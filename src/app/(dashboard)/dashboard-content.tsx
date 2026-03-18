"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HealthIndicator,
  type HealthStatus,
} from "@/components/health-indicator";

interface DashboardContentProps {
  firstName: string;
}

export function DashboardContent({ firstName }: DashboardContentProps) {
  const [cogneeStatus, setCogneeStatus] = useState<HealthStatus>("loading");
  const [storageStatus, setStorageStatus] = useState<HealthStatus>("loading");

  const fetchHealth = useCallback(async () => {
    // Fetch Cognee health
    try {
      const cogneeRes = await fetch("/api/health/cognee");
      const cogneeData = await cogneeRes.json();
      setCogneeStatus(cogneeData.status as HealthStatus);
    } catch {
      setCogneeStatus("unreachable");
    }

    // Fetch Storage health
    try {
      const storageRes = await fetch("/api/health/storage");
      const storageData = await storageRes.json();
      setStorageStatus(storageData.status as HealthStatus);
    } catch {
      setStorageStatus("unreachable");
    }
  }, []);

  useEffect(() => {
    // Immediate fetch on mount
    fetchHealth();

    // Poll every 30 seconds
    const interval = setInterval(fetchHealth, 30_000);

    return () => clearInterval(interval);
  }, [fetchHealth]);

  const greeting = firstName
    ? `Welcome back, ${firstName}`
    : "Welcome back";

  return (
    <div className="mt-4">
      {/* Welcome card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {greeting}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base">
            DataBridge AI — Content Intelligence Platform
          </p>
        </CardContent>
      </Card>

      {/* Health status card */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <HealthIndicator serviceName="cognee" status={cogneeStatus} />
            <HealthIndicator serviceName="storage" status={storageStatus} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
