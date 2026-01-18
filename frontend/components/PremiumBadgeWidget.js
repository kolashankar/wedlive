'use client';
import { Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function PremiumBadgeWidget({ user }) {
  const isPremium = user?.subscription_plan === 'monthly' || user?.subscription_plan === 'yearly';

  if (isPremium) {
    return (
      <div className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <Badge className="bg-yellow-600 hover:bg-yellow-700">
            Premium {user.subscription_plan === 'yearly' ? 'Yearly' : 'Monthly'}
          </Badge>
        </div>
        <p className="text-sm text-yellow-800 mb-3">
          Enjoy unlimited features and priority support
        </p>
        <Link href="/pricing">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full border-yellow-600 text-yellow-700 hover:bg-yellow-50"
          >
            Manage Subscription
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="w-5 h-5 text-gray-400" />
        <Badge variant="outline">Free Plan</Badge>
      </div>
      <p className="text-sm text-gray-600 mb-3">
        Upgrade to unlock premium features
      </p>
      <Link href="/pricing">
        <Button 
          size="sm" 
          className="w-full bg-gradient-to-r from-rose-500 to-purple-500 hover:from-rose-600 hover:to-purple-600"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade to Premium
        </Button>
      </Link>
    </div>
  );
}
