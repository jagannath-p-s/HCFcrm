import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isAfter } from 'date-fns';
import { Snackbar, Alert, Pagination } from '@mui/material';
import { supabase } from '../supabaseClient';

const Debts = () => {
  const [totalDebts, setTotalDebts] = useState(0);
  const [debts, setDebts] = useState([]);
  const [customDebt, setCustomDebt] = useState({
    id: null,
    description: '',
    debt_amount: '',
    debt_date: format(new Date(), 'yyyy-MM-dd'),
    creditor: '',
    due_date: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [creditorFilter, setCreditorFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchTotalDebts();
    fetchAllDebts();
  }, [currentPage, dateFilter, customDateRange, creditorFilter]);

  const fetchTotalDebts = async () => {
    try {
      const { data, error } = await supabase
        .from('debts')
        .select('debt_amount');

      if (error) throw error;

      const total = data.reduce((sum, { debt_amount }) => sum + parseFloat(debt_amount), 0);
      setTotalDebts(total);
    } catch (error) {
      console.error('Error fetching total debts:', error.message);
    }
  };

  const fetchAllDebts = async () => {
    try {
      let query = supabase
        .from('debts')
        .select('*', { count: 'exact' })
        .order('debt_date', { ascending: false });

      // Apply date filtering
      switch (dateFilter) {
        case 'today':
          query = query.eq('debt_date', format(new Date(), 'yyyy-MM-dd'));
          break;
        case 'this-week':
          query = query.gte('debt_date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
                       .lte('debt_date', format(endOfWeek(new Date()), 'yyyy-MM-dd'));
          break;
        case 'this-month':
          query = query.gte('debt_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
                       .lte('debt_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            query = query.gte('debt_date', customDateRange.start)
                         .lte('debt_date', customDateRange.end);
          }
          break;
      }

      // Apply creditor filtering
      if (creditorFilter !== 'all') {
        query = query.eq('creditor', creditorFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setDebts(data || []);
      setTotalPages(Math.ceil(count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching all debts data:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomDebt((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateDebt = async () => {
    const { id, description, debt_amount, debt_date, creditor, due_date } = customDebt;
    if (description && parseFloat(debt_amount) > 0) {
      try {
        if (isEditing) {
          const { error } = await supabase
            .from('debts')
            .update({ description, debt_amount: parseFloat(debt_amount), debt_date, creditor, due_date })
            .eq('id', id);
          if (error) throw error;
          setSnackbarMessage('Debt updated successfully!');
        } else {
          const { error } = await supabase
            .from('debts')
            .insert([{ description, debt_amount: parseFloat(debt_amount), debt_date, creditor, due_date }]);
          if (error) throw error;
          setSnackbarMessage('Debt added successfully!');
        }

        setCustomDebt({ id: null, description: '', debt_amount: '', debt_date: format(new Date(), 'yyyy-MM-dd'), creditor: '', due_date: '' });
        fetchTotalDebts();
        fetchAllDebts();
        setSnackbarOpen(true);
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error adding/updating debt:', error.message);
        setSnackbarMessage('Error adding/updating debt. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditDebt = (debt) => {
    setCustomDebt({
      id: debt.id,
      description: debt.description,
      debt_amount: debt.debt_amount.toString(),
      debt_date: debt.debt_date,
      creditor: debt.creditor,
      due_date: debt.due_date
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDeleteDebt = async (id) => {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchTotalDebts();
      fetchAllDebts();
      setSnackbarMessage('Debt deleted successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting debt:', error.message);
      setSnackbarMessage('Error deleting debt. Please try again.');
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

  const handleCreditorFilterChange = (value) => {
    setCreditorFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Debts Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Overall Total Debts: ₹{totalDebts.toFixed(2)}</h2>
          </div>

          <div className="mb-4">
            <Button onClick={() => {
              setIsEditing(false);
              setCustomDebt({ id: null, description: '', debt_amount: '', debt_date: format(new Date(), 'yyyy-MM-dd'), creditor: '', due_date: '' });
              setDialogOpen(true);
            }}>Add New Debt</Button>
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
            <Select onValueChange={handleCreditorFilterChange} value={creditorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by creditor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All creditors</SelectItem>
                <SelectItem value="bank">Bank</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
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
            <h3 className="text-lg font-medium">All Debts</h3>
            <table className="w-full mt-2 border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Amount</th>
                  <th className="p-2 border-b">Date</th>
                  <th className="p-2 border-b">Creditor</th>
                  <th className="p-2 border-b">Due Date</th>
                  <th className="p-2 border-b">Status</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {debts.map((debt) => (
                  <tr key={debt.id} className="text-center">
                    <td className="p-2 border-b">{debt.description}</td>
                    <td className="p-2 border-b">₹{parseFloat(debt.debt_amount).toFixed(2)}</td>
                    <td className="p-2 border-b">{format(new Date(debt.debt_date), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b">{debt.creditor}</td>
                    <td className="p-2 border-b">{debt.due_date ? format(new Date(debt.due_date), 'yyyy-MM-dd') : 'N/A'}</td>
                    <td className="p-2 border-b">
                      {debt.due_date && isAfter(new Date(), new Date(debt.due_date)) ? 
                        <span className="text-red-500">Overdue</span> : 
                        <span className="text-green-500">On time</span>
                      }
                    </td>
                    <td className="p-2 border-b">
                      <Button onClick={() => handleEditDebt(debt)} className="mr-2">Edit</Button>
                      <Button onClick={() => handleDeleteDebt(debt.id)} variant="destructive">Delete</Button>
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

      {/* Custom Debt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Debt' : 'Add New Debt'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-4">
            <Input
              type="text"
              placeholder="Description"
              name="description"
              value={customDebt.description}
              onChange={handleChange}
            />
            <Input
              type="number"
              placeholder="Amount"
              name="debt_amount"
              value={customDebt.debt_amount}
              onChange={handleChange}
            />
   
<Input
  type="date"
  name="debt_date"
  value={customDebt.debt_date}
  onChange={handleChange}
/>

<Input
  list="creditor-options" // Associates this input with the datalist for predefined creditors
  name="creditor"
  value={customDebt.creditor}
  onChange={handleChange}
  placeholder="Select or type creditor"
/>

{/* Datalist for predefined creditor options */}
<datalist id="creditor-options">
  <option value="Bank" />
  <option value="Credit Card" />
  <option value="Personal" />
  <option value="Other" />
</datalist>
            <Input
              type="date"
              name="due_date"
              value={customDebt.due_date}
              onChange={handleChange}
              placeholder="Due Date (optional)"
            />
            <Button onClick={handleAddOrUpdateDebt}>{isEditing ? 'Update Debt' : 'Add Debt'}</Button>
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

export default Debts;