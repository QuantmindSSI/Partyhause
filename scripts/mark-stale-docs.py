#!/usr/bin/env python3
"""Stamp a staleness banner onto documentation that describes the retired stack.

Why this exists
---------------
187 markdown files live in this repository. 79 of them describe Supabase, Netlify or
Vercel as if they were live. The project moved to Azure Container Apps, Prisma and a
self-hosted Express API in July 2026, and none of those files were revisited.

An index in docs/README.md is not enough on its own. An agent or engineer who opens
one of these files directly, via search or a link, never sees the index. The warning
has to live in the file.

The classification is the authored data below, not a heuristic. A keyword scan cannot
separate STALE ("do not follow this") from HISTORICAL ("this is a dated record and
must not be rewritten"), and both mention Supabase. Getting that distinction wrong
would either falsify a record or leave a trap in place.

Usage
-----
    python3 scripts/mark-stale-docs.py           # apply
    python3 scripts/mark-stale-docs.py --check   # exit 1 if any file is unstamped

--check is the CI-friendly mode: it verifies the banners are still present without
modifying anything.

Idempotent: a file that already carries the banner is left untouched.
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

# Sentinel used for idempotency. Must appear verbatim in the rendered banner.
MARKER = "<!-- DOC-STATUS: STALE -->"

CLASSIFIED_ON = "2026-09-04"

# Files classified STALE on CLASSIFIED_ON: they present Supabase, Netlify or Vercel as
# live infrastructure, or reference directories (api/, netlify/) that no longer exist.
# Paths are repo-relative and POSIX-separated.
STALE_DOCS: tuple[str, ...] = (
    "INVITATION_VISUAL_GUIDE.md",
    "INVITATION_WORKFLOW_GUIDE.md",
    "apps/mobile/README.md",
    "server/data/templates/README.md",
    "docs/AI_EVENT_PLANNING_ASSISTANT.md",
    "docs/CLEANUP_READY.md",
    "docs/CURRENT_FEATURES_EXTENSION_GUIDE.md",
    "docs/DEPLOYMENT_ALTERNATIVES.md",
    "docs/DEPLOYMENT_STATUS.md",
    "docs/DNS_RECORDS_TO_ADD.md",
    "docs/DOMAIN_CONFIGURATION_FIX.md",
    "docs/DOMAIN_FIX_GUIDE.md",
    "docs/EMAIL_SETUP_GUIDE.md",
    "docs/ENDPOINT_STATUS.md",
    "docs/FEATURE_ROADMAP_COMPREHENSIVE.md",
    "docs/GUEST_CREW_IMPLEMENTATION.md",
    "docs/GUEST_EXPERIENCE_FLOW.md",
    "docs/GUEST_EXPERIENCE_VISUAL.md",
    "docs/IMPLEMENTATION_PLAN.md",
    "docs/MASTER_ROADMAP_INDEX.md",
    "docs/PARTYHAUSE_FEATURES_ROADMAP.md",
    "docs/PARTYHUB_REFACTORING.md",
    "docs/PRODUCTION_CHECKLIST.md",
    "docs/PROFILE_NOT_FOUND_FIX.md",
    "docs/PWA_IMPLEMENTATION_SUMMARY.md",
    "docs/PWA_PRODUCTION_DEPLOYMENT_GUIDE.md",
    "docs/PWA_TESTING_GUIDE.md",
    "docs/QUICK_START_GUIDE.md",
    "docs/REACT_NATIVE_PWA_DEPLOYMENT.md",
    "docs/SOCIAL_MEDIA_INTEGRATION.md",
    "docs/SUPABASE_CLI_SETUP.md",
    "docs/SUPABASE_SMTP_SETUP.md",
    "docs/TESTING_GUIDE_NATIVE_VS_WEB.md",
    "docs/TESTING_IN_EXPO_GO.md",
    "docs/UNIFIED_POLL_UX_DESIGN.md",
    "docs/USER_CLEANUP_GUIDE.md",
    "docs/UTILITY_FEATURES.md",
    "docs/VENDOR_MARKETPLACE.md",
    "docs/WEB_PARTYCREW_COMPLETE.md",
    "docs/ZOHO_MAIL_MIGRATION.md",
    "docs/architecture/BACKEND_ARCHITECTURE.md",
    "docs/architecture/MICROSERVICES_ARCHITECTURE.md",
    "docs/architecture/PARTYCREW_ARCHITECTURE.md",
    "docs/deployment/PRODUCTION_DEPLOYMENT.md",
    "docs/features/CARD_UI_TESTING_GUIDE.md",
    "docs/features/COLLABORATION_IMPLEMENTATION_PROGRESS.md",
    "docs/features/COLLABORATION_QUICK_REFERENCE.md",
    "docs/features/COLLABORATION_REDUNDANCY_ANALYSIS.md",
    "docs/features/COLLABORATION_TESTING_GUIDE.md",
    "docs/features/COLLABORATION_UI_IMPROVEMENTS.md",
    "docs/features/CREW_VS_GUESTS_GUIDE.md",
    "docs/features/EVENT_PLANNING_BLOCKS_FEATURE.md",
    "docs/features/EXPLORE_PARTYCREW_FEED_PLAN.md",
    "docs/features/GUEST_INVITE_STATUS.md",
    "docs/features/GUEST_MANAGEMENT_QUICK_START.md",
    "docs/features/HOST_GUEST_MANAGEMENT.md",
    "docs/features/INVITATION_SYSTEM_REVIEW.md",
    "docs/features/MIND_MAP_COLLABORATION_SYSTEM.md",
    "docs/features/MIND_MAP_PLANNING_SYSTEM.md",
    "docs/features/PARTYBOARD_HYBRID_IMPLEMENTATION.md",
    "docs/features/PARTYCREW_API_COMPLETE.md",
    "docs/features/PARTYCREW_IMPLEMENTATION_SUMMARY.md",
    "docs/features/REAL_TIME_COLLABORATION_ENGINE.md",
    "docs/features/SOCIAL_NETWORK_PLAN.md",
    "docs/features/TEMPLATES_INTEGRATION_PLAN.md",
    "docs/features/TIMELINE_VS_GAMES_CLARIFICATION.md",
    "docs/features/collaborativefeatures.md",
    "docs/features/templateimplementation.md",
    "docs/mobile/MOBILE_API_CONFIG.md",
    "docs/mobile/MOBILE_DEBUGGING_GUIDE.md",
    "docs/mobile/MOBILE_EMAIL_READY.md",
    "docs/mobile/MOBILE_EVENT_PUBLISHING_READY.md",
    "docs/mobile/MOBILE_IMPLEMENTATION_SUMMARY.md",
    "docs/mobile/MOBILE_INVITE_IMPLEMENTATION.md",
    "docs/mobile/MOBILE_TESTING_GUIDE.md",
    "docs/project/PACKAGE_VERSIONS.md",
    "docs/project/PARTYHAUSE_ESSENCE_COMPREHENSIVE.md",
    "docs/testing/EMAIL_TROUBLESHOOTING.md",
    "docs/testing/TESTING_INVITATION_FEATURE.md",
)

# Files whose git date is 2026-08-30 purely because of the repo-wide PartyHaus ->
# PartyHause string replacement. That commit changed spelling without reading content,
# so these look far fresher than they are and earn an extra line in the banner.
SPELLING_ONLY: frozenset[str] = frozenset({
    "docs/AI_EVENT_PLANNING_ASSISTANT.md",
    "docs/CURRENT_FEATURES_EXTENSION_GUIDE.md",
    "docs/DOMAIN_CONFIGURATION_FIX.md",
    "docs/DOMAIN_FIX_GUIDE.md",
    "docs/FEATURE_ROADMAP_COMPREHENSIVE.md",
    "docs/IMPLEMENTATION_PLAN.md",
    "docs/MASTER_ROADMAP_INDEX.md",
    "docs/PRODUCTION_CHECKLIST.md",
    "docs/PWA_IMPLEMENTATION_SUMMARY.md",
    "docs/PWA_PRODUCTION_DEPLOYMENT_GUIDE.md",
    "docs/SOCIAL_MEDIA_INTEGRATION.md",
    "docs/SUPABASE_SMTP_SETUP.md",
    "docs/TESTING_GUIDE_NATIVE_VS_WEB.md",
    "docs/UTILITY_FEATURES.md",
    "docs/VENDOR_MARKETPLACE.md",
    "docs/features/COLLABORATION_IMPLEMENTATION_PROGRESS.md",
    "docs/features/CREW_VS_GUESTS_GUIDE.md",
    "docs/features/EVENT_PLANNING_BLOCKS_FEATURE.md",
    "docs/features/REAL_TIME_COLLABORATION_ENGINE.md",
    "docs/features/SOCIAL_NETWORK_PLAN.md",
})


def relative_link(from_doc: str, to_repo_path: str) -> str:
    """Markdown-safe relative path from one repo file to another.

    Both arguments are repo-relative POSIX paths. Returns a POSIX relative path so the
    link resolves in a rendered view regardless of where the document sits.
    """
    start_dir = os.path.dirname(from_doc) or "."
    rel = os.path.relpath(to_repo_path, start=start_dir)
    return Path(rel).as_posix()


def build_banner(doc_path: str) -> str:
    """Render the banner for one document, with links correct for its depth."""
    agents = relative_link(doc_path, "AGENTS.md")
    index = relative_link(doc_path, "docs/README.md")

    lines = [
        MARKER,
        "",
        "> [!WARNING]",
        "> **This document is STALE. Do not follow its instructions.**",
        ">",
        f"> Classified on {CLASSIFIED_ON}. It describes Supabase, Netlify or Vercel as live"
        " infrastructure.",
        "> This project moved to Azure Container Apps, Prisma and a self-hosted Express API in"
        " July 2026.",
        "> Commands, file paths, table definitions, environment variables and URLs below are"
        " likely wrong.",
    ]

    if doc_path in SPELLING_ONLY:
        lines += [
            ">",
            "> Its git date reads 2026-08-30, which is misleading. That commit was a repo-wide"
            " `PartyHaus`",
            "> to `PartyHause` spelling replacement that changed the text without reviewing it."
            " The content",
            "> predates the migration.",
        ]

    lines += [
        ">",
        f"> Current engineering reference: [`AGENTS.md`]({agents}).",
        f"> Documentation index: [`docs/README.md`]({index}).",
        "",
    ]
    return "\n".join(lines) + "\n"


def is_stamped(text: str) -> bool:
    return MARKER in text


def process(doc_path: str, *, check_only: bool) -> str:
    """Return one of: 'missing', 'already', 'stamped', 'would-stamp'."""
    full = REPO_ROOT / doc_path
    if not full.is_file():
        return "missing"

    text = full.read_text(encoding="utf-8")
    if is_stamped(text):
        return "already"
    if check_only:
        return "would-stamp"

    # Empty files get the banner alone; there is nothing to preserve below it.
    body = text.lstrip("\n")
    full.write_text(build_banner(doc_path) + ("\n" + body if body else ""), encoding="utf-8")
    return "stamped"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--check",
        action="store_true",
        help="verify banners are present; exit 1 if any is missing. Changes nothing.",
    )
    args = parser.parse_args()

    counts = {"missing": 0, "already": 0, "stamped": 0, "would-stamp": 0}
    missing: list[str] = []
    unstamped: list[str] = []

    for doc in STALE_DOCS:
        result = process(doc, check_only=args.check)
        counts[result] += 1
        if result == "missing":
            missing.append(doc)
        elif result == "would-stamp":
            unstamped.append(doc)

    print(f"stale docs declared : {len(STALE_DOCS)}")
    print(f"  already stamped   : {counts['already']}")
    if args.check:
        print(f"  MISSING banner    : {counts['would-stamp']}")
    else:
        print(f"  stamped now       : {counts['stamped']}")
    print(f"  file not found    : {counts['missing']}")

    for doc in missing:
        print(f"    not found: {doc}", file=sys.stderr)
    for doc in unstamped:
        print(f"    unstamped: {doc}", file=sys.stderr)

    # A declared file that has vanished means the list has drifted from the tree and the
    # classification can no longer be trusted. Fail rather than report a clean run.
    if missing:
        return 1
    if args.check and unstamped:
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
