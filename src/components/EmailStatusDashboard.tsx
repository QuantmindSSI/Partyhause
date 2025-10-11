import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { 
  getEmailAnalytics, 
  getEventEmailLogs, 
  resendEmail,
  type EmailStatus 
} from '../lib/email-tracking';
import { RefreshCw, Mail, CheckCircle, XCircle, Clock, Eye, MousePointer } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface EmailStatusDashboardProps {
  eventId: string;
}

interface EmailLog {
  id: string;
  email_type: string;
  recipient_email: string;
  subject: string;
  status: string;
  sent_at: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  bounced_at?: string;
  error_message?: string;
  guests?: {
    name: string;
    email: string;
  };
}

interface EmailAnalytics {
  total_emails_sent: number;
  delivered_count: number;
  opened_count: number;
  clicked_count: number;
  bounced_count: number;
  failed_count: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
}

export function EmailStatusDashboard({ eventId }: EmailStatusDashboardProps) {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingEmails, setResendingEmails] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const loadEmailData = async () => {
    try {
      setLoading(true);
      
      const [analyticsData, logsData] = await Promise.all([
        getEmailAnalytics(eventId),
        getEventEmailLogs(eventId)
      ]);

      setAnalytics(analyticsData);
      setEmailLogs(logsData);
    } catch (error) {
      console.error('Failed to load email data:', error);
      toast({
        title: "Failed to load email data",
        description: "Please try refreshing the page.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmailData();
  }, [eventId]);

  const handleResendEmail = async (emailLogId: string) => {
    try {
      setResendingEmails(prev => new Set([...prev, emailLogId]));
      
      await resendEmail(emailLogId);
      
      toast({
        title: "Email resent successfully! ✅",
        description: "The email has been sent again.",
      });
      
      // Refresh data to show new email log
      await loadEmailData();
      
    } catch (error) {
      console.error('Failed to resend email:', error);
      toast({
        title: "Failed to resend email",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setResendingEmails(prev => {
        const newSet = new Set(prev);
        newSet.delete(emailLogId);
        return newSet;
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'opened':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'clicked':
        return <MousePointer className="h-4 w-4 text-purple-500" />;
      case 'bounced':
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'opened':
        return 'bg-blue-100 text-blue-800';
      case 'clicked':
        return 'bg-purple-100 text-purple-800';
      case 'bounced':
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Email Analytics */}
      {analytics && analytics.total_emails_sent > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Analytics
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadEmailData}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analytics.total_emails_sent}
                </div>
                <div className="text-sm text-gray-600">Total Sent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analytics.delivered_count}
                </div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analytics.opened_count}
                </div>
                <div className="text-sm text-gray-600">Opened</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analytics.clicked_count}
                </div>
                <div className="text-sm text-gray-600">Clicked</div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Delivery Rate</span>
                  <span>{analytics.delivery_rate}%</span>
                </div>
                <Progress value={analytics.delivery_rate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Open Rate</span>
                  <span>{analytics.open_rate}%</span>
                </div>
                <Progress value={analytics.open_rate} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Click Rate</span>
                  <span>{analytics.click_rate}%</span>
                </div>
                <Progress value={analytics.click_rate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email History ({emailLogs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {emailLogs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>No emails sent yet</p>
              <p className="text-sm">Emails will appear here when you add guests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.status)}
                    <div>
                      <div className="font-medium">
                        {log.guests?.name || 'Unknown'} 
                        <span className="text-gray-500 ml-2">
                          ({log.recipient_email})
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.email_type} • {new Date(log.sent_at).toLocaleDateString()}
                        {log.error_message && (
                          <span className="text-red-500 ml-2">
                            • {log.error_message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(log.status)}>
                      {log.status}
                    </Badge>
                    
                    {(log.status === 'failed' || log.status === 'bounced') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendEmail(log.id)}
                        disabled={resendingEmails.has(log.id)}
                      >
                        {resendingEmails.has(log.id) ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          'Resend'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}