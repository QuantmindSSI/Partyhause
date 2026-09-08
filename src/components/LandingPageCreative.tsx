/**
 * The unauthenticated landing page.
 *
 * Mounted from `App.tsx` when `appMode === 'landing'` and no user is present.
 * It is a static import rather than lazy, deliberately: it is the first paint
 * for every anonymous visitor, so putting it behind a chunk boundary trades a
 * smaller entry bundle for a slower first contentful paint on the one route
 * where that matters most.
 *
 * Design constraints taken from docs/BRAND.md and enforced here:
 *
 *   - `coral-500` (#FF5233) is the brand colour, not a button colour. White on
 *     it is 3.23:1, which passes only for large display text. Solid buttons
 *     with white labels use `coral-700` (5.86:1); small links and labels use
 *     `coral-700` or darker; `coral-600` is the focus ring.
 *   - The brand gradient is permitted on surfaces and prohibited on buttons
 *     and body text. It appears here twice, on the video tint and on the
 *     closing band, and nowhere else.
 *   - The `Sparkles` icon is retired from anything logo-shaped. The mark is
 *     `BrandMark`, which is the committed artwork rather than a stand-in.
 *
 * This file previously leaned on `.modern-card`, `.card-elevated`,
 * `.icon-button-3d` and `.btn-floating` from `src/index.css`. Three of those
 * are declared twice in that stylesheet, once inside `@layer components` and
 * again unlayered, so the second declaration silently won and the hover
 * behaviour did not match the rule most readers would find first. It also used
 * `.hover-lift`, which is not defined anywhere in the repository and therefore
 * did nothing in three places. Surfaces are now plain utilities and motion is
 * expressed in `whileHover`, so what renders is what the file says.
 */

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/BrandMark';
import { usePartyStore } from '@/store/usePartyStore';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  ChevronDown,
  Coffee,
  Heart,
  Lightbulb,
  ListChecks,
  Menu,
  PartyPopper,
  Ticket,
  Users,
  Wand2,
  X,
} from 'lucide-react';

/**
 * What the visitor came to do. Forwarded to `AuthScreen`, which renders
 * different headline, subtitle and benefit copy per branch.
 *
 * All three values are produced by this page. They were not before: every call
 * site relied on the `'create_event'` default, so two thirds of the copy in
 * `AuthScreen` was unreachable from the only page that can reach it.
 */
type LandingIntent = 'create_event' | 'join_event' | 'explore_features';

type LandingPageCreativeProps = {
  onStartAuth?: (intent: LandingIntent) => void;
};

const HERO_VIDEO_SRC = '/videos/Video_concept_lively_202509130901.mp4';
const HERO_VIDEO_POSTER = '/images/video-poster-1.jpg';

const SECTION_HOW = 'how-it-works';
const SECTION_STYLE = 'find-your-style';
const SECTION_CULTURE = 'party-culture';

/** In-page nav destinations. Every entry scrolls; the blog is reached from
 *  the culture section itself rather than from the header, so there is no
 *  second kind of destination to model. */
const NAV_LINKS: ReadonlyArray<{ label: string; id: string }> = [
  { label: 'How it works', id: SECTION_HOW },
  { label: 'Find your style', id: SECTION_STYLE },
  { label: 'Party culture', id: SECTION_CULTURE },
];

const PRINCIPLES = [
  {
    icon: Users,
    title: 'Everyone in one place',
    body:
      'Guest list, RSVPs, running order and the group chat that usually lives in four apps. One link, one page, one source of truth.',
  },
  {
    icon: ListChecks,
    title: 'Nothing forgotten',
    body:
      'Turn a sticky note into a task, split the cost, and see what is still open. The plan updates for everyone the moment it changes.',
  },
  {
    icon: PartyPopper,
    title: 'Then get out of the way',
    body:
      'The work happens before the night. On the night you should be at your own party, not answering the same question eleven times.',
  },
] as const;

