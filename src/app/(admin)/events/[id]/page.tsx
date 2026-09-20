import React from "react";
import { EditEventClient } from "./EditEventClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function EditEventPage() {
  return <EditEventClient />;
}
