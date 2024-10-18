import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Snackbar, Alert, Pagination } from '@mui/material';
import { supabase } from '../supabaseClient';

const Credits = () => {
  const [totalCredits, setTotalCredits] = useState(0);
  const [credits, setCredits] = useState([]);
  const [customCredit, setCustomCredit] = useState({
    id: null,
    description: '',
    credit_amount: '',
    credit_date: format(new Date(), 'yyyy-MM-dd'),
    source: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [sourceFilter, setSourceFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTotalCredits();
    fetchAllCredits();
  }, [currentPage, dateFilter, customDateRange, sourceFilter]);

  const fetchTotalCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('credits')
        .select('credit_amount');

      if (error) throw error;

      const total = data.reduce((sum, { credit_amount }) => sum + parseFloat(credit_amount), 0);
      setTotalCredits(total);
    } catch (error) {
      console.error('Error fetching total credits:', error.message);
    }
  };

  const fetchAllCredits = async () => {
    try {
      let query = supabase
        .from('credits')
        .select('*', { count: 'exact' })
        .order('credit_date', { ascending: false });

      // Apply date filtering
      switch (dateFilter) {
        case 'today':
          query = query.eq('credit_date', format(new Date(), 'yyyy-MM-dd'));
          break;
        case 'this-week':
          query = query.gte('credit_date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
                       .lte('credit_date', format(endOfWeek(new Date()), 'yyyy-MM-dd'));
          break;
        case 'this-month':
          query = query.gte('credit_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
                       .lte('credit_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            query = query.gte('credit_date', customDateRange.start)
                         .lte('credit_date', customDateRange.end);
          }
          break;
      }

      // Apply source filtering
      if (sourceFilter !== 'all') {
        query = query.eq('source', sourceFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCredits(data || []);
      setTotalPages(Math.ceil(count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching all credits data:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomCredit((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateCredit = async () => {
    const { id, description, credit_amount, credit_date, source } = customCredit;
    if (description && parseFloat(credit_amount) > 0) {
      try {
        if (isEditing) {
          const { error } = await supabase
            .from('credits')
            .update({ description, credit_amount: parseFloat(credit_amount), credit_date, source })
            .eq('id', id);
          if (error) throw error;
          setSnackbarMessage('Credit updated successfully!');
        } else {
          const { error } = await supabase
            .from('credits')
            .insert([{ description, credit_amount: parseFloat(credit_amount), credit_date, source }]);
          if (error) throw error;
          setSnackbarMessage('Credit added successfully!');
        }

        setCustomCredit({ id: null, description: '', credit_amount: '', credit_date: format(new Date(), 'yyyy-MM-dd'), source: '' });
        fetchTotalCredits();
        fetchAllCredits();
        setSnackbarOpen(true);
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error adding/updating credit:', error.message);
        setSnackbarMessage('Error adding/updating credit. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditCredit = (credit) => {
    setCustomCredit({
      id: credit.id,
      description: credit.description,
      credit_amount: credit.credit_amount.toString(),
      credit_date: credit.credit_date,
      source: credit.source
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDeleteCredit = async (id) => {
    try {
      const { error } = await supabase
        .from('credits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchTotalCredits();
      fetchAllCredits();
      setSnackbarMessage('Credit deleted successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting credit:', error.message);
      setSnackbarMessage('Error deleting credit. Please try again.');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
  };

  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    setCurrentPage(1);
  };

  const handleCustomDateChange = (e) => {
    const { name, value } = e.target;
    setCustomDateRange(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleSourceFilterChange = (value) => {
    setSourceFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-0">
      <Card>
        <CardHeader>
          <CardTitle>Total Credits Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Overall Total Credits: ₹{totalCredits.toFixed(2)}</h2>
          </div>

          <div className="mb-4">
            <Button onClick={() => {
              setIsEditing(false);
              setCustomCredit({ id: null, description: '', credit_amount: '', credit_date: format(new Date(), 'yyyy-MM-dd'), source: '' });
              setDialogOpen(true);
            }}>Add New Credit</Button>
          </div>

          <div className="mb-4 flex space-x-2">
            <Select onValueChange={handleDateFilterChange} value={dateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This week</SelectItem>
                <SelectItem value="this-month">This month</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleSourceFilterChange} value={sourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {dateFilter === 'custom' && (
            <div className="mt-2 flex space-x-2">
              <Input
                type="date"
                name="start"
                value={customDateRange.start}
                onChange={handleCustomDateChange}
                placeholder="Start date"
              />
              <Input
                type="date"
                name="end"
                value={customDateRange.end}
                onChange={handleCustomDateChange}
                placeholder="End date"
              />
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-medium">All Credits</h3>
            <table className="w-full mt-2 border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Amount</th>
                  <th className="p-2 border-b">Date</th>
                  <th className="p-2 border-b">Source</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {credits.map((credit) => (
                  <tr key={credit.id} className="text-center">
                    <td className="p-2 border-b">{credit.description}</td>
                    <td className="p-2 border-b">₹{parseFloat(credit.credit_amount).toFixed(2)}</td>
                    <td className="p-2 border-b">{format(new Date(credit.credit_date), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b">{credit.source}</td>
                    <td className="p-2 border-b">
                      <Button onClick={() => handleEditCredit(credit)} className="mr-2">Edit</Button>
                      <Button onClick={() => handleDeleteCredit(credit.id)} variant="destructive">Delete</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 flex justify-center">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Credit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Credit' : 'Add New Credit'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-4">
            <Input
              type="text"
              placeholder="Description"
              name="description"
              value={customCredit.description}
              onChange={handleChange}
            />
            <Input
              type="number"
              placeholder="Amount"
              name="credit_amount"
              value={customCredit.credit_amount}
              onChange={handleChange}
            />
         <Input
  list="source-options" // Associates this input with the datalist
  name="source"
  value={customCredit.source}
  onChange={handleChange}
  placeholder="Select source"
/>

{/* Datalist for predefined source options */}
<datalist id="source-options">
  <option value="Salary" />
  <option value="Bonus" />
  <option value="Investment" />
  <option value="Other" />
</datalist>
            <Button onClick={handleAddOrUpdateCredit}>{isEditing ? 'Update Credit' : 'Add Credit'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Credits;