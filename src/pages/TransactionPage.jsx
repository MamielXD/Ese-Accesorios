import React, { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useCart } from "@/contexts/CartContext";
import { usePoints } from "@/contexts/PointsContext";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { 
  SecurityBadge,
  SecurityFooter, 
  CheckoutProgress,
} from '@/components/security/SecurityComponents';

const TransactionPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [pointsEarned, setPointsEarned] = useState(0);
  // 🔧 Usar sessionStorage para persistir el estado de procesamiento
  const [isProcessed, setIsProcessed] = useState(false);

  const { clearCart } = useCart();
  const { addPoints, calculatePointsFromOrder } = usePoints();
  const { toast } = useToast();

  // 🔧 Limpiar el reference de parámetros adicionales
  const rawReference = searchParams.get("reference");
  const transactionId = searchParams.get("id");
  
  // Extraer solo la referencia limpia (antes del ?)
  const reference = rawReference ? rawReference.split('?')[0] : null;

  // 🔧 Verificar si ya se procesó esta transacción en esta sesión
  useEffect(() => {
    if (reference && transactionId) {
      const processingKey = `transaction_processed_${reference}_${transactionId}`;
      const wasProcessed = sessionStorage.getItem(processingKey) === 'true';
      setIsProcessed(wasProcessed);
    }
  }, [reference, transactionId]);

  useEffect(() => {
    const checkTransaction = async () => {
      if (!transactionId || !reference) {
        setStatus("error");
        setMessage("No se encontró información de la transacción.");
        return;
      }

      // 🔧 Si ya se procesó en esta sesión, skip el procesamiento de puntos
      if (isProcessed) {
        console.log("Transaction already processed in this session, checking final status...");
        await getFinalTransactionStatus();
        return;
      }

      try {
        console.log("🔍 Starting transaction check for:", { transactionId, reference });
        
        // 🔧 Primero verificar el estado en la base de datos
        const { data: existingOrder, error: orderError } = await supabase
          .from("orders")
          .select("total, points_awarded, shipping_price, status, transaction_id")
          .eq("reference", reference)
          .maybeSingle();

        if (orderError) {
          console.error("[TransactionPage] Supabase error:", orderError);
          setStatus("error");
          setMessage("Error al obtener información del pedido.");
          return;
        }

        if (!existingOrder) {
          console.warn("⚠️ No order found for reference:", reference);
          setStatus("error");
          setMessage("No se encontró el pedido asociado a esta transacción.");
          return;
        }

        console.log("✅ Existing order data:", existingOrder);

        // 🔧 Si la orden ya está procesada y aprobada, mostrar estado final
        if (existingOrder.status === 'approved' && existingOrder.points_awarded) {
          console.log("ℹ️ Order already processed and approved with points awarded");
          await markAsProcessedAndShowResult(existingOrder);
          return;
        }
        
        // 🔧 Obtener estado actual de Wompi
        let tx = null;
        try {
          const wompiUrl = `https://production.wompi.co/v1/transactions/${transactionId}`;
          console.log("🌐 Fetching from Wompi:", wompiUrl);
          
          const res = await fetch(wompiUrl, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
          });
          
          if (!res.ok) {
            throw new Error(`Wompi API error: ${res.status} ${res.statusText}`);
          }
          
          const data = await res.json();
          tx = data.data;
          
          console.log("✅ Wompi response:", { status: res.status, data: tx });
          
        } catch (wompiError) {
          console.error("❌ Error fetching from Wompi:", wompiError);
          setStatus("error");
          setMessage("Error al conectar con el servicio de pagos. Intenta más tarde.");
          return;
        }

        if (!tx) {
          setStatus("error");
          setMessage("No se encontró transacción para esta referencia.");
          return;
        }

        const newStatus = tx.status;
        console.log("📊 Transaction status from Wompi:", newStatus);

        // Procesar según el estado de la transacción
        if (newStatus === "APPROVED") {
          await handleApprovedTransaction(existingOrder, tx, reference);
        } else if (newStatus === "DECLINED") {
          await handleDeclinedTransaction(tx, reference);
        } else {
          await handlePendingTransaction(tx, reference, newStatus);
        }

        // 🔧 Marcar como procesada después del éxito
        markTransactionAsProcessed();

      } catch (err) {
        console.error("💥 Unexpected error in checkTransaction:", err);
        setStatus("error");
        setMessage("Ocurrió un error inesperado al verificar la transacción.");
      }
    };

    checkTransaction();
  }, [transactionId, reference, isProcessed]);

  // 🔧 Función para obtener estado final cuando ya se procesó
  const getFinalTransactionStatus = async () => {
    try {
      const { data: order, error } = await supabase
        .from("orders")
        .select("total, points_awarded, shipping_price, status")
        .eq("reference", reference)
        .maybeSingle();

      if (error || !order) {
        setStatus("error");
        setMessage("Error al obtener el estado del pedido.");
        return;
      }

      // Mostrar estado basado en la orden existente
      if (order.status === 'approved') {
        setStatus("approved");
        setMessage("¡Tu pago ha sido aprobado! Tu pedido está siendo procesado.");
        
        if (order.points_awarded) {
          const totalAmount = order.total || 0;
          const shippingPrice = order.shipping_price || 0;
          const pointsToEarn = calculatePointsFromOrder ? calculatePointsFromOrder(totalAmount, shippingPrice) : 0;
          setPointsEarned(pointsToEarn);
        }
      } else if (order.status === 'declined') {
        setStatus("declined");
        setMessage("El pago fue rechazado. Puedes intentar nuevamente.");
      } else {
        setStatus("pending");
        setMessage("El pago está pendiente de confirmación.");
      }
    } catch (err) {
      console.error("Error getting final status:", err);
      setStatus("error");
      setMessage("Error al obtener el estado del pedido.");
    }
  };

  // 🔧 Función para marcar como procesada y mostrar resultado
  const markAsProcessedAndShowResult = async (orderData) => {
    const totalAmount = orderData.total || 0;
    const shippingPrice = orderData.shipping_price || 0;
    const pointsToEarn = calculatePointsFromOrder ? calculatePointsFromOrder(totalAmount, shippingPrice) : 0;
    
    setStatus("approved");
    setMessage("¡Tu pago ha sido aprobado! Tu pedido está siendo procesado.");
    setPointsEarned(pointsToEarn);
    
    markTransactionAsProcessed();
  };

  // 🔧 Función para marcar transacción como procesada en sessionStorage
  const markTransactionAsProcessed = () => {
    if (reference && transactionId) {
      const processingKey = `transaction_processed_${reference}_${transactionId}`;
      sessionStorage.setItem(processingKey, 'true');
      setIsProcessed(true);
    }
  };

  // 🔧 Función separada para manejar transacciones aprobadas
  const handleApprovedTransaction = async (orderData, tx, reference) => {
    try {
      // Calcular puntos antes de la actualización (excluyendo shipping)
      const totalAmount = orderData.total || 0;
      const shippingPrice = orderData.shipping_price || 0;
      const pointsToEarn = calculatePointsFromOrder ? calculatePointsFromOrder(totalAmount, shippingPrice) : 0;
      
      console.log(`💰 Order total: ${totalAmount}, Shipping: ${shippingPrice}, Points to earn: ${pointsToEarn}`);
      
      // 🔧 VERIFICACIÓN CRÍTICA: Solo otorgar puntos si NO se han otorgado antes
      let pointsAwarded = orderData.points_awarded || false; // Usar valor existente
      
      if (!orderData.points_awarded && pointsToEarn > 0) {
        console.log("🎁 Attempting to award points:", pointsToEarn);
        
        if (addPoints) {
          const success = await addPoints(pointsToEarn);
          if (success) {
            pointsAwarded = true;
            setPointsEarned(pointsToEarn);
            
            console.log("✅ Points successfully awarded:", pointsToEarn);
            
            if (toast) {
              toast({
                title: "🎉 ¡Pedido Confirmado!",
                description: `Gracias por tu compra. Has ganado ${pointsToEarn} puntos.`,
                action: (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/perfil">Ver mis puntos</Link>
                  </Button>
                ),
              });
            }
          } else {
            console.error("⚠ Error al otorgar puntos");
            if (toast) {
              toast({
                title: "Pedido Confirmado",
                description: "Tu pedido ha sido confirmado, pero hubo un problema al otorgar los puntos.",
                variant: "destructive",
              });
            }
          }
        }
      } else {
        console.log("ℹ️ Puntos ya otorgados o no hay puntos que otorgar", { 
          already_awarded: orderData.points_awarded,
          points_to_earn: pointsToEarn 
        });
        
        // Si ya tenía puntos otorgados, mostrarlos
        if (orderData.points_awarded && pointsToEarn > 0) {
          setPointsEarned(pointsToEarn);
        }
      }

      // 🔧 Actualizar estado de la orden - SIEMPRE actualizar points_awarded correctamente
      try {
        const { error: updateError } = await supabase
          .from("orders")
          .update({
            status: "approved", // Usar string fijo en lugar de newStatus.toLowerCase()
            transaction_id: tx.id,
            payment_method: tx.payment_method_type,
            points_awarded: pointsAwarded, // Asegurar que se guarde el estado correcto
          })
          .eq("reference", reference);

        if (updateError) {
          console.error("❌ Error updating order:", updateError);
        } else {
          console.log("✅ Order updated successfully with points_awarded:", pointsAwarded);
        }
      } catch (updateErr) {
        console.error("💥 Unexpected error updating order:", updateErr);
      }

      if (clearCart) {
        clearCart();
      }
      
      setStatus("approved");
      setMessage("¡Tu pago ha sido aprobado! Tu pedido está siendo procesado.");

    } catch (err) {
      console.error("💥 Error in handleApprovedTransaction:", err);
      setStatus("error");
      setMessage("Error procesando la transacción aprobada.");
    }
  };

  // 🔧 Función separada para manejar transacciones rechazadas
  const handleDeclinedTransaction = async (tx, reference) => {
    try {
      await supabase
        .from("orders")
        .update({
          status: "declined",
          transaction_id: tx.id,
          payment_method: tx.payment_method_type,
          points_awarded: false, // 🔧 Asegurar que no se marquen como otorgados
        })
        .eq("reference", reference);

      setStatus("declined");
      setMessage("El pago fue rechazado. Puedes intentar nuevamente.");
    } catch (err) {
      console.error("💥 Error in handleDeclinedTransaction:", err);
      setStatus("error");
      setMessage("Error procesando la transacción rechazada.");
    }
  };

  // 🔧 Función separada para manejar transacciones pendientes
  const handlePendingTransaction = async (tx, reference, newStatus) => {
    try {
      await supabase
        .from("orders")
        .update({
          status: newStatus ? newStatus.toLowerCase() : "pending",
          transaction_id: tx.id,
          payment_method: tx.payment_method_type,
          points_awarded: false, // 🔧 Asegurar que no se marquen como otorgados mientras esté pendiente
        })
        .eq("reference", reference);

      setStatus("pending");
      setMessage("El pago está pendiente de confirmación.");
    } catch (err) {
      console.error("💥 Error in handlePendingTransaction:", err);
      setStatus("error");
      setMessage("Error procesando la transacción pendiente.");
    }
  };

  const renderIcon = () => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />;
      case "declined":
        return <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />;
      case "pending":
        return <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />;
      case "loading":
        return <Loader2 className="w-12 h-12 text-stone-500 animate-spin mx-auto mb-4" />;
      case "error":
        return <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  return (
    <>
    <div className="container mx-auto px-4 py-12 max-w-lg text-center">
      {/* Progress bar */}
{status === "approved" ? (
  <CheckoutProgress currentStep={3} />
) : status === "pending" || status === "loading" ? (
  <CheckoutProgress currentStep={2} />
) : status === "declined" || status === "error" ? (
  <CheckoutProgress currentStep={2} status={false} />
) : null}

      
      
      {/* Security badge */}
      <SecurityBadge />
      <div className="bg-white/80 shadow-sm rounded-sm p-8 border border-stone-200">
        {renderIcon()}

        <h1 className="text-2xl font-semibold tracking-wide text-neutral-800 mb-4">
          Estado de la Transacción
        </h1>

        <p className="mb-6 text-base text-stone-700 leading-relaxed">{message}</p>

        {status === "approved" && pointsEarned > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800 font-medium">
              🎉 ¡Has ganado {pointsEarned} puntos!
            </p>
            <p className="text-green-600 text-sm mt-1">
              Úsalos en tu próxima compra.
            </p>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          {(status === "approved" || status === "pending" || status === "error") && (
            <Link
              to="/"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-sm uppercase"
            >
              Volver a la tienda
            </Link>
          )}

          {status === "declined" && (
            <Link
              to="/checkout"
              className="border-primary text-primary hover:bg-primary/90 hover:text-primary-foreground px-6 py-3 rounded-sm uppercase"
            >
              Intentar de nuevo
            </Link>
          )}

          {status === "approved" && pointsEarned > 0 && (
            <>
              <Link
                to="/perfil"
                className="border-primary text-primary hover:bg-primary/90 hover:text-primary-foreground px-6 py-3 rounded-sm uppercase"
              >
                Ver mis puntos
              </Link>
              <Link
                to="/pedidos"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-sm uppercase"
              >
                Mis pedidos
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
    <SecurityFooter />
    </>
  );
};

export default TransactionPage;