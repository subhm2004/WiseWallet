"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import { accountSchema } from "@/app/lib/schema";

export function EditAccountDrawer({ account, accounts = [], children, onSuccess }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [migrateToId, setMigrateToId] = useState("");

  const otherAccounts = useMemo(
    () => accounts.filter((a) => a.id && a.id !== account?.id),
    [accounts, account?.id]
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: account?.name || "",
      type: account?.type || "CURRENT",
      balance: String(account?.balance ?? ""),
      isDefault: account?.isDefault || false,
    },
  });

  useEffect(() => {
    if (open && account) {
      reset({
        name: account.name,
        type: account.type,
        balance: String(account.balance),
        isDefault: account.isDefault,
      });
      setMigrateToId(otherAccounts[0]?.id || "");
    }
  }, [open, account, reset, otherAccounts]);

  const onSubmit = async (data) => {
    if (!account?.id) {
      toast.error("Account not found. Refresh and try again.");
      return;
    }
    setSaving(true);
    try {
      await api.accounts.update(account.id, data);
      toast.success("Account updated");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message || "Failed to update account");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!account?.id) {
      toast.error("Account not found");
      return;
    }
    if (otherAccounts.length === 0) {
      toast.error("You must keep at least one account");
      return;
    }

    const txCount = account._count?.transactions ?? 0;
    if (txCount > 0 && !migrateToId) {
      toast.error("Select an account to move transactions to");
      return;
    }

    if (!confirm(`Delete "${account.name}"? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      await api.accounts.delete(account.id, {
        migrateToAccountId: txCount > 0 ? migrateToId : undefined,
      });
      toast.success("Account deleted");
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (!account?.id) return null;

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild onClick={(e) => e.stopPropagation()}>
        {children}
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit Account</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-name" className="text-sm font-medium">
                Account Name
              </label>
              <Input id="edit-name" {...register("name")} />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-type" className="text-sm font-medium">
                Account Type
              </label>
              <Select
                value={watch("type")}
                onValueChange={(value) => setValue("type", value)}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CURRENT">Current</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="edit-balance" className="text-sm font-medium">
                Balance
              </label>
              <Input
                id="edit-balance"
                type="number"
                step="0.01"
                {...register("balance")}
              />
              {errors.balance && (
                <p className="text-sm text-red-500">{errors.balance.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-medium">Default account</p>
                <p className="text-sm text-muted-foreground">
                  Used for new transactions
                </p>
              </div>
              <Switch
                checked={watch("isDefault")}
                onCheckedChange={(checked) => setValue("isDefault", checked)}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DrawerClose>
              <Button type="submit" className="flex-1" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t space-y-3">
            {(account._count?.transactions ?? 0) > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Move {account._count.transactions} transaction(s) to:
                </p>
                <Select value={migrateToId} onValueChange={setMigrateToId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose account" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              className="w-full gap-2"
              onClick={handleDelete}
              disabled={deleting || otherAccounts.length === 0}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
