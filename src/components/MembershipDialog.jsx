import React, { useState, useEffect } from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '../supabaseClient';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Snackbar } from '@mui/material';

function MembershipDialog({ open, onClose, refreshData }) {
  const [membershipFormData, setMembershipFormData] = useState({
    user_id: '',
    membership_plan_id: '',
    payment_mode_id: '',
    start_date: '',
    end_date: '',
    admission_or_renewal_fee: 0,
    plan_fee: 0,
    additional_fee: 1000,
    total_amount: 0,
    remarks: '',
  });

  const [users, setUsers] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [newPaymentMode, setNewPaymentMode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [usersData, plansData, paymentModesData] = await Promise.all([
        supabase.from('users').select('id, name'),
        supabase.from('membership_plans').select('*'),
        supabase.from('payment_modes').select('*')
      ]);

      setUsers(usersData.data || []);
      setAllPlans(plansData.data || []);
      setPaymentModes(paymentModesData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load necessary data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setMembershipFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (planId) => {
    const selectedPlan = allPlans.find((plan) => plan.id === parseInt(planId));
    if (!selectedPlan) return;

    const startDate = new Date();
    const endDate = new Date(startDate);
    if (selectedPlan.duration_in_days) {
      endDate.setDate(startDate.getDate() + selectedPlan.duration_in_days);
    }

    setMembershipFormData(prev => ({
      ...prev,
      membership_plan_id: planId,
      plan_fee: selectedPlan.base_price || 0,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      admission_or_renewal_fee: selectedPlan.type.toLowerCase() === 'admission fee' ? selectedPlan.base_price : 0,
      additional_fee: selectedPlan.type.toLowerCase() === 'additional service' ? selectedPlan.base_price : 0,
    }));
  };

  const handleAdditionalFeeChange = (e) => {
    const fee = parseFloat(e.target.value) || 0;
    handleInputChange('additional_fee', fee);
  };

  const handleAddPaymentMode = async () => {
    if (!newPaymentMode.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('payment_modes').insert({ name: newPaymentMode.trim() }).select().single();
      if (error) throw error;
      setPaymentModes(prev => [...prev, data]);
      setNewPaymentMode('');
      handleInputChange('payment_mode_id', data.id);
      setSnackbarMessage('New payment mode added successfully');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error adding payment mode:', error);
      setSnackbarMessage('Failed to add new payment mode. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return (
      parseFloat(membershipFormData.admission_or_renewal_fee || 0) +
      parseFloat(membershipFormData.plan_fee || 0) +
      parseFloat(membershipFormData.additional_fee || 0)
    );
  };

  const handleFormSubmit = async () => {
    const totalAmount = calculateTotal();

    if (totalAmount === 0) {
      setSnackbarMessage('At least one fee (Plan, Admission/Renewal, or Additional) should be charged.');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('memberships').insert({
        ...membershipFormData,
        total_amount: totalAmount,
      });
      if (error) throw error;
      toast({
        title: "Success",
        description: "Membership added successfully.",
      });
      refreshData();
      onClose();
    } catch (error) {
      console.error('Error saving membership:', error);
      toast({
        title: "Error",
        description: "Failed to save membership. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-[800px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Membership</DialogTitle>
            <DialogDescription>Fill in the details to add a new membership.</DialogDescription>
          </DialogHeader>
          {isLoading ? (
            <div className="flex justify-center items-center h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 px-4">
              <div className="space-y-4">
                <div>
                  <Label>User</Label>
                  <Select
                    value={membershipFormData.user_id}
                    onValueChange={(value) => handleInputChange('user_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select User" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Membership Plan</Label>
                  <Select
                    value={membershipFormData.membership_plan_id}
                    onValueChange={handlePlanChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {allPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - ₹{plan.base_price} ({plan.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-3">
                  <Label>Admission Fee (₹)</Label>
                  <Input
                    id="additional-fee"
                    type="number"
                    value={membershipFormData.additional_fee}
                    onChange={handleAdditionalFeeChange}
                    placeholder="Enter additional fee"
                  />
                </div>

                <div>
                  <Label>Payment Mode</Label>
                  <Select
                    value={membershipFormData.payment_mode_id}
                    onValueChange={(value) => handleInputChange('payment_mode_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Payment Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModes.map((mode) => (
                        <SelectItem key={mode.id} value={mode.id.toString()}>{mode.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 mb-6">
                  <Input
                    value={newPaymentMode}
                    onChange={(e) => setNewPaymentMode(e.target.value)}
                    placeholder="New payment mode"
                  />
                  <Button onClick={handleAddPaymentMode} disabled={!newPaymentMode.trim() || isLoading}>
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={membershipFormData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={membershipFormData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Remarks</Label>
                  <Input
                    id="remarks"
                    value={membershipFormData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter any remarks"
                  />
                </div>

                <div>
                  <Label>Total Amount (₹)</Label>
                  <Input
                    id="total-amount"
                    value={calculateTotal().toFixed(2)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </>
  );
}

export default MembershipDialog;