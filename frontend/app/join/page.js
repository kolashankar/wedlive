'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Video, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import Link from 'next/link';

export default function JoinWeddingPage() {
  const router = useRouter();
  const [weddingCode, setWeddingCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    
    if (!weddingCode || weddingCode.length !== 6) {
      toast.error('Please enter a valid 6-digit wedding code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/viewer/join', {
        wedding_code: weddingCode
      });
      
      const { wedding_id, title, bride_name, groom_name } = response.data;
      toast.success(`Welcome to ${bride_name} & ${groom_name}'s wedding!`);
      
      // Redirect to unified viewer page
      router.push(`/view/${wedding_id}`);
    } catch (error) {
      console.error('Error joining wedding:', error);
      if (error.response?.status === 404) {
        toast.error('Wedding not found. Please check the code and try again.');
      } else {
        toast.error('Failed to join wedding. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setWeddingCode(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              WedLive
            </span>
          </Link>
          <Link href="/login">
            <Button variant="outline">Sign In</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-24">
        <div className="max-w-md mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <Video className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Join a Wedding
            </h1>
            <p className="text-gray-600 text-lg">
              Enter the 6-digit wedding code to watch the live ceremony
            </p>
          </div>

          {/* Join Form */}
          <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Enter Wedding Code</CardTitle>
              <CardDescription className="text-center">
                The code was shared by the wedding host
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleJoin} className="space-y-6">
                <div>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="123456"
                    value={weddingCode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className="text-center text-3xl font-bold tracking-widest h-16"
                    disabled={loading}
                  />
                  <p className="text-sm text-gray-500 text-center mt-2">
                    {weddingCode.length}/6 digits
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-lg bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                  disabled={loading || weddingCode.length !== 6}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Wedding
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-500">
              Don't have a wedding code?
            </p>
            <Link href="/weddings">
              <Button variant="ghost" className="text-pink-600 hover:text-pink-700">
                Browse Public Weddings
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl mb-2">📺</div>
              <p className="text-sm text-gray-600">HD Streaming</p>
            </div>
            <div>
              <div className="text-3xl mb-2">📸</div>
              <p className="text-sm text-gray-600">Photos & Videos</p>
            </div>
            <div>
              <div className="text-3xl mb-2">🎥</div>
              <p className="text-sm text-gray-600">Recordings</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
