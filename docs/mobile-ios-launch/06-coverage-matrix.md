# Coverage Matrix

## Coverage Standard

A registered item is covered only when an end-to-end case names it and defines an observable outcome. Merely rendering a route does not count. Alternate and failure branches count when the case requires them explicitly.

## App-Owned Screen Coverage

### Authentication

| Screen | Cases |
|---|---|
| `AUTH-01` | `C01`, `C10` |
| `AUTH-02` | `C01`, `C02` |
| `AUTH-03` | `C01` |
| `AUTH-04` | `C01` |
| `AUTH-05` | `C01` |
| `AUTH-06` | `C10` |
| `AUTH-07` | `C10` |
| `AUTH-08` | `C01` |

### Events And Creation

| Screen | Cases |
|---|---|
| `EVT-01` | `C01`, `C02` |
| `EVT-02` | `C02` |
| `EVT-03` | `C01` |
| `EVT-04` | `C01` |
| `EVT-05` | `C01` |
| `EVT-06` | `C01` |
| `EVT-07` | `C01` |
| `EVT-08` | `C01` |
| `EVT-09` | `C01`, `C02` |
| `EVT-10` | `C01` |
| `EVT-11` | `C01`, `C02`, `C03`, `C04`, `C05`, `C06`, `C07` |
| `EVT-12` | `C02` |
| `EVT-13` | `C02` |
| `EVT-14` | `C02` |
| `EVT-15` | `C02`, `C03` |

### Invitations, RSVP, Guests, And Check-In

| Screen | Cases |
|---|---|
| `INV-01` | `C03` |
| `INV-02` | `C03` |
| `INV-03` | `C03` |
| `INV-04` | `C03` |
| `INV-05` | `C03` |
| `INV-06` | `C03` |
| `RSVP-01` | `C04` |
| `RSVP-02` | `C04` |
| `RSVP-03` | `C04` |
| `GST-01` | `C03`, `C06` |
| `GST-02` | `C03`, `C06` |
| `CHK-01` | `C04` |
| `CHK-02` | `C04` |
| `CHK-03` | `C04` |

### Timeline, Polls, Costs, And PartyBoard

| Screen | Cases |
|---|---|
| `TIM-01` | `C04`, `C05` |
| `TIM-02` | `C05` |
| `POL-01` | `C05` |
| `POL-02` | `C05` |
| `POL-03` | `C05` |
| `COST-01` | `C06` |
| `COST-02` | `C06` |
| `COST-03` | `C06` |
| `COST-04` | `C06` |
| `BRD-01` | `C05` |
| `BRD-02` | `C05` |

### Games

| Screen | Cases |
|---|---|
| `GAM-01` | `C07` |
| `GAM-02` | `C07` |
| `GAM-03` | `C07` |
| `GAM-04` | `C07` |
| `GAM-05` | `C07` |

### PartyCrew, Feed, And Profiles

| Screen | Cases |
|---|---|
| `SOC-01` | `C09` |
| `SOC-02` | `C09` |
| `SOC-03` | `C09` |
| `SOC-04` | `C08` |
| `SOC-05` | `C08`, `C09` |
| `SOC-06` | `C08` |
| `SOC-07` | `C08` |
| `SOC-08` | `C08` |
| `SOC-09` | `C08` |

### Notifications, Settings, Support, Moderation, And Account

| Screen | Cases |
|---|---|
| `NTF-01` | `C09` |
| `NTF-02` | `C09` |
| `SET-01` | `C02`, `C10` |
| `SET-02` | `C10` |
| `SET-03` | `C10` |
| `SUP-01` | `C10` |
| `SUP-02` | `C10` |
| `SUP-03` | `C10` |
| `MOD-01` | `C05`, `C09` |
| `LEG-01` | `C10` |
| `LEG-02` | `C10` |
| `LEG-03` | `C10` |
| `ACC-01` | `C10` |

### System And Recovery

| Screen | Cases |
|---|---|
| `SYS-01` | `C01`, `C02`, `C10` |
| `SYS-02` | `C01`, `C04`, `C09`, `C10` |
| `SYS-03` | `C02`, `C04`, `C05` |
| `SYS-04` | `C03`, `C04`, `C08`, `C09` |
| `SYS-05` | `C02` |

