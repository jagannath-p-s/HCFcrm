import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Edit, Trash2, ToggleLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "../supabaseClient";
import { Input } from "@/components/ui/input"; // Import Input for search bar
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

function UsersTable({ users, onEdit, refreshUsers }) {
  const [searchQuery, setSearchQuery] = useState(""); // State for search query
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Handle delete user
  const handleDeleteUser = async (userId) => {
    try {
      const { error } = await supabase.from("users").delete().eq("id", userId);
      if (error) throw error;
      setSnackbar({ open: true, message: "User deleted successfully.", severity: "success" });
      refreshUsers(); // Refresh users after delete
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
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
      setSnackbar({ open: true, message: "User deactivated successfully.", severity: "success" });
      refreshUsers(); // Refresh users after deactivation
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
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

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
      {/* Search Input */}
      <div className="mb-4">
        <Input
          placeholder="Search by Name, Email, or Mobile Number"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)} />
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
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default UsersTable;
