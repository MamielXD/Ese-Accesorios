import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/contexts/PointsContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import CheckoutForm from '@/components/checkout/CheckoutForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import useCheckoutForm from '@/hooks/useCheckoutForm';
import { ShoppingBag, PartyPopper, AlertTriangle, Phone, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { 
  SecurityBadge, 
  CheckoutProgress, 
  LoadingSpinner,
  SecurityFooter
} from '@/components/security/SecurityComponents';
import { validateForm } from '@/utils/validationUtils';

// Función para generar una referencia de pago única (Corregida)
function generateDateId(orderId = null) {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1; // Usar número del mes (1-12)
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}${minutes}`;
  const baseId = `p${day}${month}${timeString}`;

  if (!orderId) {
    return baseId;
  }
  
  const orderSuffix = orderId.slice(-4);
  return `${baseId}r${orderSuffix}`;
}

function getExpirationTimeConsistent(minutesFromNow) {
  const date = new Date(Date.now() + minutesFromNow * 60000);
  date.setMilliseconds(0);
  return date.toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

const CheckoutPage = () => {
  const [reference, setReference] = useState(() => generateDateId());
  const [expirationTime] = useState(() => getExpirationTimeConsistent(10));
  const [userCoupons, setUserCoupons] = useState([]);
  const [formValidation, setFormValidation] = useState({ isValid: false, errors: {}, validFields: {} });
  const [legalAccepted, setLegalAccepted] = useState(false);
  const [isFormReady, setIsFormReady] = useState(false);

  const { cart, globalPromo, loading: cartLoading } = useCart();
  const { userProfile, loading: authLoading } = useAuth();
  const { calculatePointsFromOrder } = usePoints();
  const navigate = useNavigate();
  
  const publicKey = import.meta.env.VITE_WOMPI_PUBLIC_KEY;
  const redirectUrl = import.meta.env.VITE_WOMPI_REDIRECT_URL;

  const {
    formData,
    setFormData,
    departments,
    cities,
    selectedDepartment,
    locationsLoading,
    handleInputChange,
    handleDepartmentChange,
    handleCityChange,
    shippingCost,
  } = useCheckoutForm();

  // Validación en tiempo real del formulario
  useEffect(() => {
    const validation = validateForm(formData);
    setFormValidation(validation);
    setIsFormReady(validation.isValid);
  }, [formData]);

  // Traer cupones del usuario
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!userProfile?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_promotions')
          .select('promotion_id, promotions(id, title, discount_value, discount_type)')
          .eq('user_id', userProfile.id);

        if (error) {
          console.error('Error cargando cupones:', error);
          return;
        }

        const normalized = (data || []).map((row) => ({
          id: row.promotions.id,
          title: row.promotions?.title ?? 'Cupón',
          code: `${row.promotions?.title.toUpperCase() ?? 'CUPON'}${row.promotions?.discount_value}` ?? 'N/A',
          discount_value: Number(row.promotions?.discount_value ?? 0),
          discount_type: row.promotions?.discount_type ?? 'percentage',
        }));
        
        setUserCoupons(normalized);
      } catch (error) {
        console.error('Error fetching coupons:', error);
      }
    };

    if (userProfile?.id) {
      fetchCoupons();
    }
  }, [userProfile]);

  // ✅ CÁLCULO DE SUBTOTALES (AHORA SIMPLE Y DIRECTO)
  const { subtotal, originalSubtotal } = useMemo(() => {
    const discountedSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const original = cart.reduce((sum, item) => sum + item.originalPrice * item.quantity, 0);

    return {
      subtotal: discountedSubtotal,
      originalSubtotal: original,
    };
  }, [cart]);

  const pointsToEarn = calculatePointsFromOrder(subtotal);

  const updateReferenceWithOrderId = (orderId) => {
    const newReference = generateDateId(orderId);
    setReference(newReference);
    return newReference;
  };

  // Loading state mejorado
  if (authLoading || cartLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <LoadingSpinner message="Cargando información de tu cuenta..." size="large" />
        </div>
      </div>
    );
  }

  // Empty cart state mejorado
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="container mx-auto px-4 py-20 text-center"
        >
          <div className="max-w-md mx-auto">
            <ShoppingBag className="h-16 w-16 text-neutral-400 mx-auto mb-6" />
            <h1 className="text-3xl font-light text-neutral-800 mb-4">
              Tu carrito está vacío
            </h1>
            <p className="text-neutral-600 mb-8">
              Descubre nuestras increíbles piezas y encuentra algo especial para ti.
            </p>
            <Button 
              onClick={() => navigate('/productos')}
              size="lg"
              className="bg-neutral-800 hover:bg-neutral-900"
            >
              Explorar Piezas
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >
        {/* Progress bar */}
        <CheckoutProgress currentStep={1} />

        {/* Título principal */}
        <h1 className="text-4xl font-heading tracking-wide text-center text-foreground mb-6">
          Finalizar Compra
        </h1>

        {/* Badge de seguridad */}
        <SecurityBadge />

        {/* Promoción global */}
        {globalPromo && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-background text-foreground p-4 rounded-sm mb-6 text-center shadow-lg"
          >
            <p className="font-medium">
              <PartyPopper className="inline-block h-5 w-5 mr-2" /> ¡Promoción activa! {globalPromo.discount_value}% de descuento aplicado
            </p>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutForm 
              formData={formData} 
              handleInputChange={handleInputChange} 
              handleDepartmentChange={handleDepartmentChange}
              handleCityChange={handleCityChange}
              departments={departments}
              cities={cities} 
              selectedDepartment={selectedDepartment}
              setFormData={setFormData}
              locationsLoading={locationsLoading}
              formValidation={formValidation}
            />
            

          </div>

          {/* Resumen */}
          <div className="lg:col-span-1 space-y-6">
            <OrderSummary 
              cart={cart} 
              subtotal={subtotal}
              originalSubtotal={originalSubtotal}
              shippingCost={shippingCost} 
              pointsToEarn={pointsToEarn}
              formData={formData}
              reference={reference}
              expirationTime={expirationTime}
              redirectUrl={redirectUrl}
              publicKey={publicKey}
              userCoupons={userCoupons}
              globalPromo={globalPromo}
              updateReferenceWithOrderId={updateReferenceWithOrderId}
              isFormReady={isFormReady}
              formValidation={formValidation}
            />
            
          </div>
        </div>
        <SecurityFooter/>
        <div className="border border-accent p-4 rounded-sm mt-8">
        <h3 className="text-sm font-medium text-foreground mb-2 flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          ¿Necesitas ayuda?
        </h3>
        <div className="space-y-2 text-xs text-foreground/80">
          <p className="flex items-center">
            <Phone className="h-4 w-4 mr-2" />
            WhatsApp: <strong> +57 314 299 1068</strong>
          </p>
          <p className="flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Email: <strong> contacto@eseaccesorios.com</strong>
          </p>
        </div>
      </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;
