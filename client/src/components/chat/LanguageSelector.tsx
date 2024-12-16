import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

type LanguageMode = 'professional' | 'regular' | 'simple' | 'crazy';

interface LanguageSelectorProps {
  onSelect: (mode: LanguageMode) => void;
  currentMode: LanguageMode;
}

export function LanguageSelector({ onSelect, currentMode }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false);

  const modes: { id: LanguageMode; label: string }[] = [
    { id: 'professional', label: 'Professional' },
    { id: 'regular', label: 'Regular' },
    { id: 'simple', label: 'Simple' },
    { id: 'crazy', label: 'Crazy Mode' },
  ];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <MessageSquare className="h-5 w-5" />
          <span className="sr-only">Toggle language complexity</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2">
        <div className="grid gap-2">
          {modes.map((mode) => (
            <Button
              key={mode.id}
              variant={currentMode === mode.id ? "default" : "ghost"}
              className="justify-start"
              onClick={() => {
                onSelect(mode.id);
                setOpen(false);
              }}
            >
              <motion.div
                initial={false}
                animate={{
                  scale: currentMode === mode.id ? 1.05 : 1,
                }}
                className="w-full flex items-center"
              >
                {mode.label}
                {currentMode === mode.id && (
                  <motion.div
                    className="ml-auto"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <div className="h-2 w-2 rounded-full bg-primary" />
                  </motion.div>
                )}
              </motion.div>
            </Button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
