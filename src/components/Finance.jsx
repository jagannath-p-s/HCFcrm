import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '../supabaseClient';

import Incomes from './Incomes';
import Expenses from './Expenses';
import Credits from './Credits';
import Debts from './Debts';
import CurrencyRupee from '@mui/icons-material/CurrencyRupee';


const Finance = () => {
  const [financeStats, setFinanceStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalCredit: 0,
    totalDebt: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const { data: incomeData } = await supabase.from('incomes').select('amount');
      const { data: expenseData } = await supabase.from('expenses').select('amount');
      const { data: creditData } = await supabase.from('credits').select('credit_amount');
      const { data: debtData } = await supabase.from('debts').select('debt_amount');

      setFinanceStats({
        totalIncome: (incomeData || []).reduce((sum, item) => sum + item.amount, 0),
        totalExpenses: (expenseData || []).reduce((sum, item) => sum + item.amount, 0),
        totalCredit: (creditData || []).reduce((sum, item) => sum + item.credit_amount, 0),
        totalDebt: (debtData || []).reduce((sum, item) => sum + item.debt_amount, 0),
      });
    } catch (error) {
      console.error('Error fetching finance data:', error);
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
      default:
        return <p className="text-lg text-gray-600">Please select a category to view details.</p>;
    }
  };

  const categories = [
    { name: 'Incomes', value: financeStats.totalIncome, color: 'text-green-600' },
    { name: 'Expenses', value: financeStats.totalExpenses, color: 'text-red-600' },
    { name: 'Credits', value: financeStats.totalCredit, color: 'text-blue-600' },
    { name: 'Debts', value: financeStats.totalDebt, color: 'text-yellow-600' },
  ];

  return (
    <div className="mx-8 my-4">
      <h1 className="text-2xl font-bold mb-4">Finance Overview</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {categories.map((category) => (
          <Card
            key={category.name}
            onClick={() => setSelectedCategory(category.name)}
            className={`cursor-pointer transition-all duration-200 ${
              selectedCategory === category.name ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{category.name}</CardTitle>
              <CurrencyRupee className={`h-4 w-4 ${category.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${category.color}`}>₹{category.value.toFixed(2)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 min-h-[400px]">
        {renderCategoryComponent()}
      </div>
    </div>
  );
};

export default Finance;
