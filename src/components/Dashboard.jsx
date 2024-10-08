import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { supabase } from '../supabaseClient';
import { Users } from 'lucide-react';
import CurrencyRupee from '@mui/icons-material/CurrencyRupee';

import Incomes from './Incomes';
import Expenses from './Expenses';
import Credits from './Credits';
import Debts from './Debts';
import ExistingMemberships from './ExistingMemberships';

const Dashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalMemberships: 0,
    activeMemberships: 0,
    totalIncome: 0,
    totalRenewals: 0,
    totalExpenses: 0,
    totalCredit: 0,
    totalDebt: 0,
  });
  const [selectedMetric, setSelectedMetric] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchFinanceData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: membershipsData } = await supabase.from('memberships').select('*');
      const totalMemberships = membershipsData.length;

      const { data: activeMembershipsData } = await supabase
        .from('memberships')
        .select('id')
        .gte('end_date', new Date().toISOString());
      const activeMemberships = activeMembershipsData.length;

      const totalIncome = membershipsData.reduce(
        (sum, membership) => sum + membership.total_amount,
        0
      );

      const totalRenewals = membershipsData.filter(
        (membership) => membership.admission_or_renewal_fee > 0
      ).length;

      setDashboardStats((prevStats) => ({
        ...prevStats,
        totalMemberships,
        activeMemberships,
        totalIncome,
        totalRenewals,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchFinanceData = async () => {
    try {
      const { data: incomeData } = await supabase.from('incomes').select('amount');
      const { data: expenseData } = await supabase.from('expenses').select('amount');
      const { data: creditData } = await supabase.from('credits').select('credit_amount');
      const { data: debtData } = await supabase.from('debts').select('debt_amount');

      setDashboardStats((prevStats) => ({
        ...prevStats,
        totalIncome: (incomeData || []).reduce((sum, item) => sum + item.amount, 0),
        totalExpenses: (expenseData || []).reduce((sum, item) => sum + item.amount, 0),
        totalCredit: (creditData || []).reduce((sum, item) => sum + item.credit_amount, 0),
        totalDebt: (debtData || []).reduce((sum, item) => sum + item.debt_amount, 0),
      }));
    } catch (error) {
      console.error('Error fetching finance data:', error);
    }
  };

  const renderMetricComponent = () => {
    switch (selectedMetric) {
      case 'Incomes':
        return <Incomes stats={dashboardStats} />;
      case 'Expenses':
        return <Expenses stats={dashboardStats} />;
      case 'Credits':
        return <Credits stats={dashboardStats} />;
      case 'Debts':
        return <Debts stats={dashboardStats} />;
      case 'Total Memberships':
      case 'Active Memberships':
      case 'Total Renewals':
        return <ExistingMemberships stats={dashboardStats} metric={selectedMetric} />;
      default:
        return <p className="text-lg text-gray-600">Please select a category to view details.</p>;
    }
  };

  const metrics = [
    { name: 'Incomes', value: dashboardStats.totalIncome, color: 'text-green-600', icon: <CurrencyRupee /> },
    { name: 'Expenses', value: dashboardStats.totalExpenses, color: 'text-red-600', icon: <CurrencyRupee /> },
    { name: 'Credits', value: dashboardStats.totalCredit, color: 'text-blue-600', icon: <CurrencyRupee /> },
    { name: 'Debts', value: dashboardStats.totalDebt, color: 'text-yellow-600', icon: <CurrencyRupee /> },
    { name: 'Total Memberships', value: dashboardStats.totalMemberships, color: 'text-muted-foreground', icon: <Users /> },
    { name: 'Active Memberships', value: dashboardStats.activeMemberships, color: 'text-green-600', icon: <Users /> },
  ];

  return (
    <div className="mx-8 my-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
        {metrics.map((metric) => (
          <Card
            key={metric.name}
            onClick={() => setSelectedMetric(metric.name)}
            className={`cursor-pointer transition-all duration-200 ${
              selectedMetric === metric.name ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'
            }`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
              {React.cloneElement(metric.icon, { className: `h-4 w-4 ${metric.color}` })}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metric.color}`}>
                ₹{metric.value.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="bg-white shadow-lg rounded-lg p-6 min-h-[400px]">
        {renderMetricComponent()}
      </div>
    </div>
  );
};

export default Dashboard;
