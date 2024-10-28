// components/Salary.jsx

import React, { useState, useEffect } from 'react';
import SalaryForm from './SalaryForm';
import SalaryTable from './SalaryTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { supabase } from '../supabaseClient'; // Ensure correct path

const Salary = ({ initialStaffs, initialAdvances }) => {
  const [staffs, setStaffs] = useState(initialStaffs || []);
  const [advances, setAdvances] = useState(initialAdvances || []);
  const [currentMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    // Fetch initial staffs if not provided via props
    const fetchInitialData = async () => {
      try {
        const { data: staffData, error: staffError } = await supabase
          .from('staffs')
          .select('*');
        if (staffError) throw staffError;
        setStaffs(staffData);
      } catch (error) {
        console.error('Error fetching initial data:', error.message);
      }
    };

    if (!initialStaffs) {
      fetchInitialData();
    }

    // Note: Real-time subscription is handled within SalaryTable
  }, [initialStaffs]);

  const handleAdvanceAdded = (newAdvance) => {
    setAdvances([...advances, newAdvance]);
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
            onSalaryAdded={() => { /* No action needed here since SalaryTable handles real-time updates */ }}
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
