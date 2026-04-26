import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className={cn("bg-white text-slate-950 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 dark:bg-neutral-900 dark:text-white dark:border dark:border-neutral-800", className)}
        role="dialog"
      >
        <div className="flex items-center justify-between p-4 border-b border-stone-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-stone-100 rounded-full transition-colors dark:text-slate-400 dark:hover:text-white dark:hover:bg-neutral-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
