import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, ToggleLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input"; // Import Input for search bar
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';

// Customize the Alert component from MUI
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

function UsersTable({ users, onEdit, refreshUsers }) {
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
      setSnackbarMessage("User deleted successfully.");
      refreshUsers(); // Refresh users after delete
      setSnackbarSeverity("success");
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  // Toggle active status (Deactivate only)
  const handleDeactivateUser = async (user) => {
    try {
      const { error } = await supabase
        .from("users")
        .update({ active: false })
        .eq("id", user.id);

      if (error) throw error;
      setSnackbarMessage("User deactivated successfully.");
      refreshUsers(); // Refresh users after deactivation
      setSnackbarSeverity("success");
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  // Filter users based on the search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.mobile_number_1.toLowerCase().includes(query)
    );
  });

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search by Name, Email, or Mobile Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Table to Display Users */}
      <Table>
        <TableHeader>
          <TableRow>
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
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile_number_1}</TableCell>
                <TableCell>{user.date_of_birth || "N/A"}</TableCell>
                <TableCell>{user.blood_group || "N/A"}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "destructive"}>
                    {user.active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>{user.role || "N/A"}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <MoreVertical className="h-5 w-5 cursor-pointer" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {user.active && (
                        <DropdownMenuItem onClick={() => handleDeactivateUser(user)}>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          Deactivate
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onEdit(user)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteUser(user.id)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center">
                No users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Snackbar for Notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000} // Adjusted auto-hide duration for better user experience
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} // Changed position for better visibility
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default UsersTable;
