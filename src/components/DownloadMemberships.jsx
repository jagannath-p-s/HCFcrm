import React from 'react';
import { Button } from '../components/ui/button';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FileText } from 'lucide-react';

// Utility function to format date to DD-MM-YYYY
const formatIndianDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

function DownloadMemberships({ dateRange, customFromDate, customToDate, memberships, todayIncome }) {
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.text("Membership Report", 20, 30);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 200, 33);

    const startDate = dateRange === 'custom' && customFromDate ? formatIndianDate(customFromDate) : '';
    const endDate = dateRange === 'custom' && customToDate ? formatIndianDate(customToDate) : '';
    const dateRangeText = dateRange === 'custom' ? `${startDate} - ${endDate}` : 'Today';

    doc.setFontSize(14);
    doc.setFont("times", "normal");
    doc.text(`Total Income for Selected Period: ${todayIncome.toFixed(2)}`, 20, 45);
    doc.text(`Time Period: ${dateRangeText}`, 20, 55);

    const tableData = memberships.map((membership, index) => ([
        index + 1,
        membership.id,
        membership.users.name,
        membership.membership_plan.name,
        formatIndianDate(membership.start_date),
        formatIndianDate(membership.end_date),
        formatIndianDate(membership.users.date_of_birth),
        `${membership.total_amount.toFixed(2)}`
    ]));

    const tableColumns = [
        { header: "S.No", dataKey: "sno" },
        { header: "Membership ID", dataKey: "id" },
        { header: "User", dataKey: "user" },
        { header: "Plan", dataKey: "plan" },
        { header: "Start Date", dataKey: "startDate" },
        { header: "End Date", dataKey: "endDate" },
        { header: "DOB", dataKey: "dob" },
        { header: "Amount", dataKey: "amount" }
    ];

    doc.autoTable({
        startY: 65,
        head: [tableColumns.map(col => col.header)],
        body: tableData,
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: { fillColor: [245, 245, 245], textColor: [100, 100, 100] },
        columnStyles: { 0: { halign: 'center' }, 7: { halign: 'right' } },
    });

    const formattedDate = formatIndianDate(new Date().toISOString());
    doc.save(`Membership_Report_${formattedDate}.pdf`);
  };

  return (
    <Button onClick={handleDownloadPDF}>
      <FileText className="mr-2" /> Download Report
    </Button>
  );
}

export default DownloadMemberships;
