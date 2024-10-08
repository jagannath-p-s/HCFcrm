import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Snackbar, Alert } from '@mui/material';
import { supabase } from '../supabaseClient';

const SalaryForm = ({ staffs, onSalaryAdded }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    scheduled_payment_date: '',
    deductions: 0,
    bonuses: 0,
    salary_amount: 0,
    remarks: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [availableStaffs, setAvailableStaffs] = useState(staffs);

  useEffect(() => {
    if (!staffs || staffs.length === 0) {
      fetchStaffs();
    }
  }, []);

  const fetchStaffs = async () => {
    try {
      const { data, error } = await supabase.from('staffs').select('id, username, salary');
      if (error) throw error;
      setAvailableStaffs(data);
    } catch (error) {
      console.error('Error fetching staff:', error.message);
      showSnackbar('Error fetching staff list', 'error');
    }
  };

  const handleStaffSelect = async (staffId) => {
    const selectedStaff = availableStaffs.find((staff) => staff.id.toString() === staffId);
    if (selectedStaff) {
      setFormData((prevData) => ({
        ...prevData,
        staff_id: staffId,
        salary_amount: selectedStaff.salary || 0,
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleAddSalary = async () => {
    try {
      const baseSalary = parseFloat(formData.salary_amount || 0);
      const deductions = parseFloat(formData.deductions || 0);
      const bonuses = parseFloat(formData.bonuses || 0);
      const netSalary = baseSalary + bonuses - deductions;

      const { error } = await supabase.from('staff_salaries').insert([
        {
          staff_id: formData.staff_id,
          base_salary: baseSalary,
          advance_taken: deductions,
          manual_deduction: deductions,
          total_deductions: deductions,
          net_salary: netSalary,
          payment_date: formData.scheduled_payment_date,
          remarks: formData.remarks,
        },
      ]);

      if (error) throw error;

      setIsDialogOpen(false);
      showSnackbar('Salary scheduled successfully', 'success');
      onSalaryAdded();
    } catch (error) {
      console.error('Error inserting salary:', error.message);
      showSnackbar('Error scheduling salary', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button onClick={() => setIsDialogOpen(true)}>
        Schedule Salary Payment
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Salary Payment</DialogTitle>
            <DialogDescription>Fill out the form below to schedule a salary payment.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium">Select Staff</label>
              <Select value={formData.staff_id} onValueChange={handleStaffSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Staff" />
                </SelectTrigger>
                <SelectContent>
                  {availableStaffs.length > 0 ? (
                    availableStaffs.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id.toString()}>
                        {staff.username}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No Staff Available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Scheduled Payment Date</label>
              <Input type="date" name="scheduled_payment_date" value={formData.scheduled_payment_date} onChange={handleChange} />
            </div>

            <div>
              <label className="text-sm font-medium">Deductions</label>
              <Input type="number" name="deductions" value={formData.deductions} onChange={handleChange} />
            </div>

            <div>
              <label className="text-sm font-medium">Bonuses</label>
              <Input type="number" name="bonuses" value={formData.bonuses} onChange={handleChange} />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Base Salary</label>
              <Input type="number" name="salary_amount" value={formData.salary_amount} readOnly />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input name="remarks" value={formData.remarks} onChange={handleChange} />
            </div>
          </div>
          <Button onClick={handleAddSalary} className="mt-4">Schedule Salary</Button>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SalaryForm;
