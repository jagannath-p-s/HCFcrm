import { useState, useEffect } from 'react';
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
    if (!error) setStaffs(data);
  };

  // Fetch salary data based on the selected month
  const fetchSalaries = async () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const { data, error } = await supabase
      .from('staff_salaries')
      .select('*, staffs(username)')
      .gte('scheduled_payment_date', startDate.toISOString())
      .lte('scheduled_payment_date', endDate.toISOString());

    if (!error) setSalaries(data);
  };

  // Fetch advance data
  const fetchAdvances = async () => {
    const { data, error } = await supabase.from('advances').select('*');
    if (!error) setAdvances(data);
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
    if (!error) fetchSalaries();
  };

  // Delete a salary and refresh the salary list
  const handleDeleteSalary = async (salaryId) => {
    const { error } = await supabase.from('staff_salaries').delete().eq('id', salaryId);
    if (!error) fetchSalaries(); // Refresh the list after deletion
  };

  // Generate month-year options for the dropdown
  const generateMonthYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1]; // For example, allow selection for 3 years (past, current, future)

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
      {/* Salary Management */}
      <Card className="mb-8">
        <CardHeader className="flex justify-between">
          <CardTitle>Salary Management</CardTitle>
          
        </CardHeader>
        <CardContent>
          {/* Form to add or edit salary */}
          <SalaryForm staffs={staffs} onSalaryAdded={handleSalaryAdded} />
          {/* List of salaries */}
          <SalaryList
            salaries={salaries}
            onMarkAsPaid={handleMarkAsPaid}
            onDeleteSalary={handleDeleteSalary}
          />
        </CardContent>
      </Card>

      {/* Advances Management */}
      <Card>
        <CardHeader>
          <CardTitle>Advances Given</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Component to manage advances */}
          <AdvancesComponent staffs={staffs} onAdvanceAdded={handleAdvanceAdded} />
        </CardContent>
      </Card>
    </div>
  );
};

export default Salary;
