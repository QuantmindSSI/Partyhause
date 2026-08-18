import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Share2, Copy, Check, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { apiUrl } from '@/lib/apiBase';

interface EventQRGeneratorProps {
  eventId: string;
  eventName: string;
}

interface InviteToken {
  id: string;
  token: string;
  token_type: string;
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
}

interface InviteData {
  token: InviteToken;
  invite_url: string;
  qr_data: string;
}

export function EventQRGenerator({ eventId, eventName }: EventQRGeneratorProps) {
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Form state
  const [tokenType, setTokenType] = useState<'guest_and_crew' | 'guest_join' | 'crew_invite'>('guest_and_crew');
  const [maxUses, setMaxUses] = useState<string>('');
  const [expiresInHours, setExpiresInHours] = useState<string>('48');

  const generateQR = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Express endpoint takes event_id in the BODY (the old
      // /api/generate-invite?event_id=... was a deleted Vercel fn).
      const response = await fetch(apiUrl('/api/invites/generate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          event_id: eventId,
          token_type: tokenType,
          max_uses: maxUses ? parseInt(maxUses) : null,
          expires_in_hours: expiresInHours ? parseInt(expiresInHours) : null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate invite');
      }

      const data = await response.json();
      setInviteData(data);
    } catch (error) {
      console.error('Failed to generate invite:', error);
      alert('Failed to generate invite. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteData) return;
    
    try {
      await navigator.clipboard.writeText(inviteData.invite_url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareInvite = async () => {
    if (!inviteData) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${eventName}`,
          text: `You're invited to join ${eventName} on PartyHause!`,
          url: inviteData.invite_url,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const downloadQR = () => {
    if (!inviteData) return;

    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${eventName.replace(/\s+/g, '-')}-qr-code.png`;
        a.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Share2 className="h-4 w-4" />
          Generate QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Generate Event Invite</DialogTitle>
          <DialogDescription>
            Create a QR code or shareable link for guests to join {eventName}
          </DialogDescription>
        </DialogHeader>

        {!inviteData ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Invite Type</Label>
              <Select value={tokenType} onValueChange={(val: any) => setTokenType(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="guest_and_crew">
                    Guest + Crew (Recommended)
                  </SelectItem>
                  <SelectItem value="guest_join">
                    Guest Only
                  </SelectItem>
                  <SelectItem value="crew_invite">
                    Crew Connection Only
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {tokenType === 'guest_and_crew' && 'Guests join event and can optionally add you to their crew'}
                {tokenType === 'guest_join' && 'Guests join event without crew connection'}
                {tokenType === 'crew_invite' && 'Send crew connection request only'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Maximum Uses (Optional)</Label>
              <Input
                type="number"
                placeholder="Unlimited"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty for unlimited uses
              </p>
            </div>

            <div className="space-y-2">
              <Label>Expires In (Hours)</Label>
              <Input
                type="number"
                placeholder="48"
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to never expire
              </p>
            </div>

            <Button 
              onClick={generateQR} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Invite'
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* QR Code Display */}
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-6 rounded-lg border">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={inviteData.qr_data}
                  size={256}
                  level="H"
                  includeMargin
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm font-medium">
                  {inviteData.token.token_type === 'guest_and_crew' && '🫧 Join Event + Crew'}
                  {inviteData.token.token_type === 'guest_join' && '🎉 Join Event'}
                  {inviteData.token.token_type === 'crew_invite' && '👥 Join Crew'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {inviteData.token.max_uses 
                    ? `${inviteData.token.current_uses}/${inviteData.token.max_uses} uses`
                    : 'Unlimited uses'}
                  {inviteData.token.expires_at && (
                    <> · Expires {new Date(inviteData.token.expires_at).toLocaleDateString()}</>
                  )}
                </p>
              </div>
            </div>

            {/* Link Display */}
            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  value={inviteData.invite_url}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                  className="font-mono text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={shareInvite}
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                variant="outline"
                onClick={downloadQR}
                className="flex-1 gap-2"
              >
                <Download className="h-4 w-4" />
                Download QR
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={() => setInviteData(null)}
              className="w-full"
            >
              Generate New Invite
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
