"use client";

import React from "react";
import { useParams } from "next/navigation";
import { RegistrationsView } from "@/features/registrations/RegistrationsView";

export function RegistrationsClient() {
  const params = useParams();
  const id = params?.id as string;

  return <RegistrationsView eventId={id} />;
}
