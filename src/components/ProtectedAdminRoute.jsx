import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedAdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(null); // null = loading

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('id', user.id)
        .single();

      setIsAdmin(!!data && !error);
    };

    checkAdmin();
  }, [user]);

  if (loading || isAdmin === null) return null; // puedes poner un spinner si deseas
  if (!user || !isAdmin) return <Navigate to="/perfil" replace />;

  return children;
};

export default ProtectedAdminRoute;
