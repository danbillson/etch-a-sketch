"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

interface Point {
  x: number;
  y: number;
  timestamp: number;
}

interface SaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: Point[];
  canvasWidth: number;
  canvasHeight: number;
}

export function SaveDialog({
  open,
  onOpenChange,
  points,
  canvasWidth,
  canvasHeight,
}: SaveDialogProps) {
  const [name, setName] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const saveDrawing = useMutation(api.drawings.saveDrawing);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a name for your drawing");
      return;
    }

    if (points.length === 0) {
      toast.error("No drawing to save");
      return;
    }

    setIsSaving(true);
    try {
      const drawingId = await saveDrawing({
        name: name.trim(),
        twitterHandle: twitterHandle.trim() || undefined,
        points,
        canvasWidth,
        canvasHeight,
      });

      const url = `${window.location.origin}/d/${drawingId}`;
      setShareUrl(url);
      toast.success("Drawing saved!");
    } catch (error) {
      console.error("Failed to save drawing:", error);
      toast.error("Failed to save drawing");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      toast.error("Failed to copy link");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form after a delay to allow animation
    setTimeout(() => {
      setName("");
      setTwitterHandle("");
      setShareUrl(null);
      setCopied(false);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {shareUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Drawing Saved!</DialogTitle>
              <DialogDescription>
                Your drawing has been saved. Share it with others using the link
                below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  onClick={handleCopy}
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Save & Share</DialogTitle>
              <DialogDescription>
                Give your drawing a name and optionally add your Twitter handle.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="drawing-name"
                  placeholder="My Amazing Drawing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitter">Twitter Handle (optional)</Label>
                <Input
                  id="twitter"
                  name="twitter-handle"
                  placeholder="@username"
                  value={twitterHandle}
                  onChange={(e) => setTwitterHandle(e.target.value)}
                  autoComplete="off"
                  data-1p-ignore
                  data-lpignore="true"
                  data-form-type="other"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSave();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

