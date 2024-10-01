// AddContactDialog.js
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';

const AddContactDialog = ({
  open,
  onClose,
  onSubmit,
  newContact,
  handleNewContactChange,
  leadSources,
  handleAddLeadSourceOpen,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add New Contact</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          label="Name"
          name="name"
          value={newContact.name}
          onChange={handleNewContactChange}
          fullWidth
          required
        />
        <TextField
          margin="dense"
          label="Mobile Number"
          name="mobile_number"
          value={newContact.mobile_number}
          onChange={handleNewContactChange}
          fullWidth
          required
        />
        <div className="flex items-center">
          <FormControl fullWidth margin="dense">
            <InputLabel id="lead-source-label">Lead Source</InputLabel>
            <Select
              labelId="lead-source-label"
              id="lead-source-select"
              name="lead_source"
              value={newContact.lead_source}
              onChange={handleNewContactChange}
              label="Lead Source"
            >
              {leadSources.map((source) => (
                <MenuItem key={source.id} value={source.name}>
                  {source.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Add Lead Source">
            <IconButton onClick={handleAddLeadSourceOpen}>
              <AddIcon />
            </IconButton>
          </Tooltip>
        </div>
        <TextField
          margin="dense"
          label="First Enquiry Date"
          name="first_enquiry_date"
          type="date"
          value={newContact.first_enquiry_date}
          onChange={handleNewContactChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          margin="dense"
          label="Next Follow Up Date"
          name="next_follow_up_date"
          type="date"
          value={newContact.next_follow_up_date}
          onChange={handleNewContactChange}
          fullWidth
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          margin="dense"
          label="Remarks"
          name="remarks"
          value={newContact.remarks}
          onChange={handleNewContactChange}
          fullWidth
          multiline
          rows={3}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onSubmit} color="primary">
          Add Contact
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddContactDialog;
