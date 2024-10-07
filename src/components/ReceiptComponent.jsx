import React, { useEffect } from 'react';

const ReceiptComponent = React.forwardRef(({ membership, onRenderComplete }, ref) => {
  useEffect(() => {
    if (onRenderComplete) {
      onRenderComplete();
    }
  }, [onRenderComplete]);

  return (
    <div
      ref={ref}
      style={{
        fontFamily: 'Arial, sans-serif',
        padding: '20px',
        border: '1px solid #ccc',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto',
        backgroundColor: '#fff',
        color: '#000',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0', fontSize: '24px', fontWeight: 'bold', color: '#444' }}>
          Her Chamber Fitness Membership Receipt
        </h2>
        <p style={{ margin: '5px 0', fontSize: '14px', color: '#888' }}>
          Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #ccc' }} />

      {/* Member Information */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Member Information</h3>
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Name</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                {membership.users?.name || 'Unknown User'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Mobile Number</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                {membership.users?.mobile_number_1 || 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Membership Details */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Membership Details</h3>
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Plan</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                {membership.membership_plans?.name || 'Unknown Plan'}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Start Date</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                {membership.start_date}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>End Date</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                {membership.end_date}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payment Details */}
      <div style={{ marginTop: '20px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>Payment Details</h3>
        <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>
                Admission Fee
              </td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                Rs {membership.admission_or_renewal_fee}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold' }}>Additional Fee</td>
              <td style={{ padding: '8px', border: '1px solid #ccc' }}>
                Rs {membership.additional_fee}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', color: '#d32f2f' }}>
                Total Amount
              </td>
              <td style={{ padding: '8px', border: '1px solid #ccc', fontWeight: 'bold', color: '#d32f2f' }}>
                Rs {membership.total_amount}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: '30px', color: '#666' }}>
        <p style={{ margin: '0', fontSize: '14px' }}>
          Thank you for your membership!
        </p>
        <p style={{ margin: '5px 0', fontSize: '12px' }}>
          If you have any questions, please contact us at support@example.com.
        </p>
      </div>
    </div>
  );
});

export default ReceiptComponent;
