import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const authStateRef = useRef(null);

  const fetchUserProfile = useCallback(async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) {
        console.error("Error fetching user profile:", error);
        return null;
      }
      return data;
    } catch (error) {
      console.error("Exception fetching user profile:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('🔴 ERROR EN AUTH:', error);
        setLoading(false);
      }
    };
    getSessionAndProfile();


    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🟡 AUTH STATE CHANGE:', event, session?.user?.id);
        
        // ✅ Cancelar la actualización anterior si aún no terminó
        if (authStateRef.current) {
          clearTimeout(authStateRef.current);
        }
        
        authStateRef.current = setTimeout(async () => {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const profile = await fetchUserProfile(session.user.id);
            console.log('🟡 PROFILE EN LISTENER:', profile);
            setUserProfile(profile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
          authStateRef.current = null;
        }, 100); // Espera 100ms antes de procesar
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
   }, []);

  const signUp = useCallback(async (email, password, fullName) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    });
    if (error) {
      toast({ title: "Error de Registro", description: error.message, variant: "destructive" });
    } else if (data.user && data.user.identities?.length === 0) {
      toast({ title: "Usuario ya existe", description: "Un usuario con este correo electrónico ya existe. Por favor, inicia sesión.", variant: "destructive" });
    } else if (data.user) {
      toast({ title: "Registro Exitoso", description: "Por favor, revisa tu correo para verificar tu cuenta." });
    }
    setLoading(false);
    return { user: data.user, error };
  }, [toast]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ title: "Error al Iniciar Sesión", description: error.message, variant: "destructive" });
    } else if (data.user) {
      const profile = await fetchUserProfile(data.user.id);
      setUserProfile(profile);
      toast({ title: "Inicio de Sesión Exitoso", description: "¡Bienvenido/a de nuevo!" });
    }
    setLoading(false);
    return { user: data.user, error };
  }, [toast, fetchUserProfile]);

  const signOut = useCallback(async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({ title: "Error al Cerrar Sesión", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sesión Cerrada", description: "Has cerrado sesión exitosamente." });
      // No necesitas setUser(null) ni setUserProfile(null), ya lo hace el listener
    }
    setLoading(false);
    return { error };
  }, [toast]);

  const sendPasswordResetEmail = useCallback(async (email) => {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/actualizar-contrasena',
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Correo Enviado", description: "Si existe una cuenta con este correo, recibirás un enlace para restablecer tu contraseña." });
    }
    setLoading(false);
    return { data, error };
  }, [toast]);

  // SOLO MODIFICO ESTA FUNCIÓN - el resto queda igual
  const updateUserPassword = useCallback(async (newPassword, accessToken = null, refreshToken = null) => {
    setLoading(true);
    
    try {
      // Si hay tokens de recovery, establecer sesión primero
      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (sessionError) {
          toast({ title: "Token inválido", description: "El enlace de recuperación es inválido o ha expirado.", variant: "destructive" });
          setLoading(false);
          return { data: null, error: sessionError };
        }
      }
      
      // Actualizar contraseña
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        toast({ title: "Error al Actualizar Contraseña", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Contraseña Actualizada", description: "Tu contraseña ha sido actualizada exitosamente." });
      }
      
      setLoading(false);
      return { data, error };
      
    } catch (err) {
      toast({ title: "Error", description: "Ocurrió un error inesperado.", variant: "destructive" });
      setLoading(false);
      return { data: null, error: err };
    }
  }, [toast]);

  const updateUserProfile = useCallback(async (profileData) => {
    if (!user) return { error: { message: "Usuario no autenticado" } };
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .update(profileData)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Error al Actualizar Perfil", description: error.message, variant: "destructive" });
    } else if (data) {
      setUserProfile(data);
      toast({ title: "Perfil Actualizado", description: "Tu información de perfil ha sido actualizada." });
    }
    setLoading(false);
    return { data, error };
  }, [user, toast]);

  const value = useMemo(() => ({
    session,
    user,
    userProfile,
    isAuthenticated: !!session,
    loading,
    signUp,
    signIn,
    signOut,
    sendPasswordResetEmail,
    updateUserPassword,
    updateUserProfile,
    fetchUserProfile,
  }), [session, user, userProfile, loading, signUp, signIn, signOut, sendPasswordResetEmail, updateUserPassword, updateUserProfile, fetchUserProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};