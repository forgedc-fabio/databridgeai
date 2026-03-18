# DataBridgeAI — Project Context

## Brief
Awaiting product brief from product team. Brief is being developed collaboratively via Notion.

## Status
- **Created**: 2026-03-04
- **Status**: Pre-planning (awaiting product brief)

## Infrastructure

| Service | Detail |
|---------|--------|
| **GitHub** | [ForgeDC/databridgeai](https://github.com/ForgeDC/databridgeai) |
| **GitHub User** | forgedc-fabio (fabio.barboza@forgedc.com) |
| **Supabase Org** | Forge DC (`uwyhxwvvzcqywaakvgke`) |
| **Supabase Project** | databridgeai (`vkdcliaocklnlbthwdpx`) |
| **Supabase MCP** | Configured in `.mcp.json` |
| **Branch** | `main` |

### Credentials Verification

```bash
gh auth status                # Should show forgedc-fabio
supabase projects list        # Should show linked project
```

## Documentation Workflow

Three-tier documentation system:

| Layer | Location | Purpose |
|-------|----------|---------|
| **Technical** | This repo (`.planning/`, code) → GitHub | Architecture, planning, requirements, code |
| **Business** | NinjaWiki (`NinjaWork/ForgeDC/_internal/DataBridgeAI/`) | PRDs, briefs, meeting notes — Obsidian local |
| **Collaboration** | [Notion database](https://www.notion.so/3199891594848014b6e6cf0ad61fae94?v=3199891594848060aecb000c87e1f243) | Product team collaboration surface |

### Sync Protocol
- **Method:** Claude-assisted — ask Claude to push/pull documents during sessions
- **Source of truth:** Where the document was authored (NinjaWiki-authored → NinjaWiki canonical; Notion-authored → Notion canonical)
- **WorkingNotes/** are never synced to Notion
- **Notion data source ID:** `31998915-9484-80b1-9d16-000bf408c3a3`

### NinjaWiki Structure
```
NinjaWork/ForgeDC/_internal/DataBridgeAI/
├── DataBridgeAI.md          ← project index
├── Briefs/                  ← PRDs, product briefs
├── MeetingNotes/            ← meeting summaries
└── WorkingNotes/            ← drafts, scratch (not synced)
```

Claude has full read/write access to this NinjaWiki folder and all subfolders.

## Dependencies
[List project dependencies]

## To-Do
- [x] Initial setup
- [x] GitHub repository connected
- [x] Supabase project linked
- [x] Documentation workflow established
- [x] NinjaWiki folder structure created
- [x] Notion database linked
- [ ] Product brief (in progress with product team)
- [ ] Run `/gsd:new-project` once brief is ready
- [ ] Define requirements
- [ ] Implementation

---

## Planning

This project uses GSD (Get Shit Done) for planning and development.

Once the product brief is ready, run one of:
- `/gsd:new-project` — interactive questioning flow
- `/gsd:new-project --auto @brief.md` — auto mode with brief document
