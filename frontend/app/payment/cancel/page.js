'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full text-center">
        <CardHeader>
          <div className="mx-auto mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-gray-400 to-gray-600 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-white" />
            </div>
          </div>
          
          <CardTitle className="text-3xl font-bold mb-2">
            Payment Cancelled
          </CardTitle>
          <CardDescription className="text-lg">
            Your payment was cancelled. No charges were made to your account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-gray-600 mb-4">
              Don't worry! You can try again anytime. Your account remains active on the free plan.
            </p>
            <p className="text-sm text-gray-500">
              If you experienced any issues during checkout, please contact our support team.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/pricing">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:opacity-90"
                data-testid="try-again-button"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" data-testid="back-to-dashboard-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
