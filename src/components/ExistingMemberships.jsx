import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { Select, SelectTrigger, SelectContent, SelectItem } from '../components/ui/select';
import { MoreVertical, Trash2, MessageCircle, Printer, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import MembershipDialog from './MembershipDialog';
import PrintBillDialog from './PrintBillDialog'; 
import { supabase } from '../supabaseClient';

// Alert Component for Snackbar
const Alert = React.forwardRef((props, ref) => <MuiAlert elevation={6} ref={ref} {...props} />);

// Utility function to format date to DD-MM-YYYY
const formatIndianDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

function ExistingMemberships() {
  const [memberships, setMemberships] = useState([]);
  const [openMembershipDialog, setOpenMembershipDialog] = useState(false);
  const [openPrintDialog, setOpenPrintDialog] = useState(false);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [todayIncome, setTodayIncome] = useState(0);
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
    calculateTodayIncome();
  }, [dateRange, customFromDate, customToDate]);

  const fetchMemberships = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let query = supabase.from('memberships').select(`
        id,
        user_id,
        start_date,
        end_date,
        total_amount,
        users (id, name, mobile_number_1, date_of_birth),
        membership_plan:membership_plans!memberships_membership_plan_id_fkey (id, name),
        admission_plan:membership_plans!memberships_admission_plan_id_fkey (id, name),
        additional_service_plan:membership_plans!memberships_additional_service_plan_id_fkey (id, name),
        payment_modes (id, name)
      `);

      if (dateRange === 'today') {
        query = query.eq('start_date', today);
      } else if (dateRange === 'custom' && customFromDate && customToDate) {
        query = query.gte('start_date', customFromDate).lte('start_date', customToDate);
      }

      const { data: membershipsData, error } = await query;
      if (error) throw error;
      setMemberships(membershipsData);
    } catch (error) {
      console.error('Error fetching memberships:', error.message);
    }
  };

  const calculateTodayIncome = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let query = supabase.from('memberships').select('total_amount');

      if (dateRange === 'today') {
        query = query.eq('start_date', today);
      } else if (dateRange === 'custom' && customFromDate && customToDate) {
        query = query.gte('start_date', customFromDate).lte('start_date', customToDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      const totalIncome = data.reduce((sum, membership) => sum + membership.total_amount, 0);
      setTodayIncome(totalIncome);
    } catch (error) {
      console.error('Error calculating income:', error.message);
    }
  };

  const handleDeleteMembership = async (membershipId) => {
    try {
      const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
      if (error) throw error;
      setSnackbarMessage("Membership deleted successfully.");
      setSnackbarSeverity("success");
      fetchMemberships();
      calculateTodayIncome();
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

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Membership Report", 20, 10);
    doc.text(`Total Income for Selected Period: ₹${todayIncome.toFixed(2)}`, 20, 20);

    let yPos = 30;
    memberships.forEach((membership) => {
      doc.text(`User: ${membership.users.name}`, 20, yPos);
      doc.text(`Plan: ${membership.membership_plan.name}`, 20, yPos + 10);
      doc.text(`Start Date: ${membership.start_date}`, 20, yPos + 20);
      doc.text(`End Date: ${membership.end_date}`, 20, yPos + 30);
      doc.text(`DOB: ${formatIndianDate(membership.users.date_of_birth)}`, 20, yPos + 40);
      doc.text(`Amount: ₹${membership.total_amount.toFixed(2)}`, 20, yPos + 50);
      yPos += 60;
    });

    doc.save(`Membership_Report_${dateRange}.pdf`);
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl">Existing Memberships</CardTitle>
          <Button onClick={() => setOpenMembershipDialog(true)}>Add Membership</Button>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div>
            <Label>Total Income:</Label>
            <p className="font-bold text-lg">₹ {todayIncome.toFixed(2)}</p>
          </div>
          <div className="flex space-x-4">
            <Select onValueChange={setDateRange} defaultValue={dateRange}>
              <SelectTrigger>Date Range</SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="custom">Custom Range</SelectItem>
              </SelectContent>
            </Select>
            {dateRange === 'custom' && (
              <>
                <Input type="date" value={customFromDate} onChange={(e) => setCustomFromDate(e.target.value)} />
                <Input type="date" value={customToDate} onChange={(e) => setCustomToDate(e.target.value)} />
              </>
            )}
            <Button onClick={handleDownloadPDF}>
              <FileText className="mr-2" /> Download Report
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">DOB</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Mode</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount (₹)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {memberships.slice((currentPage - 1) * membershipsPerPage, currentPage * membershipsPerPage).map((membership) => (
                <tr key={membership.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.users.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{formatIndianDate(membership.users.date_of_birth)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.membership_plan.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.payment_modes.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.start_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{membership.end_date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">₹ {membership.total_amount.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center justify-end space-x-2">
                    <Printer
                      className="cursor-pointer text-gray-600 hover:text-gray-800 w-4 h-4"
                      onClick={() => handlePrint(membership)}
                    />
                    <MessageCircle
                      className="text-green-500 cursor-pointer hover:text-green-700 w-4 h-4"
                      onClick={() => handleWhatsApp(membership.users, membership.membership_plan, membership.start_date)}
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
                  <td colSpan="8" className="px-6 py-4 text-center">
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
