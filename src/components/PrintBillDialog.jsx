import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog } from '@mui/material';
import { Button } from '../components/ui/button';
import logo from '../assets/log.png';

const PrintBillDialog = ({ open, onClose, membership }) => {
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page { 
        size: auto; 
        margin: 15mm 10mm; 
      }
      body {
        font-family: 'Arial', sans-serif;
      }
    `,
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div ref={componentRef} className="p-4 bg-white text-sm">
        <div className="flex justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-lg font-bold">Her Chamber Fitness</h2>
            <p className="text-xs">Membership Bill</p>
          </div>
          <img src={logo} alt="Logo" className="h-25" />
        </div>

        <div className="mb-4">
          <h3 className="font-semibold mb-2">Membership Details</h3>
          <p><strong>Name:</strong> {membership?.users?.name}</p>
          <p><strong>Plan:</strong> {membership?.membership_plans?.name}</p>
          <p><strong>Start Date:</strong> {membership?.start_date}</p>
          <p><strong>End Date:</strong> {membership?.end_date}</p>
          <p><strong>Total Amount:</strong> ${membership?.total_amount}</p>
        </div>

        <p className="text-xs italic">
          Thank you for being a member of Her Chamber Fitness!
        </p>
      </div>

      <div className="p-4 flex justify-end space-x-4">
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={handlePrint} variant="contained" color="primary">Print Bill</Button>
      </div>
    </Dialog>
  );
};

export default PrintBillDialog;
