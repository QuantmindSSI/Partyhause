import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePartyStore } from '@/store/usePartyStore';
import { 
  Calendar, 
  Sparkles, 
  ArrowRight, 
  Play,
  Heart,
  Wand2,
  Lightbulb,
  Coffee,
  BookOpen,
  ChevronDown
} from 'lucide-react';

type LandingIntent = 'create_event' | 'join_event' | 'explore_features';

type LandingPageCreativeProps = {
  onStartAuth?: (intent: LandingIntent) => void;
};

const videoSources = [
  {
    src: '/videos/Video_concept_lively_202509130901.mp4',
    poster: '/images/video-poster-1.jpg',
    type: 'video/mp4'
  }
];

export const LandingPageCreative = ({ onStartAuth }: LandingPageCreativeProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  const [currentArchetype, setCurrentArchetype] = useState(0);
  
  // Store access
  const { setCurrentPage } = usePartyStore();
  
  // Navigation handlers
  const navigateToBlog = () => {
    setCurrentPage('party-culture-blog');
  };
  
  const navigateToApp = () => {
    setCurrentPage('dashboard');
  };
  
  const navigateToAuth = (intent: LandingIntent = 'create_event') => {
    setCurrentPage('auth');
    onStartAuth?.(intent);
  };
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  // Video background parallax effect
  const videoScale = useTransform(scrollYProgress, [0, 0.3], [1, 1.1]);
  const videoOpacity = useTransform(scrollYProgress, [0, 0.5], [0.8, 0.3]);
  
  const experienceArchetypes = [
    {
      title: "The Intimate Curator",
      description: "You create meaningful moments through thoughtful details and personal connections.",
      icon: Heart,
      color: "from-rose-400 to-orange-400"
    },
    {
      title: "The Bold Creator", 
      description: "You transform spaces and experiences with innovative ideas and creative energy.",
      icon: Wand2,
      color: "from-purple-400 to-pink-400"
    },
    {
      title: "The Mindful Host",
      description: "You believe in quality over quantity, creating authentic experiences that nourish the soul.",
      icon: Lightbulb,
      color: "from-emerald-400 to-teal-400"
    },
    {
      title: "The Culture Catalyst",
      description: "You bring people together across communities, creating bridges through shared celebration.",
      icon: Coffee,
      color: "from-amber-400 to-orange-400"
    }
  ];

  const blogPreviews = [
    {
      title: "The Art of Micro-Moments",
      excerpt: "How to transform ordinary Tuesday dinners into memory-making experiences",
      category: "Experience Design",
      readTime: "4 min read",
      image: "/images/blog-micro-moments.jpg"
    },
    {
      title: "Cultural Celebration Trends 2025",
      excerpt: "Global inspiration for creating authentic, meaningful gatherings",
      category: "Culture",
      readTime: "7 min read", 
      image: "/images/blog-culture-trends.jpg"
    },
    {
      title: "The Psychology of Perfect Timing",
      excerpt: "Understanding rhythm and flow in experience design",
      category: "Mindful Celebration",
      readTime: "5 min read",
      image: "/images/blog-psychology.jpg"
    }
  ];

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-hidden">
      {/* Video Background */}
      <motion.div 
        className="fixed inset-0 w-full h-full z-0"
        style={{ scale: videoScale, opacity: videoOpacity }}
      >
        {/*
          object-position is 50% 35%, not the browser default of 50% 50%.

          The source is 1280x720. `object-cover` on a phone in portrait, say
          390x844, has to scale it to cover 844px of height, which renders it
          ~1500px wide and crops away roughly three quarters of the frame. A
          centre crop takes the middle band, which on this footage is the floor.
          Biasing upward keeps faces and the horizon in frame instead.
        */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          className="w-full h-full object-cover [object-position:50%_35%]"
          poster="/images/video-poster-1.jpg"
          style={{
            filter: 'brightness(0.7) contrast(1.1) saturate(1.2)',
          }}
        >
          {videoSources.map((source, index) => (
            <source key={index} src={source.src} type={source.type} />
          ))}
        </video>

        {/*
          Two overlays, not three. The stack used to be a b/30-50-70 wash, a
          horizontal orange/purple tint, and a second bottom-up black/60, then
          the hero section added its own black/20 with a backdrop-blur on top.
          Five layers over a video already at brightness(0.7) left roughly 28%
          of the original luminance: the footage was paid for and then hidden.

          What remains is one vertical wash sized for text contrast, and the
          brand gradient at low opacity carrying coral to magenta rather than
          the orange/purple that matched nothing in the palette.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/65" />
        <div
          className="absolute inset-0 opacity-20 mix-blend-overlay"
          style={{ backgroundImage: 'var(--gradient-brand)' }}
        />
        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-10" 
             style={{
               backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
               mixBlendMode: 'multiply'
             }}
        />
      </motion.div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 w-full z-50 backdrop-blur-lg bg-black/20 border-b border-white/10"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div 
              className="text-2xl font-bold text-white"
              whileHover={{ scale: 1.05 }}
            >
              PartyHause
            </motion.div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('experience-archetypes')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Curate My Experience
              </button>
              <button 
                onClick={navigateToBlog}
                className="text-white/80 hover:text-white transition-colors"
              >
                Party Culture
              </button>
              <button 
                onClick={() => scrollToSection('philosophy')}
                className="text-white/80 hover:text-white transition-colors"
              >
                Experience Gallery
              </button>
              <Button 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={navigateToApp}
              >
                The Curator's Toolkit
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center">
        {/*
          The fifth overlay layer used to live here: bg-black/20 with a
          backdrop-blur-sm across the whole section. It was removed for two
          reasons. It was redundant once the wash above was sized for contrast,
          and backdrop-blur over a playing video forces the compositor to
          re-blur every frame across the full viewport, which is the most
          expensive thing on this page and buys nothing legibility already has.
        */}
        
        <div className="container mx-auto px-6 text-center relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              className="mb-8"
            >
              {/*
                The brand gradient, coral-400 to magenta-400, replacing
                `from-orange-400 to-pink-400`. The old pair was Tailwind's stock
                palette and matched nothing in docs/BRAND.md.

                The 400 steps rather than the specified 500s because this text
                sits on a darkened video, not on white. At display size WCAG
                needs 3:1, and coral-400 clears it against the wash while
                coral-500 is marginal. The 500 pair remains correct wherever the
                gradient is a surface rather than type.
              */}
              <h1 className="text-6xl md:text-8xl font-light text-white mb-6 leading-tight drop-shadow-2xl">
                Your Personal
                <span className="block bg-gradient-to-r from-coral-400 to-magenta-400 bg-clip-text text-transparent font-bold">
                  Experience Curator
                </span>
              </h1>
            </motion.div>

            <motion.p 
              className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed drop-shadow-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              We don't just plan events—we curate experiences that transform 
              ordinary moments into extraordinary memories.
            </motion.p>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.5 }}
            >
              <Button 
                size="lg" 
                className="btn-floating text-lg px-8 py-4 h-auto"
                onClick={() => navigateToAuth()}
              >
                <Sparkles className="w-5 h-5 mr-2" />
                Create Your Event
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 h-auto"
                onClick={() => scrollToSection('experience-archetypes')}
              >
                <Play className="w-5 h-5 mr-2" />
                Discover Your Style
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/*
          Scroll indicator, moved out of the container and anchored to the
          section.

          It previously sat inside `container mx-auto ... relative z-20`, whose
          only positioned ancestor is itself. That container is a flex child
          under `items-center`, so it is content-height, not section-height.
          `bottom-8` therefore measured eight units from the bottom of the text
          block, parking the chevron just under the buttons in the middle of the
          viewport rather than at the foot of the hero.

          The section is `relative min-h-screen`, so anchoring here puts it
          where it was always meant to be, at every viewport height.
        */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <motion.button
            type="button"
            aria-label="Scroll to next section"
            onClick={() => scrollToSection('experience-archetypes')}
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-white/60 hover:text-white transition-colors cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          >
            <ChevronDown className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </section>

      {/* Content Sections */}
      <div className="relative z-10 bg-white">
        {/* Philosophy Section */}
        <section id="philosophy" className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-6">
            <motion.div 
              className="max-w-4xl mx-auto text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-8">
                The Philosophy of
                <span className="block text-orange-500 font-bold">Conscious Celebration</span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-12 leading-relaxed">
                In a world that moves too fast, we believe in the power of intentional gathering. 
                Every celebration is an opportunity to strengthen bonds, create meaning, and 
                honor the moments that make life beautiful.
              </p>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  {
                    icon: Heart,
                    title: "Human Connection",
                    description: "Technology that brings people closer, not further apart"
                  },
                  {
                    icon: Wand2,
                    title: "Effortless Elegance", 
                    description: "Sophisticated experiences without the stress and overwhelm"
                  },
                  {
                    icon: Lightbulb,
                    title: "Mindful Moments",
                    description: "Quality over quantity in every interaction and detail"
                  }
                ].map((principle, index) => (
                  <motion.div
                    key={index}
                    className="modern-card p-8 text-center hover-lift"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.2 }}
                    viewport={{ once: true }}
                  >
                    <div className="icon-button-3d bg-orange-500 w-16 h-16 mx-auto mb-6">
                      <principle.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{principle.title}</h3>
                    <p className="text-gray-600">{principle.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Experience Archetypes */}
        <section id="experience-archetypes" className="py-20 bg-white">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
                Discover Your
                <span className="block text-orange-500 font-bold">Celebration Archetype</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Every host has a unique style. Understanding yours helps us curate 
                the perfect experience for your personality and vision.
              </p>
            </motion.div>

            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {experienceArchetypes.map((archetype, index) => (
                  <motion.div
                    key={index}
                    className={`modern-card p-8 cursor-pointer transition-all duration-300 ${
                      currentArchetype === index ? 'card-elevated' : 'hover-lift'
                    }`}
                    onClick={() => setCurrentArchetype(index)}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    viewport={{ once: true }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${archetype.color} flex items-center justify-center mb-6`}>
                      <archetype.icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">
                      {archetype.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {archetype.description}
                    </p>
                  </motion.div>
                ))}
              </div>

              <motion.div 
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
              >
                <Button 
                  className="btn-floating" 
                  size="lg"
                  onClick={() => scrollToSection('philosophy')}
                >
                  <Wand2 className="w-5 h-5 mr-2" />
                  Take the Style Quiz
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Party Culture Blog */}
        <section id="culture" className="py-20 bg-gradient-to-b from-orange-50 to-white">
          <div className="container mx-auto px-6">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-center mb-6">
                <BookOpen className="w-8 h-8 text-orange-500 mr-3" />
                <span className="text-orange-500 font-semibold text-lg">Party Culture Blog</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-light text-gray-900 mb-6">
                Inspiration for
                <span className="block text-orange-500 font-bold">Conscious Celebration</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Explore the art and science of meaningful gathering through our 
                curated insights on celebration culture, design, and human connection.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {blogPreviews.map((post, index) => (
                <motion.article
                  key={index}
                  className="modern-card overflow-hidden hover-lift cursor-pointer"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -8 }}
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-orange-200 to-pink-200 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-400/20" />
                    <div className="absolute top-4 left-4">
                      <span className="text-xs font-semibold text-orange-600 bg-white/90 px-2 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{post.readTime}</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-orange-500 hover:text-orange-600"
                        onClick={navigateToBlog}
                      >
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>

            <motion.div 
              className="text-center mt-12"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <Button 
                className="btn-floating" 
                size="lg"
                onClick={navigateToBlog}
              >
                <BookOpen className="w-5 h-5 mr-2" />
                Explore All Articles
              </Button>
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-light mb-6">
                Ready to Curate Your
                <span className="block font-bold">Next Experience?</span>
              </h2>
              
              <p className="text-xl mb-12 opacity-90">
                Join thousands of conscious celebrators who have transformed 
                their approach to gathering and connection.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-orange-500 hover:bg-gray-100 text-lg px-8 py-4 h-auto"
                  onClick={() => navigateToAuth()}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Start Creating Event
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 h-auto"
                  onClick={navigateToApp}
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Explore Platform
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPageCreative;