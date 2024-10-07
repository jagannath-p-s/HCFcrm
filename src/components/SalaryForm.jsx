import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '../supabaseClient';

const SalaryForm = ({ staffs, onSalaryAdded }) => {
  const [formData, setFormData] = useState({
    staff_id: '',
    scheduled_payment_date: '',
    deductions: 0,
    bonuses: 0,
    salary_amount: 0, // This will be filled automatically
    remarks: '',
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch the selected staff's salary when staff is selected
  const handleStaffSelect = async (staffId) => {
    setFormData({ ...formData, staff_id: staffId });
    
    // Fetch the selected staff's salary from the `staffs` table
    const { data, error } = await supabase
      .from('staffs')
      .select('salary')
      .eq('id', staffId)
      .single();

    if (error) {
      console.error('Error fetching staff salary:', error);
      return;
    }

    // Set the fetched salary into the form data
    setFormData({ ...formData, staff_id: staffId, salary_amount: data.salary });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddSalary = async () => {
    try {
      // Calculate net salary
      const baseSalary = parseFloat(formData.salary_amount || 0);
      const deductions = parseFloat(formData.deductions || 0);
      const bonuses = parseFloat(formData.bonuses || 0);
      const netSalary = baseSalary + bonuses - deductions;

      // Insert the salary data into the database
      const { data, error } = await supabase.from('staff_salaries').insert([
        {
          staff_id: formData.staff_id,
          scheduled_payment_date: formData.scheduled_payment_date,
          salary_amount: baseSalary,
          deductions: deductions,
          bonuses: bonuses,
          net_salary: netSalary,
          remarks: formData.remarks,
          status: 'Pending',
        },
      ]);

      if (error) {
        console.error('Error inserting salary:', error);
        return; // Stop if there is an error
      }

      console.log('Salary added successfully:', data);
      setIsDialogOpen(false);
      onSalaryAdded(); // Refresh the list after adding
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  };

  return (
    <>
      <Button variant="default" onClick={() => setIsDialogOpen(true)}>
        Schedule Salary Payment
      </Button>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Schedule Salary Payment</DialogTitle>
            <DialogDescription>Fill out the form below to schedule a salary payment.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Staff Selection */}
            <div>
              <label className="text-sm font-medium">Select Staff</label>
              <Select value={formData.staff_id} onValueChange={handleStaffSelect}>
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

            {/* Scheduled Payment Date */}
            <div>
              <label className="text-sm font-medium">Scheduled Payment Date</label>
              <Input type="date" name="scheduled_payment_date" value={formData.scheduled_payment_date} onChange={handleChange} />
            </div>

            {/* Deductions */}
            <div>
              <label className="text-sm font-medium">Deductions</label>
              <Input type="number" name="deductions" value={formData.deductions} onChange={handleChange} />
            </div>

            {/* Bonuses */}
            <div>
              <label className="text-sm font-medium">Bonuses</label>
              <Input type="number" name="bonuses" value={formData.bonuses} onChange={handleChange} />
            </div>

            {/* Salary Amount (filled automatically) */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Base Salary</label>
              <Input type="number" name="salary_amount" value={formData.salary_amount} readOnly />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Remarks</label>
              <Input name="remarks" value={formData.remarks} onChange={handleChange} />
            </div>
          </div>
          <Button onClick={handleAddSalary} className="mt-4">Schedule Salary</Button>
        </DialogContent>
      </Dialog>
    </>
  );
};



export default SalaryForm;
