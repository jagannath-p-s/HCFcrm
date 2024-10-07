import React, { useState, useEffect } from 'react';
import { Edit, Trash2 } from 'lucide-react'; // Importing icons from Lucide
import { supabase } from '../supabaseClient'; // Adjust the path if necessary
import { Button } from '@/components/ui/button'; // ShadCN Button
import { Input } from '@/components/ui/input'; // ShadCN Input
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'; // ShadCN Dialog
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'; // ShadCN Table
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'; // ShadCN Card

function MembershipPlans({ showSnackbar }) {
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);
  const [planFormData, setPlanFormData] = useState({
    id: null,
    name: '',
    duration_in_days: '',
    base_price: '',
    type: '',
    class_type: '',
    additional_services: '',
    number_of_people: 1, // Default to 1 person
  });
  const [expanded, setExpanded] = useState(false); // State for expand/contract
  const [currentPage, setCurrentPage] = useState(1); // Pagination state
  const plansPerPage = 15;

  // Fetch membership plans on component mount
  useEffect(() => {
    fetchMembershipPlans();
  }, []);

  const fetchMembershipPlans = async () => {
    const { data, error } = await supabase.from('membership_plans').select('*');
    if (error) {
      console.error('Error fetching membership plans:', error);
      showSnackbar('Error fetching membership plans.', 'error');
    } else {
      setMembershipPlans(data);
    }
  };

  // Dialog handlers
  const handleOpenPlanDialog = (plan = null) => {
    setPlanFormData(
      plan || {
        id: null,
        name: '',
        duration_in_days: '',
        base_price: '',
        type: '',
        class_type: '',
        additional_services: '',
        number_of_people: 1, // Reset to default value of 1 person
      }
    );
    setOpenPlanDialog(true);
  };

  const handleClosePlanDialog = () => {
    setOpenPlanDialog(false);
  };

  const handlePlanFormChange = (e) => {
    const { name, value } = e.target;
    setPlanFormData({ ...planFormData, [name]: value });
  };

  const handlePlanFormSubmit = async () => {
    try {
      if (planFormData.id) {
        // Update existing plan
        const { error } = await supabase
          .from('membership_plans')
          .update({
            name: planFormData.name,
            duration_in_days: planFormData.duration_in_days,
            base_price: planFormData.base_price,
            type: planFormData.type,
            class_type: planFormData.class_type,
            additional_services: planFormData.additional_services,
            number_of_people: planFormData.number_of_people,
          })
          .eq('id', planFormData.id);
        if (error) throw error;
        showSnackbar('Plan updated successfully', 'success');
      } else {
        // Create new plan
        const { error } = await supabase.from('membership_plans').insert({
          name: planFormData.name,
          duration_in_days: planFormData.duration_in_days,
          base_price: planFormData.base_price,
          type: planFormData.type,
          class_type: planFormData.class_type,
          additional_services: planFormData.additional_services,
          number_of_people: planFormData.number_of_people,
        });
        if (error) throw error;
        showSnackbar('Plan created successfully', 'success');
      }
      fetchMembershipPlans();
      handleClosePlanDialog();
    } catch (error) {
      console.error('Error saving plan:', error);
      showSnackbar('Error saving plan: ' + error.message, 'error');
    }
  };

  const handleDeletePlan = async (id) => {
    try {
      const { error } = await supabase
        .from('membership_plans')
        .delete()
        .eq('id', id);
      if (error) throw error;
      showSnackbar('Plan deleted successfully', 'success');
      fetchMembershipPlans();
    } catch (error) {
      console.error('Error deleting plan:', error);
      showSnackbar('Error deleting plan: ' + error.message, 'error');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(membershipPlans.length / plansPerPage);
  const indexOfLastPlan = currentPage * plansPerPage;
  const indexOfFirstPlan = indexOfLastPlan - plansPerPage;

  // Handle expanded state
  const currentPlans = expanded
    ? membershipPlans.slice(0, 1) // Show only 1 plan in contracted mode
    : membershipPlans.slice(indexOfFirstPlan, indexOfLastPlan); // Paginated plans when expanded

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  // Pagination Component
  const renderPagination = () => {
    if (totalPages <= 1 || expanded) return null;

    const pagesToShow = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pagesToShow.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pagesToShow.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pagesToShow.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pagesToShow.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return (
      <div className="flex justify-between items-center mt-4">
        <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </Button>
        <div className="flex space-x-2">
          {pagesToShow.map((page, index) =>
            typeof page === 'number' ? (
              <Button
                key={index}
                onClick={() => handlePageChange(page)}
                variant={currentPage === page ? 'solid' : 'ghost'}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="text-gray-500">
                {page}
              </span>
            )
          )}
        </div>
        <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </Button>
        <div className="text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between">
          <CardTitle>Membership Plans</CardTitle>
          <div>
            <Button onClick={() => setExpanded(!expanded)}>
              {expanded ? 'Show Only One' : 'Show All'}
            </Button>
            <Button onClick={() => handleOpenPlanDialog()} className="ml-2">
              Create New Plan
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Duration (Days)</TableHead>
              <TableHead>Base Price (Rs)</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Class Type</TableHead>
              <TableHead>Additional Services</TableHead>
              <TableHead>Number of People</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentPlans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell>{plan.name}</TableCell>
                <TableCell>{plan.duration_in_days || 'N/A'}</TableCell>
                <TableCell>{plan.base_price}</TableCell>
                <TableCell>{plan.type}</TableCell>
                <TableCell>{plan.class_type || 'N/A'}</TableCell>
                <TableCell>{plan.additional_services || 'N/A'}</TableCell>
                <TableCell>{plan.number_of_people || 1}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" onClick={() => handleOpenPlanDialog(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" onClick={() => handleDeletePlan(plan.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {membershipPlans.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No membership plans found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {!expanded && renderPagination()}
      </CardContent>

      <CardFooter>
        <Dialog open={openPlanDialog} onOpenChange={setOpenPlanDialog}>
          <DialogTrigger asChild></DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {planFormData.id ? 'Edit Membership Plan' : 'Create Membership Plan'}
              </DialogTitle>
              <DialogDescription>
                Fill in the details to create or edit a membership plan.
              </DialogDescription>
            </DialogHeader>
            <Input
              label="Plan Name"
              name="name"
              value={planFormData.name}
              onChange={handlePlanFormChange}
              placeholder="Enter Plan Name"
              required
            />
            <Input
              label="Duration (Days)"
              name="duration_in_days"
              type="number"
              value={planFormData.duration_in_days}
              onChange={handlePlanFormChange}
              placeholder="Enter Duration (in Days)"
            />
            <Input
              label="Base Price (Rs)"
              name="base_price"
              type="number"
              value={planFormData.base_price}
              onChange={handlePlanFormChange}
              placeholder="Enter Base Price"
              required
            />
            <Input
              label="Type"
              name="type"
              value={planFormData.type}
              onChange={handlePlanFormChange}
              placeholder="Enter Plan Type"
              required
            />
            <Input
              label="Class Type"
              name="class_type"
              value={planFormData.class_type}
              onChange={handlePlanFormChange}
              placeholder="Enter Class Type (optional)"
            />
            <Input
              label="Additional Services"
              name="additional_services"
              value={planFormData.additional_services}
              onChange={handlePlanFormChange}
              placeholder="Enter Additional Services (optional)"
            />
            <Input
              label="Number of People"
              name="number_of_people"
              type="number"
              value={planFormData.number_of_people}
              onChange={handlePlanFormChange}
              placeholder="Enter Number of People"
              required
            />
            <Button onClick={handlePlanFormSubmit}>
              {planFormData.id ? 'Save Changes' : 'Create Plan'}
            </Button>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

export default MembershipPlans;
