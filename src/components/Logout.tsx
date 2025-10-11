import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

const Logout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = async () => {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        // Redirect to auth page after successful sign-out
        navigate('/auth');
      } catch (err) {
        setError('An error occurred during logout.');
        setLoading(false);
      }
    };

    // Listen for auth state changes to handle sign-out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/auth');
      }
    });

    handleLogout();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  if (loading) {
    return <div>Loading...</div>; // Prevent blank page during logout
  }

  if (error) {
    return <div>Error: {error}</div>; // Show error instead of blank page
  }

  return <div>Logging out...</div>; // Fallback content
};

export default Logout;
