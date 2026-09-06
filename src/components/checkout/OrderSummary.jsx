import React, { useState, useEffect, useMemo } from 'react';
import { Truck, AlertTriangle, Star, Eye, EyeOff, Tag, Lock, Shield, CheckCircle2, Clock, PartyPopper, Wallet } from 'lucide-react';
import WompiButton from '@/components/WompiButton';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {ErrorDisplay, LegalNotices } from '@/components/security/SecurityComponents';
import { getImageUrl } from '@/utils/imageHelpers';


const OrderSummary = ({
  cart,
  subtotal,
  originalSubtotal,
  shippingCost,
  pointsToEarn,
  formData,
  reference,
  expirationTime,
  redirectUrl,
  publicKey,
  updateReferenceWithOrderId,
  globalPromo,
  userCoupons = [],
  isFormReady = false,
  formValidation
}) => {
  const [expanded, setExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(3);
  const [useCoupon, setUseCoupon] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLegalReady, setLegalAccepted] = useState(false);


  useEffect(() => {
    const updateVisibleCount = () => {
      window.innerWidth >= 640 ? setVisibleCount(4) : setVisibleCount(2);
    };
    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);
  
  useEffect(() => {
    if (useCoupon && !selectedCoupon && userCoupons.length > 0) {
      setSelectedCoupon(userCoupons[0]);
    } else if (!useCoupon) {
      setSelectedCoupon(null);
    }
  }, [useCoupon, userCoupons, selectedCoupon]);

  const {
    globalDiscount,
    couponDiscount,
    totalDiscount,
    finalTotal,
    finalTotalInCentsWompi,
  } = useMemo(() => {
    const subtotalInCents = Math.round(subtotal * 100);
    const shippingCostInCents = Math.round(shippingCost * 100);
    const originalSubtotalInCents = Math.round(originalSubtotal * 100);
    
    const globalDiscountInCents = originalSubtotalInCents - subtotalInCents;

    const couponDiscountInCents = (() => {
      if (!useCoupon || !selectedCoupon) return 0;
      if (selectedCoupon.discount_type === 'percentage') {
        return Math.round(subtotalInCents * (selectedCoupon.discount_value / 100));
      }
      if (selectedCoupon.discount_type === 'fixed') {
        const fixedDiscountInCents = selectedCoupon.discount_value * 100;
        return Math.min(fixedDiscountInCents, subtotalInCents);
      }
      return 0;
    })();

    const totalDiscountInCents = globalDiscountInCents + couponDiscountInCents;
    const finalTotalInCents = subtotalInCents - couponDiscountInCents + shippingCostInCents;
    const finalTotalInCentsWompi = finalTotalInCents - shippingCostInCents;

    return {
      globalDiscount: globalDiscountInCents / 100,
      couponDiscount: couponDiscountInCents / 100,
      totalDiscount: totalDiscountInCents / 100,
      finalTotal: finalTotalInCents / 100,
      finalTotalInCents,
      finalTotalInCentsWompi,
    };
  }, [subtotal, originalSubtotal, shippingCost, useCoupon, selectedCoupon]);

  const visibleItems = expanded ? cart : cart.slice(0, visibleCount);

  const getCouponDisplayText = (coupon) => {
    if (coupon.discount_type === 'percentage') return `${coupon.discount_value}% OFF`;
    if (coupon.discount_type === 'fixed') return `$${coupon.discount_value.toLocaleString()} OFF`;
    return `${coupon.discount_value}% OFF`;
  };

  const handleRetryPayment = () => {
    setPaymentError(null);
    setIsProcessing(false);
  };

  return (
    <div className="space-y-4">
      {/* Resumen principal */}
      <div className="bg-background backdrop-blur-sm p-6 rounded-lg border border-accent shadow-lg sticky top-24">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading text-foreground flex items-center">
            <Truck className="mr-2 h-5 w-5 text-foreground" />
            Resumen del Pedido
          </h2>
          {isFormReady && isLegalReady && (
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="text-xs text-green-600 font-medium">Listo para pagar</span>
            </div>
          )}
        </div>

        {/* Promoción global */}
        {globalPromo && (
          <div className="bg-background border border-accent rounded-sm p-3 text-center mb-4">
            <p className="text-sm text-foreground font-medium">
              <PartyPopper className="inline-block h-4 w-4 mr-1" /> {globalPromo.discount_value}% OFF en toda la tienda
            </p>
            <p className="text-xs text-foreground/80 mt-1">{globalPromo.title}</p>
          </div>
        )}

        {/* Items del carrito */}
        <div className="space-y-3 mb-4">
          {visibleItems.map(item => (
            <div key={item.id} className="flex justify-between items-center text-sm text-foreground border-b border-accent pb-3">
              <div className="flex items-center max-w-[calc(100%-100px)]">
                <div className="relative">
                  <img
                  src={getImageUrl(item.image, 'small')} alt={item.name} className="w-14 h-14 object-cover rounded-sm mr-3 shadow-sm"
                  />
                  <span className="absolute -top-1 -right-1 bg-background text-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                    {item.quantity}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{item.name}</span>
                  <span className="text-xs text-foreground/80">Cantidad: {item.quantity}</span>
                </div>
              </div>
              <div className="text-right">
                {globalPromo ? (
                  <div>
                    <span className="text-xs text-gray-400 line-through block">
                      ${(item.originalPrice * item.quantity).toLocaleString()}
                    </span>
                    <span className="font-semibold text-emerald-600">
                      ${(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <span className="font-semibold text-foreground">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}

          {cart.length > visibleCount && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="w-full border border-accent hover:border-accent text-foreground"
            >
              {expanded ? (
                <><EyeOff className="h-4 w-4 mr-2" /> Mostrar menos</>
              ) : (
                <><Eye className="h-4 w-4 mr-2" /> Ver {cart.length-3} más</>
              )}
            </Button>
          )}
        </div>
        
        {/* Selector de cupones */}
        {userCoupons.length > 0 && (
          <div className="border border-accent p-4 rounded-sm bg-gradient-to-r from-rose-50 to-pink-50 mb-4">
            <label className="flex items-center text-sm text-foreground cursor-pointer group">
              <input
                type="checkbox"
                checked={useCoupon}
                onChange={() => setUseCoupon(!useCoupon)}
                className="mr-3 w-4 h-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
              />
              <Tag className="h-4 w-4 mr-2 text-rose-600" />
              <span className="group-hover:text-neutral-800 transition-colors font-medium">
                Aplicar cupón de descuento adicional
              </span>
            </label>
            {useCoupon && (
              <Select
                value={selectedCoupon?.id || ''}
                onValueChange={(value) => {
                  const c = userCoupons.find(c => c.id.toString() === value);
                  setSelectedCoupon(c);
                }}
              >
                <SelectTrigger className="mt-3 w-full border-rose-200 focus:border-rose-400">
                  <SelectValue placeholder="Selecciona tu cupón favorito" />
                </SelectTrigger>
                <SelectContent>
                  {userCoupons.map(coupon => (
                    <SelectItem key={coupon.id} value={coupon.id.toString()}>
                      <div className="flex items-center justify-between w-full">
                        <span>{coupon.title}</span>
                        <span className="ml-2 text-rose-600 font-medium">
                          {getCouponDisplayText(coupon)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {/* Resumen de precios */}
        <div className="pt-4 space-y-3 border-t border-accent">
          {globalPromo && (
            <div className="flex justify-between text-sm text-foreground/80">
              <span>Subtotal original:</span>
              <span className="line-through">${originalSubtotal.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-foreground/80">
            <span>Subtotal{globalPromo ? ' con descuento' : ''}:</span>
            <span className={globalPromo ? 'text-emerald-600 font-medium' : 'font-medium'}>
              ${subtotal.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm text-foreground/80">
            <span>Envío:</span>
            <span className="font-medium">${shippingCost.toLocaleString()}</span>
          </div>
          {globalDiscount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600">
              <span>Descuento promocional:</span>
              <span className="font-medium">- ${globalDiscount.toLocaleString()}</span>
            </div>
          )}
          {couponDiscount > 0 && (
            <div className="flex justify-between text-sm text-rose-600">
              <span>Descuento cupón ({selectedCoupon?.code}):</span>
              <span className="font-medium">- ${couponDiscount.toLocaleString()}</span>
            </div>
          )}
          
          {/* Total final destacado */}
          <div className="flex justify-between text-xl font-bold text-foreground pt-3 border-t-2 border-accent bg-background -mx-2 px-2 py-3 rounded-sm">
            <span>Total a pagar:</span>
            <span className={totalDiscount > 0 ? 'text-emerald-700' : 'text-foreground'}>
              ${finalTotal.toLocaleString()}
            </span>
          </div>
          
          {totalDiscount > 0 && (
            <div className="flex justify-between text-sm text-emerald-700 font-semibold bg-emerald-50 -mx-2 px-2 py-2 rounded-sm">
              <span><Wallet className="inline-block h-4 w-4 mr-1" /> Total ahorrado:</span>
              <span>${totalDiscount.toLocaleString()}</span>
            </div>
          )}
        </div>

        {/* Puntos a ganar */}
        {pointsToEarn > 0 && (
          <div className="mt-4 p-3 bg-accent rounded-sm">
            <div className="flex items-center text-accent-foreground">
              <Star className="h-5 w-5 mr-2 text-accent-foreground fill-current" />
              <p className="text-sm font-medium">
                Con esta compra ganarás <strong>{pointsToEarn}</strong> puntos de recompensa
              </p>
            </div>
          </div>
        )}

        {/* Estados de validación del formulario */}
        <div className="mt-4 p-3 rounded-sm border">
          {!isFormReady ? (
            <div className="flex items-center space-x-2 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Completa tu información</p>
                <p className="text-xs text-amber-700 mt-1">
                  Faltan algunos datos para proceder con el pago
                </p>
                {Object.keys(formValidation.errors).length > 0 && (
                  <ul className="text-xs text-amber-700 mt-2 space-y-1">
                    {Object.entries(formValidation.errors).slice(0, 3).map(([field, error]) => (
                      <li key={field}>• {error}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Información completa</p>
                <p className="text-xs text-green-700 mt-1">
                  Todo listo para procesar tu pago de forma segura
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Términos y condiciones compacto */}
        <div className="mt-4 p-3">
          <LegalNotices 
          onAcceptChange={setLegalAccepted}
          accepted={isLegalReady}
          />
        </div>

        {/* Error de pago */}
        {paymentError && (
          <div className="mt-4">
            <ErrorDisplay 
              error={paymentError}
              onRetry={handleRetryPayment}
            />
          </div>
        )}

        {/* Botón de pago mejorado */}
        <div className="mt-6">
          {!(isFormReady && isLegalReady) ? (
            <div className="relative">
            <Button 
              disabled 
              className="w-full bg-primary text-primary-foreground border border-accent cursor-not-allowed py-3 text-lg font-medium"
            >
              <Lock className="h-5 w-5 mr-2" />
              {!isFormReady ? 'Completa la información' : 'Acepta los términos'}
            </Button>
            <div className="absolute inset-0  rounded-sm"></div>
          </div>
          ) : (
            <div className="space-y-3">
              <WompiButton
                publicKey={publicKey}
                reference={reference}
                amountInCents={finalTotalInCentsWompi}
                redirectUrl={`${redirectUrl}?reference=${reference}`}
                expirationTime={expirationTime}
                formData={formData}
                items={cart}
                shippingCost={shippingCost}
                updateReferenceWithOrderId={updateReferenceWithOrderId}
                onError={setPaymentError}
                onProcessing={setIsProcessing}
              />
            </div>
          )}
        </div>

        {/* Información de seguridad adicional */}
        <div className="mt-4 text-center">
          <div className="flex justify-center items-center space-x-4 text-xs text-foreground/70">
            <div className="flex items-center space-x-1">
              <Lock className="h-3 w-3" />
              <span>SSL</span>
            </div>
            <div className="flex items-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verificado</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
