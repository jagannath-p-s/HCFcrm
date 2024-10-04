import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

const SalaryList = ({ salaries, onMarkAsPaid, onDeleteSalary }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <Badge variant="default">Paid</Badge>;
      case 'Overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Staff</TableHead>
          <TableHead>Scheduled Date</TableHead>
          <TableHead>Base Salary</TableHead>
          <TableHead>Advance Amount</TableHead>
          <TableHead>Net Salary</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {salaries.map((salary) => (
          <TableRow key={salary.id}>
            <TableCell>{salary.staffs?.username || 'N/A'}</TableCell>
            <TableCell>{format(parseISO(salary.scheduled_payment_date), 'yyyy-MM-dd')}</TableCell>
            <TableCell>₹{salary.salary_amount.toFixed(2)}</TableCell>
            <TableCell>₹{salary.advance_amount.toFixed(2)}</TableCell>
            <TableCell>₹{salary.net_salary.toFixed(2)}</TableCell>
            <TableCell>{getStatusBadge(salary.status)}</TableCell>
            <TableCell>
              {salary.status !== 'Paid' && (
                <Button variant="outline" size="sm" onClick={() => onMarkAsPaid(salary)}>
                  Mark as Paid
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                className="ml-2"
                onClick={() => onDeleteSalary(salary.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {salaries.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center">No salaries scheduled.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};

export default SalaryList;
