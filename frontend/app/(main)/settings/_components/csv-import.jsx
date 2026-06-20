"use client";

import { useEffect, useState } from "react";
import { Upload, FileSpreadsheet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarLoader } from "react-spinners";

const FORMATS = [
  { id: "auto", label: "Auto-detect" },
  { id: "hdfc", label: "HDFC Bank" },
  { id: "sbi", label: "SBI Bank" },
  { id: "phonepe", label: "PhonePe / UPI" },
  { id: "generic", label: "Generic CSV" },
];

export function CsvImport() {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [format, setFormat] = useState("auto");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    api.accounts.list().then((data) => {
      setAccounts(data);
      const def = data.find((a) => a.isDefault) || data[0];
      if (def) setAccountId(def.id);
    });
  }, []);

  const handleFile = async (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      toast.error("Please upload a .csv file");
      return;
    }
    setFile(f);
    setLoading(true);
    try {
      const data = await api.transactions.previewCsv(f, { format, accountId });
      setPreview(data);
    } catch (e) {
      toast.error(e.message);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const importCsv = async () => {
    if (!file || !accountId) {
      toast.error("Select account and CSV file");
      return;
    }
    setImporting(true);
    try {
      const result = await api.transactions.importCsv(file, {
        accountId,
        format,
        skipDuplicates: true,
        applyRules: true,
      });
      toast.success(
        `Imported ${result.imported} transactions${result.skipped ? ` (${result.skipped} duplicates skipped)` : ""}`
      );
      setFile(null);
      setPreview(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Bank Statement (CSV)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload HDFC, SBI, PhonePe or generic CSV exports. Transactions are
          auto-categorized and duplicate-safe.
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Select value={accountId} onValueChange={setAccountId}>
            <SelectTrigger>
              <SelectValue placeholder="Import into account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Bank format" />
            </SelectTrigger>
            <SelectContent>
              {FORMATS.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer hover:bg-muted/40 transition-colors">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm font-medium">
            {file ? file.name : "Click to upload CSV"}
          </span>
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </label>

        {loading && <BarLoader width="100%" color="hsl(var(--primary))" />}

        {preview && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Detected <strong>{preview.format}</strong> — {preview.totalRows} rows
            </div>
            <div className="rounded-lg border overflow-x-auto max-h-48">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Date</th>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview?.map((r, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 whitespace-nowrap">
                        {new Date(r.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="p-2 max-w-[180px] truncate">{r.description}</td>
                      <td
                        className={`p-2 text-right whitespace-nowrap ${
                          r.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {r.type === "INCOME" ? "+" : "-"}
                        {formatMoney(r.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button onClick={importCsv} disabled={importing} className="w-full sm:w-auto">
              {importing ? "Importing..." : `Import ${preview.totalRows} transactions`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
