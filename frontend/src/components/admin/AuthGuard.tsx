import { useEffect, type ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  children: ReactNode;
}

export default function AuthGuard({ children }: Props) {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      window.location.href = '/admin-nh-7x9k2m/login';
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
