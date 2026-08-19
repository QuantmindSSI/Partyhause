# WebMCP Monitoring Layer

**Landed in:** PR [#5](https://github.com/QuantmindSSI/Partyhause/pull/5), hardened in PR [#8](https://github.com/QuantmindSSI/Partyhause/pull/8).
**Code:** `src/mcp/` (`index.ts` bootstrap, `monitor.ts` capture core, `tools.ts` tool definitions, `webmcp.d.ts` types) + telemetry hooks in `src/lib/api-client.ts`.

The web app registers monitoring tools on the browser's Model Context (`navigator.modelContext`, the [WebMCP](https://github.com/webmachinelearning/webmcp) API) so a locally connected AI agent (e.g. Chrome DevTools MCP) can observe application state, API traffic, runtime errors, backend health and performance — without screen-scraping.

## Zero cost without an agent

`initWebMCP()` (called from `src/main.tsx` before first render) is a **true no-op when `navigator.modelContext` is absent** — i.e. for every regular user. No console wrappers, no error listeners, no recording. `recordApiCall` in the api-client hot path returns immediately until capture is enabled. Buffers that nothing can read are never filled.

## Data policy

- Auth tokens, request headers and request/response bodies are **never recorded or exposed**. API telemetry is method/path/status/duration/attempts/error-message only.
- Guest data is returned **as aggregates only** (totals, RSVP breakdown, check-ins) — never per-guest names/emails/phones.
- Buffers are bounded ring buffers (200 API calls, 100 errors); messages and stacks are truncated. Memory growth is provably bounded.
- All tools are **read-only** except `navigate_to_page`. `get_events refresh=true` fetches fresh data but does not write into the app store.

## Tools

| Tool | Purpose |
|---|---|
| `get_app_state` | auth status, user, current page, current event, loading, connectivity |
| `get_events` | event list from store; `refresh=true` re-fetches (read-only) |
| `get_event_details` | one event + aggregated guest stats |
| `get_api_activity` | recent API calls + error rate / avg latency (`limit`, `errors_only`) |
| `get_error_log` | captured runtime errors/warnings (`limit`, `level`) |
| `get_health_status` | pings `/api/health`; frontend + backend health snapshot |
| `get_performance_metrics` | JS heap, navigation timing, resource count |
| `navigate_to_page` | drive the internal page state machine (auth required; the only mutating tool) |

## Using it

1. Run the app (`npm run dev`) and open it in a WebMCP-capable Chrome with an agent bridge (e.g. `chrome-devtools` MCP server).
2. The console logs `WebMCP: 8 PartyHause monitoring tools registered` when active, or `modelContext unavailable — monitoring disabled` otherwise.
3. Agents list tools via the bridge and call them; e.g. `get_health_status` returns backend reachability/latency plus API error-rate aggregates.

## Known caveats

- Because the console wrappers become the new `console.error/warn`, DevTools attributes logged warnings to `monitor.ts` as the top stack frame; expand one frame for the real call site (documented in `monitor.ts`).
- `NAVIGABLE_PAGES` in `tools.ts` must be kept in sync when pages are added to the `App.tsx` state machine (e.g. `notifications`, `privacy-settings` from PR #8).
