import React, { useState, useEffect } from 'react';
import SalaryForm from './SalaryForm';
import SalaryList from './SalaryList';
import AdvancesComponent from './AdvancesComponent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

const Salary = ({ initialSalaries, initialStaffs, initialAdvances }) => {
  const [salaries, setSalaries] = useState(initialSalaries || []);
  const [staffs, setStaffs] = useState(initialStaffs || []);
  const [advances, setAdvances] = useState(initialAdvances || []);
  const [currentMonth] = useState(format(new Date(), 'yyyy-MM'));

  useEffect(() => {
    // In a real-world scenario, you could use this space for any side effects needed after data is passed in as props
  }, []);

  const handleSalaryAdded = (newSalary) => {
    setSalaries([...salaries, newSalary]);
  };

  const handleAdvanceAdded = (newAdvance) => {
    setAdvances([...advances, newAdvance]);
  };

  const handleMarkAsPaid = (salaryId) => {
    setSalaries(salaries.map(salary => 
      salary.id === salaryId ? { ...salary, status: 'Paid' } : salary
    ));
  };

  const handleDeleteSalary = (salaryId) => {
    setSalaries(salaries.filter(salary => salary.id !== salaryId));
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
          <SalaryList
            salaries={salaries}
            onMarkAsPaid={handleMarkAsPaid}
            onDeleteSalary={handleDeleteSalary}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Advances Given</CardTitle>
        </CardHeader>
        <CardContent>
          <AdvancesComponent
            staffs={staffs}
            advances={advances}
            onAdvanceAdded={handleAdvanceAdded}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Salary;
