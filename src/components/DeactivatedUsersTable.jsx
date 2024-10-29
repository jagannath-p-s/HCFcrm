import React, { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} {...props} />;
});

function DeactivatedUsersTable() {
  const [deactivatedUsers, setDeactivatedUsers] = useState([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetchDeactivatedUsers();
  }, []);

  const fetchDeactivatedUsers = async () => {
    const { data, error } = await supabase
      .from("deactivated_users")
      .select("user_id, name, email, mobile_number_1, deactivated_at");

    if (error) {
      console.error("Error fetching deactivated users:", error);
      return;
    }

    setDeactivatedUsers(data);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleReactivateUser = async (userId) => {
    try {
      // Update the user's `active` status in the `users` table
      const { error: updateError } = await supabase
        .from("users")
        .update({ active: true })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Remove the user from the `deactivated_users` table
      const { error: deleteError } = await supabase
        .from("deactivated_users")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      setSnackbarMessage("User reactivated successfully.");
      setSnackbarSeverity("success");

      // Refresh the deactivated users list
      fetchDeactivatedUsers();
    } catch (error) {
      setSnackbarMessage(`Error: ${error.message}`);
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  return (
    <div>
      <h2 className="mb-4">Deactivated Users</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>User ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Mobile</TableHead>
            <TableHead>Deactivated At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deactivatedUsers.length > 0 ? (
            deactivatedUsers.map((user, index) => (
              <TableRow key={user.user_id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{user.user_id}</TableCell>
                <TableCell>{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.mobile_number_1}</TableCell>
                <TableCell>{new Date(user.deactivated_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReactivateUser(user.user_id)}
                  >
                    Reactivate
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="text-center">
                No deactivated users found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

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
    </div>
  );
}

export default DeactivatedUsersTable;
