'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Settings, CreditCard, LogOut, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfileDropdown({ user, onLogout }) {
  const router = useRouter();

  if (!user) return null;

  const getInitials = (name) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || 'U';
    const names = name.split(' ');
    return names.map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const isPremium = user.subscription_plan !== 'free';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar className="h-9 w-9 ring-2 ring-offset-2 ring-rose-500/20">
            <AvatarImage src={user.avatar_url} alt={user.full_name || user.email} />
            <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white text-sm">
              {getInitials(user.full_name)}
            </AvatarFallback>
          </Avatar>
          {isPremium && (
            <Crown className="w-4 h-4 text-yellow-500" />
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.full_name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
            <Badge 
              variant={isPremium ? "default" : "secondary"} 
              className={isPremium ? "bg-gradient-to-r from-rose-500 to-purple-600" : ""}
            >
              {user.subscription_plan || 'free'}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(isPremium ? '/payment/history' : '/pricing')}>
          <CreditCard className="mr-2 h-4 w-4" />
          <span>{isPremium ? 'Billing & Plans' : 'Upgrade to Premium'}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
