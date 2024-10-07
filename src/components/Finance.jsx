import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import FinanceOverview from "./FinanceOverview";

const Finance = () => {
  const [financeStats, setFinanceStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalCredit: 0,
    totalDebt: 0,
  });

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      // Fetch total income
      const { data: incomeData } = await supabase
        .from("incomes")
        .select("amount");
      const totalIncome = incomeData.reduce((sum, item) => sum + item.amount, 0);

      // Fetch total expenses
      const { data: expenseData } = await supabase
        .from("expenses")
        .select("amount");
      const totalExpenses = expenseData.reduce((sum, item) => sum + item.amount, 0);

      // Fetch total credits
      const { data: creditData } = await supabase
        .from("credits")
        .select("credit_amount");
      const totalCredit = creditData.reduce((sum, item) => sum + item.credit_amount, 0);

      // Fetch total debts
      const { data: debtData } = await supabase
        .from("debts")
        .select("debt_amount");
      const totalDebt = debtData.reduce((sum, item) => sum + item.debt_amount, 0);

      // Set the state with fetched totals
      setFinanceStats({ totalIncome, totalExpenses, totalCredit, totalDebt });
    } catch (error) {
      console.error("Error fetching finance data:", error);
    }
  };

  return <FinanceOverview financeStats={financeStats} />;
};

export default Finance;
