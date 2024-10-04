import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '../supabaseClient';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AdvancesComponent = ({ staffs, onAdvanceAdded }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    amount: '',
    advance_date: format(new Date(), 'yyyy-MM-dd'), // Automatically set today's date
    description: '',
    expense_id: null, // Track associated expense
  });
  const [advances, setAdvances] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM')); // Default to current month

  // Fetch advances on component mount and whenever the filter month changes
  useEffect(() => {
    fetchAdvances();
  }, [filterMonth]);

  // Fetch the list of advances based on the selected month
  const fetchAdvances = async () => {
    const [year, month] = filterMonth.split('-');
    const startDate = startOfMonth(new Date(year, month - 1));
    const endDate = endOfMonth(new Date(year, month - 1));

    const { data, error } = await supabase
      .from('advances')
      .select('*, staffs(username), expenses(*)') // Fetch expenses data too
      .gte('advance_date', startDate.toISOString())
      .lte('advance_date', endDate.toISOString())
      .order('advance_date', { ascending: false });

    if (error) {
      handleSnackbarOpen('Error fetching advances', 'error');
    } else {
      setAdvances(data);
    }
  };

  // Show snackbar with a message and severity
  const handleSnackbarOpen = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Close snackbar
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
    setSnackbarMessage('');
  };

  // Input change handler for form fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Validate the form inputs
  const validateForm = () => {
    if (!formData.staff_id || !formData.amount || !formData.advance_date) {
      handleSnackbarOpen('Please fill in all the required fields.', 'error');
      return false;
    }
    if (parseFloat(formData.amount) <= 0) {
      handleSnackbarOpen('Amount must be greater than 0.', 'error');
      return false;
    }
    return true;
  };

  // Add advance and handle salary and expense updates
  const handleAddAdvance = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Step 1: Insert the expense into the 'expenses' table
      const { data: expenseData, error: expenseError } = await supabase
        .from('expenses')
        .insert([{
          amount: parseFloat(formData.amount),
          description: `Advance payment for staff ID ${formData.staff_id}`,
          expense_date: formData.advance_date,
          staff_id: formData.staff_id,
          expense_type: 'Advance',
          status: 'Paid'
        }])
        .select('id') // Fetch the expense ID
        .single();

      if (expenseError || !expenseData) {
        handleSnackbarOpen('Error adding expense. Please try again.', 'error');
        return;
      }

      // Step 2: Insert the advance into the 'advances' table with the expense ID
      const { error: advanceError } = await supabase
        .from('advances')
        .insert([{ 
          staff_id: formData.staff_id, 
          amount: parseFloat(formData.amount), 
          advance_date: formData.advance_date, 
          description: formData.description,
          expense_id: expenseData.id // Link to the newly created expense
        }]);

      if (advanceError) {
        handleSnackbarOpen('Error adding advance. Please try again.', 'error');
        return;
      }

      // Step 3: Check if a salary is scheduled for the same staff and month
      const scheduledDate = new Date(formData.advance_date);
      const startDate = startOfMonth(scheduledDate);
      const endDate = endOfMonth(scheduledDate);

      const { data: salaryData, error: salaryError } = await supabase
        .from('staff_salaries')
        .select('*')
        .eq('staff_id', formData.staff_id)
        .gte('scheduled_payment_date', startDate.toISOString())
        .lte('scheduled_payment_date', endDate.toISOString())
        .single();

      // If salary is found, update it with the new advance amount
      if (!salaryError && salaryData) {
        const totalAdvance = salaryData.advance_amount + parseFloat(formData.amount);
        const netSalary = salaryData.salary_amount + salaryData.bonuses - salaryData.deductions - totalAdvance;

        const { error: updateSalaryError } = await supabase
          .from('staff_salaries')
          .update({ 
            advance_amount: totalAdvance,
            net_salary: netSalary 
          })
          .eq('id', salaryData.id);

        if (updateSalaryError) {
          handleSnackbarOpen('Error updating salary. Please try again.', 'error');
          return;
        }
      }

      handleSnackbarOpen('Advance added successfully.', 'success');
      setIsDialogOpen(false);
      onAdvanceAdded();
      setFormData({ staff_id: '', amount: '', advance_date: format(new Date(), 'yyyy-MM-dd'), description: '' });
      fetchAdvances();
    } catch (error) {
      handleSnackbarOpen('Error occurred while adding the advance.', 'error');
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 500); // Adding a small pause to prevent double submission
    }
  };

  // Delete advance and update salary if necessary
  const handleDeleteAdvance = async (advanceId, staffId, advanceAmount, advanceDate, expenseId) => {
    try {
      // Step 1: Delete the expense
      const { error: deleteExpenseError } = await supabase.from('expenses').delete().eq('id', expenseId);

      if (deleteExpenseError) {
        handleSnackbarOpen('Error deleting expense.', 'error');
        return;
      }

      // Step 2: Delete the advance
      const { error: deleteAdvanceError } = await supabase.from('advances').delete().eq('id', advanceId);

      if (deleteAdvanceError) {
        handleSnackbarOpen('Error deleting advance.', 'error');
        return;
      }

      // Step 3: Fetch the corresponding salary for the same staff and month
      const scheduledDate = new Date(advanceDate);
      const startDate = startOfMonth(scheduledDate);
      const endDate = endOfMonth(scheduledDate);

      const { data: salaryData, error: salaryError } = await supabase
        .from('staff_salaries')
        .select('*')
        .eq('staff_id', staffId)
        .gte('scheduled_payment_date', startDate.toISOString())
        .lte('scheduled_payment_date', endDate.toISOString())
        .single();

      // If salary is found, update the advance amount and recalculate net salary
      if (!salaryError && salaryData) {
        const newAdvanceAmount = salaryData.advance_amount - parseFloat(advanceAmount);
        const newNetSalary = salaryData.salary_amount + salaryData.bonuses - salaryData.deductions - newAdvanceAmount;

        const { error: updateSalaryError } = await supabase
          .from('staff_salaries')
          .update({ 
            advance_amount: newAdvanceAmount,
            net_salary: newNetSalary
          })
          .eq('id', salaryData.id);

        if (updateSalaryError) {
          handleSnackbarOpen('Error updating salary after deleting advance.', 'error');
          return;
        }
      }

      handleSnackbarOpen('Advance and expense deleted successfully.', 'success');
      fetchAdvances();
      onAdvanceAdded();
    } catch (error) {
      handleSnackbarOpen('Error occurred while deleting the advance.', 'error');
    }
  };

  // Generate options for month-year selection
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
      <div className="flex justify-between items-center mb-4">
        <Button variant="default" onClick={() => setIsDialogOpen(true)}>
          Add Advance
        </Button>

        <Select value={filterMonth} onValueChange={setFilterMonth}>
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

      <Table className="mt-4">
        <TableHeader>
          <TableRow>
            <TableHead>Staff</TableHead>
            <TableHead>Advance Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {advances.length > 0 ? (
            advances.map((advance) => (
              <TableRow key={advance.id}>
                <TableCell>{advance.staffs?.username || 'N/A'}</TableCell>
                <TableCell>{format(parseISO(advance.advance_date), 'yyyy-MM-dd')}</TableCell>
                <TableCell>₹{advance.amount.toFixed(2)}</TableCell>
                <TableCell>{advance.description || 'N/A'}</TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      handleDeleteAdvance(advance.id, advance.staff_id, advance.amount, advance.advance_date, advance.expense_id)
                    }
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                No advances recorded for the selected month.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Advance</DialogTitle>
            <DialogDescription>Fill out the form below to add an advance.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium">Select Staff</label>
              <Select value={formData.staff_id} onValueChange={(value) => setFormData({ ...formData, staff_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  {staffs.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id.toString()}>
                      {staff.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Advance Date</label>
              <Input type="date" name="advance_date" value={formData.advance_date} onChange={handleChange} />
            </div>

            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" name="amount" value={formData.amount} onChange={handleChange} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Description</label>
              <Input name="description" value={formData.description} onChange={handleChange} />
            </div>
          </div>
          <Button onClick={handleAddAdvance} className="mt-4" disabled={isLoading}>
            {isLoading ? 'Adding...' : 'Add Advance'}
          </Button>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdvancesComponent;
