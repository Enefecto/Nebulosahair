import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const { isAuthenticated } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/admin-nh-7x9k2m/login';
    } else {
      setChecked(true);
    }
  }, [isAuthenticated]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
