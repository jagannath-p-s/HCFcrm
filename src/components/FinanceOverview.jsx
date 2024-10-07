import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";

const FinanceOverview = ({ financeStats }) => {
  return (
    <Card className="border">
      <CardHeader>
        <CardTitle>Finance Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-4 mb-4">
          {/* Total Income */}
          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Total Income</h2>
              <CurrencyRupeeIcon className="text-green-600" />
            </div>
            <p className="text-2xl font-bold">₹{(financeStats.totalIncome || 0).toFixed(2)}</p>
          </div>

          {/* Total Expenses */}
          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Total Expenses</h2>
              <CurrencyRupeeIcon className="text-red-600" />
            </div>
            <p className="text-2xl font-bold">₹{(financeStats.totalExpenses || 0).toFixed(2)}</p>
          </div>

          {/* Total Credit */}
          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Total Credit</h2>
              <CurrencyRupeeIcon className="text-blue-600" />
            </div>
            <p className="text-2xl font-bold">₹{(financeStats.totalCredit || 0).toFixed(2)}</p>
          </div>

          {/* Total Debt */}
          <div className="border p-4 rounded">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-medium">Total Debt</h2>
              <CurrencyRupeeIcon className="text-orange-600" />
            </div>
            <p className="text-2xl font-bold">₹{(financeStats.totalDebt || 0).toFixed(2)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinanceOverview;
