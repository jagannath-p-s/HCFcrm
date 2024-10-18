import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '../supabaseClient';
import { TrendingUp, CreditCard, DollarSign, PiggyBank, ArrowUpDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {
  startOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from 'date-fns';

import Incomes from './Incomes';
import Expenses from './Expenses';
import Credits from './Credits';
import Debts from './Debts';
import Profit from './Profit';  // Import the Profit component

const Finance = () => {
  const [financeStats, setFinanceStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalCredit: 0,
    totalDebt: 0,
    profitOrLoss: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [customFromDate, setCustomFromDate] = useState(null);
  const [customToDate, setCustomToDate] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertVariant, setAlertVariant] = useState('default');

  const dateFilterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this-week' },
    { label: 'This Month', value: 'this-month' },
    { label: 'This Year', value: 'this-year' },
    { label: 'Custom Range', value: 'custom' },
  ];

  useEffect(() => {
    fetchFinanceData();
  }, [dateRange, customFromDate, customToDate]);

  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: now, end: now };
      case 'this-week':
        return { start: startOfWeek(now), end: now };
      case 'this-month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'this-year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: customFromDate || new Date(0), end: customToDate || now };
      default:
        return { start: new Date(0), end: now };
    }
  };

  const fetchFinanceData = async () => {
    try {
      const { start, end } = getDateRange();

      const { data: incomeData, error: incomeError } = await supabase
        .from('incomes')
        .select('amount')
        .gte('income_date', start.toISOString())
        .lte('income_date', end.toISOString());

      if (incomeError) throw incomeError;

      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', start.toISOString())
        .lte('expense_date', end.toISOString());

      if (expenseError) throw expenseError;

      const { data: creditData, error: creditError } = await supabase
        .from('credits')
        .select('credit_amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (creditError) throw creditError;

      const { data: debtData, error: debtError } = await supabase
        .from('debts')
        .select('debt_amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (debtError) throw debtError;

      const totalIncome = (incomeData || []).reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = (expenseData || []).reduce((sum, item) => sum + item.amount, 0);
      const totalCredit = (creditData || []).reduce((sum, item) => sum + item.credit_amount, 0);
      const totalDebt = (debtData || []).reduce((sum, item) => sum + item.debt_amount, 0);

      setFinanceStats({
        totalIncome,
        totalExpenses,
        totalCredit,
        totalDebt,
        profitOrLoss: totalIncome - totalExpenses,
      });
    } catch (error) {
      console.error('Error fetching finance data:', error);
      setAlertMessage('Error fetching finance data. Please try again.');
      setAlertVariant('destructive');
      setAlertOpen(true);
    }
  };

  const renderCategoryComponent = () => {
    switch (selectedCategory) {
      case 'Incomes':
        return <Incomes financeStats={financeStats} />;
      case 'Expenses':
        return <Expenses financeStats={financeStats} />;
      case 'Credits':
        return <Credits financeStats={financeStats} />;
      case 'Debts':
        return <Debts financeStats={financeStats} />;
      case 'Profit or Loss':
        return <Profit profitOrLoss={financeStats.profitOrLoss} />;
      default:
        return <p className="text-lg text-gray-600">Please select a category to view details.</p>;
    }
  };

  const categories = [
    {
      name: 'Incomes',
      value: financeStats.totalIncome,
      color: 'text-green-600',
      icon: DollarSign,
    },
    {
      name: 'Expenses',
      value: financeStats.totalExpenses,
      color: 'text-red-600',
      icon: CreditCard,
    },
    {
      name: 'Credits',
      value: financeStats.totalCredit,
      color: 'text-blue-600',
      icon: PiggyBank,
    },
    {
      name: 'Debts',
      value: financeStats.totalDebt,
      color: 'text-yellow-600',
      icon: ArrowUpDown,
    },
    {
      name: 'Profit or Loss',
      value: financeStats.profitOrLoss,
      color: financeStats.profitOrLoss >= 0 ? 'text-green-600' : 'text-red-600',
      icon: TrendingUp,
    },
  ];

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex flex-wrap items-center space-x-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {dateRange === 'custom' && (
            <div className="flex items-center space-x-4">
              <DatePicker
                selected={customFromDate}
                onChange={setCustomFromDate}
                placeholderText="Start Date"
                className="w-[150px] p-2 border rounded"
              />
              <DatePicker
                selected={customToDate}
                onChange={setCustomToDate}
                placeholderText="End Date"
                className="w-[150px] p-2 border rounded"
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-4">
          {categories.map((category) => (
            <Card
              key={category.name}
              onClick={() => setSelectedCategory(category.name)}
              className={`cursor-pointer transition-all duration-200 ${
                selectedCategory === category.name
                  ? 'border-2 border-blue-500 '
                  : 'border border-gray-200'
              }`}
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
                <category.icon className={`h-4 w-4 ${category.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${category.color}`}>
                  ₹{category.value.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="bg-white rounded-lg  min-h-[400px]">
          {renderCategoryComponent()}
        </div>
      </CardContent>

      {alertOpen && (
        <Alert variant={alertVariant} onClose={() => setAlertOpen(false)}>
          <AlertDescription>{alertMessage}</AlertDescription>
        </Alert>
      )}
    </Card>
  );
};

export default Finance;
