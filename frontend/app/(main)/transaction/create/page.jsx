"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarLoader } from "react-spinners";
import { api } from "@/lib/api";
import { defaultCategories } from "@/data/categories";
import { AddTransactionForm } from "../_components/transaction-form";

export default function AddTransactionPage() {
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const [accounts, setAccounts] = useState([]);
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshAccounts = async () => {
    const accountsData = await api.accounts.list();
    setAccounts(accountsData);
    return accountsData;
  };

  useEffect(() => {
    async function load() {
      try {
        const accountsData = await api.accounts.list();
        setAccounts(accountsData);

        if (editId) {
          const transaction = await api.transactions.get(editId);
          setInitialData(transaction);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [editId]);

  if (loading) {
    return <BarLoader className="mt-4" width={"100%"} color="hsl(var(--primary))" />;
  }

  return (
    <div className="max-w-3xl mx-auto px-5">
      <div className="flex justify-center md:justify-normal mb-8">
        <h1 className="text-5xl gradient-title">Transaction Entry</h1>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
        onAccountsRefresh={refreshAccounts}
      />
    </div>
  );
}
