import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * PartyHub Index - Redirects to PartyBoard
 * 
 * The PartyHub is now a unified collaborative planning space centered around
 * the PartyBoard. All features (polls, debates, ideas) are integrated into
 * the board as interactive elements.
 */
export default function PartyHubIndex() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // Redirect directly to the PartyBoard
  return <Redirect href={`/events/${id}/planning/partyhub/partyboard`} />;
}
