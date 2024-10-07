import { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AdvancesComponent = ({ staffs }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    amount: '',
    advance_date: '', // Set default date here if needed
    description: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [filterMonth, setFilterMonth] = useState('');

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
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

  // Generate options for month-year selection
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
          {/* You can render dummy data here for testing */}
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>2024-10-01</TableCell>
            <TableCell>₹5000</TableCell>
            <TableCell>Advance for October</TableCell>
            <TableCell>
              <Button variant="destructive" size="sm">Delete</Button>
            </TableCell>
          </TableRow>
          {/* Add more rows as needed */}
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
          <Button onClick={() => handleSnackbarOpen('Advance added successfully.', 'success')} className="mt-4">
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
