import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog } from '@mui/material';
import { Button } from '../components/ui/button';
import logo from '../assets/log.png'; // Assuming your logo is here

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
        font-size: 14px;
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
        {/* Gym details */}
        <div className="flex justify-between mb-6">
          <div>
            <h3 className="font-semibold mb-2">Her Chamber Fitness</h3>
            <p>Peramangalam, Thrissur</p>
            <p>Contact: +91 8848581074</p>
            <p>Email: herchambergym@gmail.com</p>
          </div>
          <img src={logo} alt="Logo" style={{  height: '140px' }} />
        </div>

        {/* Invoice details */}
        <div className="text-right mb-6">
          <h2 className="text-lg font-bold">INVOICE</h2>
          <p>Invoice #: {membership.id}</p>
          <p>Invoice Date: {formatDate(membership.created_at)}</p>
          <p>Pay Mode: {membership.payment_mode?.name || 'N/A'}</p>
        </div>

        {/* Member details */}
        <div className="mb-4">
          <h3 className="font-semibold">Member ID: {membership.id}</h3>
          <p>Member Name: {membership.users?.name}</p>
          <p>Member Ph: {membership.users?.mobile_number_1}</p>
        </div>

        {/* Table for membership details */}
        <table className="w-full mb-4 border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left pb-2 pt-2 pl-2 border-b border-gray-400">Item</th>
              <th className="text-left pb-2 pt-2 pl-2 border-b border-gray-400">From - To</th>
              <th className="text-right pb-2 pt-2 pr-2 border-b border-gray-400">Reg. Fee</th>
              <th className="text-right pb-2 pt-2 pr-2 border-b border-gray-400">Plan Fee</th>
              <th className="text-right pb-2 pt-2 pr-2 border-b border-gray-400">Additional Fee</th>
              <th className="text-right pb-2 pt-2 pr-2 border-b border-gray-400">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              {/* Dynamic plan name from membership object */}
              <td className="pt-4 pl-2">{membership.membership_plan?.name || 'N/A'}</td>
              <td className="pt-4 pl-2">
                {formatDate(membership.start_date)} - {formatDate(membership.end_date)}
              </td>
              <td className="pt-4 pr-2 text-right">
                {membership.admission_or_renewal_fee ? membership.admission_or_renewal_fee.toFixed(2) : '0.00'}
              </td>
              <td className="pt-4 pr-2 text-right">
                {membership.plan_fee ? membership.plan_fee.toFixed(2) : '0.00'}
              </td>
              <td className="pt-4 pr-2 text-right">
                {membership.additional_fee ? membership.additional_fee.toFixed(2) : '0.00'}
              </td>
              <td className="pt-4 pr-2 text-right">
                {membership.total_amount ? membership.total_amount.toFixed(2) : '0.00'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Payment and total summary */}
        <div className="text-right font-semibold">
          <p>Rec. Amount: ₹ {membership.total_amount ? membership.total_amount.toFixed(2) : '0.00'}</p>
          <p>Balance Due: ₹ 0.00</p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs italic">
            Fees once paid will not be refundable
          </p>
        </div>
      </div>

      {/* Buttons for closing and printing */}
      <div className="p-4 flex justify-end space-x-4">
        <Button onClick={onClose} variant="outlined">Close</Button>
        <Button onClick={handlePrint} variant="contained" color="primary">Print Bill</Button>
      </div>
    </Dialog>
  );
};

export default PrintBillDialog;

