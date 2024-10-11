import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import bcrypt from 'bcryptjs';
import { Snackbar, Alert } from '@mui/material';

const StaffDialog = ({ open, onClose, isEdit, staffData, onSuccess }) => {
  const [staff, setStaff] = useState({
    user_id: '',
    username: '',
    useremail: '',
    password: '',
    role: 'Staff',
    mobile_number: '',
    employee_code: '',
    salary: '',
  });

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (isEdit && staffData) {
      setStaff({
        user_id: staffData.user_id,
        username: staffData.username,
        useremail: staffData.useremail,
        password: '',
        role: staffData.role,
        mobile_number: staffData.mobile_number,
        employee_code: staffData.employee_code,
        salary: staffData.salary,
      });
    } else {
      setStaff({
        user_id: '',
        username: '',
        useremail: '',
        password: '',
        role: 'Staff',
        mobile_number: '',
        employee_code: '',
        salary: '',
      });
    }
  }, [isEdit, staffData]);

  const handleSubmit = async () => {
    if (
      staff.user_id.trim() &&
      staff.username.trim() &&
      staff.useremail.trim() &&
      (!isEdit || staff.password.trim())
    ) {
      try {
        let hashedPassword = null;
        if (staff.password) {
          const salt = bcrypt.genSaltSync(12);
          hashedPassword = bcrypt.hashSync(staff.password, salt);
        }

        if (isEdit) {
          // Check if the new user_id already exists (if it was changed)
          if (staff.user_id !== staffData.user_id) {
            const { data: existingStaff } = await supabase
              .from('staffs')
              .select('user_id')
              .eq('user_id', staff.user_id)
              .single();

            if (existingStaff) {
              console.error('User ID already exists.');
              setSnackbar({ open: true, message: 'User ID already exists.', severity: 'error' });
              return;
            }
          }

          let updates = {
            user_id: staff.user_id.trim(),
            username: staff.username.trim(),
            useremail: staff.useremail.trim(),
            role: staff.role,
            mobile_number: staff.mobile_number,
            employee_code: staff.employee_code,
            salary: staff.salary ? parseFloat(staff.salary) : null,
          };

          if (hashedPassword) {
            updates.password = hashedPassword;
          }

          // Use the original user_id to find the record
          const { error } = await supabase
            .from('staffs')
            .update(updates)
            .eq('user_id', staffData.user_id);

          if (error) {
            console.error('Error updating staff:', error);
            setSnackbar({ open: true, message: 'Error updating staff.', severity: 'error' });
          } else {
            setSnackbar({ open: true, message: 'Staff updated successfully.', severity: 'success' });
            onClose();
            if (onSuccess) onSuccess();
          }
        } else {
          // Check if user_id already exists
          const { data: existingStaff } = await supabase
            .from('staffs')
            .select('user_id')
            .eq('user_id', staff.user_id)
            .single();

          if (existingStaff) {
            console.error('User ID already exists.');
            setSnackbar({ open: true, message: 'User ID already exists.', severity: 'error' });
            return;
          }

          const { error } = await supabase.from('staffs').insert([
            {
              user_id: staff.user_id.trim(),
              username: staff.username.trim(),
              useremail: staff.useremail.trim(),
              password: hashedPassword,
              role: staff.role,
              mobile_number: staff.mobile_number,
              employee_code: staff.employee_code,
              salary: staff.salary ? parseFloat(staff.salary) : null,
              start_date: new Date().toISOString(),
              end_date: new Date(
                new Date().setFullYear(new Date().getFullYear() + 1)
              ).toISOString(),
              active: true,
            },
          ]);

          if (error) {
            console.error('Error adding new staff:', error);
            setSnackbar({ open: true, message: 'Error adding new staff.', severity: 'error' });
          } else {
            setSnackbar({ open: true, message: 'Staff added successfully.', severity: 'success' });
            onClose();
            if (onSuccess) onSuccess();
          }
        }
      } catch (err) {
        console.error('Error:', err.message);
        setSnackbar({ open: true, message: 'An error occurred.', severity: 'error' });
      }
    } else {
      console.error('Please fill in all required fields.');
      setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'warning' });
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              placeholder="User ID"
              value={staff.user_id}
              onChange={(e) => setStaff({ ...staff, user_id: e.target.value })}
            />
            <Input
              placeholder="Staff Name"
              value={staff.username}
              onChange={(e) => setStaff({ ...staff, username: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={staff.useremail}
              onChange={(e) => setStaff({ ...staff, useremail: e.target.value })}
            />
            <Input
              placeholder="Password"
              type="password"
              value={staff.password}
              onChange={(e) => setStaff({ ...staff, password: e.target.value })}
            />
            <Input
              placeholder="Mobile Number"
              value={staff.mobile_number}
              onChange={(e) => setStaff({ ...staff, mobile_number: e.target.value })}
            />
            <Input
              placeholder="Employee Code"
              value={staff.employee_code}
              onChange={(e) => setStaff({ ...staff, employee_code: e.target.value })}
            />
            <Input
              placeholder="Salary"
              type="number"
              value={staff.salary}
              onChange={(e) => setStaff({ ...staff, salary: e.target.value })}
            />
            <Select
              value={staff.role}
              onValueChange={(value) => setStaff({ ...staff, role: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} className="mt-4">
            {isEdit ? 'Save Changes' : 'Add Staff'}
          </Button>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
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

export default StaffDialog;
