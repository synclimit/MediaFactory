# Decisions

## UX Decisions
* Native File Picker required
* Native Folder Picker required
* No manual path typing
* Multi Output workflow retained
* Queue snapshot architecture retained
* Single-threaded renderer retained
* Metadata Cleaner panel removed
* Clean Title editing integrated into Source Pool
* Audio Preview + Audio Settings merged
* Compilation Workspace + Output Preview merged
* Render Plans displayed beside Compilation Workspace
* Queue displayed beside Render Plans

## Render Decisions
* MP3 output only
* Output folder: `D:\MediaFactory\Output`
* yt-dlp for YouTube sources
* FFmpeg concat rendering
* Queue item may not reach COMPLETED unless output file exists

## Preview Decisions
* Real audio preview
* AudioPresetLibrary centralized

## Workflow Decisions
* Global audio profile only
* No per-track audio profiles
* Output count configurable
* Multi-output generation enabled
* Single render worker only
* Cache required before rendering
* Cache subsystem actively monitors and cleans orphaned files and validates integrity

## Cache Decisions
* Combined Orphan Detection Strategy: Gathers references from backend in-memory jobs and client-side `localStorage` keys (`mediafactory_m2_queue`, `mediafactory_m2_completed`) to build a combined reference set.
* Health Status Rules: Categorizes cache health dynamically as `GOOD`, `WARNING` (if orphans or invalid files exist), or `CRITICAL` (if directory inaccessible/validation fail).
* Last Validated timestamp persisted in client `localStorage` under `mediafactory_m2_cache_last_validated`.
* Never delete referenced concat manifest files (`concat_*.txt`).

## Scheduler Decisions
* Frontend-Only Execution: The scheduler relies entirely on frontend timer loops, aligning with the offline-first browser usage constraint. No background daemon or SQLite database is introduced.
* Full Pipeline Automation: Scheduled triggers execute compilation, queueing, and rendering automatically.
* Double-Trigger & Overlap Prevention: Uses an active run lock (`isRunning`) and checks for active/pending queue jobs to prevent race conditions.
* Continue On Error: Job failures log errors but keep the scheduler active to prevent processing stalls.
* Verification Hold: Task 10E is marked as IMPLEMENTED - AWAITING FINAL VERIFICATION. The logic and UI elements are built, but live runtime verification with screenshots (e.g. running UI, scheduler visible, Toggle proof, Run Now proof, Activity Log, and LocalStorage values) remains pending.

## History & Analytics Decisions
* **Strict Purity**: `RenderHistoryService` is strictly pure. Activity log generation is elevated to `App.jsx`.
* **Storage vs Display Caps**: History retains 500 items to ensure accurate longitudinal metrics, but the UI table (`RenderAnalyticsPanel`) renders a maximum of 50 items to guarantee optimal browser performance.
* **Separation of Keys**: History uses `mediafactory_m2_render_history` and is intentionally detached from `mediafactory_m2_workspace` to decouple ephemeral session states from permanent production records.
* **Immutability & Safety**: Records store snapshot strings (e.g. `masteringChain`) to prevent re-execution logic. If a payload gets corrupted, the UI returns an empty array rather than throwing a fatal error.  

## Template System Decisions
* **Limit Behavior**: The Template Manager specifically blocks additions when the 100-template limit is reached and returns `TEMPLATE_LIMIT_REACHED` instead of automatically dropping the oldest. This ensures the user doesn't lose old templates without explicit consent.
* **Security & Path Stripping**: Fixed Templates strictly exclude `localPath` or absolute file paths from the schema to prevent storing broken absolute references and ensure cross-system transferability via export features in the future.
* **Loading Isolation**: Loading a template overwrites active configuration states but explicitly does NOT alter the active Queue, Cache, Render History, or Workspace Snapshot.