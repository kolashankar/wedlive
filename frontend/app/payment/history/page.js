'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Download, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  Loader2,
  Receipt,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function PaymentHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('TEST');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user) {
      loadPaymentHistory();
    }
  }, [user, authLoading]);

  const loadPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions/payment-history?limit=100');
      if (response.data) {
        setPayments(response.data.payments || []);
        setMode(response.data.mode || 'TEST');
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
      case 'created':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'cancelled':
      case 'failed':
      case 'payment_failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-green-100 text-green-700',
      paid: 'bg-green-100 text-green-700',
      success: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      created: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
      failed: 'bg-red-100 text-red-700',
      payment_failed: 'bg-red-100 text-red-700'
    };

    const className = variants[status] || 'bg-gray-100 text-gray-700';
    
    return (
      <Badge className={`${className} border-0`}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const formatAmount = (amount) => {
    const rupees = (amount / 100).toFixed(2);
    return `₹${rupees}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleViewInvoice = (payment) => {
    router.push(`/payment/invoice/${payment.id}`);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
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
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
              Payment History
            </h1>
            {mode === 'TEST' && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                TEST MODE
              </Badge>
            )}
          </div>
          <p className="text-gray-600">View all your transactions and download invoices</p>
        </div>

        {/* Payment List */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No payments yet</h3>
              <p className="text-gray-500 mb-6">Your payment history will appear here once you make a purchase</p>
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-rose-500 to-purple-600 text-white">
                  View Plans
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="p-3 bg-gradient-to-br from-rose-100 to-purple-100 rounded-lg">
                        {getStatusIcon(payment.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">
                            {payment.type === 'subscription' 
                              ? `${payment.plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`
                              : payment.notes?.description || 'One-Time Payment'
                            }
                          </h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(payment.created_at)}
                          </div>
                          {payment.razorpay_payment_id && (
                            <div className="flex items-center">
                              <Receipt className="w-4 h-4 mr-2 text-gray-400" />
                              ID: {payment.razorpay_payment_id.substring(0, 20)}...
                            </div>
                          )}
                        </div>

                        {payment.paid_at && (
                          <div className="text-sm text-green-600 mt-2">
                            ✓ Paid on {formatDate(payment.paid_at)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-3 ml-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                          {formatAmount(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.currency || 'INR'}
                        </div>
                      </div>
                      
                      {(payment.status === 'active' || payment.status === 'paid' || payment.status === 'success') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewInvoice(payment)}
                          className="border-rose-200 hover:bg-rose-50"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Invoice
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Card */}
        {payments.length > 0 && (
          <Card className="mt-8 bg-gradient-to-br from-rose-50 to-purple-50">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Successful</p>
                  <p className="text-2xl font-bold text-green-600">
                    {payments.filter(p => ['active', 'paid', 'success'].includes(p.status)).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {payments.filter(p => ['pending', 'created'].includes(p.status)).length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Spent</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatAmount(
                      payments
                        .filter(p => ['active', 'paid', 'success'].includes(p.status))
                        .reduce((sum, p) => sum + (p.amount || 0), 0)
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
