"use client";

import React from "react";
import { useParams } from "next/navigation";
import { RegistrationsView } from "@/features/registrations/RegistrationsView";

import { getRouteId } from "@/lib/utils";

export function RegistrationsClient() {
  const params = useParams();
  const [resolvedId, setResolvedId] = React.useState<string>(() => getRouteId(params?.id as string));

  React.useEffect(() => {
    const real = getRouteId(params?.id as string);
    if (real && real !== resolvedId) {
      setResolvedId(real);
    }
  }, [params?.id, resolvedId]);

  return <RegistrationsView eventId={resolvedId} />;
}
