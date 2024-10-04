import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const AddEditUserDialog = ({ isOpen, onClose, isEdit, user, refreshUsers }) => {
  const [formData, setFormData] = useState({
    user_id: "",
    name: "",
    email: "",
    mobile_number_1: "",
    date_of_birth: "",
    blood_group: "",
    role: "Member",
    active: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (isEdit && user) {
      setFormData(user);
    }
  }, [isEdit, user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (isEdit) {
        const { error } = await supabase
          .from("users")
          .update({
            user_id: formData.user_id,
            name: formData.name,
            email: formData.email,
            mobile_number_1: formData.mobile_number_1,
            date_of_birth: formData.date_of_birth,
            blood_group: formData.blood_group,
            role: formData.role,
            active: formData.active,
            updated_at: new Date(),
          })
          .eq("id", user.id);

        if (error) throw error;
        setSnackbar({ open: true, message: "User updated successfully.", severity: "success" });
      } else {
        const { error } = await supabase
          .from("users")
          .insert({
            user_id: formData.user_id,
            name: formData.name,
            email: formData.email,
            mobile_number_1: formData.mobile_number_1,
            date_of_birth: formData.date_of_birth,
            blood_group: formData.blood_group,
            role: formData.role,
            active: formData.active,
            created_at: new Date(),
          });

        if (error) throw error;
        setSnackbar({ open: true, message: "User added successfully.", severity: "success" });
      }

      refreshUsers(); // Refresh users dynamically after adding/editing
      onClose();
    } catch (error) {
      setSnackbar({ open: true, message: `Error: ${error.message}`, severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit User" : "Add New User"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block mb-2 text-sm">User ID</label>
              <Input
                name="user_id"
                placeholder="User ID"
                value={formData.user_id}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Name</label>
              <Input
                name="name"
                placeholder="Name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Email</label>
              <Input
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Mobile Number 1</label>
              <Input
                name="mobile_number_1"
                placeholder="Mobile Number 1"
                value={formData.mobile_number_1}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Date of Birth</label>
              <Input
                name="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Blood Group</label>
              <Input
                name="blood_group"
                placeholder="Blood Group"
                value={formData.blood_group}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block mb-2 text-sm">Role</label>
              <Input
                name="role"
                placeholder="Role"
                value={formData.role}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <Button onClick={handleSave} className="mt-4" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Save Changes" : "Add User"}
          </Button>
        </DialogContent>
      </Dialog>

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
};

export default AddEditUserDialog;
