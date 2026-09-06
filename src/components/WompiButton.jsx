import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeData } from '@/utils/validationUtils';
import { LoadingSpinner, ErrorDisplay, TrustBadges } from '@/components/security/SecurityComponents';
import { Shield } from 'lucide-react';

const WompiButton = ({
  publicKey,
  reference,
  amountInCents,        // monto base en CENTAVOS (ej. $10.000 -> 1000000)
  redirectUrl,
  expirationTime,
  formData = {},
  items = [],
  shippingCost = 0,     // ⚠️ Asumo pesos (ej. 5000). Si pasas centavos, ajusta la conversión.
  updateReferenceWithOrderId, // 🔥 NUEVA PROP
  onError,             // Nueva prop para manejar errores
  onProcessing         // Nueva prop para estado de procesamiento
}) => {
  const buttonContainerRef = useRef(null);
  const [signature, setSignature] = useState(null);
  const [currentReference, setCurrentReference] = useState(reference); // 🔥 Estado local para la referencia actual
  const orderCreatedRef = useRef(false); // solo marca creación de orden (no bloquea firma)
  const observerRef = useRef(null);
  const cleanupFunctionsRef = useRef([]);
  const [isShippingReady, setIsShippingReady] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef(null);
  const { user } = useAuth();

  const baseUrl = import.meta.env.DEV
    ? "https://gfbpnljevubkiefjmrnf.functions.supabase.co"
    : "https://gfbpnljevubkiefjmrnf.functions.supabase.co";

  // 🔥 Sincronizar referencia local con prop
  useEffect(() => {
    setCurrentReference(reference);
  }, [reference]);

  // Shipping ready with enhanced validation
  useEffect(() => {
    const isValidShipping = (formData?.city && typeof shippingCost === 'number') || (!formData?.city && shippingCost === 0);
    setIsShippingReady(isValidShipping);
  }, [formData?.city, shippingCost]);

  // Enhanced error handling
  const handleError = useCallback((errorMessage, errorDetails = null) => {
    console.error('[WompiButton] Error:', errorMessage, errorDetails);
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  }, [onError]);

  // Enhanced data sanitization
  const sanitizeFormData = useCallback((data) => {
    return sanitizeData({
      fullName: data?.fullName || "Invitado",
      email: data?.email || "colombia@prueba.com",
      phone: data?.phone || "3000000000",
      address: data?.address || "Sin dirección",
      city: data?.city || "Bogotá",
      department: data?.department || "Colombia",
      country: data?.country || "CO",
      phonePrefix: data?.phonePrefix || "+57",
      notes : data?.notes || "Sin notas"
    });
  }, []);

  // cleanup centralizado
  const cleanup = useCallback(() => {
    cleanupFunctionsRef.current.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.warn('[WompiButton] Error in cleanup:', error);
      }
    });
    cleanupFunctionsRef.current = [];
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // --- Helper: convertir shipping a centavos ---
  const shippingCostInCents = Math.round(Number(shippingCost || 0) * 100);

  // monto final en centavos: monto base + envío
  const totalAmountInCents = (Number(amountInCents) || 0) + shippingCostInCents;

  // Enhanced order creation and signature generation
  useEffect(() => {
    if (!currentReference || !totalAmountInCents || !expirationTime || !isShippingReady) {
      console.log('[WompiButton] Esperando datos completos', { 
        reference: !!currentReference, 
        totalAmountInCents: !!totalAmountInCents, 
        expirationTime: !!expirationTime, 
        isShippingReady 
      });
      return;
    }

    // Clear previous debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      onProcessing?.(true);

      try {
        console.log('🔐 WompiButton - Iniciando proceso seguro (total en centavos):', totalAmountInCents);
        console.log('🚚 WompiButton - Costo de envío (pesos):', shippingCost);

        // Sanitize form data
        const sanitizedData = sanitizeFormData(formData);

        // Verificar si la orden ya existe
        const { data: existing, error: selErr } = await supabase
          .from('orders')
          .select('id')
          .eq('reference', currentReference)
          .maybeSingle();

        if (selErr) {
          throw new Error(`Error verificando orden existente: ${selErr.message}`);
        }

        let finalReference = currentReference;

        if (!existing) {
          // Crear orden con datos sanitizados
          const orderData = {
            full_name: sanitizedData.fullName,
            email: sanitizedData.email,
            address: sanitizedData.address,
            phone: sanitizedData.phone,
            items: JSON.stringify(items),
            total: totalAmountInCents / 100, // Total completo incluyendo envío
            shipping_price: Number(shippingCost || 0),
            status: "pending",
            reference: currentReference,
            user_id: user?.id || null,
            department_order: sanitizedData.department,
            city_order: sanitizedData.city,
            notes: sanitizedData.notes,
            created_at: new Date().toISOString()
          };

          const { data: newOrder, error } = await supabase
            .from('orders')
            .insert([orderData])
            .select('id')
            .single();

          if (error) {
            throw new Error(`Error creando orden: ${error.message}`);
          }

          orderCreatedRef.current = true;
          console.log("✅ [WompiButton] Orden creada en Supabase con ID:", newOrder.id);
          
          // 🔥 ACTUALIZAR REFERENCIA CON EL ID DE LA ORDEN
          if (updateReferenceWithOrderId && newOrder.id) {
            finalReference = updateReferenceWithOrderId(newOrder.id);
            setCurrentReference(finalReference);
            console.log("🎯 Referencia actualizada:", finalReference);
            
            // 🔥 ACTUALIZAR LA REFERENCIA EN LA BASE DE DATOS
            const { error: updateError } = await supabase
              .from('orders')
              .update({ reference: finalReference })
              .eq('id', newOrder.id);
              
            if (updateError) {
              console.warn("⚠️ Error actualizando referencia en BD:", updateError);
            } else {
              console.log("✅ Referencia actualizada en BD:", finalReference);
            }
          }
        } else {
          // Actualizar orden existente con datos sanitizados
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              full_name: sanitizedData.fullName,
              email: sanitizedData.email,
              address: sanitizedData.address,
              phone: sanitizedData.phone,
              total: totalAmountInCents / 100,
              shipping_price: Number(shippingCost || 0),
              items: JSON.stringify(items),
              user_id: user?.id || null,
              department_order: sanitizedData.department,
              city_order: sanitizedData.city,
              notes: sanitizedData.notes,
              updated_at: new Date().toISOString()
            })
            .eq('reference', currentReference);

          if (updateError) {
            console.warn('[WompiButton] Error actualizando orden existente:', updateError);
          } else {
            console.log('✅ [WompiButton] Orden existente actualizada');
          }
        }

        // GENERAR firma SIEMPRE usando datos validados
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const signaturePayload = {
          amountInCents: totalAmountInCents,
          currency: "COP",
          expirationTime,
          reference: finalReference
        };

        console.log('🔐 Generando firma con payload:', signaturePayload);

        const res = await fetch(`${baseUrl}/functions/v1/generate-wompi-signature`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify(signaturePayload)
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Error generando firma (${res.status}): ${errorText}`);
        }

        const dataRes = await res.json();
        
        if (!dataRes.signature) {
          throw new Error('No se recibió firma válida del servidor');
        }

        console.log('✅ [WompiButton] Firma generada exitosamente para referencia:', finalReference);
        setSignature(dataRes.signature);

      } catch (err) {
        handleError("Error procesando el pago. Por favor, intenta nuevamente.", err);
      } finally {
        setIsLoading(false);
        onProcessing?.(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [currentReference, totalAmountInCents, expirationTime, baseUrl, isShippingReady, formData, items, shippingCost, updateReferenceWithOrderId, user?.id, sanitizeFormData, handleError, onProcessing]);

  // Enhanced order update function
  const updateOrder = useCallback(async () => {
    if (!currentReference) return;

    try {
      const sanitizedData = sanitizeFormData(formData);
      
      const { error } = await supabase
        .from('orders')
        .update({
          full_name: sanitizedData.fullName,
          email: sanitizedData.email,
          address: sanitizedData.address,
          phone: sanitizedData.phone,
          total: totalAmountInCents / 100,
          shipping_price: Number(shippingCost || 0),
          items: JSON.stringify(items),
          department_order: sanitizedData.department,
          city_order: sanitizedData.city,
          notes: sanitizedData.notes,
          updated_at: new Date().toISOString()
        })
        .eq('reference', currentReference);

      if (error) throw error;
      console.log('✅ [WompiButton] Orden actualizada antes del pago');
    } catch (err) {
      console.error('[WompiButton] Error al actualizar orden:', err);
      handleError("Error actualizando información de la orden", err);
    }
  }, [formData, totalAmountInCents, items, currentReference, shippingCost, sanitizeFormData, handleError]);

  // Enhanced widget rendering
  useEffect(() => {
    cleanup();

    if (!signature || !publicKey || !currentReference || !totalAmountInCents || isLoading) {
      return;
    }

    const container = buttonContainerRef.current;
    if (!container) return;

    container.innerHTML = '';

    try {
      const sanitizedData = sanitizeFormData(formData);
      
      const script = document.createElement('script');
      script.src = `https://checkout.wompi.co/widget.js?cache_bust=${Date.now()}`;
      script.setAttribute('data-render', 'button');
      script.setAttribute('data-public-key', publicKey);
      script.setAttribute('data-currency', 'COP');
      script.setAttribute('data-amount-in-cents', totalAmountInCents.toString());
      script.setAttribute('data-reference', currentReference);
      script.setAttribute('data-redirect-url', `${redirectUrl}?reference=${currentReference}`);
      script.setAttribute('data-expiration-time', expirationTime);
      script.setAttribute('data-default-language', 'es');
      script.setAttribute('data-signature:integrity', signature);

      // Enhanced customer data with sanitization
      script.setAttribute('data-customer-data:email', sanitizedData.email);
      script.setAttribute('data-customer-data:full-name', sanitizedData.fullName);
      script.setAttribute('data-customer-data:phone-number', sanitizedData.phone);
      script.setAttribute('data-customer-data:phone-number-prefix', sanitizedData.phonePrefix);

      // Enhanced shipping address
      script.setAttribute('data-shipping-address:address-line-1', sanitizedData.address);
      script.setAttribute('data-shipping-address:country', sanitizedData.country);
      script.setAttribute('data-shipping-address:city', sanitizedData.city);
      script.setAttribute('data-shipping-address:region', sanitizedData.department);
      script.setAttribute('data-shipping-address:phone-number', sanitizedData.phone);

      const handleScriptClick = () => {
        console.log('🖱️ Script click - actualizando orden');
        updateOrder();
      };
      
      script.addEventListener('click', handleScriptClick);
      cleanupFunctionsRef.current.push(() => {
        script.removeEventListener('click', handleScriptClick);
      });

      container.appendChild(script);

      // Enhanced mutation observer
      observerRef.current = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const wompiBtn = node.querySelector ? node.querySelector('button') : 
                            (node.tagName === 'BUTTON' ? node : null);
              
              if (wompiBtn) {
                console.log('✅ Botón Wompi detectado y configurado');
                
                const handleButtonClick = () => {
                  console.log('🖱️ Botón Wompi click - actualizando orden');
                  updateOrder();
                };
                
                wompiBtn.addEventListener('click', handleButtonClick);
                cleanupFunctionsRef.current.push(() => {
                  wompiBtn.removeEventListener('click', handleButtonClick);
                });
                
                if (observerRef.current) {
                  observerRef.current.disconnect();
                  observerRef.current = null;
                }
              }
            }
          });
        });
      });

      observerRef.current.observe(container, { 
        childList: true, 
        subtree: true,
        attributes: false,
        characterData: false
      });

    } catch (error) {
      console.error('[WompiButton] Error configurando widget:', error);
      handleError("Error configurando el botón de pago", error);
    }

    return cleanup;
  }, [signature, publicKey, currentReference, totalAmountInCents, redirectUrl, expirationTime, formData, updateOrder, cleanup, isLoading, sanitizeFormData, handleError]);

  // cleanup on unmount
  useEffect(() => cleanup, [cleanup]);

  // Loading state
  if (!isShippingReady) {
    return (
      <div className="p-4 bg-edit/10 border border-edit/40 rounded-sm">
        <LoadingSpinner message="Calculando costo de envío..." size="small" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error}
        onRetry={() => {
          setError(null);
          setSignature(null);
        }}
      />
    );
  }

  // Loading signature
  if (isLoading || !signature) {
    return (
      <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/40 rounded-sm">
        <div className="text-center space-y-3">
          <LoadingSpinner message="Preparando pago seguro..." size="small" />
          <div className="flex items-center justify-center space-x-2 text-sm text-primary">
            <Shield className="h-4 w-4" />
            <span>Verificando datos con Wompi...</span>
          </div>
        </div>
      </div>
    );
  }

  // Success state with enhanced styling
  return (
    <div className="space-y-3">
      
      
      <div className="relative">
        <div ref={buttonContainerRef} className="w-full flex justify-center" />
        
        {/* Loading overlay while processing */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/90 flex items-center justify-center rounded-sm">
            <LoadingSpinner message="Procesando..." size="small" />
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
      <TrustBadges/>
        </div>
    </div>
  );
};

export default WompiButton;
