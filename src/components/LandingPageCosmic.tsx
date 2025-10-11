import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Sparkles, 
  Calendar, 
  Users, 
  Gamepad2, 
  Camera, 
  Music, 
  QrCode,
  ArrowRight,
  Star,
  Trophy,
  Heart,
  Zap,
  Play,
  ChevronDown
} from 'lucide-react';
import { usePartyStore } from '@/store/usePartyStore';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

export const LandingPageCosmic = ({ onGetStarted, onSignIn }: LandingPageProps) => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, -50]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);

  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Calendar,
      title: "Smart Event Planning",
      description: "AI-powered planning with guest management, real-time updates, and seamless coordination",
      color: "electric-purple",
      benefits: ["Automated guest lists", "QR code check-ins", "Real-time notifications", "Smart scheduling"]
    },
    {
      icon: Gamepad2,
      title: "Interactive Gaming Platform", 
      description: "30+ engaging games including trivia, icebreakers, AR experiences, and social challenges",
      color: "electric-magenta",
      benefits: ["Trivia battles", "AR mystery hunts", "Photo challenges", "Team competitions"]
    },
    {
      icon: Camera,
      title: "Memory Creation System",
      description: "Automatic photo organization, reel creation, and lasting friendship connections",
      color: "electric-gold",
      benefits: ["Smart photo tagging", "Auto-generated reels", "Friend networks", "Memory timelines"]
    }
  ];

  const stats = [
    { value: "10K+", label: "Events Created" },
    { value: "50K+", label: "Happy Guests" },
    { value: "30+", label: "Interactive Games" },
    { value: "95%", label: "User Satisfaction" }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Birthday Party Host",
      content: "PartyHaus turned my daughter's birthday into an unforgettable adventure. The AR treasure hunt had all the kids completely engaged!",
      rating: 5,
      image: "/api/placeholder/64/64"
    },
    {
      name: "Marcus Johnson", 
      role: "Corporate Event Manager",
      content: "The team-building games were a hit at our company retreat. Everyone was laughing and connecting in ways I never expected.",
      rating: 5,
      image: "/api/placeholder/64/64"
    },
    {
      name: "Emily Rodriguez",
      role: "Wedding Coordinator",
      content: "The guest management and check-in system saved us hours of work. Plus, the automatic photo compilation was absolutely magical.",
      rating: 5,
      image: "/api/placeholder/64/64"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-cosmic-deep">
      {/* Hero Section */}
      <section className="hero-cosmic relative overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div 
          style={{ y: y1 }}
          className="absolute inset-0 opacity-30"
        >
          <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-gradient-to-r from-electric-purple to-electric-magenta blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-32 w-24 h-24 rounded-full bg-gradient-to-r from-electric-cyan to-electric-gold blur-2xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 left-1/4 w-40 h-40 rounded-full bg-gradient-to-r from-electric-gold to-electric-magenta blur-3xl animate-pulse delay-2000"></div>
        </motion.div>

        <motion.div 
          style={{ y: y2, opacity }}
          className="hero-content relative z-10"
        >
          {/* Logo and Branding */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              className="inline-flex items-center justify-center mb-6"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Sparkles className="h-12 w-12 mr-4 text-electric-gold animate-pulse" />
              <h1 className="logo-cosmic text-6xl md:text-8xl lg:text-9xl font-bold">
                PartyHaus
              </h1>
              <Sparkles className="h-12 w-12 ml-4 text-electric-magenta animate-pulse delay-500" />
            </motion.div>
            
            <motion.p 
              className="text-2xl md:text-3xl lg:text-4xl font-light text-cosmic-secondary mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Where Every Event Becomes Unforgettable
            </motion.p>
            
            <motion.p 
              className="text-lg md:text-xl text-cosmic-secondary max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              The premium event platform combining smart planning, interactive gaming, 
              and magical memory creation for celebrations that bring people together.
            </motion.p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.0 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
          >
            <Button
              onClick={onGetStarted}
              className="btn-cosmic-primary text-lg px-8 py-4 group"
              size="lg"
            >
              Start Planning Your Event
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button
              variant="outline"
              className="text-lg px-8 py-4 border-electric-cyan text-electric-cyan hover:bg-electric-cyan hover:text-cosmic-deep transition-all duration-300"
              size="lg"
            >
              <Play className="mr-2 h-5 w-5" />
              See How It Works
            </Button>
          </motion.div>

          {/* Social Proof Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                className="text-center"
                whileHover={{ scale: 1.05 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.1 }}
              >
                <div className="text-3xl md:text-4xl font-bold text-electric-gold mb-2">
                  {stat.value}
                </div>
                <div className="text-cosmic-secondary text-sm md:text-base">
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="h-8 w-8 text-electric-purple" />
        </motion.div>
      </section>

      {/* Features Showcase */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
              Everything You Need for Perfect Events
            </h2>
            <p className="text-xl text-cosmic-secondary max-w-3xl mx-auto">
              From intimate gatherings to grand celebrations, PartyHaus provides 
              the tools and experiences that make every moment magical.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="card-cosmic h-full border-electric-purple/20 hover:border-electric-gold/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-electric-purple to-electric-magenta mb-6 group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-cosmic-primary mb-4">
                      {feature.title}
                    </h3>
                    
                    <p className="text-cosmic-secondary mb-6 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center text-cosmic-secondary">
                          <Star className="h-4 w-4 text-electric-gold mr-3 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 px-4 bg-cosmic-medium">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
              See PartyHaus in Action
            </h2>
            <p className="text-xl text-cosmic-secondary max-w-3xl mx-auto">
              Experience the magic of seamless event management and interactive entertainment.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Demo Video/Preview */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-video bg-gradient-to-br from-electric-purple to-electric-magenta rounded-2xl p-1">
                <div className="w-full h-full bg-cosmic-deep rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <Play className="h-16 w-16 text-electric-gold mx-auto mb-4" />
                    <p className="text-cosmic-secondary">Interactive Demo Coming Soon</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Feature Highlights */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {[
                { icon: QrCode, title: "Instant Check-ins", desc: "QR code guest management" },
                { icon: Gamepad2, title: "Live Gaming", desc: "Real-time multiplayer experiences" },
                { icon: Camera, title: "Memory Magic", desc: "Automatic photo organization" },
                { icon: Music, title: "Spotify Integration", desc: "Seamless playlist management" }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-4 p-4 rounded-xl bg-cosmic-light/50 hover:bg-cosmic-light transition-colors"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-electric-cyan to-electric-purple flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-cosmic-primary">{item.title}</h4>
                    <p className="text-cosmic-secondary">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gradient mb-6">
              Loved by Event Creators
            </h2>
            <p className="text-xl text-cosmic-secondary">
              Join thousands who've made their events unforgettable
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                whileHover={{ y: -5 }}
              >
                <Card className="card-cosmic h-full">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-electric-gold fill-current" />
                      ))}
                    </div>
                    
                    <p className="text-cosmic-secondary mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    
                    <div className="flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-electric-purple to-electric-magenta mr-4"></div>
                      <div>
                        <h4 className="font-semibold text-cosmic-primary">{testimonial.name}</h4>
                        <p className="text-cosmic-secondary text-sm">{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-electric-purple via-electric-magenta to-electric-gold">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Ready to Create Magic?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join the PartyHaus community and transform your next event into an 
              unforgettable experience that brings people together.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={onGetStarted}
                className="bg-white text-electric-purple hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
                size="lg"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Your Free Event
              </Button>
              
              <Button
                onClick={onSignIn}
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-electric-purple text-lg px-8 py-4"
                size="lg"
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};