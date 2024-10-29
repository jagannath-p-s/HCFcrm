import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import Pagination from "@mui/material/Pagination";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import ViewMembershipDialog from "./ViewMembershipDialog";
import MembershipDialog from "./MembershipDialog";
import { Button } from "@/components/ui/button";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} {...props} />;
});

function UsersTable({ users, onEdit, refreshUsers }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [updatedUsers, setUpdatedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(25);
  const [viewMembershipDialogOpen, setViewMembershipDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null); // Keep track of selected user ID for dialogs
  const [membershipDialogOpen, setMembershipDialogOpen] = useState(false);
  const [filterBy, setFilterBy] = useState("all");

  useEffect(() => {
    const fetchMembershipStatus = async () => {
      const today = new Date();

      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("user_id, end_date")
        .order("end_date", { ascending: false });

      if (error) {
        console.error("Error fetching memberships:", error);
        return;
      }

      const updatedUserStatus = users.map((user) => {
        const userMemberships = memberships.filter((m) => m.user_id === user.id);
        const latestMembership = userMemberships[0];
        const endDate = latestMembership ? new Date(latestMembership.end_date) : null;
        let expiryStatus = null;
        let daysRemaining = null;

        if (endDate) {
          daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
          if (daysRemaining < 0) {
            expiryStatus = "Expired";
          } else if (daysRemaining === 0) {
            expiryStatus = "Expires Today";
          } else if (daysRemaining <= 7) {
            expiryStatus = `Expires in ${daysRemaining} Days`;
          } else {
            expiryStatus = "Active";
          }
        }

        return {
          ...user,
          expiryStatus,
          daysRemaining,
          endDate,
        };
      });

      updatedUserStatus.sort((a, b) => {
        const statusOrder = {
          "Expires Today": 1,
          "Expires in 1 Days": 2,
          "Expires in 2 Days": 3,
          "Expires in 3 Days": 4,
          "Expires in 4 Days": 5,
          "Expires in 5 Days": 6,
          "Expires in 6 Days": 7,
          "Expires in 7 Days": 8,
          Active: 9,
          Expired: 10,
        };
        return (statusOrder[a.expiryStatus] || 11) - (statusOrder[b.expiryStatus] || 11);
      });

      setUpdatedUsers(updatedUserStatus);
    };

    fetchMembershipStatus();
  }, [users]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDeactivateUser = async (user) => {
    try {
      // Update user in `users` table to set them as inactive
      const { error: updateError } = await supabase
        .from("users")
        .update({ active: false })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Add the deactivated user to `deactivated_users` table
      const { error: insertError } = await supabase.from("deactivated_users").insert({
        user_id: user.id,
        name: user.name,
        email: user.email,
        mobile_number_1: user.mobile_number_1,
        deactivated_at: new Date(),
      });

      if (insertError) throw insertError;

      setSnackbarMessage("User deactivated successfully.");
      setSnackbarSeverity("success");
      refreshUsers(); // Refresh the users list to reflect changes
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleViewMemberships = (userId) => {
    setSelectedUserId(userId);
    setViewMembershipDialogOpen(true);
  };

  const handleRenewMembership = (userId) => {
    setSelectedUserId(userId); // Set the selected user ID
    setMembershipDialogOpen(true); // Open the membership dialog
  };

  const filteredUsers = updatedUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      user.user_id?.toString().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.mobile_number_1?.toLowerCase().includes(query);

    if (!matchesSearch) return false;

    switch (filterBy) {
      case "expiringToday":
        return user.expiryStatus === "Expires Today";
      case "expiringIn7Days":
        return user.daysRemaining <= 7;
      case "expired":
        return user.expiryStatus === "Expired";
      case "active":
        return user.expiryStatus === "Active";
      default:
        return true;
    }
  });

  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + entriesPerPage);

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleEntriesChange = (value) => {
    setEntriesPerPage(Number(value));
    setCurrentPage(1);
  };

  const getExpiryColor = (status) => {
    switch (status) {
      case "Expires Today":
        return "destructive";
      case "Expires in 1 Days":
        return "orange";
      case "Expires in 7 Days":
        return "yellow";
      case "Expired":
        return "red";
      case "Active":
        return "green";
      default:
        return "default";
    }
  };

  const handleWhatsApp = (user) => {
    let message;
    if (user.expiryStatus === "Expired") {
      message = `Hi ${user.name}, we noticed your gym membership expired on ${user.endDate.toLocaleDateString()}! Are you giving up on your fitness journey? We'd love to see you back soon—renew now and keep crushing your goals!`;
    } else {
      message = `Hi ${user.name}, just a reminder that your gym membership will expire in ${user.daysRemaining} days on ${user.endDate.toLocaleDateString()}. Don't miss out on your fitness journey—renew now and keep up the great work!`;
    }

    const phoneNumber = user.mobile_number_1.replace(/\D/g, ""); // Remove non-digit characters
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, "_blank");
  };

  return (
    <>
      <div className="mb-4 space-y-4">
        <div className="flex justify-between items-center">
          <Input
            placeholder="Search by User ID, Name, Email, or Mobile Number"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-md"
          />
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-[200px]">
              <span>Filter Status</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="expiringToday">Expiring Today</SelectItem>
              <SelectItem value="expiringIn7Days">Expiring in 7 Days or Less</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="active">Active</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile 1</TableHead>
            <TableHead>Date of Birth</TableHead>
            <TableHead>Blood Group</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user, index) => (
              <TableRow key={user.id}>
                <TableCell>{startIndex + index + 1}</TableCell>
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile_number_1}</TableCell>
                <TableCell>{user.date_of_birth || "N/A"}</TableCell>
                <TableCell>{user.blood_group || "N/A"}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Eye
                    className="text-blue-500 cursor-pointer h-4 w-4"
                    onClick={() => handleViewMemberships(user.id)}
                  />
                  {(user.expiryStatus === "Active" ||
                    user.expiryStatus === "Expires Today" ||
                    user.daysRemaining <= 7 ||
                    user.expiryStatus === "Expired") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRenewMembership(user.id)}
                    >
                      Renew
                    </Button>
                  )}
                  <Badge variant={getExpiryColor(user.expiryStatus)}>
                    {user.expiryStatus || "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{user.role || "N/A"}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <WhatsAppIcon
                    className="text-green-500 cursor-pointer"
                    onClick={() => handleWhatsApp(user)}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MoreVertical className="h-5 w-5 cursor-pointer" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeactivateUser(user)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <span>Show</span>
          <Select onValueChange={handleEntriesChange} defaultValue={`${entriesPerPage}`}>
            <SelectTrigger className="w-[70px]">
              {entriesPerPage}
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
          <span>entries</span>
        </div>
        <Pagination
          count={Math.ceil(filteredUsers.length / entriesPerPage)}
          page={currentPage}
          onChange={handleChangePage}
          color="primary"
        />
      </div>

      {viewMembershipDialogOpen && (
        <ViewMembershipDialog
          open={viewMembershipDialogOpen}
          onClose={() => setViewMembershipDialogOpen(false)}
          userId={selectedUserId}
        />
      )}

      {membershipDialogOpen && (
        <MembershipDialog
          open={membershipDialogOpen}
          onClose={() => setMembershipDialogOpen(false)}
          refreshData={refreshUsers}
          userId={selectedUserId} // Passing the selected user ID to MembershipDialog
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default UsersTable;
