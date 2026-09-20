import React from "react";
import { RegistrationsClient } from "./RegistrationsClient";

export function generateStaticParams() {
  return [{ id: "_" }];
}

export default function RegistrationsPage() {
  return <RegistrationsClient />;
}
