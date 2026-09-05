/**
 * PartyCrew tab.
 *
 * GAP-EVT-10's required outcome is "Replace Explore with the canonical
 * PartyCrew tab". Explore advertised public event discovery against an endpoint
 * that does not exist and deliberately returned nothing. PartyCrew is the
 * opposite case: `/api/feed/crew` and the seven `/api/partycrew` routes have
 * been live all along, `useCrewFeed` already calls them, and
 * PartyCrewFeedScreen already renders them.
 *
 * The only thing missing was this file. The screen sat in components/ with no
 * route importing it, so 231 lines of working, API-backed feed were unreachable
 * from the running app. That is a navigation defect (P7), not an unbuilt
 * feature, and the fix is a route rather than a rewrite.
 */
import { PartyCrewFeedScreen } from '@/components/screens/PartyCrewFeedScreen';

export default function PartyCrewTab() {
  return <PartyCrewFeedScreen />;
}
