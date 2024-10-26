// components/SalaryTable.jsx

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FiMoreVertical } from 'react-icons/fi'; // 3-dots icon
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Snackbar, Alert } from '@mui/material';
import { supabase } from '../supabaseClient'; // Ensure correct path

const SalaryTable = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State for Add Advance Dialog
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  
  // State for Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // State for Add Advance Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Function to fetch initial salaries
    const fetchSalaries = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_salaries')
          .select(`
            id,
            staff_id,
            staffs (username), 
            base_salary,
            advance_taken,
            manual_deduction,
            total_deductions,
            net_salary,
            payment_date,
            bonuses,
            status
          `)
          .order('payment_date', { ascending: false });

        if (error) throw error;
        setSalaries(data);
      } catch (error) {
        console.error('Error fetching salaries:', error.message);
        showSnackbar('Error fetching salaries', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSalaries();

    // Setting up real-time subscription using channels (supabase-js v2)
    const channel = supabase
      .channel('public:staff_salaries') // Channel name can be arbitrary but should be unique
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events: INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'staff_salaries',
        },
        (payload) => {
          console.log('Change received!', payload);
          const { eventType, new: newData, old: oldData } = payload;

          if (eventType === 'INSERT') {
            setSalaries((prevSalaries) => [newData, ...prevSalaries]);
          } else if (eventType === 'UPDATE') {
            setSalaries((prevSalaries) =>
              prevSalaries.map((salary) =>
                salary.id === newData.id ? newData : salary
              )
            );
          } else if (eventType === 'DELETE') {
            setSalaries((prevSalaries) =>
              prevSalaries.filter((salary) => salary.id !== oldData.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup function to remove the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Snackbar functions
  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Function to open Add Advance dialog
  const handleAddAdvanceClick = (salaryId) => {
    setSelectedSalaryId(salaryId);
    setAdvanceAmount(0);
    setIsAddAdvanceOpen(true);
  };
  
  // Function to handle adding advance
  const handleAddAdvance = async () => {
    if (advanceAmount <= 0) {
      showSnackbar('Advance amount must be greater than zero.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .rpc('add_advance', {
          salary_id: selectedSalaryId,
          advance_amount: advanceAmount,
        });

      if (error) throw error;

      setIsAddAdvanceOpen(false);
      showSnackbar('Advance added successfully', 'success');
      // No need to manually update state as real-time subscription will handle it
    } catch (error) {
      console.error('Error adding advance:', error.message);
      showSnackbar('Error adding advance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Function to handle Mark as Paid
  const handleMarkAsPaid = async (salaryId) => {
    try {
      const { data, error } = await supabase
        .from('staff_salaries')
        .update({ status: 'Paid' })
        .eq('id', salaryId);

      if (error) throw error;

      showSnackbar('Marked as Paid successfully', 'success');
      // Real-time subscription will handle the UI update
    } catch (error) {
      console.error('Error marking as paid:', error.message);
      showSnackbar('Error marking as paid', 'error');
    }
  };
  
  return (
    <>
      <Table>
        <TableCaption>A list of scheduled salaries.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">ID</TableHead>
            <TableHead>Staff Name</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Bonuses</TableHead>
            <TableHead>Advance Taken</TableHead>
            <TableHead>Manual Deduction</TableHead>
            <TableHead>Total Deductions</TableHead>
            <TableHead>Net Salary</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Actions</TableHead> {/* Action Column */}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : salaries.length > 0 ? (
            salaries.map((salary) => (
              <TableRow key={salary.id}>
                <TableCell className="font-medium">{salary.id}</TableCell>
                <TableCell>{salary.staffs.username}</TableCell>
                <TableCell>{Number(salary.base_salary).toFixed(2)}</TableCell>
                <TableCell>{Number(salary.bonuses).toFixed(2)}</TableCell>
                <TableCell>{Number(salary.advance_taken).toFixed(2)}</TableCell>
                <TableCell>{Number(salary.manual_deduction).toFixed(2)}</TableCell>
                <TableCell>{Number(salary.total_deductions).toFixed(2)}</TableCell>
                <TableCell>{Number(salary.net_salary).toFixed(2)}</TableCell>
                <TableCell>
                  {new Date(salary.payment_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{salary.status}</TableCell>
                <TableCell className="text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <FiMoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onSelect={() => handleAddAdvanceClick(salary.id)}>
                        Add Advance
                      </DropdownMenuItem>
                      {salary.status !== 'Paid' && (
                        <DropdownMenuItem onSelect={() => handleMarkAsPaid(salary.id)}>
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={11} className="text-center">
                No salary records found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Add Advance Dialog */}
      <Dialog open={isAddAdvanceOpen} onOpenChange={setIsAddAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Advance</DialogTitle>
            <DialogDescription>
              Enter the advance amount to be deducted from the net salary.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Advance Amount</label>
            <Input
              type="number"
              min="0"
              value={advanceAmount}
              onChange={(e) => setAdvanceAmount(parseFloat(e.target.value))}
              placeholder="Enter amount"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={() => setIsAddAdvanceOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button className="ml-2" onClick={handleAddAdvance} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
     
    </>
  );
};

export default SalaryTable;
