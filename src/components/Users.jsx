import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AddEditUserDialog from "./AddEditUserDialog";
import UsersTable from "./UsersTable";
import DeactivatedUsersTable from "./DeactivatedUsersTable";
import { supabase } from "../supabaseClient";
import { Button } from "@/components/ui/button";

const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeactivatedUsers, setShowDeactivatedUsers] = useState(false); // New state to toggle views

  useEffect(() => {
    fetchUsersData();
  }, []);

  const fetchUsersData = async () => {
    const { data, error } = await supabase.from("users").select("*");
    if (!error) setUsersData(data);
  };

  const handleAddUser = () => {
    setIsEdit(false);
    setSelectedUser(null);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user) => {
    setIsEdit(true);
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const toggleView = () => {
    setShowDeactivatedUsers((prev) => !prev);
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Users Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Button onClick={handleAddUser}>Add User</Button>
            <Button onClick={toggleView} variant="outline">
              {showDeactivatedUsers ? "View Active Users" : "View All Users"}
            </Button>
          </div>

          {/* Conditionally render UsersTable or DeactivatedUsersTable */}
          {showDeactivatedUsers ? (
            <DeactivatedUsersTable />
          ) : (
            <UsersTable users={usersData} onEdit={handleEditUser} refreshUsers={fetchUsersData} />
          )}
        </CardContent>
      </Card>

      <AddEditUserDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isEdit={isEdit}
        user={selectedUser}
        refreshUsers={fetchUsersData}
      />
    </div>
  );
};

export default Users;
