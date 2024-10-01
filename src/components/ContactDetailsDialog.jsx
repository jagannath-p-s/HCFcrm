
// ContactDetailsDialog.js
import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import dayjs from 'dayjs';

const ContactDetailsDialog = ({
  open,
  onClose,
  contact,
  isEditing,
  editedContact,
  handleEdit,
  handleEditedContactChange,
  handleCancelEdit,
  handleSaveEdit,
  leadSources,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>
        Contact Details
        {!isEditing && (
          <IconButton
            aria-label="edit"
            onClick={handleEdit}
            style={{ position: 'absolute', right: 8, top: 8 }}
          >
            <EditIcon />
          </IconButton>
        )}
      </DialogTitle>
      <DialogContent>
        {isEditing ? (
          <div className="p-4">
            <TextField
              margin="dense"
              label="Name"
              name="name"
              value={editedContact.name}
              onChange={handleEditedContactChange}
              fullWidth
              required
            />
            <TextField
              margin="dense"
              label="Mobile Number"
              name="mobile_number"
              value={editedContact.mobile_number}
              onChange={handleEditedContactChange}
              fullWidth
              required
            />
            <FormControl fullWidth margin="dense">
              <InputLabel id="lead-source-label">Lead Source</InputLabel>
              <Select
                labelId="lead-source-label"
                id="lead-source-select"
                name="lead_source"
                value={editedContact.lead_source}
                onChange={handleEditedContactChange}
                label="Lead Source"
              >
                {leadSources.map((source) => (
                  <MenuItem key={source.id} value={source.name}>
                    {source.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              label="First Enquiry Date"
              name="first_enquiry_date"
              type="date"
              value={
                editedContact.first_enquiry_date
                  ? dayjs(editedContact.first_enquiry_date).format('YYYY-MM-DD')
                  : ''
              }
              onChange={handleEditedContactChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Next Follow Up Date"
              name="next_follow_up_date"
              type="date"
              value={
                editedContact.next_follow_up_date
                  ? dayjs(editedContact.next_follow_up_date).format('YYYY-MM-DD')
                  : ''
              }
              onChange={handleEditedContactChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              margin="dense"
              label="Remarks"
              name="remarks"
              value={editedContact.remarks}
              onChange={handleEditedContactChange}
              fullWidth
              multiline
              rows={3}
            />
          </div>
        ) : (
          <div className="p-4">
            <h2 className="text-lg font-bold mb-2">{contact.name}</h2>
            <p className="mb-1">
              <strong>Mobile:</strong> {contact.mobile_number}
            </p>
            <p className="mb-1">
              <strong>Lead Source:</strong> {contact.lead_source}
            </p>
            <p className="mb-1">
              <strong>First Enquiry Date:</strong>{' '}
              {contact.first_enquiry_date
                ? new Date(contact.first_enquiry_date).toLocaleDateString()
                : 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Next Follow Up Date:</strong>{' '}
              {contact.next_follow_up_date
                ? new Date(contact.next_follow_up_date).toLocaleDateString()
                : 'N/A'}
            </p>
            <p className="mb-1">
              <strong>Remarks:</strong> {contact.remarks}
            </p>
          </div>
        )}
      </DialogContent>
      <DialogActions>
        {isEditing ? (
          <>
            <Button onClick={handleCancelEdit} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} color="primary">
              Save
            </Button>
          </>
        ) : (
          <Button onClick={onClose} color="primary">
            Close
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ContactDetailsDialog;