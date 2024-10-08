import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { format, parseISO } from 'date-fns';
import { Trash } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import SnackbarContent from '@mui/material/SnackbarContent';
import { supabase } from '../supabaseClient';

const SalaryList = ({ salaries, fetchSalaries }) => {
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Filter salaries based on the selected month
  const filteredSalaries = salaries.filter((salary) => {
    const paymentDate = salary.payment_date ? parseISO(salary.payment_date) : null;
    const formattedDate = paymentDate ? format(paymentDate, 'yyyy-MM') : '';
    return formattedDate === filterMonth;
  });

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
    setSnackbarMessage('');
  };

  // Generate month-year options for the dropdown
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

  // Mark salary as paid and create an expense
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
          category_id: null, // Set category if applicable
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

  // Delete salary and corresponding expense
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

  return (
    <>
      <div className="flex justify-between items-center mb-4 mt-4">
        {/* Month Filter Dropdown */}
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

      {/* Salary Table */}
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
          {filteredSalaries.length > 0 ? (
            filteredSalaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell>{salary.staffs?.username || 'N/A'}</TableCell>
                <TableCell>{salary.payment_date ? format(parseISO(salary.payment_date), 'yyyy-MM-dd') : 'N/A'}</TableCell>
                <TableCell>&#8377;{salary.base_salary.toFixed(2)}</TableCell>
                <TableCell>&#8377;{salary.advance_taken.toFixed(2)}</TableCell>
                <TableCell>&#8377;{salary.bonuses.toFixed(2)}</TableCell>
                <TableCell>&#8377;{salary.total_deductions.toFixed(2)}</TableCell>
                <TableCell>&#8377;{salary.net_salary.toFixed(2)}</TableCell>
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
              <TableCell colSpan={9} className="text-center">No salaries scheduled for the selected month.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Bottom-Centered Snackbar for Success/Error messages */}
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
