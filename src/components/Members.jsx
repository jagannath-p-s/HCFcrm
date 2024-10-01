// src/components/Members.jsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Snackbar,
  Alert,
} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MembershipPlans from './MembershipPlans'; // Adjust the path if necessary
import ExistingMemberships from './ExistingMemberships'; // Adjust the path if necessary

const theme = createTheme();

function Members() {
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Snackbar handler
  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: 'success' });
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
  

        {/* Membership Plans Section */}
        <Box sx={{ mb: 4 }}>
          <MembershipPlans showSnackbar={showSnackbar} />
        </Box>

        {/* Existing Memberships Section */}
        <Box>
          <ExistingMemberships showSnackbar={showSnackbar} />
        </Box>

        {/* Snackbar for success or error messages */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseSnackbar}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </ThemeProvider>
  );
}

export default Members;
