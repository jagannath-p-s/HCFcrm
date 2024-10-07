import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Pagination from "@mui/material/Pagination";

const ExpenseTable = ({ expenses, expenseTypes, currentPage, totalPages, handlePageChange }) => {
  return (
    <Card className="mt-4 border">
      <CardHeader>
        <CardTitle>Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{expense.description || "-"}</TableCell>
                <TableCell>₹{expense.amount}</TableCell>
                <TableCell>
                  {expenseTypes.find((type) => type.id === expense.category_id)?.name || "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant={expense.status === "paid" ? "default" : "destructive"}>
                    {expense.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {expense.final_date_to_pay ? new Date(expense.final_date_to_pay).toLocaleDateString() : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Pagination count={totalPages} page={currentPage} onChange={handlePageChange} className="mt-4" />
      </CardContent>
    </Card>
  );
};

export default ExpenseTable;
