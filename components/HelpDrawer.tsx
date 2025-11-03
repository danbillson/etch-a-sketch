"use client";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "./ui/drawer";
import { HelpCircle } from "lucide-react";

interface KeyboardShortcuts {
  key: string;
  description: string;
}

const shortcuts: KeyboardShortcuts[] = [
  { key: "A / S", description: "Rotate horizontal knob (left/right)" },
  { key: "K / L", description: "Rotate vertical knob (down/up)" },
  { key: "E", description: "Erase drawing" },
  { key: "Ctrl+S / Cmd+S", description: "Share drawing" },
  { key: "G", description: "Go to gallery" },
  { key: "U", description: "Upload image to draw" },
  { key: "?", description: "Show/hide help" },
];

interface HelpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpDrawer({ open, onOpenChange }: HelpDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Keyboard Shortcuts</DrawerTitle>
          <DrawerDescription>
            All actions can be controlled via keyboard shortcuts
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-3">
          {shortcuts.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 border-b last:border-0"
            >
              <span className="text-sm text-muted-foreground">
                {shortcut.description}
              </span>
              <kbd className="px-2 py-1 text-xs font-semibold bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export function HelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-50 w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-lg transition-colors"
      aria-label="Show help"
    >
      <HelpCircle className="w-5 h-5" />
    </button>
  );
}
