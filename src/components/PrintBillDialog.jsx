import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '../supabaseClient';
import ReceiptComponent from './ReceiptComponent';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const PrintBillDialog = ({ open, onClose, membership }) => {
  const receiptRef = useRef(null);
  const [billUrl, setBillUrl] = useState('');

  const handleGenerateAndUploadBill = async () => {
    try {
      if (!receiptRef.current) {
        console.error("Receipt component reference not found.");
        return;
      }

      // Generate PDF from the receipt using html2canvas and jsPDF
      const canvas = await html2canvas(receiptRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      pdf.addImage(imgData, 'PNG', 0, 0);
      const pdfBlob = pdf.output('blob');
      const file = new File([pdfBlob], `bill_${membership.id}.pdf`, { type: 'application/pdf' });

      // Upload PDF to Supabase public storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('bills')  // Make sure the bucket name 'bills' exists in your storage
        .upload(`bill_${membership.id}.pdf`, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading PDF to Supabase:', uploadError.message);
        return;
      }

      // Get the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('bills')
        .getPublicUrl(`bill_${membership.id}.pdf`);

      const publicURL = publicUrlData.publicUrl;
      setBillUrl(publicURL);  // Set the public URL

      // Insert bill data into the `membership_bills` table
      const { data: insertData, error: insertError } = await supabase
        .from('membership_bills')
        .insert([
          {
            membership_id: membership.id,
            user_id: membership.user_id,
            bill_url: publicURL,  // Use the public URL
            expires_at: new Date(new Date().setMonth(new Date().getMonth() + 1)),  // Set expiration 1 month from now
          }
        ]);

      if (insertError) {
        console.error('Error inserting bill data into Supabase:', insertError.message);
      } else {
        console.log('Bill inserted successfully:', insertData);
      }

    } catch (error) {
      console.error('Error generating and uploading bill:', error.message);
    }
  };

  const handleSendWhatsApp = () => {
    if (!billUrl) {
      console.error('No bill URL available for sharing');
      return;
    }

    const userMobileNumber = membership.users.mobile_number_1;
    const message = `Here is your bill: ${billUrl}`;
    const url = `https://wa.me/${userMobileNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Print and Share Bill</DialogTitle>
        </DialogHeader>
        <div>
          {/* Render the receipt */}
          <div ref={receiptRef}>
            <ReceiptComponent membership={membership} />
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerateAndUploadBill}>Generate Bill</Button>
            {billUrl && (
              <>
                <Button as="a" href={billUrl} target="_blank" className="ml-4">
                  Download Bill
                </Button>
                <Button onClick={handleSendWhatsApp} className="ml-4">
                  Share via WhatsApp
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrintBillDialog;
