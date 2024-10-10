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
    onBeforeGetContent: () => {
      if (membership?.id) {
        document.title = `Bill_Membership_${membership.id}`;
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      document.title = 'Her Chamber Fitness Bill';
    },
  });

  if (!membership) {
    return null;
  }

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(date));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <div ref={componentRef} className="p-8 bg-white text-sm">
      <div className="flex justify-between mb-6">
  <img src={logo} alt="Logo" className="h-40" />
  <div>
    <h2 className="text-lg font-bold text-right">INVOICE</h2>
    <p className="text-right">INVOICE NO: {membership.id}</p>
    <p className="text-right">DATE: {new Date().toLocaleDateString()}</p>
  </div>
</div>


        <div className="mb-4">
          <h3 className="font-semibold mb-2">To: {membership.users?.name}</h3>
          <p>Membership Period: {formatDate(membership.start_date)} - {formatDate(membership.end_date)}</p>
          <p>Payment Mode: {membership.payment_mode?.name || 'N/A'}</p>
        </div>

        <table className="w-full mb-4">
          <thead>
            <tr>
              <th className="text-left pb-2 border-b">PLAN</th>
              <th className="text-left pb-2 border-b">QTY</th>
              <th className="text-right pb-2 border-b">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pt-4">{membership.membership_plan?.name}</td>
              <td className="pt-4">1</td>
              <td className="pt-4 text-right">₹ {membership.total_amount}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-right font-semibold">
          <p>TOTAL: ₹ {membership.total_amount}</p>
        </div>

        <div className="mt-6">
          <p className="text-xs italic">
            Thank you for being a member of Her Chamber Fitness!
          </p>
        </div>
      </div>

      <div className="p-4 flex justify-end space-x-4">
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={handlePrint} variant="contained" color="primary">Print Bill</Button>
      </div>
    </Dialog>
  );
};

export default PrintBillDialog;
