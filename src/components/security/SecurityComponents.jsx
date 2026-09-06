import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, CheckCircle, Lock, Box, Clock, HeadphonesIcon, RotateCcw, Check, AlertTriangle, ShoppingCart, ClipboardList, CreditCard, X, Phone, Zap } from 'lucide-react';
import { VisaLogo, MastercardLogo, PseLogo, NequiLogo, DaviplataLogo, BancolombiaLogo } from '@/components/ui/PaymentMethodLogos';
import { motion } from 'framer-motion';

// Badge de seguridad SSL
export const SecurityBadge = () => (
  <div className="flex items-center justify-center space-x-2 mb-6 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-sm shadow-sm">
    <Shield className="h-5 w-5 text-green-600" />
    <span className="text-sm text-green-800 font-medium">
      <Lock className="inline-block h-4 w-4 mr-1" /> Conexión segura - Tus datos están protegidos con encriptación SSL
    </span>
    <Shield className="h-5 w-5 text-green-600" />
  </div>
);

// Badges de confianza de Wompi
export const TrustBadges = () => (
  <div className="mt-4 p-4 rounded-sm">
    <div className="flex items-center justify-center space-x-3 mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <Lock className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-foreground">Pagos seguros procesados por Wompi</span>
      </div>
    </div>
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-2 place-items-center text-xs text-foreground/80">
      <VisaLogo />
      <MastercardLogo />
      <PseLogo />
      <NequiLogo />
      <DaviplataLogo />
      <BancolombiaLogo />
    </div>
  </div>
);