const ARCHETYPES = [
  {
    id: 'intimate',
    title: 'The Intimate Curator',
    description:
      'Eight people around one table. You care about who sits where, what is playing, and whether the wine ran out. Small is the point.',
    signature: 'Seating plans, playlists, and a running order measured in courses.',
    icon: Heart,
  },
  {
    id: 'bold',
    title: 'The Bold Creator',
    description:
      'The room should not look like the room. You build a theme and commit to it, and people talk about it for a year afterwards.',
    signature: 'Themes, budgets that need splitting, and a build day before the day.',
    icon: Wand2,
  },
  {
    id: 'mindful',
    title: 'The Mindful Host',
    description:
      'Fewer, better. You would rather do four nights a year properly than one a month badly, and your guests can tell the difference.',
    signature: 'Short guest lists, long lead times, and a plan that never feels rushed.',
    icon: Lightbulb,
  },
  {
    id: 'catalyst',
    title: 'The Culture Catalyst',
    description:
      'You introduce people. Half the room did not know the other half, and by midnight nobody remembers which half they arrived in.',
    signature: 'Big lists, open invites, and a crew that grows every time you host.',
    icon: Coffee,
  },
] as const;

const BLOG_PREVIEWS = [
  {
    title: 'The art of micro-moments',
    excerpt:
      'The difference between a dinner and an occasion is about four decisions, and none of them cost anything.',
    category: 'Experience design',
    readTime: '4 min read',
  },
  {
    title: 'Celebration trends worth stealing',
    excerpt:
      'What hosts in six cities are doing differently this year, and which of it survives contact with a Tuesday.',
    category: 'Culture',
    readTime: '7 min read',
  },
  {
    title: 'The psychology of timing',
    excerpt:
      'Every good night has a shape. Here is how to plan the shape instead of hoping for it.',
    category: 'Hosting craft',
    readTime: '5 min read',
  },
] as const;

const FOOTER_LEGAL = [
  { label: 'Privacy', href: '/privacy.html' },
  { label: 'Terms', href: '/terms.html' },
  { label: 'Support', href: '/support.html' },
] as const;

/** Section heading with the brand accent on the second line.
 *  `coral-500` is permitted here and only here: at this size the text is
 *  "large" under WCAG, where the threshold is 3:1 and coral-500 measures
 *  3.23:1 on white. The same colour on 16px body text would fail. */
