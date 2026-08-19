// Landing page for the email-verification link sent at signup:
//   /auth/verify-email?token=<raw>&email=<address>
// Verifies immediately on mount and shows the outcome. Signed-in users with
// an expired/invalid link can request a fresh one from here.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, MailCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { authService } from '@/lib/auth';
import { getStoredToken } from '@/lib/supabase';

type VerifyState =
  | { phase: 'verifying' }
  | { phase: 'success'; message: string }
  | { phase: 'error'; message: string }
  | { phase: 'resent'; message: string };

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<VerifyState>({ phase: 'verifying' });
  const [resending, setResending] = useState(false);
  // React 18 StrictMode double-mounts effects; verify exactly once.
  const started = useRef(false);

  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';
  const signedIn = Boolean(getStoredToken());

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!email || !token) {
      setState({ phase: 'error', message: 'This verification link is incomplete. Use the link from your email.' });
      return;
    }

    authService.verifyEmail(email, token).then((result) => {
      if (result.success) {
        setState({ phase: 'success', message: result.message ?? 'Email verified successfully' });
      } else {
        setState({ phase: 'error', message: result.error ?? 'Verification failed' });
      }
    });
  }, [email, token]);

  const handleResend = async () => {
    setResending(true);
    const result = await authService.resendVerification();
    setResending(false);
    if (result.success) {
      setState({ phase: 'resent', message: result.message ?? 'Verification email sent' });
    } else {
      setState({ phase: 'error', message: result.error ?? 'Could not resend the verification email' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-4">
          {state.phase === 'verifying' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" aria-hidden="true" />
              <h1 className="text-xl font-bold text-foreground">Verifying your email…</h1>
              <p className="text-sm text-muted-foreground">{email}</p>
            </>
          )}

          {state.phase === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" aria-hidden="true" />
              <h1 className="text-xl font-bold text-foreground">Email verified</h1>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <Button className="w-full" onClick={() => navigate('/')}>
                Continue to PartyHause
              </Button>
            </>
          )}

          {state.phase === 'resent' && (
            <>
              <MailCheck className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
              <h1 className="text-xl font-bold text-foreground">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Back to PartyHause
              </Button>
            </>
          )}

          {state.phase === 'error' && (
            <>
              <XCircle className="h-12 w-12 mx-auto text-destructive" aria-hidden="true" />
              <h1 className="text-xl font-bold text-foreground">Verification failed</h1>
              <p className="text-sm text-muted-foreground">{state.message}</p>
              {signedIn && (
                <Button className="w-full" onClick={handleResend} disabled={resending}>
                  {resending ? 'Sending…' : 'Send a new verification link'}
                </Button>
              )}
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Back to PartyHause
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
