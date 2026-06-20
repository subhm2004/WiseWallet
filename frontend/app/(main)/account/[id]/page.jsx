"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { BarLoader } from "react-spinners";
import { Pencil } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { TransactionTable } from "../_components/transaction-table";
import { AccountChart } from "../_components/account-chart";
import { Button } from "@/components/ui/button";
import { EditAccountDrawer } from "@/components/edit-account-drawer";

export default function AccountPage() {
  const { id } = useParams();
  const router = useRouter();
  const [accountData, setAccountData] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [data, list] = await Promise.all([
        api.accounts.get(id),
        api.accounts.list(),
      ]);
      setAccountData(data);
      setAccounts(list);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  if (loading) {
    return <BarLoader className="mt-4" width={"100%"} color="hsl(var(--primary))" />;
  }

  if (!accountData) {
    return <p className="text-center mt-20">Account not found</p>;
  }

  const { transactions, ...account } = accountData;

  const handleAccountUpdate = async () => {
    const list = await api.accounts.list();
    const stillExists = list.find((a) => a.id === id);
    if (!stillExists) {
      router.push("/dashboard");
      return;
    }
    await load();
  };

  return (
    <div className="space-y-8 px-5">
      <div className="flex gap-4 items-end justify-between">
        <div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-title capitalize">
            {account.name}
          </h1>
          <p className="text-muted-foreground">
            {account.type.charAt(0) + account.type.slice(1).toLowerCase()} Account
          </p>
        </div>

        <div className="text-right pb-2 flex flex-col items-end gap-2">
          <EditAccountDrawer
            account={{ ...account, _count: { transactions: transactions?.length ?? 0 } }}
            accounts={accounts}
            onSuccess={handleAccountUpdate}
          >
            <Button variant="outline" size="sm" className="gap-2">
              <Pencil className="h-4 w-4" />
              Edit account
            </Button>
          </EditAccountDrawer>
          <div className="text-xl sm:text-2xl font-bold">
            {formatMoney(account.balance)}
          </div>
          <p className="text-sm text-muted-foreground">
            {transactions?.length ?? 0} Transactions
          </p>
        </div>
      </div>

      <AccountChart transactions={transactions} />
      <TransactionTable transactions={transactions} />
    </div>
  );
}
