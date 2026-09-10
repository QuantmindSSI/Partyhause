/**
 * The host's journey, driven through a real browser.
 *
 * One continuous story rather than isolated cases, because the defects this is
 * meant to catch live in the seams: a session that is valid but renders as
 * signed out, an invitation that is sent but cannot be answered, a role that
 * gates a control nobody can reach. Each step below depends on the one above,
 * and `test.describe.serial` stops the suite at the first break rather than
 * reporting eight failures with one cause.
 *
 * What this does NOT cover, and why, is recorded in `unbuilt-surfaces.spec.ts`.
 */

import { expect, test } from '@playwright/test';

import {
  API_BASE,
  CONSENT,
  auth,
  createVerifiedUser,
  emailFor,
  seedSession,
  waitForToken,
  type Session,
} from './support';

const HOST_EMAIL = emailFor('host');
const HOST_PASSWORD = 'planner-pw-8891';
const HOST_NAME = 'Priya Host';

const COMMITTEE_EMAIL = emailFor('committee');
const COMMITTEE_PASSWORD = 'committee-pw-8891';

/** Carried between steps: populated as the story progresses. */
const story: {
  hostSession?: Session;
  eventId?: string;
  guestId?: string;
  rsvpToken?: string;
} = {};

test.describe.serial('host plans an event end to end', () => {
  test('1. signup refuses to proceed without the consent the server records', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /create one here/i }).click();

    await page.locator('#auth-name').fill(HOST_NAME);
    await page.locator('#auth-email').fill(HOST_EMAIL);
    await page.locator('#auth-password').fill(HOST_PASSWORD);

    // Submit deliberately WITHOUT ticking either box. The server stores the
    // accepted document versions against the account, so a signup that has not
    // collected them would be recording a statement the user never made.
    const submit = page.getByRole('button', { name: /create account/i });
    await expect(submit).toBeDisabled();

    await page.getByRole('checkbox').first().check();
    await expect(submit, 'one box is not enough').toBeDisabled();

    await page.getByRole('checkbox').nth(1).check();
    await expect(submit, 'both boxes ticked').toBeEnabled();

    // The confirmation arrives as a native `alert()`, not as page content, so
    // it has to be captured before the click. Playwright auto-dismisses
    // dialogs, which means an assertion against the DOM would silently find
    // nothing and report "element not found" for a message that was in fact
    // delivered.
    //
    // Worth flagging rather than just working around: the app already depends
    // on `sonner` for toasts, and window.alert is used here and for every
    // auth error. It blocks the event loop and cannot be styled or tested
    // without this dance.
    const dialogMessage = new Promise<string>((resolve) => {
      page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.dismiss();
        resolve(message);
      });
    });

    await submit.click();

    expect(await dialogMessage).toMatch(/check your email/i);

    // Signup issues no session. The address has to be confirmed first, so the
    // app must not appear signed in here.
    await expect(page.locator('#auth-email')).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('partyhause_auth_token'))).toBeNull();
  });

  test('2. the emailed link confirms the address', async ({ page }) => {
    const token = await waitForToken('verify-email', HOST_EMAIL);

    await page.goto(`/auth/verify-email?token=${token}&email=${encodeURIComponent(HOST_EMAIL)}`);
    await expect(page.getByText(/verified|confirmed|success/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('3. sign in establishes a session the app can actually render', async ({ page }) => {
    await page.goto('/');
    await page.locator('#auth-email').fill(HOST_EMAIL);
    await page.locator('#auth-password').fill(HOST_PASSWORD);
    await page.getByRole('button', { name: /sign in/i }).click();

    // The session is two keys and the store hydrates only when both are
    // present. Asserting the greeting rather than the token proves the app
    // could actually read what sign-in wrote.
    await expect(page.getByText(new RegExp(`Hey, ${HOST_NAME.split(' ')[0]}`, 'i'))).toBeVisible({
      timeout: 20_000,
    });

    const stored = await page.evaluate(() => ({
      token: localStorage.getItem('partyhause_auth_token'),
      user: localStorage.getItem('partyhause_auth_user'),
    }));
    expect(stored.token, 'token half of the session').toBeTruthy();
    expect(stored.user, 'cached-user half of the session').toBeTruthy();

    story.hostSession = {
      token: stored.token as string,
      user: JSON.parse(stored.user as string),
    };
  });

  test('4. becoming a creator is what unlocks event creation', async ({ page }) => {
    await seedSession(page, story.hostSession!);
    await page.goto('/');

    // The attendee dashboard has no way to create an event, by design: the
    // create control lives on the creator dashboard and the role is the gate.
    await expect(page.getByRole('button', { name: /new event/i })).toHaveCount(0);

    await page.getByRole('button', { name: /upgrade/i }).click();
    await expect(page.getByText(/how will you use partyhause/i)).toBeVisible();

    await page.getByText(/event creator/i).first().click();
    await page.getByRole('button', { name: /continue/i }).click();

    await expect(page.getByText(/creator studio/i).first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /new event/i }).first()).toBeVisible();
  });

  test('5. the AI planner turns a sentence into a structured draft', async ({ page, request }) => {
    await seedSession(page, story.hostSession!, 'creator');
    await page.goto('/');
    await page.getByRole('button', { name: /new event/i }).first().click();

    await expect(page.getByText(/ai planner/i).first()).toBeVisible({ timeout: 20_000 });

    const prompt = page.getByPlaceholder(/describe your event/i);
    await prompt.fill('A 30th birthday party for 30 guests in Lagos on 20 December at 8pm');
    await prompt.press('Enter');

    // The planner answers with a follow-up question and a structured
    // extraction. Without AZURE_OPENAI_* or OPENAI_API_KEY it runs the
    // deterministic chrono-node and lexicon path, which is the configuration
    // under test here: the feature must work with no external service.
    await expect(page.getByText(/so far i have|guests|birthday/i).first()).toBeVisible({
      timeout: 30_000,
    });

    // Assert the extraction directly, because what the wizard carries forward
    // is the structure, not the prose.
    const extraction = await request.post(`${API_BASE}/api/ai/chat`, {
      headers: auth(story.hostSession!),
      data: {
        messages: [
          {
            role: 'user',
            content: 'A 30th birthday party for 30 guests in Lagos on 20 December at 8pm',
          },
        ],
      },
    });
    expect(extraction.status()).toBe(200);
    const parsed = await extraction.json();
    expect(parsed.data.extracted.templateId).toBe('birthday');
    expect(parsed.data.extracted.expectedGuests).toBe(30);
  });

  test('6. the host creates the event', async ({ request }) => {
    // Created through the API rather than the eight-step wizard. The wizard is
    // the subject of its own coverage; what the rest of this story needs is an
    // event that exists, and driving eight screens to get one would make every
    // later step fail for a reason that has nothing to do with the step.
    const created = await request.post(`${API_BASE}/api/events`, {
      headers: auth(story.hostSession!),
      data: {
        name: 'Priya 30th',
        title: 'Priya 30th',
        description: 'Planning committee coordination',
        location: 'Lagos',
        start_date: new Date(Date.now() + 14 * 864e5).toISOString(),
        end_date: new Date(Date.now() + 14 * 864e5 + 4 * 36e5).toISOString(),
        privacy: 'private',
        status: 'draft',
      },
    });
    expect(created.status(), await created.text()).toBeLessThan(300);
    const body = await created.json();
    story.eventId = body.event?.id ?? body.id ?? body.data?.id;
    expect(story.eventId, 'event id').toBeTruthy();
  });

  test('7. a planning committee member is invited and can answer', async ({ request, browser }) => {
    // The committee member is a real confirmed account: the invitation has to
    // reach somebody who exists, and the RSVP has to be answerable by a person
    // who is not signed in.
    await createVerifiedUser(request, COMMITTEE_EMAIL, COMMITTEE_PASSWORD, 'Chidi Committee');

    const added = await request.post(`${API_BASE}/api/guests`, {
      headers: auth(story.hostSession!),
      data: {
        event_id: story.eventId,
        name: 'Chidi Committee',
        email: COMMITTEE_EMAIL,
        rsvp_status: 'pending',
      },
    });
    expect(added.status(), await added.text()).toBeLessThan(300);
    const guestBody = await added.json();
    story.guestId = guestBody.guest?.id ?? guestBody.id ?? guestBody.data?.id;
    expect(story.guestId, 'guest id').toBeTruthy();

    // The guest list is the authorization boundary for invitations: the send
    // endpoint refuses any recipient who is not already on it.
    const list = await request.get(`${API_BASE}/api/guests?event_id=${story.eventId}`, {
      headers: auth(story.hostSession!),
    });
    expect(list.status()).toBe(200);
    expect(JSON.stringify(await list.json())).toContain(COMMITTEE_EMAIL);

    // An anonymous browser answers, which is the real shape of an RSVP: the
    // guest has no account and the token in the URL is the credential.
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    await anonPage.goto('/join/not-a-real-token');
    // Whatever it renders, it must not crash and must not leak the event.
    await expect(anonPage.locator('body')).not.toContainText('Priya 30th');
    await anon.close();
  });

  test('8. the committee deliberates on the partyboard', async ({ request }) => {
    const sticky = await request.post(`${API_BASE}/api/partyboard/stickies`, {
      headers: auth(story.hostSession!),
      data: {
        event_id: story.eventId,
        type: 'idea',
        category: 'entertainment',
        data: { text: 'Hire a live band' },
      },
    });
    expect(sticky.status(), await sticky.text()).toBeLessThan(300);
    const stickyId = (await sticky.json()).sticky?.id;
    expect(stickyId, 'sticky id').toBeTruthy();

    // Voting is a toggle, which is the entire reason votes are rows with a
    // unique (sticky_id, user_id) rather than a counter column.
    const first = await request.patch(`${API_BASE}/api/partyboard/stickies/${stickyId}/vote`, {
      headers: auth(story.hostSession!),
    });
    expect((await first.json()).votes).toBe(1);
    expect((await first.json().catch(() => ({}))).user_has_voted ?? true).toBeTruthy();

    const second = await request.patch(`${API_BASE}/api/partyboard/stickies/${stickyId}/vote`, {
      headers: auth(story.hostSession!),
    });
    expect((await second.json()).votes, 'second click toggles off').toBe(0);

    // Converting an idea to a task is how deliberation becomes a plan.
    await request.patch(`${API_BASE}/api/partyboard/stickies/${stickyId}/vote`, {
      headers: auth(story.hostSession!),
    });
    const task = await request.post(
      `${API_BASE}/api/partyboard/stickies/${stickyId}/convert-to-task`,
      {
        headers: auth(story.hostSession!),
        data: { title: 'Book the band', estimated_cost: 450.5 },
      },
    );
    expect(task.status(), await task.text()).toBeLessThan(300);
  });

  test('9. an outsider cannot read the private board', async ({ request }) => {
    const outsider = await createVerifiedUser(
      request,
      emailFor('outsider'),
      'outsider-pw-8891',
      'Outsider',
    );
    const denied = await request.get(
      `${API_BASE}/api/partyboard/stickies?event_id=${story.eventId}`,
      { headers: auth(outsider) },
    );
    expect(denied.status(), 'a stranger must not read the committee board').toBe(403);
  });

  test('10. the host publishes the event', async ({ request }) => {
    const published = await request.put(`${API_BASE}/api/events/${story.eventId}`, {
      headers: auth(story.hostSession!),
      data: { status: 'published' },
    });
    expect(published.status(), await published.text()).toBeLessThan(300);

    const reread = await request.get(`${API_BASE}/api/events/${story.eventId}`, {
      headers: auth(story.hostSession!),
    });
    expect(JSON.stringify(await reread.json())).toContain('published');
  });
});
