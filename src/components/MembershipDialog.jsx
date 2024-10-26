// MembershipDialog.jsx
import React, { useState, useEffect } from "react";
import Select from "react-select"; // Import react-select
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "../supabaseClient";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

function MembershipDialog({ open, onClose, refreshData, userId }) {
  const [membershipFormData, setMembershipFormData] = useState({
    user_id: "",
    membership_plan_id: "",
    payment_mode_id: "",
    start_date: "",
    end_date: "",
    admission_or_renewal_fee: 1000, // Admission fee set to 1000 by default
    plan_fee: 0,
    additional_fee: 0,
    total_amount: 0,
    remarks: "",
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [paymentModes, setPaymentModes] = useState([]);
  const [newPaymentMode, setNewPaymentMode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [userOptions, setUserOptions] = useState([]);
  const [latestMembership, setLatestMembership] = useState(null); // Holds the latest membership data when renewing

  useEffect(() => {
    if (open) {
      fetchData();
      if (userId) {
        fetchUserById(userId);
        fetchLatestMembership(userId);
      } else {
        fetchUsers(); // Fetch initial users if no userId is provided
      }
    }
    // Reset form data when dialog is closed
    if (!open) {
      setMembershipFormData({
        user_id: "",
        membership_plan_id: "",
        payment_mode_id: "",
        start_date: "",
        end_date: "",
        admission_or_renewal_fee: 1000,
        plan_fee: 0,
        additional_fee: 0,
        total_amount: 0,
        remarks: "",
      });
      setSelectedUser(null);
      setUserOptions([]);
      setNewPaymentMode("");
      setLatestMembership(null);
    }
  }, [open, userId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [plansData, paymentModesData] = await Promise.all([
        supabase.from("membership_plans").select("*"),
        supabase.from("payment_modes").select("*"),
      ]);

      setAllPlans(plansData.data || []);
      setPaymentModes(paymentModesData.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setSnackbar({
        open: true,
        message: "Failed to load necessary data. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async (inputValue = "") => {
    try {
      let query = supabase.from("users").select("id, name, mobile_number_1").limit(20);
      if (inputValue.trim()) {
        query = query.or(
          `name.ilike.%${inputValue}%,mobile_number_1.ilike.%${inputValue}%`
        );
      }
      const { data, error } = await query;
      if (error) throw error;
      const options = (data || []).map((user) => ({
        value: user.id,
        label: `${user.name} (${user.mobile_number_1})`,
      }));
      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching users:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch users. Please try again.",
        severity: "error",
      });
    }
  };

  const fetchUserById = async (id) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, mobile_number_1")
        .eq("id", id)
        .single();
      if (error) throw error;
      const option = {
        value: data.id,
        label: `${data.name} (${data.mobile_number_1})`,
      };
      setSelectedUser(option);
      handleInputChange("user_id", option.value);
    } catch (error) {
      console.error("Error fetching user:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch user details. Please try again.",
        severity: "error",
      });
    }
  };

  const fetchLatestMembership = async (id) => {
    try {
      const { data, error } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", id)
        .order("end_date", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") { // PGRST116: No rows found
        throw error;
      }

      if (data) {
        setLatestMembership(data);
      } else {
        setLatestMembership(null);
      }
    } catch (error) {
      console.error("Error fetching latest membership:", error);
      setSnackbar({
        open: true,
        message: "Failed to fetch latest membership. Please try again.",
        severity: "error",
      });
    }
  };

  const handleUserInputChange = (inputValue) => {
    fetchUsers(inputValue);
  };

  const handleUserChange = (selectedOption) => {
    setSelectedUser(selectedOption);
    handleInputChange("user_id", selectedOption ? selectedOption.value : "");
  };

  const handleInputChange = (field, value) => {
    setMembershipFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (value) => {
    const planId = parseInt(value);
    const selectedPlan = allPlans.find((plan) => plan.id === planId);
    if (!selectedPlan) return;

    // Calculate the plan fee per person
    const planFeePerPerson =
      selectedPlan.base_price / (selectedPlan.number_of_people || 1);

    setMembershipFormData((prev) => ({
      ...prev,
      membership_plan_id: value,
      plan_fee: planFeePerPerson,
      // Admission fee remains editable; not overwritten here
    }));

    // Automatically set start_date and end_date based on latestMembership or today
    let baseDate = new Date();
    if (latestMembership && latestMembership.end_date) {
      baseDate = new Date(latestMembership.end_date);
      baseDate.setDate(baseDate.getDate() + 1); // Start date is the day after the last end_date
    }

    const startDate = baseDate.toISOString().split("T")[0];
    const endDateObj = new Date(baseDate);
    if (selectedPlan.duration_in_days) {
      endDateObj.setDate(endDateObj.getDate() + selectedPlan.duration_in_days);
    }
    const endDate = endDateObj.toISOString().split("T")[0];

    setMembershipFormData((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  const handleAdmissionFeeChange = (e) => {
    const fee = parseFloat(e.target.value) || 0;
    handleInputChange("admission_or_renewal_fee", fee);
  };

  const handleAdditionalFeeChange = (e) => {
    const fee = parseFloat(e.target.value) || 0;
    handleInputChange("additional_fee", fee);
  };

  const handleAddPaymentMode = async () => {
    if (!newPaymentMode.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_modes")
        .insert({ name: newPaymentMode.trim() })
        .select()
        .single();
      if (error) throw error;
      setPaymentModes((prev) => [...prev, data]);
      setNewPaymentMode("");
      handleInputChange("payment_mode_id", data.id.toString());
      setSnackbar({
        open: true,
        message: "New payment mode added successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error adding payment mode:", error);
      setSnackbar({
        open: true,
        message: "Failed to add new payment mode. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return (
      parseFloat(membershipFormData.admission_or_renewal_fee || 0) +
      parseFloat(membershipFormData.plan_fee || 0) +
      parseFloat(membershipFormData.additional_fee || 0)
    );
  };

  const handleFormSubmit = async () => {
    const totalAmount = calculateTotal();

    if (totalAmount === 0) {
      setSnackbar({
        open: true,
        message:
          "At least one fee (Plan, Admission/Renewal, or Additional) should be charged.",
        severity: "error",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Check for existing membership for the same user and plan with overlapping dates
      const { data: existingMemberships, error: fetchError } = await supabase
        .from("memberships")
        .select("*")
        .eq("user_id", membershipFormData.user_id)
        .eq("membership_plan_id", membershipFormData.membership_plan_id)
        .gte("end_date", membershipFormData.start_date)
        .lte("start_date", membershipFormData.end_date);

      if (fetchError) throw fetchError;

      if (existingMemberships && existingMemberships.length > 0) {
        // Duplicate found
        setSnackbar({
          open: true,
          message:
            "A membership already exists for this user with overlapping dates.",
          severity: "error",
        });
      } else {
        // No duplicate, proceed to insert
        const { error } = await supabase.from("memberships").insert({
          ...membershipFormData,
          total_amount: totalAmount,
        });
        if (error) throw error;
        setSnackbar({
          open: true,
          message: "Membership added successfully.",
          severity: "success",
        });
        refreshData();
        onClose();
      }
    } catch (error) {
      console.error("Error saving membership:", error);
      setSnackbar({
        open: true,
        message: "Failed to save membership. Please try again.",
        severity: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {userId ? "Renew Membership" : "Add Membership"}
            </DialogTitle>
            <DialogDescription>
              {userId
                ? "Renew the membership for the selected user."
                : "Fill in the details to add a new membership."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-4">
              {/* User Selection (Only show if userId is not provided) */}
              {!userId && (
                <div>
                  <Label>User</Label>
                  <Select
                    value={selectedUser}
                    onChange={handleUserChange}
                    onInputChange={handleUserInputChange}
                    options={userOptions}
                    placeholder="Search and select user"
                    isClearable
                    isLoading={isLoading}
                  />
                </div>
              )}

              {/* Membership Plan Selection */}
              <div>
                <Label>Membership Plan</Label>
                <select
                  className="w-full border rounded p-2"
                  value={membershipFormData.membership_plan_id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                >
                  <option value="" disabled>
                    Select Plan
                  </option>
                  {allPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name} - ₹{plan.base_price} ({plan.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Admission Fee */}
              <div>
                <Label>
                  {userId ? "Renewal Fee (₹)" : "Admission Fee (₹)"}
                </Label>
                <Input
                  id="admission-fee"
                  type="number"
                  value={membershipFormData.admission_or_renewal_fee}
                  onChange={handleAdmissionFeeChange}
                  placeholder={
                    userId ? "Enter renewal fee" : "Enter admission fee"
                  }
                />
              </div>

              {/* Additional Fee */}
              <div>
                <Label>Additional Fee (₹)</Label>
                <Input
                  id="additional-fee"
                  type="number"
                  value={membershipFormData.additional_fee}
                  onChange={handleAdditionalFeeChange}
                  placeholder="Enter additional fee"
                />
              </div>

              {/* Payment Mode Selection */}
              <div>
                <Label>Payment Mode</Label>
                <select
                  className="w-full border rounded p-2"
                  value={membershipFormData.payment_mode_id}
                  onChange={(e) =>
                    handleInputChange("payment_mode_id", e.target.value)
                  }
                >
                  <option value="" disabled>
                    Select Payment Mode
                  </option>
                  {paymentModes.map((mode) => (
                    <option key={mode.id} value={mode.id}>
                      {mode.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Add New Payment Mode */}
              <div className="flex items-center space-x-2">
                <Input
                  value={newPaymentMode}
                  onChange={(e) => setNewPaymentMode(e.target.value)}
                  placeholder="New payment mode"
                />
                <Button
                  onClick={handleAddPaymentMode}
                  disabled={!newPaymentMode.trim() || isLoading}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Start Date */}
              <div>
                <Label>Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={membershipFormData.start_date}
                  onChange={(e) =>
                    handleInputChange("start_date", e.target.value)
                  }
                />
              </div>

              {/* End Date */}
              <div>
                <Label>End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={membershipFormData.end_date}
                  onChange={(e) =>
                    handleInputChange("end_date", e.target.value)
                  }
                />
              </div>

              {/* Remarks */}
              <div>
                <Label>Remarks</Label>
                <Input
                  id="remarks"
                  value={membershipFormData.remarks}
                  onChange={(e) => handleInputChange("remarks", e.target.value)}
                  placeholder="Enter any remarks"
                />
              </div>

              {/* Total Amount */}
              <div>
                <Label>Total Amount (₹)</Label>
                <Input
                  id="total-amount"
                  value={calculateTotal().toFixed(2)}
                  readOnly
                />
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleFormSubmit}
              disabled={
                isLoading ||
                (!userId && !membershipFormData.user_id) ||
                !membershipFormData.membership_plan_id ||
                !membershipFormData.payment_mode_id
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default MembershipDialog;
