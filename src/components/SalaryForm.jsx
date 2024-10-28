// components/SalaryForm.jsx

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
  const [currentAdvance, setCurrentAdvance] = useState(0); // Store current advance taken

  useEffect(() => {
    if (!staffs || staffs.length === 0) {
      fetchStaffs();
    }
  }, [staffs]);

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
      // Fetch current advance for selected staff
      const { data: advances, error: advanceError } = await supabase
        .from('advances')
        .select('amount')
        .eq('staff_id', staffId);

      if (advanceError) {
        console.error('Error fetching advance:', advanceError.message);
      } else {
        const totalAdvance = advances.reduce((sum, adv) => sum + Number(adv.amount), 0);
        setCurrentAdvance(totalAdvance);
      }
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

      const { data, error } = await supabase
        .from('salaries')
        .insert([
          {
            employee_id: formData.staff_id,
            basic_salary: baseSalary,
            advance: currentAdvance,
            deductions: deductions,
            bonus: bonuses,
            scheduled_date: formData.scheduled_payment_date,
            status: 'unpaid',
            remarks: formData.remarks,
          },
        ])
        .select(); // Use select() to return the inserted row

      if (error) throw error;

      setIsDialogOpen(false);
      showSnackbar('Salary scheduled successfully', 'success');

      // Pass the new salary to the parent component
      if (onSalaryAdded && data) {
        onSalaryAdded(data[0]);
      }

      // Reset the form
      setFormData({
        staff_id: '',
        scheduled_payment_date: '',
        deductions: 0,
        bonuses: 0,
        salary_amount: 0,
        remarks: '',
      });
      setCurrentAdvance(0); // Reset advance display
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
          {/* Horizontal layout (landscape orientation) */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="w-full md:w-1/2 lg:w-1/3">
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

            <div className="w-full md:w-1/2 lg:w-1/3">
              <label className="text-sm font-medium">Scheduled Payment Date</label>
              <Input
                type="date"
                name="scheduled_payment_date"
                value={formData.scheduled_payment_date}
                onChange={handleChange}
              />
            </div>

            <div className="w-full md:w-1/2 lg:w-1/3">
              <label className="text-sm font-medium">Deductions</label>
              <Input
                type="number"
                name="deductions"
                value={formData.deductions}
                onChange={handleChange}
              />
            </div>

            <div className="w-full md:w-1/2 lg:w-1/3">
              <label className="text-sm font-medium">Bonuses</label>
              <Input
                type="number"
                name="bonuses"
                value={formData.bonuses}
                onChange={handleChange}
              />
            </div>

            <div className="w-full md:w-1/2 lg:w-1/3">
              <label className="text-sm font-medium">Base Salary</label>
              <Input type="number" name="salary_amount" value={formData.salary_amount} readOnly />
            </div>

            <div className="w-full md:w-1/2 lg:w-1/3">
              <label className="text-sm font-medium">Current Advance Taken</label>
              <Input type="number" value={currentAdvance} readOnly />
            </div>

            <div className="w-full">
              <label className="text-sm font-medium">Remarks</label>
              <Input
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
              />
            </div>
          </div>
          <Button onClick={handleAddSalary} className="mt-4">
            Schedule Salary
          </Button>
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
