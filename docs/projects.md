# Selected projects

## Luxid — AI messenger and workflow application

**Context:** Independent project, developed and operated with Hermes and coding agents in 2026. The application combines model APIs, persistent memory, selectable conversation context, browser research and voice/image services.

**Reliable replies.** Replies could exist in the database but appear only after reopening the application. Work on durable PostgreSQL jobs addressed execution and recovery; investigation of the authentication proxy separately exposed buffered SSE delivery. These were two different problems, not one successful API request. Historical checks included duplicate submissions producing one user message and one assistant reply, and a PostgreSQL restart test covering job recovery and duplicate prevention.

**Browser research.** An authenticated search collected results but still failed when its temporary profile could not be removed. The repair used a minimal session copy, idempotent shutdown and ownership-scoped network cleanup. Three repeated authenticated runs left no temporary profile directories. The accompanying offline code sample illustrates input contracts and evidence processing; it is not the full authenticated browser application.

**Media integration.** A case-sensitive multipart boundary was damaged by lowercasing the entire header. Separating MIME comparison from boundary parsing restored uploads. Image interpretation was then passed to the existing conversation model. A separate FFmpeg frame-padding failure was addressed with stream-copy-first audio assembly; a subsequent 24-turn audio job completed with a 129.894-second MP3.

**My contribution:** Product requirements, defect discovery, agent direction and acceptance criteria, with agents performing the detailed implementation and automated checks.

## Lincoln School — operational automation

**Context:** Automation of teaching and administrative work using Python, Google Sheets/Drive, XLSX and document tools.

Repeated manual entry had to account for separate class schedules, skipped lesson-history entries and different Friday rows. Repeatable processing moved into deterministic scripts. The workflow used the relevant plan/history source, restricted updates to intended cells, read back written values and retained dated CSV records for comparison. Actual spreadsheet update and read-back records support the workflow, rather than only script existence.

**My contribution:** Defined classroom rules and exceptions, identified incorrect outputs and directed corrections against actual teaching needs.

## Haejo — AI automation-assessment application

**Context:** Independent AI-assisted application developed in March–April 2026, with recommendations and diagnosis in an assessment flow.

The interface requested eight recommendations, while the backend capped the request at four. Aligning the limit and handling short model output repaired the contract; the deployment record reports eight returned items on the public endpoint. Fallback entries could supplement the model output.

A later public 502 occurred while the app itself remained alive. The recorded investigation isolated a missing reverse-proxy dependency, restarted the Linux service and checked public HTTP 200. Monitoring was aligned with the external user path rather than local process status. These are historical deployment results, not a current uptime claim.

**My contribution:** Defined expected output, directed deployment and recovery, and required verification at the user-visible endpoint.

## Assignment Planner — scheduling and document workflow

**Context:** Volunteer operations project using a JavaScript PWA, Python API, Excel and official PDF forms.

Role-aware candidates, recent workload and assignment intervals helped scheduling decisions; same-week duplicates were flagged. The assignment-summary sheet was the source for formula-driven monthly views. Range-level write-back was checked against the workbook, and generated app data had to refresh when the source changed.

Official individual documents were filled from the source rather than recreated manually. A historical batch generated 16 PDF/PNG pairs with zero source-to-PDF field mismatches; remote file comparison confirmed 32 matching files.

**My contribution:** Defined assignment rules and output requirements, exercised the workflow and directed fixes when source data, app state and exported documents disagreed.

## Supporting operations

Additional projects include Hermes MCP integration with REA/Ghidra, tested through a real fixture analysis; Ubuntu SSH/service-log diagnostics; organization OWA mailbox integration; OAuth recovery; and local LLM API/lifecycle checks. These complement the application projects rather than imply enterprise Microsoft 365 tenant-administration experience.
