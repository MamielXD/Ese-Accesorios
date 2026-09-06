import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

const PointsContext = createContext();

export const usePoints = () => useContext(PointsContext);

export const POINTS_PER_AMOUNT = 1;
export const AMOUNT_FOR_POINTS = 10000; // 10,000 pesos for 1 point

export const PointsProvider = ({ children }) => {
  const [points, setPoints] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false); // Evitar múltiples actualizaciones simultáneas
  const { user, userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && userProfile && !authLoading) {
      setPoints(userProfile.points || 0);
    } else if (!user && !authLoading) {
      setPoints(0);
    }
  }, [user, userProfile, authLoading]);

  // Función optimizada para añadir puntos - SIN optimistic locking para evitar problemas
  const addPoints = async (pointsToAdd) => {
    if (!user || pointsToAdd <= 0 || isUpdating) {
      console.log("addPoints: Condiciones no cumplidas", { user: !!user, pointsToAdd, isUpdating });
      return false;
    }

    setIsUpdating(true);

    try {
      // Usar RPC de Supabase para incrementar atómicamente (sin condiciones de carrera)
      const { data, error } = await supabase
        .rpc('increment_user_points', {
          user_id: user.id,
          points_to_add: pointsToAdd
        });

      if (error) {
        console.error("Error incrementing points:", error);
        // Fallback: actualización simple sin optimistic locking
        const { data: currentData, error: fetchError } = await supabase
          .from("user_profiles")
          .select("points")
          .eq("id", user.id)
          .single();
  
        if (fetchError) {
          console.error("Error fetching current points:", fetchError);
          setIsUpdating(false);
          return false;
        }
  
        const currentPoints = currentData?.points || 0;
        const newTotalPoints = currentPoints + pointsToAdd;
        
        console.log(`Fallback: Adding ${pointsToAdd} points. Current: ${currentPoints}, New total: ${newTotalPoints}`);
        
        // Actualizar sin optimistic locking
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ points: newTotalPoints })
          .eq('id', user.id);

        if (updateError) {
          console.error("Error updating points in Supabase:", updateError);
          setIsUpdating(false);
          return false;
        }

        setPoints(newTotalPoints);
        console.log(`Points successfully updated to ${newTotalPoints}`);
        setIsUpdating(false);
        return true;
      }

      // Si RPC fue exitoso, usar los puntos devueltos
      const newTotalPoints = data || 0;
      setPoints(newTotalPoints);
      console.log(`Points successfully incremented via RPC to ${newTotalPoints}`);
      setIsUpdating(false);
      return true;
    } catch (error) {
      console.error("Error in addPoints:", error);
      setIsUpdating(false);
      return false;
    }
  };

  // Función para calcular puntos basado en el total del pedido (excluyendo envío)
  const calculatePointsFromOrder = (orderTotal, shippingPrice = 0) => {
    // Restar el costo de envío del total para calcular puntos solo sobre productos
    const productTotal = orderTotal - (shippingPrice || 0);
    
    // Solo calcular puntos sobre el total de productos (sin envío)
    const calculatedPoints = Math.floor(Math.max(0, productTotal) / AMOUNT_FOR_POINTS) * POINTS_PER_AMOUNT;
    
    console.log(`Calculating points - Total: ${orderTotal}, Shipping: ${shippingPrice || 0}, Product total: ${productTotal}, Points: ${calculatedPoints}`);
    return calculatedPoints;
  };

  // Función optimizada para canjear puntos
  const redeemPoints = async (pointsToRedeem, rewardType) => {
    if (!user || points < pointsToRedeem || isUpdating) {
      return { 
        success: false, 
        message: "Puntos insuficientes, usuario no autenticado, o actualización en progreso." 
      };
    }
    
    setIsUpdating(true);
    
    try {
      // Obtener puntos actuales de Supabase
      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        console.error("Error fetching points for redemption:", fetchError);
        setIsUpdating(false);
        return { success: false, message: "Error al obtener puntos actuales." };
      }

      const currentPoints = data?.points || 0;
      if (currentPoints < pointsToRedeem) {
        setIsUpdating(false);
        return { success: false, message: "Puntos insuficientes." };
      }

      const newTotalPoints = currentPoints - pointsToRedeem;

      // Procesar según el tipo de recompensa
      if ((rewardType === 'discount' || rewardType === 'accessory') && pointsToRedeem === 50) {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ points: newTotalPoints })
          .eq('id', user.id)
          .eq('points', currentPoints); // Optimistic locking

        if (updateError) {
          console.error(`Error updating points for ${rewardType}:`, updateError);
          setIsUpdating(false);
          return { success: false, message: "Error al actualizar puntos." };
        }

        setPoints(newTotalPoints);
        setIsUpdating(false);
        
        const message = rewardType === 'discount' 
          ? "Descuento del 5% aplicado." 
          : "Accesorio gratuito añadido (simulado).";
        
        return { success: true, message };
      }

      setIsUpdating(false);
      return { success: false, message: "Tipo de recompensa no válido." };
    } catch (error) {
      console.error("Error in redeemPoints:", error);
      setIsUpdating(false);
      return { success: false, message: "Error al procesar la redención." };
    }
  };

  // Función para sincronizar puntos con Supabase
  const syncPoints = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("points")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error syncing points:", error);
        return false;
      }

      const currentPoints = data?.points || 0;
      setPoints(currentPoints);
      return true;
    } catch (error) {
      console.error("Error in syncPoints:", error);
      return false;
    }
  };

  const setPointsManually = (newPoints) => {
    setPoints(newPoints);
  };

  return (
    <PointsContext.Provider value={{ 
      points, 
      addPoints, 
      calculatePointsFromOrder,
      redeemPoints, 
      setPointsManually,
      syncPoints,
      isUpdating
    }}>
      {children}
    </PointsContext.Provider>
  );
};