function SectionHeading({
  lead,
  accent,
  body,
  align = 'center',
}: {
  lead: string;
  accent: string;
  body?: string;
  align?: 'center' | 'left';
}) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-2xl ${alignment}`}>
      <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">
        {lead}
        <span className="block text-coral-500">{accent}</span>
      </h2>
      {body ? (
        <p className="mt-5 text-lg leading-relaxed text-neutral-600">{body}</p>
      ) : null}
    </div>
  );
}

export const LandingPageCreative = ({ onStartAuth }: LandingPageCreativeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });

  const [selectedArchetype, setSelectedArchetype] = useState(0);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const setCurrentPage = usePartyStore((s) => s.setCurrentPage);

  /**
   * `useReducedMotion` returns the live value of `prefers-reduced-motion`.
   *
   * It gates the hero video, which is an 8 MB autoplaying MP4. The CSS in
   * `src/index.css` neutralises animation *durations* under the same query,
   * but a `<video autoplay loop>` is not a CSS animation and was unaffected:
   * a visitor who has asked the platform to stop moving things still got a
   * looping video, and paid for it on a metered connection. When reduced
   * motion is requested the poster frame is shown instead and the MP4 is
   * never requested.
   */
  const prefersReducedMotion = useReducedMotion();
  const showVideo = !prefersReducedMotion;

  const videoScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.08]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.35]);

  /** Close the mobile sheet on Escape. Without this the only way out is the
   *  close button, which is a trap for keyboard users who opened it by
   *  accident. */
  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  const goToBlog = () => {
    setMobileNavOpen(false);
    setCurrentPage('party-culture-blog');
  };

  /**
   * Hands the visitor to the auth screen carrying their intent.
   *
   * Note what this does NOT do. The previous version had a second helper that
   * called `setCurrentPage('dashboard')`, which for a signed-out visitor
   * matched no branch in `App.tsx`'s mode effect: `appMode` stayed `'landing'`
   * and the landing page simply re-rendered. Two buttons, "The Curator's
   * Toolkit" in the nav and "Explore Platform" in the closing band, did
   * nothing at all when clicked. Both now route here with
   * `'explore_features'`, which is a real destination.
   */
  const goToAuth = (intent: LandingIntent) => {
    setMobileNavOpen(false);
    setCurrentPage('auth');
    onStartAuth?.(intent);
  };

  const scrollToSection = (sectionId: string) => {
    setMobileNavOpen(false);
    const element = document.getElementById(sectionId);
    if (!element) return;
    element.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const activeArchetype = ARCHETYPES[selectedArchetype];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-neutral-50">
      {/* ---------------------------------------------------------------- */}
      {/* Hero backdrop                                                     */}
      {/* ---------------------------------------------------------------- */}
      <motion.div
        className="fixed inset-0 z-0 h-full w-full"
        style={{ scale: videoScale, opacity: videoOpacity }}
        aria-hidden="true"
      >
        {showVideo ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={HERO_VIDEO_POSTER}
            /*
              object-position is 50% 35%, not the browser default of 50% 50%.
              The source is 1280x720; `object-cover` on a 390x844 phone scales
              it to ~1500px wide and crops three quarters of the frame away. A
              centre crop takes the middle band, which on this footage is the
              floor. Biasing upward keeps faces and the horizon in shot.
            */
            className="h-full w-full object-cover [object-position:50%_35%]"
            style={{ filter: 'brightness(0.62) contrast(1.05) saturate(1.1)' }}
          >
            <source src={HERO_VIDEO_SRC} type="video/mp4" />
          </video>
        ) : (
          <div
            className="h-full w-full bg-neutral-900 bg-cover bg-center"
            style={{
              backgroundImage: `url(${HERO_VIDEO_POSTER})`,
              filter: 'brightness(0.62) contrast(1.05) saturate(1.1)',
            }}
          />
        )}

        {/* Contrast wash, sized so white body text clears 4.5:1 over the
            brightest frame of the footage. */}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/55 via-neutral-950/45 to-neutral-950/75" />
        {/* Brand gradient as a surface tint. Permitted use. */}
        <div
          className="absolute inset-0 opacity-25 mix-blend-overlay"
          style={{ backgroundImage: 'var(--gradient-brand)' }}
        />
      </motion.div>

      {/* ---------------------------------------------------------------- */}
      {/* Navigation                                                        */}
      {/* ---------------------------------------------------------------- */}
      <motion.header
        className="fixed top-0 z-50 w-full border-b border-white/10 bg-neutral-950/40 backdrop-blur-lg"
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <nav
          aria-label="Primary"
          className="container mx-auto flex items-center justify-between gap-4 px-6 py-4"
        >
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' })}
            className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
          >
            <BrandMark tone="onDark" size={32} />
            <span className="text-xl font-bold tracking-tight text-white">PartyHause</span>
          </button>

          {/* Desktop */}
          <div className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <button
                key={link.label}
                type="button"
                onClick={() => scrollToSection(link.id)}
                className="rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              >
                {link.label}
              </button>
            ))}
            <Button
              size="sm"
              className="ml-3 bg-white text-coral-700 hover:bg-white/90"
              onClick={() => goToAuth('explore_features')}
            >
              Sign in
            </Button>
          </div>

          {/* Mobile toggle. The nav links were `hidden md:flex` with no
              alternative, so below 768px the only thing in the header was the
              wordmark and every destination was unreachable. */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 md:hidden"
            aria-expanded={mobileNavOpen}
            aria-controls="landing-mobile-nav"
            aria-label={mobileNavOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>

        {mobileNavOpen ? (
          <motion.div
            id="landing-mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/10 bg-neutral-950/90 backdrop-blur-lg md:hidden"
          >
            <div className="container mx-auto flex flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  className="rounded-md px-3 py-3 text-left text-base font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500"
                >
                  {link.label}
                </button>
              ))}
              <Button
                className="mt-2 w-full bg-white text-coral-700 hover:bg-white/90"
                onClick={() => goToAuth('explore_features')}
              >
                Sign in
              </Button>
            </div>
          </motion.div>
        ) : null}
      </motion.header>

      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-24">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-sm font-semibold uppercase tracking-[0.18em] text-white/70"
          >
            Plan. Party. Perfect.
          </motion.p>

          {/*
            The heading was `text-6xl md:text-8xl` (128px at lg). BRAND.md caps
            display type at 60px and flags the old scale explicitly. This is
            48px to 72px, which still reads as a hero and stops the second line
            wrapping to three on a 390px phone.

            coral-400 rather than coral-500 in the gradient because this text
            sits on a darkened video, not on white. At display size WCAG asks
            for 3:1, and the 400 step clears it against the wash while the 500
            step is marginal.
          */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-5 text-5xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl"
          >
            Throw the party.
            <span className="block bg-gradient-to-r from-coral-400 to-magenta-400 bg-clip-text text-transparent">
              Skip the admin.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-white/85 md:text-xl"
          >
            Guest list, invites, RSVPs, running order and who owes what. PartyHause
            keeps all of it in one place so the night belongs to you too.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-10 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="h-12 bg-coral-700 px-8 text-base text-white hover:bg-coral-800"
              onClick={() => goToAuth('create_event')}
            >
              <CalendarCheck className="mr-2 h-5 w-5" />
              Create your event
            </Button>

            {/* This is what makes the `join_event` branch of AuthScreen
                reachable. Every CTA on the old page defaulted to
                `create_event`, so two thirds of that copy was dead. */}
            <Button
              size="lg"
              variant="outline"
              className="h-12 border-white/40 bg-white/5 px-8 text-base text-white hover:bg-white/15 hover:text-white"
              onClick={() => goToAuth('join_event')}
            >
              <Ticket className="mr-2 h-5 w-5" />
              I have an invite
            </Button>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.6 }}
        >
          <motion.button
            type="button"
            aria-label="Scroll to how it works"
            onClick={() => scrollToSection(SECTION_HOW)}
            animate={prefersReducedMotion ? undefined : { y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="rounded-full p-2 text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <ChevronDown className="h-6 w-6" />
          </motion.button>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Everything below the hero sits on an opaque surface so the fixed  */}
      {/* video cannot show through it.                                     */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative z-10 bg-neutral-50">
        {/* How it works */}
        <section id={SECTION_HOW} className="scroll-mt-20 border-b border-neutral-200 bg-white py-20 md:py-24">
          <div className="container mx-auto px-6">
            <SectionHeading
              lead="Hosting is a logistics problem"
              accent="right up until it isn't"
              body="Most of the work happens in the two weeks nobody sees. PartyHause takes that part."
            />

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
              {PRINCIPLES.map((principle, index) => (
                <motion.article
                  key={principle.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                  className="rounded-lg border border-neutral-200 bg-white p-7 shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_6px_16px_rgb(0_0_0/0.08)]"
                >
                  <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-coral-500">
                    <principle.icon className="h-6 w-6 text-white" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-semibold text-neutral-900">{principle.title}</h3>
                  <p className="mt-3 leading-relaxed text-neutral-600">{principle.body}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        {/* Find your style */}
        <section id={SECTION_STYLE} className="scroll-mt-20 bg-neutral-50 py-20 md:py-24">
          <div className="container mx-auto px-6">
            <SectionHeading
              lead="Four kinds of host"
              accent="Pick the one that stings"
              body="Not a personality test. It changes which templates, checklists and timings we put in front of you first."
            />

            <div className="mx-auto mt-14 max-w-5xl">
              <div className="grid gap-4 sm:grid-cols-2">
                {ARCHETYPES.map((archetype, index) => {
                  const isSelected = selectedArchetype === index;
                  return (
                    <motion.button
                      key={archetype.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => setSelectedArchetype(index)}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                      transition={{ duration: 0.4, delay: index * 0.08 }}
                      viewport={{ once: true, amount: 0.2 }}
                      className={[
                        'rounded-lg border p-7 text-left transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-600 focus-visible:ring-offset-2',
                        isSelected
                          ? 'border-coral-500 bg-white shadow-[0_6px_16px_rgb(0_0_0/0.08)]'
                          : 'border-neutral-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] hover:border-neutral-300',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg transition-colors',
                          isSelected ? 'bg-coral-500' : 'bg-neutral-100',
                        ].join(' ')}
                      >
                        <archetype.icon
                          className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-neutral-500'}`}
                          strokeWidth={2}
                        />
                      </div>
                      <h3 className="text-xl font-semibold text-neutral-900">{archetype.title}</h3>
                      <p className="mt-3 leading-relaxed text-neutral-600">{archetype.description}</p>
                    </motion.button>
                  );
                })}
              </div>

              {/*
                The selection now produces a visible result. Previously the
                only CTA in this section was labelled "Take the Style Quiz"
                and scrolled to the Philosophy section, which sat *above* it
                and was not a quiz: the button moved the reader backwards away
                from the thing it named.
              */}
              <motion.div
                key={activeArchetype.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 rounded-lg border border-neutral-200 bg-white p-7 text-center shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
                aria-live="polite"
              >
                <p className="text-sm font-semibold uppercase tracking-[0.14em] text-coral-700">
                  {activeArchetype.title}
                </p>
                <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-neutral-700">
                  {activeArchetype.signature}
                </p>
                <Button
                  size="lg"
                  className="mt-7 h-12 bg-coral-700 px-8 text-base text-white hover:bg-coral-800"
                  onClick={() => goToAuth('create_event')}
                >
                  Start with this setup
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Party culture */}
        <section id={SECTION_CULTURE} className="scroll-mt-20 border-y border-neutral-200 bg-white py-20 md:py-24">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-2xl text-center">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-coral-50 px-4 py-1.5">
                <BookOpen className="h-4 w-4 text-coral-700" strokeWidth={2} />
                <span className="text-sm font-semibold text-coral-700">Party culture</span>
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-neutral-900 md:text-4xl">
                Notes from people who
                <span className="block text-coral-500">host on purpose</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-neutral-600">
                Short pieces on what actually makes a gathering work. No listicles.
              </p>
            </div>

            <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
              {BLOG_PREVIEWS.map((post, index) => (
                <motion.article
                  key={post.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04)] transition-shadow hover:shadow-[0_6px_16px_rgb(0_0_0/0.08)]"
                >
                  {/*
                    A gradient panel, not an <img>. Each preview used to carry
                    an `image` path (/images/blog-*.jpg); none of the three
                    files exist, and the component never read the field, so it
                    was three lines of data describing nothing. The field is
                    gone rather than pointed at a stock photo.
                  */}
                  <div
                    className="relative aspect-[16/9] w-full"
                    style={{ backgroundImage: 'var(--gradient-brand)' }}
                    aria-hidden="true"
                  >
                    <div className="absolute inset-0 bg-neutral-950/10" />
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-coral-700">
                      {post.category}
                    </span>
                    <h3 className="mt-3 text-lg font-semibold leading-snug text-neutral-900">
                      {post.title}
                    </h3>
                    <p className="mt-2 flex-1 leading-relaxed text-neutral-600">{post.excerpt}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-neutral-100 pt-4">
                      <span className="text-sm text-neutral-500">{post.readTime}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-coral-700 hover:bg-coral-50 hover:text-coral-800"
                        onClick={goToBlog}
                      >
                        Read
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Button
                variant="outline"
                size="lg"
                className="h-12 border-neutral-300 px-8 text-base text-neutral-800 hover:bg-neutral-50"
                onClick={goToBlog}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Read every article
              </Button>
            </div>
          </div>
        </section>

        {/* Closing band. The brand gradient as a surface, which BRAND.md
            permits; the buttons on it are solid, which is the part it does
            not permit to be gradient. */}
        <section
          className="py-20 text-white md:py-24"
          style={{ backgroundImage: 'var(--gradient-brand)' }}
        >
          <div className="container mx-auto px-6">
            <motion.div
              className="mx-auto max-w-2xl text-center"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
                Your next one is already
                <span className="block">further along than you think</span>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-white/90">
                Set the date, paste the guest list, send the invites. The rest of the
                plan builds itself around those three things.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  className="h-12 bg-white px-8 text-base text-coral-700 hover:bg-white/90"
                  onClick={() => goToAuth('create_event')}
                >
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Create your event
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/50 bg-transparent px-8 text-base text-white hover:bg-white/15 hover:text-white"
                  onClick={() => goToAuth('explore_features')}
                >
                  Look around first
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/* Footer                                                            */}
        {/*                                                                   */}
        {/* There was no footer at all. public/privacy.html, terms.html and    */}
        {/* support.html are built, served by nginx with their own cache       */}
        {/* rules, and were reachable only by typing the URL.                  */}
        {/* ---------------------------------------------------------------- */}
        <footer className="border-t border-neutral-200 bg-white">
          <div className="container mx-auto px-6 py-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
              <div className="max-w-sm">
                <div className="flex items-center gap-2.5">
                  <BrandMark tone="onLight" size={28} />
                  <span className="text-lg font-bold tracking-tight text-neutral-900">
                    PartyHause
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Plan. Party. Perfect. Everything a gathering needs, from the first
                  invite to the last thank you.
                </p>
              </div>

              <nav aria-label="Footer" className="flex flex-wrap gap-x-8 gap-y-3">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.label}
                    type="button"
                    onClick={() => scrollToSection(link.id)}
                    className="rounded text-sm font-medium text-neutral-600 transition-colors hover:text-coral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-600 focus-visible:ring-offset-2"
                  >
                    {link.label}
                  </button>
                ))}
                {FOOTER_LEGAL.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    className="rounded text-sm font-medium text-neutral-600 transition-colors hover:text-coral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-600 focus-visible:ring-offset-2"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>
            </div>

            <p className="mt-10 border-t border-neutral-100 pt-6 text-sm text-neutral-500">
              &copy; {new Date().getFullYear()} PartyHause. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPageCreative;
