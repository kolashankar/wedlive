'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Give webhook time to process and refresh user data
    const timer = setTimeout(async () => {
      if (refreshUser) {
        await refreshUser();
      }
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [refreshUser]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-6">
            {loading ? (
              <div className="w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-white animate-spin" />
              </div>
            ) : (
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-600 flex items-center justify-center animate-bounce">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                </div>
              </div>
            )}
          </div>
          
          <CardTitle className="text-3xl font-bold mb-2">
            {loading ? 'Processing Your Payment...' : '🎉 Payment Successful!'}
          </CardTitle>
          <CardDescription className="text-lg">
            {loading 
              ? 'Please wait while we activate your premium subscription'
              : 'Welcome to WedLive Premium! Your account has been upgraded.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!loading && (
            <>
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">You now have access to:</h3>
                <ul className="text-left space-y-2 max-w-md mx-auto">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited wedding events</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited viewers</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Unlimited recording storage</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>HD streaming quality</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button 
                    size="lg"
                    className="bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90"
                    data-testid="go-to-dashboard-button"
                  >
                    Go to Dashboard
                  </Button>
                </Link>
                <Link href="/weddings">
                  <Button size="lg" variant="outline" data-testid="browse-weddings-button">
                    Browse Live Weddings
                  </Button>
                </Link>
              </div>

              {sessionId && (
                <p className="text-sm text-gray-500 mt-4">
                  Session ID: {sessionId}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
