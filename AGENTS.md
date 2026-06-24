
<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for all task and project management activities.

**CRITICAL GUIDANCE**

- If your client supports MCP resources, read `backlog://workflow/overview` to understand when and how to use Backlog for this project.
- If your client only supports tools or the above request fails, call `backlog.get_backlog_instructions()` to load the tool-oriented overview. Use the `instruction` selector when you need `task-creation`, `task-execution`, or `task-finalization`.

- **First time working here?** Read the overview resource IMMEDIATELY to learn the workflow
- **Already familiar?** You should have the overview cached ("## Backlog.md Overview (MCP)")
- **When to read it**: BEFORE creating tasks, or when you're unsure whether to track work

These guides cover:
- Decision framework for when to create tasks
- Search-first workflow to avoid duplicates
- Links to detailed guides for task creation, execution, and finalization
- MCP tools reference

You MUST read the overview resource to understand the complete workflow. The information is NOT summarized here.

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->

---

## NU face deploy (regulă pentru agenți)

NU rula `gcloud app deploy` (nici `app.yaml --project=phrasal-period-415315`, nici orice alt deploy/publicare în producție). Te oprești la **modificările pe branch-ul `ticket/...` + Pull Request**. Deploy-ul în producție îl face **omul, manual**, după ce aprobă PR-ul. Comenzile de deploy din `CLAUDE.md` sunt doar referință pentru om, nu un pas de executat. (Vezi și `AGENTS.md` din rădăcina workspace-ului.)
