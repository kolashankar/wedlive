'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Video, Sparkles, Users, PlayCircle, Calendar, Heart, ArrowRight, CheckCircle, Star } from 'lucide-react';

// Sapthapadhi Section Component
function SapthapadhiSection() {
  const [currentStep, setCurrentStep] = useState(0);
  const sectionRef = useRef(null);

  const sapthapadhiSteps = [
    {
      number: 1,
      title: "Nourishment & Provision",
      vow: "Together we shall provide for our family",
      meaning: "The first step is a promise to provide for the family's needs and welfare, ensuring sustenance and prosperity.",
      icon: "🍽️"
    },
    {
      number: 2,
      title: "Strength & Well-being",
      vow: "Together we shall develop physical, mental and spiritual strength",
      meaning: "Commitment to physical and mental health, offering courage and support to each other in all circumstances.",
      icon: "💪"
    },
    {
      number: 3,
      title: "Prosperity & Wealth",
      vow: "Together we shall work towards increasing our wealth",
      meaning: "Vowing to work together for financial stability and prosperity, building a secure future.",
      icon: "💰"
    },
    {
      number: 4,
      title: "Happiness & Harmony",
      vow: "Together we shall acquire happiness and harmony",
      meaning: "A pledge for mutual love, trust, and shared joys, creating a harmonious household.",
      icon: "😊"
    },
    {
      number: 5,
      title: "Family & Responsibility",
      vow: "Together we shall raise strong and virtuous children",
      meaning: "Promise to care for children, family, and contribute positively to society.",
      icon: "👨‍👩‍👧‍👦"
    },
    {
      number: 6,
      title: "Health & Seasons",
      vow: "Together we shall live through all seasons of life",
      meaning: "A commitment to face life's seasons - joys and sorrows - and support each other's health.",
      icon: "🌸"
    },
    {
      number: 7,
      title: "Friendship & Loyalty",
      vow: "Together we shall remain lifelong companions",
      meaning: "The final vow of eternal friendship, loyalty, unity, and companionship for seven lifetimes.",
      icon: "🤝"
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      
      const section = sectionRef.current;
      const rect = section.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate which step should be visible based on scroll position
      if (rect.top < windowHeight / 2 && rect.bottom > windowHeight / 2) {
        const scrollProgress = (windowHeight / 2 - rect.top) / (rect.height - windowHeight / 2);
        const newStep = Math.min(Math.floor(scrollProgress * sapthapadhiSteps.length), sapthapadhiSteps.length - 1);
        setCurrentStep(Math.max(0, newStep));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section ref={sectionRef} className="py-20 px-4 bg-gradient-to-b from-orange-50 via-amber-50 to-rose-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200">
            <Sparkles className="w-3 h-3 mr-1" />
            Sacred Hindu Wedding Tradition
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 bg-clip-text text-transparent">
            Saptapadi - Seven Sacred Steps
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            The seven steps in Hindu marriage ceremonies represent a spiritual journey and foundational vows for a lifelong partnership
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start min-h-[800px]">
          {/* Left side - Vertical Timeline */}
          <div className="space-y-8">
            {sapthapadhiSteps.map((step, index) => (
              <div
                key={index}
                className={`transition-all duration-700 ${
                  index <= currentStep ? 'opacity-100 translate-x-0' : 'opacity-30 translate-x-4'
                } ${index % 2 === 0 ? 'ml-0' : 'ml-12'}`}
              >
                <Card 
                  className={`p-6 transition-all duration-500 ${
                    index === currentStep 
                      ? 'shadow-xl scale-105 border-2 border-orange-400 bg-gradient-to-r from-orange-50 to-rose-50' 
                      : 'shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Footstep Icon */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-500 ${
                      index === currentStep 
                        ? 'bg-gradient-to-br from-orange-500 to-rose-500 scale-110' 
                        : 'bg-gradient-to-br from-orange-300 to-rose-300'
                    }`}>
                      <span className="transform rotate-12">{step.icon}</span>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className="bg-orange-500 text-white">Step {step.number}</Badge>
                        {index === currentStep && (
                          <Badge className="bg-rose-500 text-white animate-pulse">Current</Badge>
                        )}
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-rose-700 italic mb-3 font-medium">"{step.vow}"</p>
                      <p className="text-gray-600 text-sm leading-relaxed">{step.meaning}</p>
                    </div>
                  </div>
                </Card>
              </div>
            ))}

            {/* Concluding Message */}
            <div 
              className={`mt-12 transition-all duration-700 ${
                currentStep >= 6 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
            >
              <Card className="p-8 bg-gradient-to-r from-orange-100 via-rose-100 to-pink-100 border-2 border-orange-300">
                <div className="text-center">
                  <Heart className="w-16 h-16 text-rose-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Journey of Eternal Union
                  </h3>
                  <p className="text-gray-700 leading-relaxed max-w-2xl mx-auto">
                    These seven sacred steps, taken around the holy fire (Agni), bind the couple for seven lifetimes. 
                    Each step represents a promise, transforming two individuals into united life partners with divine blessings. 
                    Together, they commit to building a life of mutual support, shared values, and eternal companionship.
                  </p>
                  <div className="mt-6 flex items-center justify-center space-x-2">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Right side - Static Image */}
          <div className="lg:sticky lg:top-24">
            <Card className="overflow-hidden shadow-2xl">
              <img 
                src="https://i.pinimg.com/736x/be/a1/9d/bea19db00102496492f53fed9f2987e8.jpg"
                alt="Saptapadi - Seven Sacred Steps in Hindu Wedding"
                className="w-full h-auto object-cover rounded-lg"
              />
              <div className="p-6 bg-gradient-to-r from-orange-50 to-rose-50">
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  The Sacred Fire Ceremony
                </h4>
                <p className="text-gray-600">
                  In the presence of the sacred fire (Agni), the couple takes seven steps together, 
                  each representing a sacred vow for their journey ahead. This ancient ritual symbolizes 
                  spiritual completeness and divine blessing.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Video, title: 'Live Streaming', desc: 'Broadcast your wedding in real-time to guests worldwide' },
    { icon: PlayCircle, title: 'HD Recording', desc: 'Automatically record and save your entire ceremony' },
    { icon: Users, title: 'Unlimited Guests', desc: 'Share your special day with unlimited virtual attendees' },
    { icon: Calendar, title: 'Easy Scheduling', desc: 'Schedule your wedding stream in just a few clicks' },
    { icon: Heart, title: 'Interactive Chat', desc: 'Let guests send wishes and reactions in real-time' },
    { icon: Sparkles, title: 'Premium Quality', desc: 'Crystal clear video and audio quality guaranteed' },
  ];

  const steps = [
    { number: 1, title: 'Create Account', desc: 'Sign up for free in seconds' },
    { number: 2, title: 'Set Up Event', desc: 'Add wedding details and schedule' },
    { number: 3, title: 'Get Stream Key', desc: 'Receive RTMP credentials instantly' },
    { number: 4, title: 'Configure OBS', desc: 'Connect your streaming software' },
    { number: 5, title: 'Test Stream', desc: 'Ensure everything works perfectly' },
    { number: 6, title: 'Go Live', desc: 'Start broadcasting your ceremony' },
    { number: 7, title: 'Share & Enjoy', desc: 'Watch with loved ones worldwide' },
  ];

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -400, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 400, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Heart className="w-8 h-8 text-rose-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/weddings" className="text-gray-700 hover:text-rose-500 transition">Live Weddings</Link>
              <Link href="#features" className="text-gray-700 hover:text-rose-500 transition">Features</Link>
              <Link href="#how-it-works" className="text-gray-700 hover:text-rose-500 transition">How It Works</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-rose-500 transition">Pricing</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200">
              <Sparkles className="w-3 h-3 mr-1" />
              World's Leading Wedding Live Streaming Platform
            </Badge>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-rose-500 via-purple-500 to-pink-500 bg-clip-text text-transparent leading-tight">
              Share Your Special Day<br />With The World
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Professional live wedding streaming made simple. Connect with loved ones anywhere,
              preserve every moment in stunning quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-gradient-to-r from-rose-500 to-purple-600 hover:from-rose-600 hover:to-purple-700 text-lg px-8">
                  Start Streaming Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 border-2 border-rose-300 hover:bg-rose-50">
                  Watch Demo
                  <PlayCircle className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20">
            {[
              { value: '10K+', label: 'Weddings Streamed' },
              { value: '500K+', label: 'Happy Viewers' },
              { value: '99.9%', label: 'Uptime' },
              { value: '4.9★', label: 'User Rating' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-rose-600">{stat.value}</div>
                <div className="text-gray-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section with Horizontal Scroll */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Powerful Features</h2>
            <p className="text-xl text-gray-600">Everything you need for perfect wedding streaming</p>
          </div>
          
          <div className="relative">
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition"
            >
              ←
            </button>
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-3 hover:bg-gray-50 transition"
            >
              →
            </button>
            
            <div
              ref={scrollContainerRef}
              className="flex gap-6 overflow-x-auto scroll-smooth hide-scrollbar pb-4 px-12"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={i}
                    className="min-w-[320px] p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-2 hover:border-rose-200"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-gray-600">{feature.desc}</p>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 7-Step How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-gradient-to-br from-purple-50 to-rose-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">How It Works</h2>
            <p className="text-xl text-gray-600">7 simple steps to go live</p>
          </div>

          <div className="grid md:grid-cols-7 gap-4">
            {steps.map((step, i) => (
              <div
                key={i}
                className="relative group"
                style={{
                  animation: `fadeInUp ${0.3 + i * 0.1}s ease-out forwards`,
                  opacity: 0,
                }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-all duration-300 border-2 hover:border-rose-300 group-hover:scale-105">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white flex items-center justify-center font-bold text-xl mb-4 mx-auto">
                    {step.number}
                  </div>
                  <h3 className="font-semibold text-center mb-2 text-sm">{step.title}</h3>
                  <p className="text-gray-600 text-center text-xs">{step.desc}</p>
                </Card>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-2 w-4 h-0.5 bg-gradient-to-r from-rose-300 to-purple-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sapthapadhi Section - Seven Sacred Steps */}
      <SapthapadhiSection />

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">Simple Pricing</h2>
            <p className="text-xl text-gray-600">Choose the perfect plan for your wedding</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <Card className="p-8 hover:shadow-xl transition border-2">
              <h3 className="text-2xl font-bold mb-2">Free</h3>
              <div className="text-4xl font-bold mb-4">$0<span className="text-lg font-normal text-gray-600">/forever</span></div>
              <ul className="space-y-3 mb-8">
                {['1 Wedding Event', 'Basic Streaming', '100 Viewers', '24h Recording Storage'].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full" variant="outline">Get Started</Button>
              </Link>
            </Card>

            {/* Monthly Plan */}
            <Card className="p-8 hover:shadow-xl transition border-2 border-rose-500 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500">Popular</Badge>
              <h3 className="text-2xl font-bold mb-2">Premium Monthly</h3>
              <div className="text-4xl font-bold mb-4">$18<span className="text-lg font-normal text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                {['Unlimited Events', 'HD Streaming', 'Unlimited Viewers', 'Unlimited Recording Storage', 'Priority Support'].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-rose-500 to-purple-600">Get Started</Button>
              </Link>
            </Card>

            {/* Yearly Plan */}
            <Card className="p-8 hover:shadow-xl transition border-2 border-purple-500 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500">Save 20%</Badge>
              <h3 className="text-2xl font-bold mb-2">Premium Yearly</h3>
              <div className="text-4xl font-bold mb-4">
                $180<span className="text-lg font-normal text-gray-600">/year</span>
              </div>
              <div className="text-sm text-gray-500 mb-4">Save $36 vs monthly</div>
              <ul className="space-y-3 mb-8">
                {['Unlimited Events', 'HD Streaming', 'Unlimited Viewers', 'Unlimited Recording Storage', 'Priority Support', 'Advanced Analytics'].map((item, i) => (
                  <li key={i} className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register">
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-600">Get Started</Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-rose-500 to-purple-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Go Live?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of couples streaming their weddings with WedLive
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-white text-rose-600 hover:bg-gray-100 text-lg px-8">
              Start Your Free Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="w-6 h-6 text-rose-500" />
            <span className="text-2xl font-bold">WedLive</span>
          </div>
          <p className="text-gray-400 mb-4">Making every wedding moment accessible to everyone</p>
          <div className="text-gray-500 text-sm">
            © 2025 WedLive. All rights reserved.
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
