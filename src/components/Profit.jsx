import React, { useEffect, useState } from 'react';
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import { supabase } from '../supabaseClient';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js';

// Register necessary chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const Profit = () => {
  const [financeStats, setFinanceStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    profit: 0,
  });

  const [incomeCategories, setIncomeCategories] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      const { data: incomeData } = await supabase.from('incomes').select('amount, source');
      const { data: expenseData } = await supabase.from('expenses').select('amount, category');

      const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

      // Aggregate by categories (source for incomes, category for expenses)
      const incomeSources = incomeData.reduce((acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + item.amount;
        return acc;
      }, {});

      const expenseCategories = expenseData.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + item.amount;
        return acc;
      }, {});

      setFinanceStats({
        totalIncome,
        totalExpenses,
        profit: totalIncome - totalExpenses,
      });

      setIncomeCategories(incomeSources);
      setExpenseCategories(expenseCategories);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
  };

  // Prepare data for charts
  const pieData = {
    labels: ['Income', 'Expenses'],
    datasets: [
      {
        data: [financeStats.totalIncome, financeStats.totalExpenses],
        backgroundColor: ['#4CAF50', '#F44336'], // Green for income, red for expenses
      },
    ],
  };

  const barData = {
    labels: Object.keys(incomeCategories),
    datasets: [
      {
        label: 'Incomes',
        data: Object.values(incomeCategories),
        backgroundColor: '#4CAF50',
      },
      {
        label: 'Expenses',
        data: Object.values(expenseCategories),
        backgroundColor: '#F44336',
      },
    ],
  };

  const donutData = {
    labels: Object.keys(expenseCategories),
    datasets: [
      {
        label: 'Expenses by Category',
        data: Object.values(expenseCategories),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#FF5722',
          '#9C27B0',
        ],
      },
    ],
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Profit Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Pie chart showing total income vs expenses */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Income vs Expenses</h3>
          <Pie data={pieData} />
        </div>

        {/* Bar chart showing detailed breakdown of incomes vs expenses */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Incomes vs Expenses by Category</h3>
          <Bar data={barData} />
        </div>

        {/* Donut chart showing breakdown of expenses by category */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Expenses by Category</h3>
          <Doughnut data={donutData} />
        </div>
      </div>

      {/* Display Profit or Loss */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold">
          Total Profit: <span className={financeStats.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
            ₹{financeStats.profit.toFixed(2)}
          </span>
        </h3>
      </div>
    </div>
  );
};

export default Profit;
