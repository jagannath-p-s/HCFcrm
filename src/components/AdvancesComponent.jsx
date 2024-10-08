import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { supabase } from '../supabaseClient';

const AdvancesComponent = ({ staffs: initialStaffs = [], advances: initialAdvances = [], onAdvanceAdded }) => {
  const [advances, setAdvances] = useState(initialAdvances);
  const [staffs, setStaffs] = useState(initialStaffs);
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
  const [filterMonth, setFilterMonth] = useState('');

  useEffect(() => {
    if (!initialStaffs.length) fetchStaffs();
    if (filterMonth) fetchAdvances();
  }, [filterMonth]);

  const fetchStaffs = async () => {
    try {
      const { data, error } = await supabase.from('staffs').select('*');
      if (error) throw error;
      setStaffs(data);
    } catch (error) {
      console.error('Error fetching staffs:', error);
      handleSnackbarOpen('Error fetching staffs', 'error');
    }
  };

  const fetchAdvances = async () => {
    try {
      const [year, month] = filterMonth.split('-');
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('advances')
        .select('*, staffs(username)')
        .gte('advance_date', startDate)
        .lte('advance_date', endDate);

      if (error) throw error;
      setAdvances(data || []);
    } catch (error) {
      console.error('Error fetching advances:', error);
      handleSnackbarOpen('Error fetching advances', 'error');
    }
  };

  const handleSnackbarOpen = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      const { error } = await supabase.from('advances').insert({
        staff_id: formData.staff_id,
        amount: parseFloat(formData.amount),
        advance_date: formData.advance_date,
        description: formData.description,
      });

      if (error) throw error;

      fetchAdvances();
      setFormData({ staff_id: '', amount: '', advance_date: '', description: '' });
      handleSnackbarOpen('Advance added successfully.');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding advance:', error);
      handleSnackbarOpen('Failed to add advance. Please try again.', 'error');
    }
  };

  const handleDelete = async (advanceId) => {
    try {
      const { error } = await supabase.from('advances').delete().eq('id', advanceId);
      if (error) throw error;

      setAdvances(advances.filter(advance => advance.id !== advanceId));
      handleSnackbarOpen('Advance deleted successfully.');
    } catch (error) {
      console.error('Error deleting advance:', error);
      handleSnackbarOpen('Failed to delete advance. Please try again.', 'error');
    }
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
                <TableCell>{advance.staffs?.username || 'Unknown'}</TableCell>
                <TableCell>{advance.advance_date}</TableCell>
                <TableCell>₹{parseFloat(advance.amount).toFixed(2)}</TableCell>
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
          <Button onClick={handleSubmit} className="mt-4">
            Add Advance
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