## Canonical Flow Coverage

| Flow | Cases |
|---|---|
| `FL-A01` | `C01` |
| `FL-A02` | `C02` |
| `FL-A03` | `C10` |
| `FL-E01` | `C01` |
| `FL-E02` | `C02` |
| `FL-E03` | `C02` |
| `FL-E04` | `C02` |
| `FL-I01` | `C03` |
| `FL-I02` | `C03` |
| `FL-I03` | `C03`, `C04` |
| `FL-GST01` | `C03` |
| `FL-R01` | `C04` |
| `FL-C01` | `C04` |
| `FL-T01` | `C05` |
| `FL-P01` | `C05` |
| `FL-CS01` | `C06` |
| `FL-CS02` | `C06` |
| `FL-B01` | `C05` |
| `FL-G01` | `C07` |
| `FL-G02` | `C07` |
| `FL-S01` | `C08` |
| `FL-S02` | `C08` |
| `FL-S03` | `C09` |
| `FL-S04` | `C08` |
| `FL-N01` | `C09` |
| `FL-N02` | `C09` |
| `FL-ST01` | `C10` |
| `FL-SP01` | `C10` |
| `FL-M01` | `C09` |
| `FL-D01` | `C10` |
| `FL-Y01` | `C01`, `C04` |
| `FL-Y02` | `C02`, `C04`, `C05` |
| `FL-O01` | `C09` |
| `FL-O02` | `C10` |
| `FL-O03` | `C10` |

## Native And System Surface Coverage

| Surface | Cases |
|---|---|
| `OS-01` Notification permission | `C09` |
| `OS-02` Contact selection | `C01` |
| `OS-03` Camera permission | `C04` |
| `OS-04` System photo picker | `C03`, `C08` |
| `OS-05` Apple Maps handoff | `C04` |
| `OS-06` Calendar editor | `C04` |
| `OS-07` Mail handoff | `C01` |
| `OS-08` App Store handoff | `C02` |
| `OS-09` iOS Settings handoff | `C04`, `C09` |

## Overlay Coverage

| Overlay | Cases |
|---|---|
| `OVL-01` Unsaved changes | `C01`, `C02`, `C03` |
| `OVL-02` Guest edit | `C01`, `C03` |
| `OVL-03` Timeline edit | `C01`, `C05` |
| `OVL-04` PartyBoard compose/actions | `C05` |
| `OVL-05` Destructive confirmation | `C02`, `C03`, `C06`, `C08`, `C10` |
| `OVL-06` Invitation send result | `C03` |
| `OVL-07` Native share | `C03`, `C07`, `C09` |
| `OVL-08` Crew relationship actions | `C08`, `C09` |
| `OVL-09` Offline/stale banner | `C02`, `C05` |

## Operational Coverage

| Operation | Cases |
|---|---|
| `OPS-01` UGC filtering | `C05`, `C09` |
| `OPS-02` Moderation triage | `C09` |
| `OPS-03` Block enforcement | `C08`, `C09` |
| `OPS-04` Support handling | `C10` |
| `OPS-05` Account deletion fulfillment | `C10` |
| `OPS-06` Invitation abuse and delivery recovery | `C03` |
| `OPS-07` Event lifecycle scheduling | `C02` |

## Coverage Result

| Registry | Covered | Total | Result |
|---|---:|---:|---|
| App-owned screens | 80 | 80 | Complete |
| Canonical flows | 35 | 35 | Complete |
| Native and system surfaces | 9 | 9 | Complete |
| Reusable overlays | 9 | 9 | Complete |
| Operational workflows | 7 | 7 | Complete |
| End-to-end cases | 10 | 10 | Complete |

Uncovered registered items: none.

`Complete` means the specification assigns an acceptance case to every registered item. It does not mean the current application implements or passes that item. Implementation readiness is tracked in document 08 and test evidence is governed by document 09.

## Change Guard

Any added screen, flow, system surface, overlay, or operation must receive:

1. A stable ID in its source registry.
2. At least one end-to-end case assignment.
3. Happy-path and failure-path acceptance criteria.
4. An App Store, privacy, permission, payment, age-rating, and moderation impact review.
5. An updated total in this document and the directory index.
