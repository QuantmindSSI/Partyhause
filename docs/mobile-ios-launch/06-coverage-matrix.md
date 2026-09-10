# IOS-MVP-1 Coverage Matrix

## Coverage Standard

A registered item is covered only when a case names it and defines an observable result. Rendering a
route without authorization, failure, retry, privacy, and accessibility behavior is not coverage.

## Native Screen Coverage

| Screen | Cases | Required result |
|---|---|---|
| `SYS-01` | `C01` | Session validated or cleared before routing |
| `AUTH-01` | `C01` | Accurate product entry and working public links |
| `AUTH-02` | `C01` | Sign-in, unverified recovery, and safe errors |
| `AUTH-03` | `C01` | Account, eligibility, and versioned consent created |
| `AUTH-04` | `C01` | Safe resend, masked address, and Mail handoff |
| `AUTH-05` | `C01` | Enumeration-safe reset request |
| `EVT-01` | `C01`, `C02` | Owned events only; loading, error, and empty distinct |
| `EVT-02` | `C02` | Private server draft, edit, review, and publish |
| `EVT-03` | `C02`, `C03`, `C05` | Authoritative event state and only approved actions |
| `GST-01` | `C03`, `C05` | Bounded guest list, RSVP totals, and manual attendance |
| `GST-02` | `C03` | Add, edit, deduplicate, cap, and remove one guest |
| `INV-01` | `C03` | Real recipient selection and truthful delivery recovery |
| `SET-01` | `C01`, `C06` | Account facts, public links, sign-out, and deletion entry |
| `ACC-01` | `C06` | Complete impact, reauthentication, confirmation, and status |

## Browser Surface Coverage

| Surface | Cases | Required result |
|---|---|---|
| `WEB-AUTH-01` | `C01` | Single-use verification and safe failure |
| `WEB-AUTH-02` | `C01` | Single-use reset and safe failure |
| `WEB-RSVP-01` | `C04` | Account-free, token-scoped, idempotent RSVP |
| `WEB-LEGAL-01` | `C01`, `C04`, `C06` | Accurate privacy and disposition terms |
| `WEB-LEGAL-02` | `C01` | Versioned terms match recorded consent |
| `WEB-SUP-01` | `C01`, `C04`, `C06` | Current public support path |

## Flow Coverage

| Flow | Case | Result |
|---|---|---|
| `FL-01` Account lifecycle | `C01` | Complete |
| `FL-02` Event lifecycle | `C02` | Complete |
| `FL-03` Guests and invitations | `C03` | Complete |
| `FL-04` Browser RSVP | `C04` | Complete |
| `FL-05` Attendance and check-in | `C05` | Complete |
| `FL-06` Account deletion | `C06` | Complete |

## Overlay Coverage

| Overlay | Cases | Required result |
|---|---|---|
| `OVL-01` Unsaved Changes | `C02`, `C03` | Input is not silently lost |
| `OVL-02` Destructive Confirmation | `C02`, `C03`, `C05`, `C06` | Object and impact are explicit |
| `OVL-03` Invitation Send Confirmation And Result | `C03` | Count, pending state, and partial outcome are exact |

## Operational Coverage

| Workflow | Cases | Required result |
|---|---|---|
| `OPS-01` Invitation Delivery | `C03` | Authorized, scoped, bounded, idempotent delivery |
| `OPS-02` Event Completion And Data Expiry | `C02`, `C04`, `C06` | One completion transition, RSVP revocation, and document 01 retention pass |
| `OPS-03` Account Deletion Fulfillment | `C06` | Immediate revocation, bounded recovery, and verified disposition |

## External Handoff Coverage

| Handoff | Cases | Required result |
|---|---|---|
| `EXT-01` Mail application | `C01` | Optional handoff with in-app recovery retained |
| `EXT-02` Default HTTPS browser | `C01`, `C04` | Correct public route without native guest entry |

## Product Rule Coverage

| Rule | Cases |
|---|---|
| iPhone-only release | `C01` through `C06` |
| Private events only | `C02`, `C04` |
| Exactly one host | `C02`, `C06` |
| At most 50 guests | `C03`, `C05` |
| Browser RSVP only | `C03`, `C04` |
| No native guest mode | `C04` |
| Manual check-in only | `C05` |
| No sensitive permission | `C01`, `C03`, `C05` |
| No payment | `C01` through `C06` release-surface inspection |
| Data disposition | `C06` |
| Excluded features absent | `C01` through `C06` route, binary, and metadata inspection |

## Coverage Result

| Registry | Covered | Total | Result |
|---|---:|---:|---|
| Native screens | 14 | 14 | Complete |
| Browser surfaces | 6 | 6 | Complete |
| Canonical flows | 6 | 6 | Complete |
| Reusable overlays | 3 | 3 | Complete |
| Operational workflows | 3 | 3 | Complete |
| External handoffs | 2 | 2 | Complete |
| End-to-end cases | 6 | 6 | Complete |

Uncovered registered items: none.

`Complete` means the specification assigns observable acceptance coverage. It does not mean the
implementation at `2cbf6a6` passes. Current implementation status is in document 08.

## Change Guard

Any added surface, flow, overlay, operation, permission, actor, device family, or data class must
receive a stable ID, a case assignment, failure criteria, privacy and security review, App Review
assessment, and updated exact totals in the same change.
