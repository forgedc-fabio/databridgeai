"use client";

export type HealthStatus = "healthy" | "degraded" | "unreachable" | "loading";

const STATUS_COLOURS: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  degraded: "bg-amber-500",
  unreachable: "bg-red-500",
  loading: "bg-gray-300",
};

export const STATUS_LABELS: Record<string, Record<string, string>> = {
  cognee: {
    healthy: "Cognee: Connected",
    degraded: "Cognee: Degraded \u2014 service responding with errors",
    unreachable: "Cognee: Unreachable \u2014 service is not responding",
    loading: "Cognee: Checking\u2026",
  },
  storage: {
    healthy: "Storage: Available",
    degraded: "Storage: Degraded",
    unreachable: "Storage: Unavailable \u2014 file operations will fail",
    loading: "Storage: Checking\u2026",
  },
};

interface HealthIndicatorProps {
  serviceName: "cognee" | "storage";
  status: HealthStatus;
}

export function HealthIndicator({ serviceName, status }: HealthIndicatorProps) {
  const label = STATUS_LABELS[serviceName]?.[status] ?? `${serviceName}: ${status}`;
  const colourClass = STATUS_COLOURS[status] ?? "bg-gray-300";

  // Derive a concise aria-label for the dot
  const ariaStatus = status === "healthy"
    ? "connected"
    : status === "degraded"
      ? "degraded"
      : status === "unreachable"
        ? "unreachable"
        : "loading";

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-block h-2 w-2 rounded-full ${colourClass}`}
        aria-label={`${serviceName} status: ${ariaStatus}`}
      />
      <span className="text-sm text-foreground">{label}</span>
    </div>
  );
}
