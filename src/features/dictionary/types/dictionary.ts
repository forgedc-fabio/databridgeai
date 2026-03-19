// Database row types (match Supabase column names exactly)
export interface DictionaryDomain {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  domain_area: string | null;
  owner: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DictionaryField {
  id: string;
  tenant_id: string;
  field_name: string;
  field_definition: string | null;
  value_type:
    | "Text"
    | "Long Text"
    | "Descriptive Text"
    | "Picklist"
    | "Concatenated"
    | "Number";
  tagging_method: "Sourced" | "AI Inferred" | "System";
  ai_instruction: string | null;
  controlled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// Extended field with domain assignments (for DataTable display)
export interface DictionaryFieldWithDomains extends DictionaryField {
  domain_ids: string[];
  domain_names: string[];
}

export interface DictionaryFieldDomain {
  id: string;
  field_id: string;
  domain_id: string;
  tenant_id: string;
}

export interface DictionaryPicklistValue {
  id: string;
  field_id: string;
  tenant_id: string;
  value: string;
  definition: string | null;
  display_order: number;
}

export interface DictionaryConcatenatedRef {
  id: string;
  field_id: string;
  referenced_field_id: string;
  tenant_id: string;
  position: number;
}

export interface DictionaryMatchTable {
  id: string;
  field_id: string;
  tenant_id: string;
  columns: string[];
  data: Record<string, string>[];
  uploaded_at: string;
}

export interface DictionaryVersion {
  id: string;
  tenant_id: string;
  version_number: number;
  label: string | null;
  snapshot: DictionarySnapshot;
  published_at: string;
  published_by: string | null;
}

// Snapshot shape stored in dictionary_versions.snapshot
export interface DictionarySnapshot {
  domains: Array<{
    id: string;
    name: string;
    description: string | null;
    domain_area: string | null;
    owner: string | null;
    display_order: number;
  }>;
  fields: Array<{
    id: string;
    field_name: string;
    field_definition: string | null;
    value_type: string;
    tagging_method: string;
    ai_instruction: string | null;
    controlled: boolean;
    domain_ids: string[];
    picklist_values?: Array<{ value: string; definition: string | null }>;
    concatenated_field_ids?: string[];
  }>;
}

// Diff result types
export interface VersionDiffResult {
  added: DictionarySnapshot["fields"];
  removed: DictionarySnapshot["fields"];
  changed: Array<{
    field: DictionarySnapshot["fields"][number];
    changes: string[];
  }>;
  domainChanges: {
    added: DictionarySnapshot["domains"];
    removed: DictionarySnapshot["domains"];
  };
}

// Form input types (camelCase for client-side usage)
export interface DictionaryFieldInput {
  fieldName: string;
  fieldDefinition?: string;
  valueType: DictionaryField["value_type"];
  taggingMethod: DictionaryField["tagging_method"];
  aiInstruction?: string;
  controlled?: boolean;
  domainIds?: string[];
}

export interface DictionaryDomainInput {
  name: string;
  description?: string;
  domainArea?: string;
  owner?: string;
}

export interface PicklistValueInput {
  value: string;
  definition?: string;
}

export interface ConcatenatedRefInput {
  referencedFieldId: string;
  position: number;
}
