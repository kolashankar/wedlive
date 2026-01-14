'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Download, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  FileText,
  Calendar,
  CreditCard,
  Mail,
  User
} from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function InvoicePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const invoiceId = params.id;
  
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && invoiceId) {
      loadInvoice();
    }
  }, [user, authLoading, invoiceId]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/subscriptions/invoice/${invoiceId}`);
      if (response.data) {
        setInvoice(response.data);
      }
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setLoading(false);
    }
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
      month: 'long', 
      day: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    toast.info('PDF download feature coming soon!');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Invoice not found</h3>
            <p className="text-gray-500 mb-6">The invoice you're looking for doesn't exist</p>
            <Link href="/payment/history">
              <Button>Back to Payment History</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      {/* Navigation - Hide on print */}
      <nav className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-rose-500 to-purple-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                WedLive
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              <Button onClick={handlePrint} variant="outline">
                Print
              </Button>
              <Button onClick={handleDownload} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Link href="/payment/history">
                <Button variant="ghost">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Invoice Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="shadow-xl">
          <CardContent className="p-8 md:p-12">
            {/* Header */}
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  WedLive
                </h1>
                <p className="text-gray-600">Premium Wedding Streaming</p>
              </div>
              <div className="text-right">
                <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg mb-2">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  PAID
                </div>
                <p className="text-sm text-gray-600">Invoice #{invoice.id?.substring(0, 8).toUpperCase()}</p>
              </div>
            </div>

            {/* Billing Information */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-gray-400" />
                  Bill To
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p className="font-medium">{invoice.user_name || 'Customer'}</p>
                  <p className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {invoice.user_email}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-gray-400" />
                  Invoice Details
                </h3>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <span className="text-gray-500">Date:</span>{' '}
                    <span className="font-medium">{formatDate(invoice.created_at)}</span>
                  </p>
                  {invoice.paid_at && (
                    <p>
                      <span className="text-gray-500">Paid On:</span>{' '}
                      <span className="font-medium">{formatDate(invoice.paid_at)}</span>
                    </p>
                  )}
                  {invoice.razorpay_payment_id && (
                    <p className="text-sm">
                      <span className="text-gray-500">Payment ID:</span>{' '}
                      <span className="font-mono text-xs">{invoice.razorpay_payment_id}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Items */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2 text-gray-400" />
                Payment Details
              </h3>
              
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {invoice.type === 'subscription' 
                              ? `${invoice.plan === 'monthly' ? 'Monthly' : 'Yearly'} Premium Subscription`
                              : invoice.notes?.description || 'One-Time Payment'
                            }
                          </p>
                          {invoice.type === 'subscription' && (
                            <p className="text-sm text-gray-500">
                              {invoice.plan === 'monthly' 
                                ? 'Billed monthly - Auto-renewing'
                                : 'Billed yearly - 20% discount applied'
                              }
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        {formatAmount(invoice.amount)}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        Total Amount
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent">
                          {formatAmount(invoice.amount)}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.currency || 'INR'}</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Method */}
            <div className="border-t border-gray-200 pt-8">
              <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-lg p-6">
                <h4 className="font-semibold mb-2">Payment Method</h4>
                <p className="text-gray-700">Razorpay Payment Gateway</p>
                <p className="text-sm text-gray-500 mt-1">Secure online payment via cards, UPI, net banking & wallets</p>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
              <p>Thank you for your business!</p>
              <p className="mt-2">
                For any questions, contact us at{' '}
                <a href="mailto:support@wedlive.com" className="text-rose-600 hover:underline">
                  support@wedlive.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Print styles */}
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          nav, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
