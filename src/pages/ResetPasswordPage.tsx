// Landing page for the password-reset link emailed by /api/auth/forgot-password:
//   /auth/reset-password?token=<raw>&email=<address>
// Previously this URL fell through to the SPA state machine and showed the
// default dashboard/auth screen — the emailed link was a dead end. This page
// completes the loop: new password form -> POST /api/auth/reset-password ->
// store the returned session token -> into the app.

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { KeyRound, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiUrl } from '@/lib/apiBase';
import { setStoredToken, setStoredUser } from '@/lib/auth-storage';

const MIN_PASSWORD = 8;

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email') ?? '';
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkBroken = !email || !token;

  const validationError = (): string | null => {
    if (password.length < MIN_PASSWORD) return `Password must be at least ${MIN_PASSWORD} characters`;
    if (password !== confirm) return 'Passwords do not match';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = validationError();
    if (invalid) {
      setError(invalid);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(apiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Sign the user in. Both halves of the session are required: the store
      // hydrates only when the token AND the cached user are present
      // (src/hooks/use-auth.ts). Writing the token alone left the user with a
      // valid session the app rendered as signed out, so a successful reset
      // dropped them back at the login screen.
      if (typeof data.token === 'string' && data.token.length > 0 && data.user?.id) {
        setStoredToken(data.token);
        setStoredUser({
          id: data.user.id,
          email: data.user.email ?? email,
          name: data.user.name ?? undefined,
        });
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Password reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 space-y-6">
          {linkBroken ? (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-destructive" aria-hidden="true" />
              <h1 className="text-xl font-bold text-foreground">Invalid reset link</h1>
              <p className="text-sm text-muted-foreground">
                This link is incomplete. Use the link from your email, or request a new one from the sign-in screen.
              </p>
              <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <KeyRound className="h-12 w-12 mx-auto text-primary" aria-hidden="true" />
                <h1 className="text-xl font-bold text-foreground">Set a new password</h1>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={MIN_PASSWORD}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={MIN_PASSWORD}
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
