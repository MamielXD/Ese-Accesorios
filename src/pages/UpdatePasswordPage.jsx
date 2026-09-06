import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Lock, Key, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const UpdatePasswordPage = () => {
  const navigate = useNavigate();
  const { updateUserPassword, loading, user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [tokenError, setTokenError] = useState(false);

  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1));
    
    // Verificar si es un enlace de recuperación de contraseña
    if (params.get('type') === 'recovery') {
      const token = params.get('access_token');
      const refresh = params.get('refresh_token');
      
      if (token && refresh) {
        setAccessToken(token);
        setRefreshToken(refresh);
        setIsRecoveryMode(true);
        setIsReady(true);
        
        // Limpiar la URL por seguridad (opcional)
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        setTokenError(true);
      }
    } else if (!user) {
      // Si no hay usuario logueado y no es modo recovery, redirigir
      navigate('/auth'); 
    } else {
      // Usuario logueado normalmente
      setIsReady(true);
    }
  }, [user, navigate]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Error", 
        description: "Las contraseñas no coinciden.", 
        variant: "destructive" 
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({ 
        title: "Error", 
        description: "La contraseña debe tener al menos 6 caracteres.", 
        variant: "destructive" 
      });
      return;
    }

    let result;
    
    if (isRecoveryMode) {
      // Pasar los tokens a la función updateUserPassword
      result = await updateUserPassword(newPassword, accessToken, refreshToken);
    } else {
      // Usuario logueado normalmente
      result = await updateUserPassword(newPassword);
    }

    if (!result.error) {
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirigir según el contexto
      setTimeout(() => {
        if (isRecoveryMode) {
          navigate('/auth');
        } else {
          navigate('/perfil');
        }
      }, 2000);
    }
  };

  // Mostrar error si el token es inválido
  if (tokenError) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-md shadow-sm border border-red-200 bg-white/80">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-light tracking-wide text-red-800">
              Enlace Inválido
            </CardTitle>
            <CardDescription className="text-red-600">
              El enlace de recuperación es inválido o ha expirado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/auth')}
              variant="destructive"
              className="w-full"
            >
              Volver al Inicio
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Loading state
  if (!isReady && !loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"
      >
        <Card className="w-full max-w-md shadow-sm border border-stone-200 bg-white/80">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-light tracking-wide text-neutral-800">
              Verificando...
            </CardTitle>
            <CardDescription className="text-stone-600">
              Comprobando tu solicitud de cambio de contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (loading && !isReady) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"
      >
        <Loader2 className="h-12 w-12 animate-spin text-neutral-700" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"
    >
      <Card className="w-full max-w-md shadow-xl border border-stone-200 bg-white/80">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center">
            <Key className="h-6 w-6 text-neutral-800" />
          </div>
          <CardTitle className="text-3xl font-light tracking-wide text-neutral-800">
            {isRecoveryMode ? 'Restablecer Contraseña' : 'Actualizar Contraseña'}
          </CardTitle>
          <CardDescription className="text-stone-600">
            {isRecoveryMode 
              ? 'Ingresa tu nueva contraseña para completar la recuperación.' 
              : 'Ingresa tu nueva contraseña.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-neutral-700">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input 
                  id="new-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  className="pl-10 border-stone-300 focus:border-neutral-800 focus:ring-neutral-800"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-neutral-700">
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400" />
                <Input 
                  id="confirm-password" 
                  type="password" 
                  placeholder="••••••••" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  className="pl-10 border-stone-300 focus:border-neutral-800 focus:ring-neutral-800"
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Key className="mr-2 h-4 w-4" />
              )}
              {isRecoveryMode ? 'Restablecer Contraseña' : 'Actualizar Contraseña'}
            </Button>
          </form>
          
          {isRecoveryMode && (
            <div className="text-center">
              <Button
                variant="link"
                onClick={() => navigate('/auth')}
                className="text-stone-600 hover:text-neutral-800 text-sm"
              >
                Volver al inicio de sesión
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter/>
      </Card>
    </motion.div>
  );
};

export default UpdatePasswordPage;