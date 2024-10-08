import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { supabase } from '../supabaseClient';

const AdvancesComponent = ({ staffs, fetchSalaries }) => {
  const [advances, setAdvances] = useState([]);
  const [formData, setFormData] = useState({
    staff_id: '',
    amount: '',
    advance_date: '',
    description: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // Default to current month

  useEffect(() => {
    fetchAdvances();
  }, [filterMonth]);

  // Fetch advances from the database
  const fetchAdvances = async () => {
    try {
      let query = supabase.from('advances').select('*, staffs (username)');
      if (filterMonth) {
        const startDate = `${filterMonth}-01`;
        const endDate = `${filterMonth}-31`;
        query = query.gte('advance_date', startDate).lte('advance_date', endDate);
      }
      const { data, error } = await query;
      if (error) throw error;
      setAdvances(data || []);
    } catch (error) {
      console.error('Error fetching advances:', error.message);
    }
  };

  // Open snackbar with message and severity
  const handleSnackbarOpen = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Submit new advance entry
  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from('advances').insert({
        staff_id: formData.staff_id,
        amount: formData.amount,
        advance_date: formData.advance_date,
        description: formData.description,
      });
      if (error) throw error;
      
      setFormData({ staff_id: '', amount: '', advance_date: '', description: '' });
      handleSnackbarOpen('Advance added successfully.');
      fetchAdvances();
      fetchSalaries(); // Refresh salary data
      setIsDialogOpen(false); // Close dialog
    } catch (error) {
      console.error('Error adding advance:', error);
      handleSnackbarOpen('Failed to add advance. Please try again.', 'error');
    }
  };

  // Delete an advance entry
  const handleDelete = async (advanceId) => {
    try {
      const { error } = await supabase.from('advances').delete().eq('id', advanceId);
      if (error) throw error;

      handleSnackbarOpen('Advance deleted successfully.');
      fetchAdvances();
      fetchSalaries(); // Refresh salary data
    } catch (error) {
      console.error('Error deleting advance:', error);
      handleSnackbarOpen('Failed to delete advance. Please try again.', 'error');
    }
  };

  // Generate month-year options for the filter dropdown
  const generateMonthYearOptions = () => {
    const options = [];
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    years.forEach((year) => {
      for (let month = 0; month < 12; month++) {
        const monthLabel = new Date(year, month).toLocaleString('default', { month: 'long', year: 'numeric' });
        const monthValue = `${year}-${String(month + 1).padStart(2, '0')}`;
        options.push({ label: monthLabel, value: monthValue });
      }
    });
    return options;
  };

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => setIsDialogOpen(true)}>
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
                <TableCell>{advance.staffs.username}</TableCell>
                <TableCell>{advance.advance_date}</TableCell>
                <TableCell>₹{advance.amount.toFixed(2)}</TableCell>
                <TableCell>{advance.description}</TableCell>
                <TableCell>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(advance.id)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">No advances found.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Advance</DialogTitle>
            <DialogDescription>Fill out the form below to add an advance.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 mt-4">
            <Input
              label="Staff"
              name="staff_id"
              onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
            />
            <Input
              type="date"
              label="Advance Date"
              name="advance_date"
              value={formData.advance_date}
              onChange={(e) => setFormData({ ...formData, advance_date: e.target.value })}
            />
            <Input
              type="number"
              label="Amount"
              name="amount"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
            <Input
              label="Description"
              name="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          <Button onClick={handleSubmit}>Add Advance</Button>
        </DialogContent>
      </Dialog>

      <Snackbar open={snackbarOpen} onClose={() => setSnackbarOpen(false)} autoHideDuration={3000}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AdvancesComponent;
