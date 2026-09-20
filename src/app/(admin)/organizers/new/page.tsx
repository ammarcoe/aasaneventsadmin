import React from "react";
import { OrganizerForm } from "@/features/organizers/OrganizerForm";

export default function NewOrganizerPage() {
  return (
    <div className="flex flex-col gap-6">
      <OrganizerForm />
    </div>
  );
}
