import React from "react";
import { EditOrganizerClient } from "./EditOrganizerClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditOrganizerPage() {
  return <EditOrganizerClient />;
}
