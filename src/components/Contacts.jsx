import React, { useState, useEffect } from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import { supabase } from '../supabaseClient';
import dayjs from 'dayjs';
import Header from './Header';
import AddContactDialog from './AddContactDialog';
import FilterDialog from './FilterDialog';
import Column from './Column';
import ContactDetailsDialog from './ContactDetailsDialog';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const Contacts = () => {
  const initialExpandedColumns = ['Lead', 'Follow-up', 'Customer Won', 'Customer Lost'];
  const [expanded, setExpanded] = useState(initialExpandedColumns);
  const [columns, setColumns] = useState([]);
  const [filteredColumns, setFilteredColumns] = useState([]);
  const [contactOpen, setContactOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    mobile_number: '',
    lead_source: '',
    first_enquiry_date: '',
    next_follow_up_date: '',
    remarks: '',
    status: 'Lead',
  });
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterDays, setFilterDays] = useState(null);
  const [filterLeadSource, setFilterLeadSource] = useState('');
  const [filterStartDate, setFilterStartDate] = useState(
    dayjs().subtract(2, 'month').format('YYYY-MM-DD')
  );
  const [filterEndDate, setFilterEndDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [leadSources, setLeadSources] = useState([]);
  const [addLeadSourceOpen, setAddLeadSourceOpen] = useState(false);
  const [newLeadSourceName, setNewLeadSourceName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState(null);

  useEffect(() => {
    fetchLeads();
    fetchLeadSources();
  }, []);

  useEffect(() => {
    applyFiltersAndSearch();
  }, [columns, filterDays, filterLeadSource, filterStartDate, filterEndDate, searchTerm]);

  const fetchLeads = async () => {
    try {
      const { data: leadsData, error } = await supabase.from('leads').select('*');
      if (error) throw error;

      const columnsData = [
        { name: 'Lead', color: 'yellow', bgColor: 'bg-yellow-50', leads: [] },
        { name: 'Follow-up', color: 'blue', bgColor: 'bg-blue-50', leads: [] },
        { name: 'Customer Won', color: 'green', bgColor: 'bg-green-50', leads: [] },
        { name: 'Customer Lost', color: 'red', bgColor: 'bg-red-50', leads: [] },
      ];

      leadsData.forEach((lead) => {
        const column = columnsData.find((col) => col.name === lead.status);
        if (column) {
          column.leads.push(lead);
        } else {
          columnsData[0].leads.push(lead); // Default to 'Lead'
        }
      });

      setColumns(columnsData);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const fetchLeadSources = async () => {
    try {
      const { data: leadSourcesData, error } = await supabase.from('lead_sources').select('*');
      if (error) throw error;
      setLeadSources(leadSourcesData);
    } catch (error) {
      console.error('Error fetching lead sources:', error);
    }
  };

  const applyFiltersAndSearch = () => {
    let filteredData = JSON.parse(JSON.stringify(columns)); // Deep copy to avoid state mutation

    // Apply date filter
    if (filterStartDate && filterEndDate) {
      filteredData = filteredData.map((column) => {
        const filteredLeads = column.leads.filter((lead) => {
          const createdAt = dayjs(lead.created_at);
          return (
            createdAt.isAfter(dayjs(filterStartDate).subtract(1, 'day')) &&
            createdAt.isBefore(dayjs(filterEndDate).add(1, 'day'))
          );
        });
        return { ...column, leads: filteredLeads };
      });
    }

    // Apply lead source filter
    if (filterLeadSource) {
      filteredData = filteredData.map((column) => {
        const filteredLeads = column.leads.filter(
          (lead) => lead.lead_source === filterLeadSource
        );
        return { ...column, leads: filteredLeads };
      });
    }

    // Apply follow-up days filter
    if (filterDays !== null && filterDays !== '') {
      filteredData = filteredData.map((column) => {
        const filteredLeads = column.leads.filter((lead) => {
          if (lead.next_follow_up_date) {
            const daysDifference = dayjs(lead.next_follow_up_date).diff(dayjs(), 'day');
            return daysDifference >= 0 && daysDifference <= filterDays;
          }
          return false;
        });
        return { ...column, leads: filteredLeads };
      });
    }

    // Apply search filter
    if (searchTerm) {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      filteredData = filteredData.map((column) => {
        const filteredLeads = column.leads.filter((lead) =>
          lead.name.toLowerCase().includes(lowercasedSearchTerm) ||
          lead.mobile_number.toLowerCase().includes(lowercasedSearchTerm)
        );
        return { ...column, leads: filteredLeads };
      });
    }

    setFilteredColumns(filteredData);
  };

  const toggleExpand = (columnName) => {
    if (expanded.includes(columnName)) {
      setExpanded(expanded.filter((c) => c !== columnName));
    } else {
      setExpanded([...expanded, columnName]);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceColIndex = columns.findIndex((col) => col.name === source.droppableId);
    const destColIndex = columns.findIndex((col) => col.name === destination.droppableId);

    if (sourceColIndex === -1 || destColIndex === -1) return;

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];

    const sourceLeads = Array.from(sourceCol.leads);
    const destLeads = Array.from(destCol.leads);

    const [movedLead] = sourceLeads.splice(source.index, 1);
    movedLead.status = destCol.name;

    destLeads.splice(destination.index, 0, movedLead);

    const updatedColumns = [...columns];
    updatedColumns[sourceColIndex] = { ...sourceCol, leads: sourceLeads };
    updatedColumns[destColIndex] = { ...destCol, leads: destLeads };

    setColumns(updatedColumns);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: destination.droppableId })
        .eq('id', movedLead.id);

      if (error) {
        console.error('Error updating lead status:', error);
      } else {
        if (destination.droppableId === 'Customer Won') {
          await convertLeadToUser(movedLead);
        }
      }
    } catch (error) {
      console.error('Error updating lead status:', error);
    }
  };

  const getTextColorClass = (color) => {
    switch (color) {
      case 'blue':
        return 'text-blue-600';
      case 'red':
        return 'text-red-600';
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'purple':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleContactOpen = (contact) => {
    setSelectedContact(contact);
    setContactOpen(true);
    setIsEditing(false);
    setEditedContact(null);
  };

  const handleContactClose = () => {
    setContactOpen(false);
  };

  const handleAddContactOpen = () => {
    setAddContactOpen(true);
  };

  const handleAddContactClose = () => {
    setAddContactOpen(false);
    setNewContact({
      name: '',
      mobile_number: '',
      lead_source: '',
      first_enquiry_date: '',
      next_follow_up_date: '',
      remarks: '',
      status: 'Lead',
    });
  };

  const handleNewContactChange = (e) => {
    const { name, value } = e.target;
    setNewContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddContactSubmit = async () => {
    try {
      const { error } = await supabase.from('leads').insert([newContact]);

      if (error) {
        console.error('Error adding new contact:', error);
      } else {
        fetchLeads();
        handleAddContactClose();
      }
    } catch (error) {
      console.error('Error adding new contact:', error);
    }
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const handleFilterDaysChange = (value) => {
    setFilterDays(value);
  };

  const handleEdit = () => {
    setEditedContact(selectedContact);
    setIsEditing(true);
  };

  const handleEditedContactChange = (e) => {
    const { name, value } = e.target;
    setEditedContact((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContact(null);
  };

  const handleSaveEdit = async () => {
    try {
      const { error } = await supabase
        .from('leads')
        .update(editedContact)
        .eq('id', editedContact.id);

      if (error) {
        console.error('Error updating contact:', error);
      } else {
        fetchLeads();
        setSelectedContact(editedContact);
        setIsEditing(false);
        setEditedContact(null);
      }
    } catch (error) {
      console.error('Error updating contact:', error);
    }
  };

  const handleAddLeadSourceOpen = () => {
    setAddLeadSourceOpen(true);
  };

  const handleAddLeadSourceClose = () => {
    setAddLeadSourceOpen(false);
    setNewLeadSourceName('');
  };

  const handleAddLeadSourceSubmit = async () => {
    try {
      const { error } = await supabase.from('lead_sources').insert([{ name: newLeadSourceName }]);

      if (error) {
        console.error('Error adding new lead source:', error);
      } else {
        fetchLeadSources();
        handleAddLeadSourceClose();
      }
    } catch (error) {
      console.error('Error adding new lead source:', error);
    }
  };

  const handleFilterLeadSourceChange = (value) => {
    setFilterLeadSource(value);
  };

  const handleFilterStartDateChange = (value) => {
    setFilterStartDate(value);
  };

  const handleFilterEndDateChange = (value) => {
    setFilterEndDate(value);
  };

  const handleClearFilter = () => {
    setFilterLeadSource('');
    setFilterStartDate(dayjs().subtract(2, 'month').format('YYYY-MM-DD'));
    setFilterEndDate(dayjs().format('YYYY-MM-DD'));
    setFilterDays(null);
  };

  const convertLeadToUser = async (lead) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            user_id: `USER_${lead.id}`,
            name: lead.name,
            mobile_number_1: lead.mobile_number,
            email: '', // Assuming email is not collected at this point
            active: true,
            created_at: new Date(),
          },
        ])
        .single();

      if (error) {
        console.error('Error converting lead to user:', error);
      } else {
        console.log('Lead converted to user:', data);
      }
    } catch (error) {
      console.error('Error converting lead to user:', error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Header
        onAddClick={handleAddContactOpen}
        onFilterClick={handleFilterOpen}
        onSearchChange={(value) => setSearchTerm(value)}
      />

      <AddContactDialog
        open={addContactOpen}
        onClose={handleAddContactClose}
        onSubmit={handleAddContactSubmit}
        newContact={newContact}
        handleNewContactChange={handleNewContactChange}
        leadSources={leadSources}
        handleAddLeadSourceOpen={handleAddLeadSourceOpen}
      />

      {/* Add Lead Source Dialog */}
      <Dialog
        open={addLeadSourceOpen}
        onClose={handleAddLeadSourceClose}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Add New Lead Source</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            label="Lead Source Name"
            value={newLeadSourceName}
            onChange={(e) => setNewLeadSourceName(e.target.value)}
            fullWidth
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddLeadSourceClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAddLeadSourceSubmit} color="primary">
            Add Lead Source
          </Button>
        </DialogActions>
      </Dialog>

      <FilterDialog
        open={filterOpen}
        onClose={handleFilterClose}
        leadSources={leadSources}
        filterLeadSource={filterLeadSource}
        filterStartDate={filterStartDate}
        filterEndDate={filterEndDate}
        filterDays={filterDays}
        handleFilterLeadSourceChange={handleFilterLeadSourceChange}
        handleFilterStartDateChange={handleFilterStartDateChange}
        handleFilterEndDateChange={handleFilterEndDateChange}
        handleFilterDaysChange={handleFilterDaysChange}
        handleClearFilter={handleClearFilter}
      />

      <div className="flex flex-grow p-4 space-x-4 overflow-x-auto">
        <DragDropContext onDragEnd={onDragEnd}>
          {(filteredColumns.length ? filteredColumns : columns).map((column) => (
            <Column
              key={column.name}
              column={column}
              expanded={expanded}
              toggleExpand={toggleExpand}
              getTextColorClass={getTextColorClass}  // Pass the function to the Column component
              handleContactOpen={handleContactOpen}
            />
          ))}
        </DragDropContext>
      </div>

      {/* Contact Details Dialog */}
      {selectedContact && (
        <ContactDetailsDialog
          open={contactOpen}
          onClose={handleContactClose}
          contact={selectedContact}
          isEditing={isEditing}
          editedContact={editedContact}
          handleEdit={handleEdit}
          handleEditedContactChange={handleEditedContactChange}
          handleCancelEdit={handleCancelEdit}
          handleSaveEdit={handleSaveEdit}
          leadSources={leadSources}
        />
      )}
    </div>
  );
};

export default Contacts;
