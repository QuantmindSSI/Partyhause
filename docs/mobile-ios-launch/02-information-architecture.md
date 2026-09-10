# IOS-MVP-1 Information Architecture

## Counting Rule

A native screen is a routeable, restorable, independently testable iPhone destination. Browser
pages, alerts, confirmation sheets, mail handoff, and Safari handoff are separate registries.

The canonical registry contains exactly 14 native screens and 6 browser surfaces.

## Navigation Model

### Signed-out stack

- `SYS-01` resolves session state before protected content renders.
- `AUTH-01` is the signed-out root.
- Authentication screens push within the signed-out stack.
- Verification and reset email links open their HTTPS browser surfaces.

### Signed-in tabs

| Tab | Root | Purpose |
|---|---|---|
| Events | `EVT-01` | Owned private events and event creation |
| Account | `SET-01` | Account facts, legal links, support, sign-out, and deletion |

There is no PartyCrew, Games, Explore, guest, notification, or profile tab.

### Event stack

`EVT-01 -> EVT-02 or EVT-03 -> GST-01 -> GST-02 or INV-01`

Only events owned by the signed-in host appear. Back navigation returns to the invoking event. A
forbidden or deleted event returns to `EVT-01` with a privacy-safe message.

## Native Screen Registry

| ID | Screen | Route | Actor | Required responsibility |
|---|---|---|---|---|
| `SYS-01` | Launch And Session Gate | Internal root gate | `V/H` | Read Keychain, validate with `/api/auth/me`, clear rejected state, then route once |
| `AUTH-01` | Welcome | `/welcome` | `V` | Explain host product; link Sign In, Create Account, Privacy, Terms, and Support |
| `AUTH-02` | Sign In | `/auth/sign-in` | `V` | Email/password sign-in, unverified recovery, password recovery entry |
| `AUTH-03` | Create Account | `/auth/sign-up` | `V` | Name, email, password, age eligibility, versioned legal consent |
| `AUTH-04` | Check Your Email | `/auth/check-email` | `V` | Mask address, resend safely, change address, open Mail, return to Sign In |
| `AUTH-05` | Forgot Password | `/auth/forgot-password` | `V` | Enumeration-safe request and browser-reset explanation |
| `EVT-01` | Events | `/(tabs)/events` | `H` | List owned events by lifecycle state; distinguish loading, error, and empty |
| `EVT-02` | Event Form | `/events/new`, `/events/:eventId/edit` | `H` | Create or edit plain event fields, save draft, publish after review |
| `EVT-03` | Event Detail | `/events/:eventId` | `H` | Show server state and host actions for edit, guests, invitations, cancel, delete |
| `GST-01` | Guests And Attendance | `/events/:eventId/guests` | `H` | Search and filter up to 50 guests; show RSVP totals; check in and correct |
| `GST-02` | Guest Form | `/events/:eventId/guests/new`, `/events/:eventId/guests/:guestId` | `H` | Add or edit one name and email; remove with impact confirmation |
| `INV-01` | Invitations | `/events/:eventId/invitations` | `H` | Select real guests, confirm send, show truthful delivery result, retry eligible failure |
| `SET-01` | Account | `/(tabs)/account` | `H` | Show account email and verification; open legal/support; sign out; enter deletion |
| `ACC-01` | Delete Account | `/account/delete` | `H` | Explain exact data impact, reauthenticate, confirm, show accepted completion state |

## Browser Surface Registry

| ID | Surface | Path | Actor | Required responsibility |
|---|---|---|---|---|
| `WEB-AUTH-01` | Verify Email Result | `/auth/verify-email` | `V` | Consume one valid verification token and provide Sign In or safe recovery |
| `WEB-AUTH-02` | Reset Password | `/auth/reset-password` | `V` | Validate one reset token, set password, invalidate token, and return to Sign In |
| `WEB-RSVP-01` | Invitation And RSVP | `/join/:token` | `R` | Preview scoped event facts and update only the bound guest response |
| `WEB-LEGAL-01` | Privacy Policy | `/privacy.html` | All | State actual collection, processors, retention, rights, and contact method |
| `WEB-LEGAL-02` | Terms Of Service | `/terms.html` | All | State current terms, eligibility, event rules, and effective version |
| `WEB-SUP-01` | Support | `/support.html` | All | Provide current contact and account, invitation, privacy, and deletion help |

The browser pages are responsive and keyboard accessible. `WEB-RSVP-01` does not advertise or open
the native app.

## Reusable Overlay Registry

| ID | Overlay | Owners | Contract |
|---|---|---|---|
| `OVL-01` | Unsaved Changes | `EVT-02`, `GST-02` | Keep editing or discard; never silently lose input |
| `OVL-02` | Destructive Confirmation | `EVT-03`, `GST-02`, `ACC-01` | Name the object and irreversible impact; require explicit destructive action |
| `OVL-03` | Invitation Send Confirmation And Result | `INV-01` | Name selected count, prevent duplicate submit, separate successes and failures |

## Operational Workflow Registry

| ID | Workflow | Trigger | Required outcome |
|---|---|---|---|
| `OPS-01` | Invitation Delivery | Confirmed `INV-01` command | Authorize host, resolve event guests, render fixed email, deliver once, record truthful result |
| `OPS-02` | Event Completion And Data Expiry | Event end or deletion | Complete the event once, then apply the event, guest, RSVP, delivery, attendance, and backup rules in document 01 |
| `OPS-03` | Account Deletion Fulfillment | Confirmed `ACC-01` request | Revoke sessions, remove hosted data, verify disposition, and communicate completion |

## External Handoffs

| ID | Handoff | Trigger | Fallback |
|---|---|---|---|
| `EXT-01` | Mail application | `AUTH-04` | Keep resend, change-address, and Sign In actions available |
| `EXT-02` | Default HTTPS browser | Verification, reset, RSVP, legal, or support link | Show the URL and a retry action if the browser cannot open |

Neither handoff requires an iOS privacy permission.

## Navigation Rules

- Authentication and signed-in routes use separate stacks.
- A stored token alone never unlocks protected navigation.
- The app retains the requested native destination through reauthentication only when it is in the
  14-screen allow-list.
- Browser RSVP never redirects into authenticated native navigation.
- Unknown routes, malformed IDs, expired browser credentials, forbidden objects, and deleted
  objects show one safe unavailable state with no existence leak.
- Each tab preserves its stack. Reselecting a tab returns to its root.
- Destructive completion replaces the removed route so Back cannot reopen stale data.
- Excluded routes are removed from the release bundle rather than hidden behind disabled controls.

## Exact Counts

| Registry | Count |
|---|---:|
| Native authentication and system | 6 |
| Native event lifecycle | 3 |
| Native guests, invitations, and attendance | 3 |
| Native account and deletion | 2 |
| **Native screens** | **14** |
| Browser account actions | 2 |
| Browser RSVP | 1 |
| Browser legal and support | 3 |
| **Browser surfaces** | **6** |
| Reusable overlays | 3 |
| Operational workflows | 3 |
| External handoffs | 2 |
