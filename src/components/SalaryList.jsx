import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { Trash } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { supabase } from '../supabaseClient';

const SalaryList = () => {
  const [salaries, setSalaries] = useState([]);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    fetchSalaries();
  }, [filterMonth]);

  const fetchSalaries = async () => {
    try {
      const [year, month] = filterMonth.split('-');
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('staff_salaries')
        .select('*, staffs (username)')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

      if (error) throw error;
      setSalaries(data || []);
    } catch (error) {
      console.error('Error fetching salaries:', error);
      handleSnackbarOpen('Error fetching salaries');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="default">Paid</Badge>;
      case 'Overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const handleSnackbarOpen = (message) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleMarkAsPaid = async (salary) => {
    try {
      await supabase
        .from('staff_salaries')
        .update({ status: 'Paid' })
        .eq('id', salary.id);

      await supabase.from('expenses').insert([
        {
          amount: salary.net_salary,
          description: `Salary payment for ${salary.staffs?.username}`,
          expense_date: new Date().toISOString(),
          staff_id: salary.staff_id,
          status: 'paid',
          expense_type: 'Salary',
        },
      ]);

      handleSnackbarOpen('Salary marked as paid and expense created.');
      fetchSalaries();
    } catch (error) {
      console.error('Error marking salary as paid or creating expense:', error);
      handleSnackbarOpen('Error occurred while marking salary as paid.');
    }
  };

  const handleDelete = async (salary) => {
    try {
      await supabase
        .from('expenses')
        .delete()
        .eq('staff_id', salary.staff_id)
        .eq('expense_type', 'Salary')
        .eq('amount', salary.net_salary);

      await supabase.from('staff_salaries').delete().eq('id', salary.id);

      handleSnackbarOpen('Salary and associated expense deleted successfully.');
      fetchSalaries();
    } catch (error) {
      console.error('Error deleting salary or expense:', error);
      handleSnackbarOpen('Error occurred while deleting salary or expense.');
    }
  };

  const generateMonthYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

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
    <>
      <div className="flex justify-between items-center mb-4 mt-4">
        <Select value={filterMonth} onValueChange={(value) => setFilterMonth(value)}>
          <SelectTrigger className="w-48">
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Staff</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Advance Taken</TableHead>
            <TableHead>Bonuses</TableHead>
            <TableHead>Total Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salaries.length > 0 ? (
            salaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell>{salary.staffs?.username || 'N/A'}</TableCell>
                <TableCell>{salary.payment_date ? format(parseISO(salary.payment_date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>&#8377;{Number(salary.base_salary).toFixed(2)}</TableCell>
                <TableCell>&#8377;{Number(salary.advance_taken).toFixed(2)}</TableCell>
                <TableCell>&#8377;{Number(salary.bonuses).toFixed(2)}</TableCell>
                <TableCell>&#8377;{Number(salary.total_deductions).toFixed(2)}</TableCell>
                <TableCell>&#8377;{Number(salary.net_salary).toFixed(2)}</TableCell>
                <TableCell>{getStatusBadge(salary.status)}</TableCell>
                <TableCell className="flex space-x-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(salary)}>
                    <Trash size={16} />
                  </Button>
                  {salary.status !== 'Paid' && (
                    <Button variant="outline" size="sm" onClick={() => handleMarkAsPaid(salary)}>
                      Mark as Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="text-center">No salaries available.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <SnackbarContent
          message={snackbarMessage}
          style={{
            backgroundColor: '#323232',
            color: '#fff',
            textAlign: 'center',
          }}
        />
      </Snackbar>
    </>
  );
};

export default SalaryList;
