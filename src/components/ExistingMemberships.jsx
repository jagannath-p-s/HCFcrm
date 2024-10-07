import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { MoreVertical, Trash2, MessageCircle, Printer } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import MembershipDialog from './MembershipDialog';
import PrintBillDialog from './PrintBillDialog'; // Import the PrintBillDialog component
import { supabase } from '../supabaseClient';

// Alert Component for Snackbar
const Alert = React.forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} {...props} />);

function ExistingMemberships() {
  const [memberships, setMemberships] = useState([]);
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false); // State for Print Dialog
  const [selectedMembership, setSelectedMembership] = useState(null); // Selected membership for printing
  const [dateRange, setDateRange] = useState('today');
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const membershipsPerPage = 10;

  useEffect(() => {
    fetchMemberships();
  }, []);

  const fetchMemberships = async () => {
    try {
      const { data: membershipsData, error } = await supabase.from('memberships').select(`
        id,
        user_id,
        start_date,
        end_date,
        total_amount,
        users (id, name, mobile_number_1),
        membership_plans!memberships_membership_plan_id_fkey (id, name),
        payment_modes (id, name)
      `);
      if (error) throw error;
      setMemberships(membershipsData);
    } catch (error) {
      console.error('Error fetching memberships:', error);
    }
  };

  const handleDeleteMembership = async (membershipId) => {
    try {
      const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
      if (error) throw error;
      setSnackbarMessage("Membership deleted successfully.");
      setSnackbarSeverity("success");
      fetchMemberships(); // Refresh memberships after deletion
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleWhatsApp = (user, plan, startDate) => {
    const message = `Hi ${user.name}, your purchase of the ${plan.name} plan on ${startDate} was successful! Thank you for being a member of Her Chamber Fitness.`;
    window.open(`https://wa.me/${user.mobile_number_1}?text=${encodeURIComponent(message)}`);
  };

  const handlePrint = (membership) => {
    setSelectedMembership(membership);
    setOpenPrintDialog(true);
  };

  const totalPages = Math.ceil(memberships.length / membershipsPerPage);
  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Card className="p-6">
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle className="text-2xl">Existing Memberships</CardTitle>
          <Button onClick={() => setOpenMembershipDialog(true)}>Add Membership</Button>
        </div>
        <div className="mt-4">
          <Label className="mr-3">Date Range</Label>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberships.slice((currentPage - 1) * membershipsPerPage, currentPage * membershipsPerPage).map((membership) => (
                <tr key={membership.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.users.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.membership_plans.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.payment_modes.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.total_amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
                    <Printer
                      className="cursor-pointer text-gray-600 hover:text-gray-800 w-4 h-4"
                      onClick={() => handlePrint(membership)}
                    />
                    <MessageCircle
                      className="text-green-500 cursor-pointer hover:text-green-700 w-4 h-4"
                      onClick={() => handleWhatsApp(membership.users, membership.membership_plans, membership.start_date)}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteMembership(membership.id)}>
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <MembershipDialog open={openMembershipDialog} onClose={() => setOpenMembershipDialog(false)} refreshData={fetchMemberships} />

      {/* PrintBillDialog for printing selected membership */}
      {selectedMembership && (
        <PrintBillDialog
          open={openPrintDialog}
          onClose={() => setOpenPrintDialog(false)}
          membership={selectedMembership}
        />
      )}
    </Card>
  );
}

export default ExistingMemberships;
