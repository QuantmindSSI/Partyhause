import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Users, 
  BarChart2, 
  PlayCircle, 
  ArrowRight,
  Star,
  Twitter,
  Instagram,
  Facebook,
  Linkedin,
  CheckCircle,
  Zap,
  Heart,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface LandingPageSoftProps {
  onGetStarted: () => void;
  onSignIn: () => void;
}

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const floatingAnimation = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
};

export function LandingPageSoft({ onGetStarted, onSignIn }: LandingPageSoftProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Navigation */}
      <motion.nav 
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' 
            : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <motion.span 
                className="text-2xl font-bold text-orange-500"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                PartyHaus
              </motion.span>
            </div>
            
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">About</a>
              <a href="#contact" className="text-gray-600 hover:text-orange-500 transition-colors font-medium">Contact</a>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={onSignIn}
                className="text-gray-600 hover:text-orange-500 font-medium"
              >
                Log In
              </Button>
              <Button
                onClick={onGetStarted}
                className="btn-floating text-white font-semibold px-6"
              >
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-24 pb-20 md:pt-32 md:pb-32">
        <div className="container mx-auto px-6">
          <motion.div
            className="flex flex-col items-center text-center"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl leading-tight"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <span className="text-orange-500">Where Every Event</span>
              <br />
              Becomes Unforgettable
            </motion.h1>
            
            <motion.p 
              className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              The ultimate platform for creating, managing, and celebrating events that leave lasting impressions.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button
                onClick={onGetStarted}
                size="lg"
                className="btn-floating text-white font-bold px-8 py-4 text-lg"
              >
                Get Started - It's Free
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="btn-soft-secondary font-bold px-8 py-4 text-lg flex items-center gap-2"
              >
                <PlayCircle className="w-5 h-5" />
                Watch Demo
              </Button>
            </motion.div>

            {/* Floating Feature Pills */}
            <motion.div 
              className="flex flex-wrap justify-center gap-4 mt-12"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {[
                { icon: CheckCircle, text: "Free to start" },
                { icon: Zap, text: "Setup in minutes" },
                { icon: Heart, text: "Loved by 10k+ hosts" }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-soft border border-gray-100"
                  variants={floatingAnimation}
                  transition={{ delay: index * 0.2 }}
                >
                  <item.icon className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">{item.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to host amazing events
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              From planning to execution, PartyHaus provides all the tools you need to create memorable experiences.
            </p>
          </motion.div>

          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                icon: Calendar,
                title: "Effortless Planning",
                description: "Create stunning events in minutes with our intuitive wizard and customizable templates.",
                color: "text-orange-500",
                bgColor: "bg-orange-500"
              },
              {
                icon: Users,
                title: "Smart Guest Management",
                description: "Track RSVPs, send reminders, and check-in guests seamlessly with our intelligent tools.",
                color: "text-blue-500",
                bgColor: "bg-blue-500"
              },
              {
                icon: BarChart2,
                title: "Real-time Analytics",
                description: "Gain insights into guest engagement and event performance with beautiful dashboards.",
                color: "text-green-500",
                bgColor: "bg-green-500"
              }
            ].map((feature, index) => (
              <motion.div key={index} variants={fadeInUp} transition={{ duration: 0.6, delay: index * 0.1 }}>
                <Card className="modern-card p-8 h-full group">
                  <div className={`icon-button-3d ${feature.bgColor} mb-6`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-orange-600 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <button className={`${feature.color} hover:text-opacity-80 flex items-center gap-2 font-medium transition-all group-hover:gap-3`}>
                    Learn more 
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="modern-card p-12 text-center max-w-4xl mx-auto">
              <div className="flex justify-center mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                ))}
              </div>
              
              <blockquote className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
                "PartyHaus transformed how we organize corporate events. What used to take days now takes hours, and our guests are consistently impressed with the professional experience."
              </blockquote>
              
              <div className="flex items-center justify-center gap-4">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b29c?w=100&h=100&fit=crop&crop=face" 
                  alt="Sarah Johnson" 
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="text-left">
                  <div className="font-bold text-gray-900">Sarah Johnson</div>
                  <div className="text-gray-600 text-sm">Event Director, TechCorp</div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                variants={floatingAnimation}
                animate="animate"
              >
                <Sparkles className="w-12 h-12 text-orange-500" />
              </motion.div>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
              Ready to Elevate Your Events?
            </h2>
            
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join thousands of hosts who are creating unforgettable experiences with PartyHaus.
            </p>
            
            <Button
              onClick={onGetStarted}
              size="lg"
              className="btn-floating text-white font-bold px-10 py-4 text-lg"
            >
              Start Your Free Trial
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold text-orange-500 mb-4">PartyHaus</h3>
              <p className="text-gray-600 leading-relaxed">
                The premium platform for event creators who demand excellence.
              </p>
            </div>
            
            {[
              {
                title: "Product",
                links: ["Features", "Pricing", "Templates", "Integrations"]
              },
              {
                title: "Resources", 
                links: ["Blog", "Guides", "Support", "API"]
              },
              {
                title: "Company",
                links: ["About", "Careers", "Contact", "Legal"]
              }
            ].map((section, index) => (
              <div key={index}>
                <h4 className="font-bold text-gray-900 mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="border-t border-gray-200 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm mb-4 md:mb-0">
              © 2024 PartyHaus. All rights reserved.
            </p>
            <div className="flex space-x-6">
              {[Twitter, Instagram, Facebook, Linkedin].map((Icon, index) => (
                <a 
                  key={index}
                  href="#" 
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}