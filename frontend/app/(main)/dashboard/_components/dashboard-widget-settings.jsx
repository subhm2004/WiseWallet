"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from "@/components/ui/drawer";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/api";
import {
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_WIDGETS,
  normalizeDashboardWidgets,
} from "@/lib/dashboard-widgets";
import { toast } from "sonner";

export function DashboardWidgetSettings({
  widgets,
  onChange,
  triggerLabel = "Edit Dashboard",
}) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(normalizeDashboardWidgets(widgets));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setEnabled(normalizeDashboardWidgets(widgets));
    }
  }, [open, widgets]);

  const toggle = (id) => {
    setEnabled((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) {
          toast.warning("Keep at least one widget visible");
          return prev;
        }
        return prev.filter((w) => w !== id);
      }
      return [...prev, id];
    });
  };

  const reset = () => setEnabled(DEFAULT_DASHBOARD_WIDGETS);

  const save = async () => {
    setSaving(true);
    try {
      const result = await api.auth.updateProfile({ dashboardWidgets: enabled });
      onChange?.(result.user?.dashboardWidgets ?? enabled);
      toast.success("Dashboard layout saved");
      setOpen(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutGrid className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Dashboard widgets</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-3 max-h-[55vh] overflow-y-auto">
          {DASHBOARD_WIDGETS.map((widget) => (
            <div
              key={widget.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div>
                <p className="font-medium text-sm">{widget.label}</p>
                <p className="text-xs text-muted-foreground">{widget.description}</p>
              </div>
              <Switch
                checked={enabled.includes(widget.id)}
                onCheckedChange={() => toggle(widget.id)}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-4 pb-4">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              Cancel
            </Button>
          </DrawerClose>
          <Button variant="outline" onClick={reset}>
            Reset
          </Button>
          <Button onClick={save} disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
