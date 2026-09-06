import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, Loader2 } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";

const AuthPage = () => {
  const navigate = useNavigate();
  const { signIn, signUp, sendPasswordResetEmail, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [activeTab, setActiveTab] = useState("signin");
  const { toast } = useToast();

  const handleSignIn = async (e) => {
    e.preventDefault();
    const { error } = await signIn(email, password);
    if (!error) navigate('/perfil');
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error de Registro", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    const { error } = await signUp(email, password);
    if (!error) {
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    const { error } = await sendPasswordResetEmail(resetEmail);
    if (!error) {
      toast({ 
        title: "Correo enviado", 
        description: "Te hemos enviado un enlace para restablecer tu contraseña. Revisa tu correo electrónico.", 
        variant: "default" 
      });
      setResetEmail('');
      setActiveTab("signin");
    }
  };

  const renderSignInForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-signin">Correo Electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email-signin"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signin">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password-signin"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="mr-2 h-4 w-4" />
        )}
        Iniciar Sesión
      </Button>
      <div className="text-center">
        <Button
          variant="link"
          onClick={() => setActiveTab("resetpassword")}
          className="text-primary hover:text-primary/80 text-sm"
        >
          ¿Olvidaste tu contraseña?
        </Button>
      </div>
    </form>
  );

  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-signup">Correo Electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email-signup"
            type="email"
            placeholder="tu@correo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password-signup">Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="password-signup"
            type="password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmar Contraseña</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirma tu contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="mr-2 h-4 w-4" />
        )}
        Registrarse
      </Button>
    </form>
  );

  const renderResetPasswordForm = () => (
    <form onSubmit={handlePasswordReset} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email-reset">Correo Electrónico</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email-reset"
            type="email"
            placeholder="tu@correo.com"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            className="pl-10 border bg-input"
          />
        </div>
      </div>
      <Button 
        type="submit" 
        disabled={loading} 
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
      >
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Mail className="mr-2 h-4 w-4" />
        )}
        Enviar Enlace
      </Button>
      <div className="text-center">
        <Button
          variant="link"
          onClick={() => setActiveTab("signin")}
          className="text-primary hover:text-primary/80 text-sm"
        >
          Volver a Iniciar Sesión
        </Button>
      </div>
    </form>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12"
    >
      <div className="flex flex-col items-center">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[350px]">
          {activeTab !== "resetpassword" && (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
          )}
          <Card className="shadow-sm border bg-card/80 rounded-sm w-full">
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl font-heading font-semibold">
                {activeTab === "signin" && "Iniciar Sesión"}
                {activeTab === "signup" && "Registrarse"}
                {activeTab === "resetpassword" && "Restablecer Contraseña"}
              </CardTitle>
              <CardDescription>
                {activeTab === "signin" && "Ingresa tus credenciales para acceder"}
                {activeTab === "signup" && "Crea una cuenta nueva"}
                {activeTab === "resetpassword" && "Ingresa tu correo para recibir el enlace"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-6">
              <TabsContent value="signin">{renderSignInForm()}</TabsContent>
              <TabsContent value="signup">{renderSignUpForm()}</TabsContent>
              <TabsContent value="resetpassword">{renderResetPasswordForm()}</TabsContent>
            </CardContent>
          </Card>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default AuthPage;