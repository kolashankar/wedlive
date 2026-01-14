'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import api from '@/lib/api';

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function PricingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      loadSubscription();
      loadRazorpayScript();
    }
  }, [user]);

  const loadSubscription = async () => {
    try {
      const response = await api.get('/api/subscriptions/my-subscription');
      if (response.data && typeof response.data === 'object') {
        setCurrentSubscription(response.data);
      }
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setCurrentSubscription(null);
    }
  };

  const handleUpgrade = async (plan) => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (plan === 'free') {
      toast.error('You are already on the free plan');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan);

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create Razorpay subscription
      const response = await api.post('/api/subscriptions/create-checkout-session', {
        plan: plan
      });

      const {
        subscription_id,
        razorpay_key,
        user_email,
        user_name,
        amount
      } = response.data;

      // Configure Razorpay options
      const options = {
        key: razorpay_key,
        subscription_id: subscription_id,
        name: 'WedLive',
        description: `${plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`,
        image: '/logo.png',
        prefill: {
          name: user_name,
          email: user_email
        },
        theme: {
          color: '#f43f5e'
        },
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await api.post('/api/subscriptions/verify-payment', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_subscription_id: response.razorpay_subscription_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan
            });

            if (verifyResponse.data.success) {
              toast.success('🎉 Payment successful! Premium plan activated.');
              router.push('/dashboard');
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Failed to verify payment');
          }
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            setSelectedPlan(null);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      setLoading(false);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to initiate payment';
      toast.error(errorMessage);
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '₹0',
      period: 'forever',
      description: 'Perfect for trying out WedLive',
      features: [
        '1 wedding event',
        'Up to 100 viewers',
        '24-hour recording storage',
        'Basic streaming quality',
        'Community support'
      ],
      icon: Zap,
      color: 'from-gray-400 to-gray-600',
      recommended: false
    },
    {
      id: 'monthly',
      name: 'Premium Monthly',
      price: '₹1,799',
      period: '/month',
      description: 'Best for regular events',
      features: [
        'Unlimited wedding events',
        'Unlimited viewers',
        'Unlimited recording storage',
        'HD streaming quality',
        'Priority support',
        'Custom branding',
        'Analytics dashboard',
        'Multi-camera support'
      ],
      icon: Crown,
      color: 'from-rose-500 to-purple-600',
      recommended: true
    },
    {
      id: 'yearly',
      name: 'Premium Yearly',
      price: '₹17,270',
      period: '/year',
      originalPrice: '₹21,588',
      discount: 'Save 20%',
      description: 'Best value for professionals',
      features: [
        'Everything in Monthly',
        '20% discount (2 months free)',
        'Extended storage',
        'Dedicated support',
        'Early access to new features',
        'API access',
        'White-label option',
        'Advanced analytics'
      ],
      icon: Crown,
      color: 'from-purple-500 to-pink-600',
      recommended: false
    }
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {user ? (
                <Button onClick={() => router.push('/dashboard')} variant="outline">
                  Dashboard
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white border-0">
            Simple Pricing
          </Badge>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free and upgrade anytime. No hidden fees, no surprises.
          </p>
          {currentSubscription && currentSubscription.plan !== 'free' && (
            <div className="mt-4 inline-flex items-center px-4 py-2 rounded-full bg-green-50 border border-green-200">
              <Check className="w-5 h-5 text-green-600 mr-2" />
              <span className="text-green-700 font-medium">
                Current Plan: {currentSubscription.plan === 'monthly' ? 'Premium Monthly' : 'Premium Yearly'}
              </span>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = currentSubscription?.plan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl ${
                  plan.recommended ? 'border-2 border-rose-500 transform scale-105' : 'hover:scale-105'
                }`}
                data-testid={`pricing-card-${plan.id}`}
              >
                {plan.recommended && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white px-4 py-1 text-sm font-semibold">
                      RECOMMENDED
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r ${plan.color} flex items-center justify-center mb-4`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-gray-600 mt-2">{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-gray-600 ml-2">{plan.period}</span>
                  </div>
                  {plan.discount && (
                    <div className="mt-2">
                      <Badge variant="secondary" className="bg-green-100 text-green-700">
                        {plan.discount}
                      </Badge>
                      <div className="text-sm text-gray-500 line-through mt-1">
                        Regular: {plan.originalPrice}/year
                      </div>
                    </div>
                  )}
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={loading || isCurrentPlan}
                    className={`w-full ${
                      plan.recommended
                        ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    }`}
                    data-testid={`upgrade-button-${plan.id}`}
                  >
                    {loading && selectedPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : plan.id === 'free' ? (
                      'Get Started Free'
                    ) : (
                      'Upgrade Now'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I upgrade or downgrade my plan?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Yes! You can upgrade to a premium plan at any time. Your account will be charged immediately and you'll have access to all premium features.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">We accept all major credit/debit cards, UPI, net banking, and wallets through our secure Razorpay payment processor.</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a free trial?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Our Free plan is available forever! Try it out and upgrade when you're ready for unlimited events and features.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2024 WedLive. Built with ❤️ for making every wedding moment accessible.
          </p>
        </div>
      </footer>
    </div>
  );
}