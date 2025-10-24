# Bloatware Review (2025-10-12)

## Syntax Checks
- `npx tsc --noEmit` completed without errors; current TypeScript version 5.8.3 exceeds the range supported by `@typescript-eslint/typescript-estree`, so unexpected parser issues could surface until dependencies are updated.
- `npm run lint` executed successfully with 326 warnings (0 errors); no outright syntax failures were reported, but the volume of warnings indicates widespread type looseness and unused code.

## Fragmented / Chunked Code Hotspots
- `src/test/setup.ts`: 80+ `any`-typed mocks, repeated empty catch blocks, and dozens of unused helper parameters indicate scaffolding that was never consolidated. These fragments make the setup brittle and hard to audit.
- `src/components/EventCreation.tsx` & `src/components/EventManagement.tsx`: large blocks of unused imports, state setters, and effects suggest the feature was decomposed but never fully wired together. The dormant hooks are likely masking stale UI flows.
- `src/components/AuthScreen.tsx` & `src/components/Dashboard.tsx`: multiple handler stubs (`handleSignIn`, `handleGetStarted`, etc.) and `any` payloads remain defined even though they are unused, signalling partially implemented logic chained across files.
- `src/components/TemplateManager.tsx`: several effect hooks without complete dependency lists and many `any` casts point to incremental patches rather than cohesive refactors.
- `src/lib/render-safety.ts` & `src/lib/error-handling.ts`: dependency-less hooks and broad `any` return paths hint at defensive wrappers that were never tightened, leaving an inconsistent runtime safety story.

## Bloatware / Dead Logic Indicators
- Massive Lucide icon import surfaces (`EventCreation.tsx`, `LandingPageCreative.tsx`, `PartyCultureBlog.tsx`) pull in icons that are never rendered, inflating bundles without UX benefit.
- `src/services/ai/AIGameEngine.ts` and `src/services/GameRecommendationService.ts` expose large analysis routines with several unused variables (`timeframe`, `eventDetails`, `game`, etc.), implying the services are over-engineered relative to their current integration.
- `src/components/ui/*.tsx` files mix component exports with unrelated helper constants, triggering fast-refresh warnings and increasing module churn for hot reload—restructure into leaner files to avoid redundant re-renders.
- `src/lib/sanitization.ts` retains permissive `any` signatures and complex regex blocks with unused control-character guards, raising maintenance risk without verified necessity.
- Test suites (`src/test/auth.test.ts`, `src/test/logout*.tsx`) rely on numerous `any`-typed helper responses, which obscures regressions and keeps unused stubs alive.

## Recommended Next Steps
- Standardize on a supported TypeScript version or upgrade `@typescript-eslint/*` to clear parser warnings and ensure future lint accuracy.
- Refactor or remove unused imports, handlers, and state across the highlighted components to reduce noise and bundle size.
- Replace broad `any` usage with specific typing in shared libs/tests to expose real integration gaps.
- Consolidate test setup mocks and eliminate empty blocks so error handling is explicit and easier to maintain.

## Cleanup Log
- **2025-10-12:** Ran `npx tsc --noEmit` and `npm run lint` to verify the current state before removals; no bloatware deletions committed yet. Focus areas remain `AuthScreen`, `EventCreation`, `EventManagement`, `TemplateManager`, `AIGameEngine`, and `GameRecommendationService` for the next pass.
- **2025-10-13:** Removed unused Lucide and UI helper imports from `src/components/EventCreation.tsx` to reduce bundle size and eliminate dormant logic paths; re-ran `npx tsc --noEmit` (pass) to confirm no syntax regressions.
