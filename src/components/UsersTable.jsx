import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, MessageCircle } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input";
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Pagination from '@mui/material/Pagination';
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";

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

  useEffect(() => {
    const fetchMembershipStatus = async () => {
      const today = new Date();

      const { data: memberships, error } = await supabase
        .from("memberships")
        .select("user_id, end_date");

      if (error) {
        console.error("Error fetching memberships:", error);
        return;
      }

      const updatedUserStatus = users.map(user => {
        const membership = memberships.find(m => m.user_id === user.id);
        const endDate = membership ? new Date(membership.end_date) : null;
        let expiryStatus = null;
        let daysRemaining = null;

        if (endDate) {
          daysRemaining = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
          expiryStatus = daysRemaining < 0 ? "Expired" : daysRemaining <= 7 ? "Nearing Expiry" : "Active";
        }

        return {
          ...user,
          expiryStatus,
          daysRemaining,
          endDate,
        };
      });

      updatedUserStatus.sort((a, b) => {
        const statusOrder = { "Nearing Expiry": 1, "Active": 2, "Expired": 3 };
        return (statusOrder[a.expiryStatus] || 4) - (statusOrder[b.expiryStatus] || 4);
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
      const { error } = await supabase
        .from("users")
        .update({ active: false })
        .eq("id", user.id);

      if (error) throw error;
      setSnackbarMessage("User deactivated successfully.");
      refreshUsers();
      setSnackbarSeverity("success");
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const filteredUsers = updatedUsers.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.user_id.toString().includes(query) ||
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.mobile_number_1.toLowerCase().includes(query)
    );
  });

  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + entriesPerPage);

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleEntriesChange = (value) => {
    setEntriesPerPage(Number(value));
    setCurrentPage(1); // Reset to first page
  };

  const getExpiryColor = (status) => {
    switch (status) {
      case "Nearing Expiry": return "yellow";
      case "Expired": return "red";
      case "Active": return "green";
      default: return "default";
    }
  };

  const handleWhatsApp = (user) => {
    const message = `Hi ${user.name}, your membership plan will expire in ${user.daysRemaining} days on ${user.endDate.toLocaleDateString()}. Please renew it soon!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <>
      <div className="mb-4 flex justify-between items-center">
        <Input
          placeholder="Search by User ID, Name, Email, or Mobile Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
                  <Badge variant={getExpiryColor(user.expiryStatus)}>
                    {user.expiryStatus || "Inactive"}
                  </Badge>
                  {user.expiryStatus === "Nearing Expiry" && (
                    <MessageCircle
                      className="text-green-500 cursor-pointer"
                      style={{ marginLeft: "4px" }}
                      onClick={() => handleWhatsApp(user)}
                    />
                  )}
                </TableCell>
                <TableCell>{user.role || "N/A"}</TableCell>
                <TableCell>
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

      <div className="flex justify-center items-center mt-4 space-x-4">
        <Pagination
          count={Math.ceil(filteredUsers.length / entriesPerPage)}
          page={currentPage}
          onChange={handleChangePage}
          color="primary"
        />
        <div className="w-24">
          <Select onValueChange={handleEntriesChange} defaultValue={`${entriesPerPage}`}>
            <SelectTrigger>Entries</SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
    </>
  );
}

export default UsersTable;
