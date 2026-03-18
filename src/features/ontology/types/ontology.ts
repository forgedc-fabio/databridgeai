// Database row types (match Supabase column names exactly)
export interface OntologyClass {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  domain_group: string | null;
  colour: string;
  icon_tag: string | null;
  custom_attributes: CustomAttribute[];
  created_at: string;
  updated_at: string;
}

export interface CustomAttribute {
  key: string;
  value: string;
  type: "text" | "number" | "boolean" | "enum";
}

export interface OntologyRelationship {
  id: string;
  tenant_id: string;
  source_class_id: string;
  target_class_id: string;
  relationship_type_id: string;
  created_at: string;
  updated_at: string;
}

// Extended relationship with joined names for display
export interface OntologyRelationshipWithNames extends OntologyRelationship {
  source_class_name: string;
  target_class_name: string;
  relationship_type_name: string;
}

export interface OntologyRelationshipType {
  id: string;
  tenant_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
}

export interface OntologySyncStatus {
  id: string;
  tenant_id: string;
  last_synced_at: string | null;
  owl_file_path: string | null;
  sync_status: "never_synced" | "synced" | "syncing" | "failed";
  created_at: string;
  updated_at: string;
}

// Form input types (for create/update operations)
export interface OntologyClassInput {
  name: string;
  description?: string;
  domainGroup?: string;
  colour?: string;
  iconTag?: string;
  customAttributes?: CustomAttribute[];
}

export interface OntologyRelationshipInput {
  sourceClassId: string;
  targetClassId: string;
  relationshipTypeId: string;
}

// Domain groups (fixed set for v1)
export const DOMAIN_GROUPS = [
  "Clinical",
  "Commercial",
  "Regulatory",
  "Medical",
  "Manufacturing",
] as const;

export type DomainGroup = (typeof DOMAIN_GROUPS)[number];

// Domain group colours for graph visualisation
export const DOMAIN_COLOURS: Record<string, string> = {
  Clinical: "#3b82f6",
  Commercial: "#10b981",
  Regulatory: "#f59e0b",
  Medical: "#8b5cf6",
  Manufacturing: "#ef4444",
  Default: "#6b7280",
};
