"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { api } from "@/lib/api";

async function copyInviteLink(inviteToken) {
  const url = api.splits.inviteUrl(inviteToken);
  await navigator.clipboard.writeText(url);
  return url;
}

export function CreateSplitGroupDrawer({ open, onOpenChange, onCreated }) {
  const [title, setTitle] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setMembers([]);
      setMemberInput("");
    }
  }, [open]);

  const addMember = () => {
    const name = memberInput.trim();
    if (!name || members.includes(name)) return;
    setMembers((prev) => [...prev, name]);
    setMemberInput("");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Group name required");
      return;
    }
    setCreating(true);
    try {
      const group = await api.splits.create({
        title: title.trim(),
        members: members.length > 0 ? members : [],
      });

      if (!group?.inviteToken) {
        toast.error("Could not create group — try again");
        return;
      }

      try {
        await copyInviteLink(group.inviteToken);
        toast.success("Group created! Invite link copied — WhatsApp pe bhej do");
      } catch {
        toast.success("Group created! Copy the invite link below");
      }

      onCreated?.({
        title: group.title,
        token: group.inviteToken,
        url: api.splits.inviteUrl(group.inviteToken),
      });
      onOpenChange(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  if (!open) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="gradient-title text-2xl">New split group</DrawerTitle>
          <p className="text-sm text-muted-foreground text-left">
            Sirf naam do — link milega, friends join karenge. Bank account ki zaroorat nahi.
          </p>
        </DrawerHeader>
        <div className="px-4 pb-6 space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Group name (Goa trip, Flatmates...)"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleCreate())}
          />
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">
              Optional — add friends now, ya baad mein link se invite karo
            </p>
            <div className="flex gap-2">
              <Input
                value={memberInput}
                onChange={(e) => setMemberInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addMember())
                }
                placeholder="Name or email"
              />
              <Button type="button" variant="outline" onClick={addMember}>
                Add
              </Button>
            </div>
            {members.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {members.map((m) => (
                  <Badge key={m} variant="secondary">
                    {m}
                    <button
                      type="button"
                      className="ml-1 hover:text-destructive"
                      onClick={() =>
                        setMembers((prev) => prev.filter((x) => x !== m))
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={handleCreate} disabled={creating} className="flex-1">
              {creating ? "Creating..." : "Create & get invite link"}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DrawerClose>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
