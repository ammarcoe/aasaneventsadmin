"use client";

import React, { useEffect, useState } from "react";

export interface FormSectionStatus {
  id: string;
  label: string;
  isOptional?: boolean;
  status: "complete" | "error" | "untouched";
}

interface SectionNavProps {
  sections: FormSectionStatus[];
  activeSectionId?: string;
  onSectionClick?: (id: string) => void;
}

export function SectionNav({ sections, activeSectionId, onSectionClick }: SectionNavProps) {
  const [currentActive, setCurrentActive] = useState(activeSectionId || sections[0]?.id);

  useEffect(() => {
    if (activeSectionId) {
      setCurrentActive(activeSectionId);
    }
  }, [activeSectionId]);

  // Scroll-spy observer
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections
        .map((s) => ({ id: s.id, el: document.getElementById(s.id) }))
        .filter((s): s is { id: string; el: HTMLElement } => s.el !== null);

      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const { id, el } = sectionElements[i];
        if (el.offsetTop <= scrollPosition) {
          setCurrentActive(id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const handleClick = (id: string) => {
    setCurrentActive(id);
    onSectionClick?.(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <nav className="w-full space-y-1">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-ink-faint)] px-3 mb-2">
        Sections
      </div>
      {sections.map((section) => {
        const isActive = currentActive === section.id;

        // Dot color
        let dotColor = "bg-[var(--color-border-strong)]"; // untouched
        if (section.status === "complete") {
          dotColor = "bg-[var(--color-accent)]";
        } else if (section.status === "error") {
          dotColor = "bg-[var(--color-crimson)]";
        }

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => handleClick(section.id)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-[var(--radius-md)] text-xs font-medium text-left transition-colors ${
              isActive
                ? "bg-[var(--color-surface-subtle)] text-[var(--color-ink)] font-semibold"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
              <span className="truncate">{section.label}</span>
            </div>
            {section.isOptional && (
              <span className="text-[10px] text-[var(--color-ink-faint)] font-normal ml-1">
                Optional
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
export default SectionNav;
