import { motion } from 'framer-motion';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Calendar,
  Clock,
  Heart,
  Share2,
  Filter,
  Search,
  Sparkles,
  Coffee,
  Lightbulb,
  Users,
  Camera,
  Globe,
  ArrowRight,
  Star
} from 'lucide-react';

const categories = [
  { id: 'all', name: 'All Stories', icon: BookOpen, count: 47 },
  { id: 'experience-design', name: 'Experience Design', icon: Sparkles, count: 12 },
  { id: 'culture', name: 'Celebration Culture', icon: Globe, count: 15 },
  { id: 'mindful', name: 'Mindful Celebration', icon: Heart, count: 8 },
  { id: 'curation', name: 'Curation Guides', icon: Lightbulb, count: 12 }
];

const featuredArticles = [
  {
    id: 1,
    title: "The Art of Micro-Moments: Transforming Everyday Gatherings",
    excerpt: "Discover how the smallest details can create the most profound connections. From Tuesday night dinners to impromptu coffee dates, learn the curator's approach to making every moment meaningful.",
    category: "Experience Design",
    readTime: "8 min read",
    publishDate: "2025-09-10",
    author: {
      name: "Sofia Chen",
      title: "Chief Experience Curator",
      avatar: "/avatars/sofia.jpg"
    },
    featured: true,
    image: "/blog/micro-moments-hero.jpg",
    tags: ["Intimate Gatherings", "Daily Rituals", "Connection"]
  },
  {
    id: 2,
    title: "Global Celebration Traditions: Lessons in Authentic Joy",
    excerpt: "A journey through celebration cultures worldwide, exploring how different communities create meaning through gathering. From Japanese tea ceremonies to Brazilian street festivals.",
    category: "Celebration Culture",
    readTime: "12 min read",
    publishDate: "2025-09-08",
    author: {
      name: "Marcus Thompson",
      title: "Cultural Anthropologist",
      avatar: "/avatars/marcus.jpg"
    },
    featured: true,
    image: "/blog/global-traditions.jpg",
    tags: ["Cultural Wisdom", "Traditions", "Global Perspective"]
  },
  {
    id: 3,
    title: "The Psychology of Perfect Timing in Experience Design",
    excerpt: "Understanding the neuroscience of memorable moments. How timing, rhythm, and flow create experiences that resonate long after the gathering ends.",
    category: "Experience Design",
    readTime: "10 min read",
    publishDate: "2025-09-05",
    author: {
      name: "Dr. Elena Rodriguez",
      title: "Experience Psychologist",
      avatar: "/avatars/elena.jpg"
    },
    featured: false,
    image: "/blog/psychology-timing.jpg",
    tags: ["Psychology", "Timing", "Memory Creation"]
  }
];

const regularArticles = [
  {
    id: 4,
    title: "Sustainable Celebrations: Conscious Party Planning",
    excerpt: "Creating beautiful experiences while honoring our planet. Practical tips for eco-friendly celebrations that don't compromise on magic.",
    category: "Mindful Celebration",
    readTime: "6 min read",
    publishDate: "2025-09-03",
    author: {
      name: "Green Party Collective",
      title: "Sustainability Experts",
      avatar: "/avatars/green-collective.jpg"
    },
    image: "/blog/sustainable-parties.jpg",
    tags: ["Sustainability", "Eco-Friendly", "Conscious Living"]
  },
  {
    id: 5,
    title: "Digital Detox Events: Creating Unplugged Experiences",
    excerpt: "In our hyper-connected world, learn how to design gatherings that encourage genuine presence and authentic connection.",
    category: "Mindful Celebration",
    readTime: "7 min read",
    publishDate: "2025-09-01",
    author: {
      name: "Maya Patel",
      title: "Mindfulness Coach",
      avatar: "/avatars/maya.jpg"
    },
    image: "/blog/digital-detox.jpg",
    tags: ["Digital Wellness", "Presence", "Authentic Connection"]
  },
  {
    id: 6,
    title: "Seasonal Celebration Calendar: Year-Round Inspiration",
    excerpt: "A curator's guide to celebrating the natural rhythm of seasons, from intimate winter gatherings to vibrant summer celebrations.",
    category: "Curation Guides",
    readTime: "15 min read",
    publishDate: "2025-08-28",
    author: {
      name: "The PartyHaus Collective",
      title: "Experience Curators",
      avatar: "/avatars/collective.jpg"
    },
    image: "/blog/seasonal-calendar.jpg",
    tags: ["Seasonal", "Planning", "Inspiration"]
  }
];

