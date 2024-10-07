import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { Snackbar, Alert, Pagination } from '@mui/material';
import { supabase } from '../supabaseClient';

const Expenses = () => {
  const [financeStats, setFinanceStats] = useState({ totalIncome: 0, totalExpenses: 0 });
  const [expenses, setExpenses] = useState([]);
  const [customExpense, setCustomExpense] = useState({
    id: null,
    description: '',
    amount: '',
    expense_date: format(new Date(), 'yyyy-MM-dd'),
    category: ''
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [categoryFilter, setCategoryFilter] = useState('all');
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFinanceData();
    fetchAllExpenses();
  }, [currentPage, dateFilter, customDateRange, categoryFilter]);

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

  const fetchAllExpenses = async () => {
    try {
      let query = supabase
        .from('expenses')
        .select('*', { count: 'exact' })
        .order('expense_date', { ascending: false });

      // Apply date filtering
      switch (dateFilter) {
        case 'today':
          query = query.eq('expense_date', format(new Date(), 'yyyy-MM-dd'));
          break;
        case 'this-week':
          query = query.gte('expense_date', format(startOfWeek(new Date()), 'yyyy-MM-dd'))
                       .lte('expense_date', format(endOfWeek(new Date()), 'yyyy-MM-dd'));
          break;
        case 'this-month':
          query = query.gte('expense_date', format(startOfMonth(new Date()), 'yyyy-MM-dd'))
                       .lte('expense_date', format(endOfMonth(new Date()), 'yyyy-MM-dd'));
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            query = query.gte('expense_date', customDateRange.start)
                         .lte('expense_date', customDateRange.end);
          }
          break;
      }

      // Apply category filtering
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setExpenses(data || []);
      setTotalPages(Math.ceil(count / itemsPerPage));
    } catch (error) {
      console.error('Error fetching all expenses data:', error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomExpense((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddOrUpdateExpense = async () => {
    const { id, description, amount, expense_date, category } = customExpense;
    if (description && parseFloat(amount) > 0) {
      try {
        if (isEditing) {
          const { error } = await supabase
            .from('expenses')
            .update({ description, amount: parseFloat(amount), expense_date, category })
            .eq('id', id);
          if (error) throw error;
          setSnackbarMessage('Expense updated successfully!');
        } else {
          const { error } = await supabase
            .from('expenses')
            .insert([{ description, amount: parseFloat(amount), expense_date, category }]);
          if (error) throw error;
          setSnackbarMessage('Expense added successfully!');
        }

        setCustomExpense({ id: null, description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd'), category: '' });
        fetchFinanceData();
        fetchAllExpenses();
        setSnackbarOpen(true);
        setDialogOpen(false);
        setIsEditing(false);
      } catch (error) {
        console.error('Error adding/updating expense:', error.message);
        setSnackbarMessage('Error adding/updating expense. Please try again.');
        setSnackbarOpen(true);
      }
    }
  };

  const handleEditExpense = (expense) => {
    setCustomExpense({
      id: expense.id,
      description: expense.description,
      amount: expense.amount.toString(),
      expense_date: expense.expense_date,
      category: expense.category
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const handleDeleteExpense = async (id) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchFinanceData();
      fetchAllExpenses();
      setSnackbarMessage('Expense deleted successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error deleting expense:', error.message);
      setSnackbarMessage('Error deleting expense. Please try again.');
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

  const handleCategoryFilterChange = (value) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Expense Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Overall Total Expenses: ₹{financeStats.totalExpenses}</h2>
          </div>

          <div className="mb-4">
            <Button onClick={() => {
              setIsEditing(false);
              setCustomExpense({ id: null, description: '', amount: '', expense_date: format(new Date(), 'yyyy-MM-dd'), category: '' });
              setDialogOpen(true);
            }}>Add Custom Expense</Button>
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
            <Select onValueChange={handleCategoryFilterChange} value={categoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="food">Food</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="entertainment">Entertainment</SelectItem>
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
            <h3 className="text-lg font-medium">All Expenses</h3>
            <table className="w-full mt-2 border border-gray-200 rounded-lg">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 border-b">Description</th>
                  <th className="p-2 border-b">Amount</th>
                  <th className="p-2 border-b">Date</th>
                  <th className="p-2 border-b">Category</th>
                  <th className="p-2 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="text-center">
                    <td className="p-2 border-b">{expense.description}</td>
                    <td className="p-2 border-b">₹{expense.amount.toFixed(2)}</td>
                    <td className="p-2 border-b">{format(new Date(expense.expense_date), 'yyyy-MM-dd')}</td>
                    <td className="p-2 border-b">{expense.category}</td>
                    <td className="p-2 border-b">
                      <Button onClick={() => handleEditExpense(expense)} className="mr-2">Edit</Button>
                      <Button onClick={() => handleDeleteExpense(expense.id)} variant="destructive">Delete</Button>
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

      {/* Custom Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Expense' : 'Add Custom Expense'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col space-y-3 mt-4">
            <Input
              type="text"
              placeholder="Description"
              name="description"
              value={customExpense.description}
              onChange={handleChange}
            />
            <Input
              type="number"
              placeholder="Amount"
              name="amount"
              value={customExpense.amount}
              onChange={handleChange}
            />
           

<Input
  type="date"
  name="expense_date"
  value={customExpense.expense_date}
  onChange={handleChange}
/>

<Input
  list="category-options" // Associates this input with the datalist
  name="category"
  value={customExpense.category}
  onChange={handleChange}
  placeholder="Select or type category"
/>

{/* Datalist for predefined category options */}
<datalist id="category-options">
  <option value="Food" />
  <option value="Transport" />
  <option value="Utilities" />
  <option value="Entertainment" />
  <option value="Other" />
</datalist>

            <Button onClick={handleAddOrUpdateExpense}>{isEditing ? 'Update Expense' : 'Add Expense'}</Button>
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

export default Expenses;