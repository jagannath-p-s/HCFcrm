import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from '../supabaseClient';
import { Loader2 } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

function ViewMembershipDialog({ open, onClose, userId }) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchMemberships = async () => {
      setLoading(true);
      try {
        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('name')
          .eq('id', userId)
          .single();

        if (userError) throw userError;
        setUserName(userData.name);

        // Fetch memberships with related plan details
        const { data, error } = await supabase
          .from('memberships')
          .select(`
            *,
            membership_plans!memberships_membership_plan_id_fkey (name, type),
            admission_plans:membership_plans!memberships_admission_plan_id_fkey (name, type),
            additional_service_plans:membership_plans!memberships_additional_service_plan_id_fkey (name, type),
            payment_modes (name)
          `)
          .eq('user_id', userId)
          .order('start_date', { ascending: false });

        if (error) throw error;

        const today = new Date();
        const processedMemberships = data.map(membership => {
          const endDate = new Date(membership.end_date);
          const daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
          
          let status;
          if (daysRemaining < 0) {
            status = "Expired";
          } else if (daysRemaining === 0) {
            status = "Expires Today";
          } else if (daysRemaining <= 5) {
            status = "Expires in 5 Days";
          } else if (daysRemaining <= 7) {
            status = "Expires in 7 Days";
          } else {
            status = "Active";
          }

          return {
            ...membership,
            status,
            daysRemaining
          };
        });

        setMemberships(processedMemberships);
      } catch (error) {
        console.error('Error fetching memberships:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open && userId) {
      fetchMemberships();
    }
  }, [open, userId]);

  const getStatusColor = (status) => {
    switch (status) {
      case "Expires Today": return "destructive";
      case "Expires in 5 Days": return "orange";
      case "Expires in 7 Days": return "yellow";
      case "Expired": return "red";
      case "Active": return "green";
      default: return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Membership History - {userName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center p-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Membership Plan</TableHead>
                <TableHead>Admission Plan</TableHead>
                <TableHead>Additional Service</TableHead>
                <TableHead>Payment Mode</TableHead>
                <TableHead>Members</TableHead>
                <TableHead>Fees Breakdown</TableHead>
                <TableHead>Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberships.length > 0 ? (
                memberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell>{formatDate(membership.start_date)}</TableCell>
                    <TableCell>{formatDate(membership.end_date)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(membership.status)}>
                        {membership.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {membership.membership_plans?.name || 'N/A'}
                      {membership.membership_plans?.type && ` (${membership.membership_plans.type})`}
                    </TableCell>
                    <TableCell>
                      {membership.admission_plans?.name || 'N/A'}
                      {membership.admission_plans?.type && ` (${membership.admission_plans.type})`}
                    </TableCell>
                    <TableCell>
                      {membership.additional_service_plans?.name || 'N/A'}
                      {membership.additional_service_plans?.type && ` (${membership.additional_service_plans.type})`}
                    </TableCell>
                    <TableCell>{membership.payment_modes?.name || 'N/A'}</TableCell>
                    <TableCell>{membership.number_of_people}</TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>Admission: {formatCurrency(membership.admission_or_renewal_fee)}</div>
                        <div>Plan: {formatCurrency(membership.plan_fee)}</div>
                        <div>Additional: {formatCurrency(membership.additional_fee)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(membership.total_amount)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center">
                    No membership history found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ViewMembershipDialog;