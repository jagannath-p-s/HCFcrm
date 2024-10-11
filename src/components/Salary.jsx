// components/Salary.jsx

import React, { useState, useEffect } from 'react';
import SalaryForm from './SalaryForm';
import SalaryTable from './SalaryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { supabase } from '../supabaseClient'; // Ensure correct path

const Salary = ({ initialSalaries, initialStaffs, initialAdvances }) => {
  const [salaries, setSalaries] = useState(initialSalaries || []);
  const [staffs, setStaffs] = useState(initialStaffs || []);
  const [advances, setAdvances] = useState(initialAdvances || []);
  const [currentMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    // Fetch initial data if not provided via props
    const fetchInitialData = async () => {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('staffs')
          .select('*');
        if (staffError) throw staffError;
        setStaffs(staffData);

        const { data: salaryData, error: salaryError } = await supabase
          .from('staff_salaries')
          .select('*');
        if (salaryError) throw salaryError;
        setSalaries(salaryData);
      } catch (error) {
        console.error('Error fetching initial data:', error.message);
      }
    };

    if (!initialStaffs || !initialSalaries) {
      fetchInitialData();
    }

    // Note: Real-time subscription is handled within SalaryTable
  }, [initialSalaries, initialStaffs]);

  const handleSalaryAdded = (newSalary) => {
    setSalaries([...salaries, newSalary]);
  };

  const handleAdvanceAdded = (newAdvance) => {
    setAdvances([...advances, newAdvance]);
  };

  const handleMarkAsPaid = (salaryId) => {
    setSalaries(
      salaries.map((salary) =>
        salary.id === salaryId ? { ...salary, status: 'Paid' } : salary
      )
    );
  };

  const handleDeleteSalary = (salaryId) => {
    setSalaries(salaries.filter((salary) => salary.id !== salaryId));
  };

  return (
    <div className="p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Salary Management</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryForm
            staffs={staffs}
            selectedMonth={currentMonth}
            onSalaryAdded={handleSalaryAdded}
          />
        </CardContent>
      </Card>

      {/* Render the SalaryTable component inside a Card for consistent UI */}
      <Card>
        <CardHeader>
          <CardTitle>Scheduled Salaries</CardTitle>
        </CardHeader>
        <CardContent>
          <SalaryTable />
        </CardContent>
      </Card>
    </div>
  );
};

export default Salary;
