"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const widthStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs">
      <div
        className="fixed inset-0"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative z-10 w-full ${widthStyles[maxWidth]} bg-surface border border-border rounded-lg shadow-lg overflow-hidden flex flex-col`}
      >
        <div className="flex items-start justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-base font-semibold text-ink">{title}</h3>
            {description && (
              <p className="text-xs text-ink-muted mt-1">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-ink-faint hover:text-ink hover:bg-surface-subtle rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-130px)]">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-4 bg-surface-subtle border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
