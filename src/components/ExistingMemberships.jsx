import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Edit2, Trash2, MoreVertical } from 'lucide-react';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import MembershipDialog from './MembershipDialog';
import { supabase } from '../supabaseClient';

function ExistingMemberships() {
  const [memberships, setMemberships] = useState([]);
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [dateRange, setDateRange] = useState('today');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const membershipsPerPage = 10;

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data: membershipsData, error: membershipsError } = await supabase.from('memberships').select(`
        id,
        user_id,
        start_date,
        end_date,
        total_amount,
        users (id, name),
        membership_plans!memberships_membership_plan_id_fkey (id, name),
        payment_modes (id, name)
      `);
      
      if (membershipsError) throw membershipsError;
      setMemberships(membershipsData);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleOpenMembershipDialog = () => {
    setOpenMembershipDialog(true);
  };

  const handleCloseMembershipDialog = () => {
    setOpenMembershipDialog(false);
    fetchMemberships(); // Refresh membership data after adding
  };

  const filterMembershipsByDateRange = () => {
    const filteredMemberships = memberships.filter((membership) => {
      const today = new Date();
      const membershipDate = new Date(membership.start_date);
      switch (dateRange) {
        case 'today':
          return membershipDate.toDateString() === today.toDateString();
        case 'week':
          const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
          return membershipDate >= startOfWeek;
        case 'month':
          return membershipDate.getMonth() === today.getMonth() && membershipDate.getFullYear() === today.getFullYear();
        case 'custom':
          const from = new Date(customFromDate);
          const to = new Date(customToDate);
          return membershipDate >= from && membershipDate <= to;
        default:
          return true;
      }
    });
    return filteredMemberships.slice((currentPage - 1) * membershipsPerPage, currentPage * membershipsPerPage);
  };

  const totalPages = Math.ceil(memberships.length / membershipsPerPage);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-2xl">Existing Memberships</CardTitle>
          <Button onClick={handleOpenMembershipDialog}>Add Membership</Button>
        </div>
        <div className="mt-4">
          <Label>Date Range</Label>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="p-2 border rounded">
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
          </select>
          {dateRange === 'custom' && (
            <div className="flex space-x-4 mt-4">
              <Input type="date" value={customFromDate} onChange={(e) => setCustomFromDate(e.target.value)} />
              <Input type="date" value={customToDate} onChange={(e) => setCustomToDate(e.target.value)} />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filterMembershipsByDateRange().map((membership) => (
                <tr key={membership.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.users.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.membership_plans.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.payment_modes.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.total_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    No memberships found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between">
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
      </CardContent>

      <MembershipDialog open={openMembershipDialog} onClose={handleCloseMembershipDialog} refreshData={fetchMemberships} />
    </Card>
  );
}

export default ExistingMemberships;
