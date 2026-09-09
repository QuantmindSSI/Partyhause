import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { CalendarDays, Clock3, Loader2, MapPin } from 'lucide-react';
import { useParams } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  resolveRsvp,
  submitRsvp,
  type BrowserRsvpChoice,
  type BrowserRsvpInvitation,
} from '@/lib/rsvp-client';

type PageState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; invitation: BrowserRsvpInvitation };

const CHOICES: Array<{ value: BrowserRsvpChoice; label: string; description: string }> = [
  { value: 'accepted', label: 'Accept', description: 'I will be there.' },
  { value: 'maybe', label: 'Maybe', description: 'I am not certain yet.' },
  { value: 'declined', label: 'Decline', description: 'I cannot attend.' },
];

function formatDate(value: string, timezone: string): string {
  const date = new Date(value);
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: timezone,
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function statusLabel(status: BrowserRsvpInvitation['rsvp']['status']): string {
  if (status === 'pending') return 'Awaiting your response';
  if (status === 'accepted') return 'Accepted';
  if (status === 'maybe') return 'Maybe';
  return 'Declined';
}

export function JoinEventPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [choice, setChoice] = useState<BrowserRsvpChoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'loading' });
    const result = await resolveRsvp(token);
    if (result.error || !result.data) {
      setState({ status: 'unavailable' });
      return;
    }
    setState({ status: 'ready', invitation: result.data });
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (!token || !choice || state.status !== 'ready') return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    const result = await submitRsvp(token, choice, state.invitation.rsvp.revision);
    setSubmitting(false);
    if (result.data) {
      setState({ status: 'ready', invitation: result.data });
      setMessage(`Your response is now ${statusLabel(result.data.rsvp.status).toLowerCase()}.`);
      return;
    }
    if (result.error?.code === 'REVISION_CONFLICT') {
      const refreshed = await resolveRsvp(token);
      if (refreshed.data) setState({ status: 'ready', invitation: refreshed.data });
      else setState({ status: 'unavailable' });
      setChoice(null);
      setError('Your response changed in another request. Review the current response and try again.');
      return;
    }
    if (result.error?.status === 404) {
      setState({ status: 'unavailable' });
      return;
    }
    setError(result.error?.message || 'Your response could not be saved. Please try again.');
  }

  if (state.status === 'loading') {
    return (
      <main className="min-h-screen bg-[#f7f1ed] px-4 py-12 flex items-center justify-center">
        <div className="text-center" role="status">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#b53120]" />
          <p className="mt-4 font-medium text-[#4d3d37]">Loading your invitation...</p>
        </div>
      </main>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <main className="min-h-screen bg-[#f7f1ed] px-4 py-12 flex items-center justify-center">
        <Card className="w-full max-w-lg border-[#ddcbc2] bg-white shadow-sm">
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a03a2b]">PartyHause RSVP</p>
            <CardTitle className="text-2xl text-[#2d211d]">Invitation unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-6 text-[#675650]">This invitation cannot be opened. Ask the host for help if you expected it to be available.</p>
          </CardContent>
          <CardFooter className="gap-5 text-sm">
            <a className="font-semibold text-[#8f2c1f] underline" href="/privacy.html" rel="noreferrer">Privacy</a>
            <a className="font-semibold text-[#8f2c1f] underline" href="/support.html" rel="noreferrer">Support</a>
          </CardFooter>
        </Card>
      </main>
    );
  }

  const { invitation } = state;
  return (
    <main className="min-h-screen bg-[#f7f1ed] px-4 py-10 sm:py-16">
      <Card className="mx-auto w-full max-w-xl overflow-hidden border-[#ddcbc2] bg-white shadow-xl shadow-[#8d4a3820]">
        <div className="bg-[#2e1812] px-6 py-8 text-white sm:px-9">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#efa28d]">Private invitation</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{invitation.event.name}</h1>
          <p className="mt-3 text-[#f5e8e3]">Hosted by {invitation.event.hostName}</p>
        </div>
        <CardContent className="space-y-7 px-6 py-7 sm:px-9">
          <section aria-labelledby="event-details" className="space-y-4">
            <h2 className="text-lg font-bold text-[#2d211d]" id="event-details">Event details</h2>
            <div className="flex gap-3 text-[#574640]">
              <CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#b53120]" />
              <div><p className="font-semibold">Starts</p><p>{formatDate(invitation.event.start, invitation.event.timezone)}</p></div>
            </div>
            <div className="flex gap-3 text-[#574640]">
              <Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#b53120]" />
              <div><p className="font-semibold">Ends</p><p>{formatDate(invitation.event.end, invitation.event.timezone)}</p><p className="text-sm">{invitation.event.timezone}</p></div>
            </div>
            <div className="flex gap-3 text-[#574640]">
              <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-[#b53120]" />
              <div><p className="font-semibold">Location</p><p>{invitation.event.location}</p></div>
            </div>
          </section>

          <div className="rounded-xl border border-[#ead9d1] bg-[#fff8f5] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7b665e]">Current response</p>
            <p className="mt-1 text-lg font-bold text-[#2d211d]">{statusLabel(invitation.rsvp.status)}</p>
          </div>

          <form className="space-y-5" onSubmit={(event) => { void submit(event); }}>
            <fieldset>
              <legend className="text-lg font-bold text-[#2d211d]">Will you attend?</legend>
              <div className="mt-3 grid gap-3">
                {CHOICES.map((option) => (
                  <label className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 ${choice === option.value ? 'border-[#b53120] bg-[#fff4f0]' : 'border-[#dfd5d1]'}`} key={option.value}>
                    <input
                      checked={choice === option.value}
                      className="h-5 w-5 accent-[#b53120]"
                      name="rsvp"
                      onChange={() => setChoice(option.value)}
                      type="radio"
                      value={option.value}
                    />
                    <span><span className="block font-bold text-[#2d211d]">{option.label}</span><span className="text-sm text-[#675650]">{option.description}</span></span>
                  </label>
                ))}
              </div>
            </fieldset>
            {message ? <p aria-live="polite" className="rounded-lg bg-[#eaf7ef] px-4 py-3 font-medium text-[#17643e]">{message}</p> : null}
            {error ? <p aria-live="assertive" className="rounded-lg bg-[#fff0f0] px-4 py-3 text-[#9b2327]" role="alert">{error}</p> : null}
            <Button className="min-h-12 w-full bg-[#b53120] text-base font-bold hover:bg-[#8f261a]" disabled={!choice || submitting} type="submit">
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving response...</> : 'Submit RSVP'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-between border-t border-[#eee5e1] px-6 py-5 text-sm sm:px-9">
          <span className="text-[#75635c]">No account is required.</span>
          <span className="flex gap-4">
            <a className="font-semibold text-[#8f2c1f] underline" href="/privacy.html" rel="noreferrer">Privacy</a>
            <a className="font-semibold text-[#8f2c1f] underline" href="/support.html" rel="noreferrer">Support</a>
          </span>
        </CardFooter>
      </Card>
    </main>
  );
}
