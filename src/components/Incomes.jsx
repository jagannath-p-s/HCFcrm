import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Snackbar, Alert, Pagination } from '@mui/material';
import { supabase } from '../supabaseClient';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

const Incomes = () => {
  const [financeStats, setFinanceStats] = useState({ totalIncome: 0, totalExpenses: 0 });
  const [incomes, setIncomes] = useState([]);
  const [customIncome, setCustomIncome] = useState({
    id: null,
    description: '',
    amount: '',
    income_date: format(new Date(), 'yyyy-MM-dd')
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFinanceData();
    fetchAllIncomes();
  }, [currentPage, dateFilter, customDateRange]);

  const fetchFinanceData = async () => {
    try {
      const { data: incomeData, error: incomeError } = await supabase.from('incomes').select('amount');
      const { data: expenseData, error: expenseError } = await supabase.from('expenses').select('amount');

      if (incomeError || expenseError) throw incomeError || expenseError;

      const totalIncome = incomeData.reduce((sum, { amount }) => sum + amount, 0);
      const totalExpenses = expenseData.reduce((sum, { amount }) => sum + amount, 0);

      setFinanceStats({ totalIncome, totalExpenses });
    } catch (error) {
      console.error('Error fetching finance data:', error.message);
    }
  };

  const fetchAllIncomes = async () => {
    try {
      let query = supabase
        .from('incomes')
        .select('*', { count: 'exact' })
        .order('income_date', { ascending: false });

      // Apply date filtering
      switch (dateFilter) {
        case 'today':
          query = query.eq('income_date', format(new Date(), 'yyyy-MM-dd'));
          break;
        case 'this-week':
          query = query.gte('income_date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
                       .lte('income_date', format(endOfWeek(new Date()), 'yyyy-MM-dd'));
          break;
        case 'this-month':
          query = query.gte('income_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
                       .lte('income_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            query = query.gte('income_date', customDateRange.start)
                         .lte('income_date', customDateRange.end);
          }
          break;
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setIncomes(data || []);
      setTotalPages(Math.ceil(count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching all incomes data:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomIncome((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateIncome = async () => {
    const { id, description, amount, income_date } = customIncome;
    if (description && parseFloat(amount) > 0) {
      try {
        if (isEditing) {
          const { error } = await supabase
            .from('incomes')
            .update({ description, amount: parseFloat(amount), income_date })
            .eq('id', id);
          if (error) throw error;
          setSnackbarMessage('Income updated successfully!');
        } else {
          const { error } = await supabase
            .from('incomes')
            .insert([{ description, amount: parseFloat(amount), income_date }]);
          if (error) throw error;
          setSnackbarMessage('Income added successfully!');
        }

        setCustomIncome({ id: null, description: '', amount: '', income_date: format(new Date(), 'yyyy-MM-dd') });
        fetchFinanceData();
        fetchAllIncomes();
        setSnackbarOpen(true);
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error adding/updating income:', error.message);
        setSnackbarMessage('Error adding/updating income. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditIncome = (income) => {
    setCustomIncome({
      id: income.id,
      description: income.description,
      amount: income.amount.toString(),
      income_date: income.income_date
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDeleteIncome = async (id) => {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchFinanceData();
      fetchAllIncomes();
      setSnackbarMessage('Income deleted successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting income:', error.message);
      setSnackbarMessage('Error deleting income. Please try again.');
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

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Income Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Overall Total Income: ₹{financeStats.totalIncome}</h2>
          </div>

          <div className="mb-4">
            <Button onClick={() => {
              setIsEditing(false);
              setCustomIncome({ id: null, description: '', amount: '', income_date: format(new Date(), 'yyyy-MM-dd') });
              setDialogOpen(true);
            }}>Add Custom Income</Button>
          </div>

          <div className="mb-4">
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
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-medium">All Incomes</h3>
            <table className="w-full mt-2 border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Amount</th>
                  <th className="p-2 border-b">Date</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {incomes.map((income) => (
                  <tr key={income.id} className="text-center">
                    <td className="p-2 border-b">{income.description}</td>
                    <td className="p-2 border-b">₹{income.amount.toFixed(2)}</td>
                    <td className="p-2 border-b">{format(new Date(income.income_date), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b">
                      <Button onClick={() => handleEditIncome(income)} className="mr-2">Edit</Button>
                      <Button onClick={() => handleDeleteIncome(income.id)} variant="destructive">Delete</Button>
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

      {/* Custom Income Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Income' : 'Add Custom Income'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-4">
            <Input
              type="text"
              placeholder="Description"
              name="description"
              value={customIncome.description}
              onChange={handleChange}
            />
            <Input
              type="number"
              placeholder="Amount"
              name="amount"
              value={customIncome.amount}
              onChange={handleChange}
            />
            <Input
              type="date"
              name="income_date"
              value={customIncome.income_date}
              onChange={handleChange}
            />
            <Button onClick={handleAddOrUpdateIncome}>{isEditing ? 'Update Income' : 'Add Income'}</Button>
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

export default Incomes;
