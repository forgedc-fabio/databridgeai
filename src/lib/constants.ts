import {
  LayoutDashboard,
  Network,
  BookOpen,
  Scale,
  FileUp,
} from "lucide-react";

export const NAV_ITEMS = [
  {
    title: "Dashboard",
    url: "/",
    icon: LayoutDashboard,
    enabled: true,
  },
  {
    title: "Ontology",
    url: "/ontology",
    icon: Network,
    enabled: true, // Phase 2
  },
  {
    title: "Dictionary",
    url: "/dictionary",
    icon: BookOpen,
    enabled: false, // Phase 3
  },
  {
    title: "Rules",
    url: "/rules",
    icon: Scale,
    enabled: false, // Phase 4
  },
  {
    title: "Content",
    url: "/content",
    icon: FileUp,
    enabled: false, // Phase 5
  },
] as const;
