import { useState, useEffect } from 'react';
import { DollarSign, Users, CheckCircle, Clock, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface CostSplit {
  id: string;
  guest_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  payment_method?: string;
  payment_reference?: string;
  paid_at?: string;
  guest: {
    id: string;
    name: string;
    email?: string;
  };
}

interface CostSummary {
  event_id: string;
  total_event_cost: number;
  total_collected: number;
  total_pending: number;
  guests_with_splits: number;
  guests_paid: number;
  guests_pending: number;
}

interface CostSplitManagerProps {
  eventId: string;
}

export function CostSplitManager({ eventId }: CostSplitManagerProps) {
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [splits, setSplits] = useState<CostSplit[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [totalAmount, setTotalAmount] = useState('');
  const [description, setDescription] = useState('');
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');

  useEffect(() => {
    fetchCostSplits();
  }, [eventId]);

  const fetchCostSplits = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/cost-split?event_id=${eventId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cost splits');
      }

      const data = await response.json();
      setSummary(data.summary);
      setSplits(data.splits);
    } catch (error) {
      console.error('Failed to fetch cost splits:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSplit = async () => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/cost-split?event_id=${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          split_method: splitMethod,
          total_amount: parseFloat(totalAmount),
          description: description || 'Event cost share',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create cost split');
      }

      await fetchCostSplits();
      setShowCreateForm(false);
      setTotalAmount('');
      setDescription('');
    } catch (error) {
      console.error('Failed to create split:', error);
      alert(error instanceof Error ? error.message : 'Failed to create cost split');
    } finally {
      setCreating(false);
    }
  };

  const markAsPaid = async (splitId: string, paymentMethod?: string, paymentRef?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/cost-split?event_id=${eventId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          split_id: splitId,
          status: 'paid',
          payment_method: paymentMethod || 'cash',
          payment_reference: paymentRef,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      await fetchCostSplits();
    } catch (error) {
      console.error('Failed to mark as paid:', error);
      alert('Failed to update payment status');
    }
  };

  const getStatusBadge = (status: CostSplit['status']) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      paid: { variant: 'default', icon: CheckCircle, label: 'Paid' },
      pending: { variant: 'secondary', icon: Clock, label: 'Pending' },
      sent: { variant: 'secondary', icon: Clock, label: 'Sent' },
      overdue: { variant: 'destructive', icon: AlertCircle, label: 'Overdue' },
      cancelled: { variant: 'outline', icon: AlertCircle, label: 'Cancelled' },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-12 pb-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Cost Split Summary
            </CardTitle>
            <CardDescription>
              Track payments from your guests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">${summary.total_event_cost.toFixed(2)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-green-600">
                  ${summary.total_collected.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${summary.total_pending.toFixed(2)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Guests Paid</p>
                <p className="text-2xl font-bold">
                  {summary.guests_paid}/{summary.guests_with_splits}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Split Section */}
      {splits.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Splitting</CardTitle>
            <CardDescription>
              Split event costs with your confirmed guests
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showCreateForm ? (
              <Button onClick={() => setShowCreateForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Cost Split
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="total-amount">Total Amount ($)</Label>
                  <Input
                    id="total-amount"
                    type="number"
                    placeholder="500.00"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Event tickets, venue rental, catering..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Split Method</Label>
                  <Select value={splitMethod} onValueChange={(val: any) => setSplitMethod(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equal">Split Equally</SelectItem>
                      <SelectItem value="custom" disabled>
                        Custom Amounts (Coming Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={createSplit}
                    disabled={creating}
                    className="flex-1"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Split'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Splits List */}
      {splits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Payment Requests
            </CardTitle>
            <CardDescription>
              {splits.length} guest{splits.length !== 1 ? 's' : ''} · Track who has paid
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{split.guest.name}</p>
                      {getStatusBadge(split.status)}
                    </div>
                    {split.guest.email && (
                      <p className="text-sm text-muted-foreground">{split.guest.email}</p>
                    )}
                    {split.status === 'paid' && split.paid_at && (
                      <p className="text-xs text-muted-foreground">
                        Paid {new Date(split.paid_at).toLocaleDateString()}
                        {split.payment_method && ` via ${split.payment_method}`}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold">
                      ${split.amount.toFixed(2)}
                    </p>
                    {split.status !== 'paid' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Mark Paid
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Mark as Paid</DialogTitle>
                            <DialogDescription>
                              Record payment from {split.guest.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label>Payment Method</Label>
                              <Select defaultValue="cash">
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cash">Cash</SelectItem>
                                  <SelectItem value="venmo">Venmo</SelectItem>
                                  <SelectItem value="paypal">PayPal</SelectItem>
                                  <SelectItem value="zelle">Zelle</SelectItem>
                                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                  <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={() => markAsPaid(split.id)}>
                              Confirm Payment
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
