import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../components/ui/card';
import { Button } from '../components/ui/button';
import 'jspdf-autotable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { MoreVertical, Trash2, MessageCircle, Printer, Edit3 } from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import MembershipDialog from './MembershipDialog';
import PrintBillDialog from './PrintBillDialog';
import { supabase } from '../supabaseClient';
import DownloadMemberships from './DownloadMemberships';

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} {...props} />;
});

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
  const [dateRange, setDateRange] = useState('all'); // Changed default to 'all'
  const [customFromDate, setCustomFromDate] = useState('');
  const [customToDate, setCustomToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [editingRemarkId, setEditingRemarkId] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');
  const entriesOptions = [25, 50, 75, 100];
  const dateFilterOptions = [
    { label: 'All', value: 'all' },
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Year', value: 'year' },
    { label: 'Custom Range', value: 'custom' },
  ];

  useEffect(() => {
    fetchMemberships();
    calculateTodayIncome();
  }, [dateRange, customFromDate, customToDate, searchTerm, entriesPerPage, currentPage]);

  const fetchMemberships = async () => {
    try {
      const today = new Date();
      let startOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];

      let query = supabase
        .from('memberships')
        .select(
          `
          id,
          user_id,
          start_date,
          end_date,
          total_amount,
          remarks,
          created_at,
          users (
            id,
            name,
            mobile_number_1,
            date_of_birth,
            active
          ),
          membership_plan:membership_plans!memberships_membership_plan_id_fkey (id, name),
          payment_modes (id, name)
        `
        );

      // Remove users.active filter or make it optional
      // query = query.eq('users.active', true);

      // Date filters
      if (dateRange !== 'all') {
        if (dateRange === 'today') {
          query = query.eq('start_date', today.toISOString().split('T')[0]);
        } else if (dateRange === 'week') {
          let startOfWeek = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - today.getDay()
          )
            .toISOString()
            .split('T')[0];
          query = query.gte('start_date', startOfWeek);
        } else if (dateRange === 'month') {
          let startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
            .toISOString()
            .split('T')[0];
          query = query.gte('start_date', startOfMonth);
        } else if (dateRange === 'year') {
          query = query.gte('start_date', startOfYear);
        } else if (dateRange === 'custom' && customFromDate && customToDate) {
          query = query.gte('start_date', customFromDate).lte('start_date', customToDate);
        }
      }

      // Check if searchTerm is a numeric value
      if (searchTerm) {
        if (/^\d+$/.test(searchTerm)) {
          // If searchTerm is numeric
          query = query.eq('id', parseInt(searchTerm, 10));
        } else {
          // If searchTerm is not numeric
          query = query.ilike('users.name', `%${searchTerm}%`);
        }
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

      if (dateRange !== 'all') {
        if (dateRange === 'today') {
          query = query.eq('start_date', today);
        } else if (dateRange === 'week') {
          let startOfWeek = new Date(
            new Date().getFullYear(),
            new Date().getMonth(),
            new Date().getDate() - new Date().getDay()
          )
            .toISOString()
            .split('T')[0];
          query = query.gte('start_date', startOfWeek);
        } else if (dateRange === 'month') {
          let startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split('T')[0];
          query = query.gte('start_date', startOfMonth);
        } else if (dateRange === 'year') {
          let startOfYear = new Date(new Date().getFullYear(), 0, 1)
            .toISOString()
            .split('T')[0];
          query = query.gte('start_date', startOfYear);
        } else if (dateRange === 'custom' && customFromDate && customToDate) {
          query = query.gte('start_date', customFromDate).lte('start_date', customToDate);
        }
      }

      const { data, error } = await query;
      if (error) throw error;
      const totalIncome = data.reduce((sum, membership) => sum + membership.total_amount, 0);
      setTodayIncome(totalIncome);
    } catch (error) {
      console.error('Error calculating income:', error.message);
    }
  };

  const handleUpdateRemark = async (membershipId) => {
    try {
      const { error } = await supabase
        .from('memberships')
        .update({ remarks: remarkInput })
        .eq('id', membershipId);

      if (error) throw error;
      setSnackbarMessage('Remark updated successfully.');
      setSnackbarSeverity('success');
      fetchMemberships();
    } catch (error) {
      setSnackbarMessage(`Error updating remark: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setEditingRemarkId(null);
      setSnackbarOpen(true);
    }
  };

  const handleDeleteMembership = async (membershipId) => {
    try {
      const { error } = await supabase.from('memberships').delete().eq('id', membershipId);
      if (error) throw error;
      setSnackbarMessage('Membership deleted successfully.');
      setSnackbarSeverity('success');
      fetchMemberships();
      calculateTodayIncome();
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleEditRemark = (membershipId, currentRemark) => {
    setEditingRemarkId(membershipId);
    setRemarkInput(currentRemark || '');
  };

  const handlePrint = (membership) => {
    setSelectedMembership(membership);
    setOpenPrintDialog(true);
  };

  const handleWhatsApp = (user, plan, startDate) => {
    const message = `Hello ${user.name}, your membership for the ${plan.name} plan starts on ${formatIndianDate(
      startDate
    )}. Thank you!`;
    const phoneNumber = user.mobile_number_1;
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  };

  const totalPages = Math.ceil(memberships.length / entriesPerPage);
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
          <div className="flex space-x-2">
            <Button onClick={() => setOpenMembershipDialog(true)}>Add Membership</Button>
            <DownloadMemberships
              dateRange={dateRange}
              customFromDate={customFromDate}
              customToDate={customToDate}
              memberships={memberships}
              todayIncome={todayIncome}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center space-x-4">
          <div>
            <Label>Total Income:</Label>
            <p className="font-bold text-lg">₹ {todayIncome.toFixed(2)}</p>
          </div>
          <Select onValueChange={setDateRange} value={dateRange}>
            <SelectTrigger className="w-[150px]">
              <span>{dateFilterOptions.find((option) => option.value === dateRange)?.label || 'Date Range'}</span>
            </SelectTrigger>
            <SelectContent>
              {dateFilterOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {dateRange === 'custom' && (
            <>
              <Input
                type="date"
                value={customFromDate}
                onChange={(e) => setCustomFromDate(e.target.value)}
                className="w-[150px]"
              />
              <Input
                type="date"
                value={customToDate}
                onChange={(e) => setCustomToDate(e.target.value)}
                className="w-[150px]"
              />
            </>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex items-center space-x-4">
          <Input
            type="text"
            placeholder="Search by Name or Membership ID"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow"
          />
          <Select
            onValueChange={(value) => {
              setEntriesPerPage(parseInt(value, 10));
              setCurrentPage(1); // Reset to first page when entries per page changes
            }}
            value={entriesPerPage.toString()}
          >
            <SelectTrigger className="w-[150px]">Entries: {entriesPerPage}</SelectTrigger>
            <SelectContent>
              {entriesOptions.map((option) => (
                <SelectItem key={option} value={option.toString()}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {[
                  'S.No',
                  'Membership ID',
                  'User Name',
                  'DOB',
                  'Plan',
                  'Payment Mode',
                  'Start Date',
                  'End Date',
                  'Total Amount (₹)',
                  'Remarks',
                  'Actions',
                ].map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-left text-sm font-medium text-gray-600 sticky top-0 bg-gray-100"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberships.length > 0 ? (
                memberships
                  .slice((currentPage - 1) * entriesPerPage, currentPage * entriesPerPage)
                  .map((membership, index) => (
                    <tr key={membership.id} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2">{(currentPage - 1) * entriesPerPage + index + 1}</td>
                      <td className="px-4 py-2">{membership.id}</td>
                      <td className="px-4 py-2">{membership.users ? membership.users.name : 'No User'}</td>
                      <td className="px-4 py-2">
                        {membership.users ? formatIndianDate(membership.users.date_of_birth) : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        {membership.membership_plan ? membership.membership_plan.name : 'N/A'}
                      </td>
                      <td className="px-4 py-2">
                        {membership.payment_modes ? membership.payment_modes.name : 'N/A'}
                      </td>
                      <td className="px-4 py-2">{formatIndianDate(membership.start_date)}</td>
                      <td className="px-4 py-2">{formatIndianDate(membership.end_date)}</td>
                      <td className="px-4 py-2"> {membership.total_amount.toFixed(2)}</td>
                      <td className="px-4 py-2">
                        {editingRemarkId === membership.id ? (
                          <div className="flex items-center">
                            <Input
                              type="text"
                              value={remarkInput}
                              onChange={(e) => setRemarkInput(e.target.value)}
                            />
                            <Button
                              variant="link"
                              size="sm"
                              className="ml-2"
                              onClick={() => handleUpdateRemark(membership.id)}
                            >
                              Save
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <span>{membership.remarks || 'No remarks'}</span>
                            <Edit3
                              className="ml-2 cursor-pointer text-gray-600 hover:text-gray-800 w-4 h-4"
                              onClick={() => handleEditRemark(membership.id, membership.remarks)}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center space-x-2">
                          <Printer
                            className="cursor-pointer text-gray-600 hover:text-gray-800 w-4 h-4"
                            onClick={() => handlePrint(membership)}
                          />
                          <MessageCircle
                            className="text-green-500 cursor-pointer hover:text-green-700 w-4 h-4"
                            onClick={() =>
                              handleWhatsApp(
                                membership.users,
                                membership.membership_plan,
                                membership.start_date
                              )
                            }
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
                        </div>
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan="11" className="px-4 py-2 text-center">
                    No memberships found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-between items-center">
          <Button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
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

      <MembershipDialog
        open={openMembershipDialog}
        onClose={() => setOpenMembershipDialog(false)}
        refreshData={fetchMemberships}
      />

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
