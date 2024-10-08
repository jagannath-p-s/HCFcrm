import React, { useState, useEffect } from 'react';
import SalaryForm from './SalaryForm';
import SalaryList from './SalaryList';
import AdvancesComponent from './AdvancesComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '../supabaseClient';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const Salary = () => {
  const [salaries, setSalaries] = useState([]);
  const [staffs, setStaffs] = useState([]);
  const [advances, setAdvances] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM')); // Default current month

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  // Fetch all necessary data (staffs, salaries, advances)
  const fetchData = async () => {
    await Promise.all([fetchStaffs(), fetchSalaries(), fetchAdvances()]);
  };

  // Fetch staff data
  const fetchStaffs = async () => {
    const { data, error } = await supabase.from('staffs').select('*');
    if (error) {
      console.error('Error fetching staffs:', error);
    } else {
      setStaffs(data);
    }
  };

  // Fetch salary data directly from staff_salaries with all fields and staff username
  const fetchSalaries = async () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const { data, error } = await supabase
      .from('staff_salaries')
      .select('id, staff_id, base_salary, advance_taken, manual_deduction, total_deductions, net_salary, payment_date, bonuses, remarks, staffs (username)')
      .gte('payment_date', startDate.toISOString())
      .lte('payment_date', endDate.toISOString());

    if (error) {
      console.error('Error fetching salaries:', error);
    } else {
      setSalaries(data);
    }
  };

  // Fetch advance data
  const fetchAdvances = async () => {
    const { data, error } = await supabase.from('advances').select('*');
    if (error) {
      console.error('Error fetching advances:', error);
    } else {
      setAdvances(data);
    }
  };

  // Refresh the salary list after adding a salary
  const handleSalaryAdded = () => {
    fetchSalaries();
  };

  // Refresh both salary and advances list after adding an advance
  const handleAdvanceAdded = () => {
    fetchAdvances();
    fetchSalaries(); // Update salaries because advance amount may affect deductions
  };

  // Mark a salary as paid and refresh the salary list
  const handleMarkAsPaid = async (salary) => {
    const { error } = await supabase.from('staff_salaries').update({ status: 'Paid' }).eq('id', salary.id);
    if (error) {
      console.error('Error marking salary as paid:', error);
    } else {
      fetchSalaries();
    }
  };

  // Delete a salary and refresh the salary list
  const handleDeleteSalary = async (salaryId) => {
    const { error } = await supabase.from('staff_salaries').delete().eq('id', salaryId);
    if (error) {
      console.error('Error deleting salary:', error);
    } else {
      fetchSalaries();
    }
  };

  // Generate month-year options for the dropdown
  const generateMonthYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1]; // Allow selection for 3 years: past, current, future

    years.forEach((year) => {
      for (let month = 0; month < 12; month++) {
        const monthLabel = format(new Date(year, month), 'MMMM yyyy');
        const monthValue = format(new Date(year, month), 'yyyy-MM');
        options.push({ label: monthLabel, value: monthValue });
      }
    });
    return options;
  };

  return (
    <div className="p-4">
      {/* Month-Year Selection */}
      <div className="mb-4">
        <label className="text-sm font-medium">Select Month</label>
        <Select value={selectedMonth} onValueChange={(value) => setSelectedMonth(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {generateMonthYearOptions().map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Salary Management */}
      <Card className="mb-8">
        <CardHeader className="flex justify-between">
          <CardTitle>Salary Management</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryForm staffs={staffs} onSalaryAdded={handleSalaryAdded} />
          <SalaryList
            salaries={salaries}
            fetchSalaries={fetchSalaries}
          />
        </CardContent>
      </Card>

      {/* Advances Management */}
      <Card>
        <CardHeader>
          <CardTitle>Advances Given</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancesComponent staffs={staffs} onAdvanceAdded={handleAdvanceAdded} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Salary;
