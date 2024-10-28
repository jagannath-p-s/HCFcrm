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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FiMoreVertical } from 'react-icons/fi';
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
import { supabase } from '../supabaseClient';
import { format, addMonths } from 'date-fns';

const SalaryTable = () => {
  const [salaries, setSalaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("unpaid"); // Default tab to unpaid

  // State for Add Advance Dialog
  const [isAddAdvanceOpen, setIsAddAdvanceOpen] = useState(false);
  const [selectedSalaryId, setSelectedSalaryId] = useState(null);
  const [advanceAmount, setAdvanceAmount] = useState(0);

  // State for Snackbar
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  // State for Add Advance Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSalaries = async () => {
      try {
        const { data, error } = await supabase
          .from('salaries')
          .select(`
            id,
            employee_id,
            staffs (username), 
            basic_salary,
            bonus,
            advance,
            deductions,
            scheduled_date,
            status,
            remarks
          `)
          .order('scheduled_date', { ascending: false });

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

    // Real-time subscription
    const channel = supabase
      .channel('public:salaries')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'salaries' },
        async (payload) => {
          const { eventType, new: newData, old: oldData } = payload;

          if (eventType === 'INSERT' || eventType === 'UPDATE') {
            try {
              // Fetch the complete salary record with 'staffs (username)'
              const { data, error } = await supabase
                .from('salaries')
                .select(`
                  id,
                  employee_id,
                  staffs (username), 
                  basic_salary,
                  bonus,
                  advance,
                  deductions,
                  scheduled_date,
                  status,
                  remarks
                `)
                .eq('id', newData.id)
                .single();

              if (error) throw error;

              setSalaries((prevSalaries) => {
                const index = prevSalaries.findIndex(salary => salary.id === data.id);
                if (index !== -1) {
                  // Update existing salary
                  const updatedSalaries = [...prevSalaries];
                  updatedSalaries[index] = data;
                  return updatedSalaries;
                } else {
                  // Insert new salary
                  return [data, ...prevSalaries];
                }
              });
            } catch (error) {
              console.error('Error fetching updated salary:', error.message);
              showSnackbar('Error updating salary', 'error');
            }
          } else if (eventType === 'DELETE') {
            setSalaries((prevSalaries) =>
              prevSalaries.filter((salary) => salary.id !== oldData.id)
            );
          }
        }
      )
      .subscribe();

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
      // Make sure the RPC function `add_advance` references the correct table: `salaries`
      const { data, error } = await supabase
        .rpc('add_advance', {
          salary_id: selectedSalaryId,
          advance_amount: advanceAmount,
        });

      if (error) throw error;

      setIsAddAdvanceOpen(false);
      showSnackbar('Advance added successfully', 'success');
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
      const { data: currentSalary, error: fetchError } = await supabase
        .from('salaries')
        .select(`
          id,
          employee_id,
          basic_salary,
          bonus,
          deductions,
          advance,
          scheduled_date,
          remarks,
          staffs (username)
        `)
        .eq('id', salaryId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('salaries')
        .update({ status: 'paid', paid_date: new Date() })
        .eq('id', salaryId);

      if (updateError) throw updateError;

      // Automatically schedule next month's salary with advance set to 0
      const nextMonthDate = format(addMonths(new Date(currentSalary.scheduled_date), 1), 'yyyy-MM-dd');
      const { error: insertError } = await supabase
        .from('salaries')
        .insert({
          employee_id: currentSalary.employee_id,
          basic_salary: currentSalary.basic_salary,
          bonus: currentSalary.bonus,
          deductions: currentSalary.deductions,
          advance: 0, // Reset advance to 0 for next month
          scheduled_date: nextMonthDate,
          status: 'unpaid',
          remarks: currentSalary.remarks || '',
        });

      if (insertError) throw insertError;

      showSnackbar('Marked as Paid and scheduled next month\'s salary successfully', 'success');
    } catch (error) {
      console.error('Error marking as paid:', error.message);
      showSnackbar('Error processing salary payment', 'error');
    }
  };

  // Filter salaries based on the selected tab (unpaid or paid)
  const filteredSalaries = salaries.filter((salary) => salary.status === selectedTab);

  return (
    <>
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="unpaid">Unpaid</TabsTrigger>
          <TabsTrigger value="paid">Paid</TabsTrigger>
        </TabsList>

        <TabsContent value="unpaid">
          <Table>
            <TableCaption>List of Unpaid Salaries</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Advance Taken</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredSalaries.length > 0 ? (
                filteredSalaries.map((salary) => {
                  const netSalary = Number(salary.basic_salary) + Number(salary.bonus) - Number(salary.deductions) - Number(salary.advance);
                  return (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{salary.id}</TableCell>
                      {/* Use optional chaining to safely access username */}
                      <TableCell>{salary.staffs?.username || 'Unknown Staff'}</TableCell>
                      <TableCell>{Number(salary.basic_salary).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.bonus).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.advance).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.deductions).toFixed(2)}</TableCell>
                      <TableCell>{netSalary.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(salary.scheduled_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{salary.status}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><FiMoreVertical /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleAddAdvanceClick(salary.id)}>Add Advance</DropdownMenuItem>
                            {salary.status !== 'paid' && (
                              <DropdownMenuItem onSelect={() => handleMarkAsPaid(salary.id)}>Mark as Paid</DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">No salary records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="paid">
          <Table>
            <TableCaption>List of Paid Salaries</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Staff Name</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Bonuses</TableHead>
                <TableHead>Advance Taken</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">Loading...</TableCell>
                </TableRow>
              ) : filteredSalaries.length > 0 ? (
                filteredSalaries.map((salary) => {
                  const netSalary = Number(salary.basic_salary) + Number(salary.bonus) - Number(salary.deductions) - Number(salary.advance);
                  return (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{salary.id}</TableCell>
                      <TableCell>{salary.staffs?.username || 'Unknown Staff'}</TableCell>
                      <TableCell>{Number(salary.basic_salary).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.bonus).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.advance).toFixed(2)}</TableCell>
                      <TableCell>{Number(salary.deductions).toFixed(2)}</TableCell>
                      <TableCell>{netSalary.toFixed(2)}</TableCell>
                      <TableCell>{format(new Date(salary.scheduled_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{salary.status}</TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><FiMoreVertical /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onSelect={() => handleAddAdvanceClick(salary.id)}>Add Advance</DropdownMenuItem>
                            {/* Optionally, you can add more actions for paid salaries */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">No salary records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Add Advance Dialog */}
      <Dialog open={isAddAdvanceOpen} onOpenChange={setIsAddAdvanceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Advance</DialogTitle>
            <DialogDescription>Enter the advance amount to be deducted from the net salary.</DialogDescription>
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
            <Button variant="outline" onClick={() => setIsAddAdvanceOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button className="ml-2" onClick={handleAddAdvance} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
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

export default SalaryTable;