export const PartyCultureBlog = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.section 
        className="py-20 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="flex items-center justify-center mb-8"
              variants={itemVariants}
            >
              <div className="icon-button-3d bg-orange-500 w-16 h-16 mr-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <div className="text-left">
                <h1 className="text-5xl md:text-6xl font-light text-gray-900">
                  Party <span className="text-orange-500 font-bold">Culture</span>
                </h1>
                <p className="text-lg text-gray-600">Insights for Conscious Celebration</p>
              </div>
            </motion.div>

            <motion.p 
              className="text-xl text-gray-600 mb-12 leading-relaxed max-w-2xl mx-auto"
              variants={itemVariants}
            >
              Explore the art and science of meaningful gathering. From cultural traditions 
              to cutting-edge experience design, discover what makes celebrations truly memorable.
            </motion.p>

            {/* Search & Filter */}
            <motion.div 
              className="flex flex-col md:flex-row gap-4 justify-center items-center mb-8"
              variants={itemVariants}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-soft pl-10 pr-4 py-3 w-80"
                />
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className={selectedCategory === category.id ? "btn-floating" : ""}
                  >
                    <category.icon className="w-4 h-4 mr-2" />
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Featured Articles */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <div className="flex items-center mb-8">
              <Star className="w-6 h-6 text-orange-500 mr-3" />
              <h2 className="text-3xl font-bold text-gray-900">Featured Stories</h2>
            </div>

            {/* Hero Featured Article */}
            <motion.article 
              className="modern-card overflow-hidden mb-8 hover-lift"
              whileHover={{ y: -4 }}
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="aspect-[4/3] bg-gradient-to-br from-orange-200 to-pink-200 relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-400/20" />
                  <div className="absolute top-6 left-6">
                    <Badge className="bg-orange-500 text-white">Featured</Badge>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-4 mb-4">
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {featuredArticles[0].category}
                    </Badge>
                    <div className="flex items-center text-gray-500 text-sm">
                      <Clock className="w-4 h-4 mr-1" />
                      {featuredArticles[0].readTime}
                    </div>
                  </div>

                  <h2 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                    {featuredArticles[0].title}
                  </h2>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {featuredArticles[0].excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-orange-400 to-pink-400 rounded-full mr-3"></div>
                      <div>
                        <p className="font-semibold text-gray-900">{featuredArticles[0].author.name}</p>
                        <p className="text-sm text-gray-500">{featuredArticles[0].author.title}</p>
                      </div>
                    </div>
                    
                    <Button className="btn-floating">
                      Read Article <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              </div>
            </motion.article>

            {/* Secondary Featured Articles */}
            <div className="grid md:grid-cols-2 gap-8">
              {featuredArticles.slice(1).map((article, index) => (
                <motion.article
                  key={article.id}
                  className="modern-card overflow-hidden hover-lift"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-purple-200 to-blue-200 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="outline" className="text-purple-600 border-purple-200">
                        {article.category}
                      </Badge>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full mr-2"></div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{article.author.name}</p>
                        </div>
                      </div>
                      
                      <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600">
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Regular Articles Grid */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Latest Insights</h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {regularArticles.map((article, index) => (
                <motion.article
                  key={article.id}
                  className="modern-card overflow-hidden hover-lift bg-white"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -4 }}
                >
                  <div className="aspect-[16/9] bg-gradient-to-br from-green-200 to-teal-200 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 to-teal-400/20" />
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-center gap-4 mb-3">
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {article.category}
                      </Badge>
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="w-4 h-4 mr-1" />
                        {article.readTime}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2">
                      {article.title}
                    </h3>
                    
                    <p className="text-gray-600 mb-4 line-clamp-3 text-sm">
                      {article.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-teal-400 rounded-full mr-2"></div>
                        <p className="text-xs text-gray-500">{article.author.name}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 p-2">
                          <Heart className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-600 p-2">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
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
              <Button className="btn-floating" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Load More Articles
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Newsletter Signup */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">
              Get Curation Insights
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Weekly inspiration and practical tips for conscious celebration, 
              delivered to your inbox every Tuesday.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500"
              />
              <Button 
                variant="secondary"
                className="bg-white text-orange-500 hover:bg-gray-100 whitespace-nowrap"
              >
                Subscribe
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default PartyCultureBlog;