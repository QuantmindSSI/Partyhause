#!/usr/bin/env python3
"""
Tests for the Cloudflare DNS publisher's decision logic.

The network-facing functions are thin wrappers over urllib; what is worth
testing is the logic that decides WHAT to publish, because getting it wrong
either breaks mail for the whole domain or leaves a record silently
unverifiable.

Run: python3 scripts/test_cloudflare_acs_email_dns.py
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

# The script's filename contains hyphens, so it is not a valid module name and
# cannot be imported with a plain `import`. Load it by path instead.
_spec_path = Path(__file__).resolve().parent / "cloudflare-acs-email-dns.py"
_spec = importlib.util.spec_from_file_location("cf_acs_dns", _spec_path)
if _spec is None or _spec.loader is None:
    raise RuntimeError(f"Could not load {_spec_path}")
cf = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(cf)


class MergeSpfTests(unittest.TestCase):
    """
    A domain may carry exactly one SPF record, and mechanisms after `all` are
    never evaluated. Both rules are easy to violate and neither fails loudly:
    a second SPF record is an RFC 7208 permerror, and an include placed after
    the qualifier is simply ignored, so mail from that sender starts failing
    with nothing in the zone that looks wrong.
    """

    def test_include_is_inserted_before_the_qualifier(self):
        merged = cf.merge_spf("v=spf1 include:zohomail.eu ~all",
                              "include:spf.protection.outlook.com")
        self.assertEqual(
            merged,
            "v=spf1 include:zohomail.eu include:spf.protection.outlook.com ~all",
        )
        # The qualifier must be last, or the new include is dead weight.
        self.assertTrue(merged.endswith("~all"))

    def test_existing_mechanisms_are_preserved(self):
        merged = cf.merge_spf("v=spf1 a mx include:one.example ~all",
                              "include:two.example")
        for token in ("a", "mx", "include:one.example", "include:two.example"):
            self.assertIn(token, merged.split())

    def test_hard_fail_qualifier_is_not_downgraded(self):
        merged = cf.merge_spf("v=spf1 include:one.example -all",
                              "include:two.example")
        self.assertTrue(merged.endswith("-all"))
        self.assertNotIn("~all", merged)

    def test_record_with_no_qualifier_gets_a_soft_fail(self):
        merged = cf.merge_spf("v=spf1 include:one.example", "include:two.example")
        self.assertTrue(merged.endswith("~all"))

    def test_only_one_qualifier_survives(self):
        merged = cf.merge_spf("v=spf1 include:one.example ~all", "include:two.example")
        qualifiers = [t for t in merged.split() if t in cf.SPF_QUALIFIERS]
        self.assertEqual(len(qualifiers), 1)


class DecideUpsertTests(unittest.TestCase):
    """
    Cloudflare returns TXT content wrapped in quotes while callers pass it
    bare. If the comparison does not unquote both sides, every TXT record
    looks permanently out of date and is rewritten on every run.
    """

    def test_absent_record_is_created(self):
        self.assertEqual(cf.decide_upsert([], "abc"), "create")

    def test_matching_record_is_left_alone(self):
        existing = [{"content": "abc"}]
        self.assertEqual(cf.decide_upsert(existing, "abc"), "unchanged")

    def test_quoted_txt_content_matches_its_bare_form(self):
        existing = [{"content": '"ms-domain-verification=abc123"'}]
        self.assertEqual(
            cf.decide_upsert(existing, "ms-domain-verification=abc123"),
            "unchanged",
        )

    def test_different_content_is_created(self):
        existing = [{"content": "old-value"}]
        self.assertEqual(cf.decide_upsert(existing, "new-value"), "create")

    def test_match_is_found_among_several_records(self):
        existing = [{"content": "wrong-1"}, {"content": "abc"}, {"content": "wrong-2"}]
        self.assertEqual(cf.decide_upsert(existing, "abc"), "unchanged")


class FqdnForTests(unittest.TestCase):
    """The apex is expressed three ways; all must resolve to the bare zone."""

    def test_at_sign_means_the_apex(self):
        self.assertEqual(cf.fqdn_for("example.com", "@"), "example.com")

    def test_zone_name_means_the_apex(self):
        self.assertEqual(cf.fqdn_for("example.com", "example.com"), "example.com")

    def test_label_is_prefixed(self):
        self.assertEqual(cf.fqdn_for("example.com", "www"), "www.example.com")

    def test_apex_verification_label_differs_from_the_www_one(self):
        # Getting these two the wrong way round is why apex validation fails.
        self.assertEqual(cf.fqdn_for("example.com", "asuid"), "asuid.example.com")
        self.assertEqual(cf.fqdn_for("example.com", "asuid.www"),
                         "asuid.www.example.com")


class RenderTests(unittest.TestCase):
    """A dry run must be visibly distinct from a real one in the log."""

    def test_dry_run_wording_is_distinct_from_a_real_write(self):
        would = cf.render("would-create", "A", "example.com", "1.2.3.4")
        did = cf.render("create", "A", "example.com", "1.2.3.4")
        self.assertIn("WOULD CREATE", would)
        self.assertNotIn("WOULD", did)

    def test_every_action_has_wording(self):
        for action in ("unchanged", "create", "would-create"):
            self.assertTrue(cf.render(action, "TXT", "example.com", "v"))


class ArgParsingTests(unittest.TestCase):
    def test_verification_token_is_required(self):
        with self.assertRaises(SystemExit):
            cf.parse_args([])

    def test_defaults(self):
        args = cf.parse_args(["--verification-token", "t"])
        self.assertEqual(args.zone, "partyhause.com")
        self.assertEqual(args.dmarc_policy, "none")
        self.assertFalse(args.dry_run)
        self.assertFalse(args.azure_web)

    def test_flags_are_parsed(self):
        args = cf.parse_args(["--verification-token", "t", "--dry-run", "--azure-web",
                              "--zone", "other.test", "--dmarc-policy", "reject"])
        self.assertTrue(args.dry_run)
        self.assertTrue(args.azure_web)
        self.assertEqual(args.zone, "other.test")
        self.assertEqual(args.dmarc_policy, "reject")

    def test_invalid_dmarc_policy_is_rejected(self):
        with self.assertRaises(SystemExit):
            cf.parse_args(["--verification-token", "t", "--dmarc-policy", "banana"])


class MissingTokenTests(unittest.TestCase):
    def test_main_exits_nonzero_without_a_token(self):
        import os
        saved = os.environ.pop("CLOUDFLARE_API_TOKEN", None)
        try:
            self.assertEqual(cf.main(["--verification-token", "t"]), 1)
        finally:
            if saved is not None:
                os.environ["CLOUDFLARE_API_TOKEN"] = saved


if __name__ == "__main__":
    unittest.main(verbosity=2)