export const CheckoutProgress = ({ currentStep = 1, status = true }) => {
  const steps = [
    { name: 'Carrito', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Información', icon: <ClipboardList className="h-5 w-5" /> },
    { name: 'Pago', icon: <CreditCard className="h-5 w-5" /> },
    { name: 'Procesando', icon: <Box className="h-5 w-5" /> }
  ];

  return (
    <div className="mb-8 px-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          // --- Determinar color y icono según status ---
          let circleClasses = "";
          let icon = step.icon;

          if (isCompleted) {
            circleClasses = "bg-green-500 text-foreground shadow-lg";
            icon = <Check className="h-5 w-5" />;
          } else if (isCurrent) {
            if (status) {
              circleClasses = "bg-foreground text-background shadow-lg ring-4 ring-foreground/80";
              icon = step.icon;
            } else {
              circleClasses = "bg-red-500 text-foreground shadow-lg ring-4 ring-red-200";
              icon = <X className="h-5 w-5" />;
            }
          } else {
            circleClasses = "bg-background text-foreground";
            icon = step.icon;
          }

          return (
            <React.Fragment key={step.name}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${circleClasses}`}
                >
                  {icon}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    index <= currentStep ? "text-foreground" : "text-foreground/50"
                  }`}
                >
                  {step.name}
                </span>
              </div>

              {/* Línea entre pasos */}
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-4 transition-all duration-300 ${
                    index < currentStep ? "bg-green-500" : "bg-foreground/30"
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};


// Avisos legales mejorados
export const LegalNotices = ({ onAcceptChange, accepted = false }) => (
  <div className="mt-4 p-4 bg-transparent border border-accent rounded-sm">
    <div className="flex items-start space-x-3">
      <Shield className="h-6 w-6 text-foreground mt-0.5 flex-shrink-0" />
      <div className="text-sm text-foreground flex-1">
        <p className="mb-3 font-medium text-foreground text-base"><Shield className="inline-block h-4 w-4 mr-1" /> Tu información está completamente protegida</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs">No almacenamos datos de tarjetas</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs">Cumplimos estándares PCI DSS</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs">Encriptación SSL</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
            <span className="text-xs">Procesamiento seguro certificado</span>
          </div>
        </div>
        <div className="pt-3 border-t border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer group">
            <input 
              type="checkbox" 
              required 
              checked={accepted}
              onChange={(e) => onAcceptChange?.(e.target.checked)}
              className="mt-0.5 w-4 h-4 text-neutral-800 border-gray-300 rounded focus:ring-neutral-800" 
            />
            <span className="text-xs leading-relaxed group-hover:text-foreground/80 transition-colors">
              He leído y acepto los{' '}
              <Link to="/terminos" className="text-blue-600 underline hover:text-blue-800 font-medium" target='_blank'>
                Términos y Condiciones
              </Link>
              {' '}y la{' '}
              <Link to="/privacidad" className="text-blue-600 underline hover:text-blue-800 font-medium" target='_blank'>
                Política de Privacidad
              </Link>
              . Entiendo que mis datos serán procesados de forma segura.
            </span>
          </label>
        </div>
      </div>
    </div>
  </div>
);

// Testimonios de confianza
export const TrustTestimonials = () => (
  <div className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-sm">
    {/* <div className="text-center"> */}
      {/* <div className="flex justify-center items-center space-x-2 mb-2">
        <Users className="h-5 w-5 text-emerald-600" />
        <span className="text-sm font-semibold text-emerald-800">
          Más de 15,000 clientes satisfechos confían en nosotros
        </span>
      </div>
      <div className="flex justify-center space-x-1 mb-2">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
        ))}
        <span className="text-xs text-emerald-700 ml-2">4.9/5 (2,450 reseñas)</span>
      </div> */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-emerald-700 mt-3">
        <div className="flex items-center justify-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>Procesamiento en &lt;30s</span>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <HeadphonesIcon className="h-3 w-3" />
          <span>Soporte 24/7</span>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <RotateCcw className="h-3 w-3" />
          <span>Garantía 30 días</span>
        </div>
      {/* </div> */}
    </div>
  </div>
);

// Loading spinner mejorado
export const LoadingSpinner = ({ message = "Cargando...", size = "default" }) => {
  const sizeClasses = {
    small: "h-5 w-5",
    default: "h-8 w-8",
    large: "h-12 w-12"
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} animate-spin text-neutral-800`}>
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-neutral-800 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 font-medium">{message}</p>
        <p className="text-xs text-gray-500 mt-1">Procesando de forma segura...</p>
      </div>
    </div>
  );
};

// Error display mejorado
export const ErrorDisplay = ({ error, onRetry }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-sm shadow-sm">
    <div className="flex items-start space-x-3">
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <h4 className="text-sm font-medium text-red-800 mb-1">Ups, algo salió mal</h4>
        <p className="text-red-700 text-sm mb-3">{error}</p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="text-xs text-red-800 underline hover:text-red-900 font-medium"
          >
            Intentar nuevamente
          </button>
        )}
      </div>
    </div>
  </div>
);

// Validación visual para inputs
export const ValidationIcon = ({ isValid, isInvalid }) => {
  if (isValid) {
    return <CheckCircle className="absolute right-3 top-3 h-5 w-5 text-green-500" />;
  }
  if (isInvalid) {
    return <AlertTriangle className="absolute right-3 top-3 h-5 w-5 text-red-500" />;
  }
  return null;
};

export const ValidationMessage = ({ message, type = "error" }) => {
  if (!message) return null;
  
  const colorClasses = {
    error: "text-red-500",
    success: "text-green-500",
    warning: "text-yellow-500"
  };
  
  return (
    <span className={`${colorClasses[type]} text-xs mt-1 block`}>
      {message}
    </span>
  );
};



export const SecurityFooter = () => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.3 }}
    className="mt-12 text-center"
  >
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-foreground/80">
      <div className="flex items-center justify-center space-x-2">
        <Lock className="h-4 w-4 text-green-600" />
        <span>Pagos 100% seguros</span>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Phone className="h-4 w-4 text-blue-600" />
        <span>Soporte especializado</span>
      </div>
      <div className="flex items-center justify-center space-x-2">
        <Zap className="h-4 w-4 text-purple-600" />
        <span>Envíos rápidos y seguros</span>
      </div>
    </div>
  </motion.div>
);
