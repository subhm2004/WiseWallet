"use client";

import { useRef } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import useFetch from "@/hooks/use-fetch";
import { api } from "@/lib/api";

export function ReceiptScanner({ onScanComplete }) {
  const fileInputRef = useRef(null);

  const { loading: scanReceiptLoading, fn: scanReceiptFn } = useFetch(
    api.transactions.scanReceipt
  );

  const handleReceiptScan = async (file) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    const result = await scanReceiptFn(file);
    if (result) {
      onScanComplete(result);
      toast.success("Receipt scanned — form filled!");
    }
  };

  return (
    <div className="flex items-center gap-4">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-sky-300 via-indigo-300 to-purple-300 dark:from-sky-700 dark:via-indigo-700 dark:to-purple-700 hover:opacity-90 transition-opacity text-foreground"
        onClick={() => fileInputRef.current?.click()}
        disabled={scanReceiptLoading}
      >
        {scanReceiptLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" />
            <span>Scanning Receipt...</span>
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>AI-Powered Receipt Scan</span>
          </>
        )}
      </Button>
    </div>
  );
}
