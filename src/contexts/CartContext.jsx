import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

const LOCALSTORAGE_KEY = "EseAccesoriosCart";

export const CartProvider = ({ children, userId }) => {
  const [cart, setCart] = useState([]);
  const [globalPromo, setGlobalPromo] = useState(null);
  const [loading, setLoading] = useState(true);
  const syncTimer = useRef(null);

  // Cargar promoción global al inicializar
  useEffect(() => {
    const fetchGlobalPromotion = async () => {
      try {
        const now = new Date().toISOString();
        console.log('Buscando promociones para fecha:', now); // Debug
        
        const { data, error } = await supabase
          .from('promotions')
          .select('*')
          .eq('active', true)
          .eq('promotion_type', 'global')
          .filter('start_date', 'lte', now)  // Fecha de inicio <= ahora
          .filter('end_date', 'gte', now)    // Fecha de fin >= ahora
          .limit(1);
  
        console.log('Resultado promociones:', { data, error }); // Debug
  
        if (error) {
          // No usar .single() si puede no haber resultados
          console.error('Error en consulta promociones:', error);
          setGlobalPromo(null);
          return;
        }
        
        // Tomar el primer resultado si existe
        setGlobalPromo(data && data.length > 0 ? data[0] : null);
      } catch (err) {
        console.error('Error cargando promoción global:', err);
        setGlobalPromo(null);
      }
    };
    fetchGlobalPromotion();
  }, []);
  // --- Helpers ---

  const applyGlobalPromo = useCallback((item) => {
    const originalPrice = parseFloat(item.price);
    if (globalPromo && globalPromo.discount_value > 0) {
      const discountFactor = (100 - globalPromo.discount_value) / 100;
      return {
        ...item,
        price: originalPrice * discountFactor,
        originalPrice: originalPrice,
      };
    }
    return { ...item, price: originalPrice, originalPrice: originalPrice };
  }, [globalPromo]);

  const normalizeItem = (raw) => {
    const productData = raw.products || raw;
    const categoryObj = productData.category;
    return {
      id: productData.id || raw.product_id,
      name: productData.name || raw.product_name,
      price: productData.price ?? 0,
      image: productData.image_url || raw.image,
      category: typeof categoryObj === "object" ? categoryObj?.name : categoryObj || "Sin categoría",
      quantity: raw.quantity ?? 1,
      stock: productData.stock ?? 0,
    };
  };

  const cartToRows = (cartArray) =>
    cartArray.map((item) => ({
      user_id: userId,
      product_id: item.id,
      quantity: item.quantity,
    }));

  const mergeCarts = (dbCart, localCart) => {
    const map = new Map();
    [...dbCart, ...localCart].forEach(item => {
      const existing = map.get(item.id);
      if (existing) {
        map.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
      } else {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  };

  const getProductStock = async (productId) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();
      if (error) throw error;
      return data?.stock ?? 0;
    } catch (err) {
      console.error('Error obteniendo stock:', err);
      return 0;
    }
  };

  // --- Carga Inicial del Carrito ---
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true);
      try {
        const rawLocal = localStorage.getItem(LOCALSTORAGE_KEY);
        const localCart = rawLocal ? JSON.parse(rawLocal) : [];
        let finalCartData = [];

        if (userId) {
          const { data: dbData, error } = await supabase
            .from("cart_items")
            .select(`
              product_id,
              quantity,
              products (id, name, price, image_url, stock, category:category_id(name))
            `)
            .eq("user_id", userId);
          if (error) throw error;
          // console.log("DATOS CRUDOS DIRECTO DE SUPABASE:", dbData);
          const normalizedDb = (dbData || []).map(normalizeItem);
          const normalizedLocal = localCart.map(normalizeItem);
          finalCartData = mergeCarts(normalizedDb, normalizedLocal);
        } else {
          finalCartData = localCart.map(normalizeItem);
        }

        const cartWithPrices = finalCartData.map(applyGlobalPromo);
        setCart(cartWithPrices);

        if (userId) {
          scheduleSync(cartWithPrices);
          localStorage.removeItem(LOCALSTORAGE_KEY);
        }
      } catch (err) {
        console.error("Error cargando el carrito:", err);
      } finally {
        setLoading(false);
      }
    };
    loadCart();
  }, [userId, globalPromo]);

  // --- Persistencia y Sincronización ---
  useEffect(() => {
    if (!userId && !loading) {
      try {
        const storableCart = cart.map(({ price, originalPrice, ...item }) => ({
          ...item,
          price: originalPrice, // Siempre guardar el precio original
        }));
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(storableCart));
      } catch (e) {
        console.error("Error guardando carrito en localStorage:", e);
      }
    }
  }, [cart, userId, loading]);

  const doSyncNow = useCallback(async (cartToSync) => {
    if (!userId) return;
    const rows = cartToRows(cartToSync);
    try {
        await supabase.from("cart_items").delete().eq("user_id", userId);
        if (rows.length > 0) {
            const { error } = await supabase.from("cart_items").insert(rows);
            if (error) throw error;
        }
    } catch (error) {
        console.error("Error sincronizando el carrito:", error);
    }
  }, [userId]);

  const scheduleSync = useCallback((newCart) => {
    if (!userId) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      doSyncNow(newCart);
    }, 1000);
  }, [userId, doSyncNow]);

  // --- Acciones del Carrito ---
  const addToCart = useCallback(async (product, quantity = 1) => {
    const normalized = normalizeItem(product);
    const productWithPromo = applyGlobalPromo(normalized);
    const stock = productWithPromo.stock > 0 ? productWithPromo.stock : await getProductStock(productWithPromo.id);
    productWithPromo.stock = stock;

    return new Promise((resolve) => {
      setCart(prev => {
        const existing = prev.find(item => item.id === productWithPromo.id);
        const newQuantity = (existing ? existing.quantity : 0) + quantity;

        if (newQuantity > stock) {
          resolve({ success: false, message: `Stock insuficiente. Solo quedan ${stock} unidades.` });
          return prev;
        }

        let nextCart;
        if (existing) {
          nextCart = prev.map(item => item.id === productWithPromo.id ? { ...item, quantity: newQuantity } : item);
        } else {
          nextCart = [...prev, { ...productWithPromo, quantity }];
        }
        
        scheduleSync(nextCart);
        resolve({ success: true, message: "Producto añadido al carrito." });
        return nextCart;
      });
    });
  }, [applyGlobalPromo, scheduleSync]);
  
  const updateQuantity = useCallback((productId, quantity) => {
     setCart(prev => {
        const itemToUpdate = prev.find(item => item.id === productId);
        if (!itemToUpdate || quantity > itemToUpdate.stock) {
            // Opcional: notificar error de stock
            return prev;
        }

        const nextCart = prev
            .map(item => item.id === productId ? { ...item, quantity } : item)
            .filter(item => item.quantity > 0);

        scheduleSync(nextCart);
        return nextCart;
     });
  }, [scheduleSync]);

  const removeFromCart = useCallback((productId) => {
    setCart(prev => {
        const nextCart = prev.filter(item => item.id !== productId);
        scheduleSync(nextCart);
        return nextCart;
    });
  }, [scheduleSync]);

  const clearCart = useCallback(() => {
    setCart([]);
    scheduleSync([]);
  }, [scheduleSync]);

  const createOrder = useCallback(async (orderData) => {
    if (!userId) return { ok: false, error: "Usuario no autenticado." };
    
    const itemsSnapshot = cart.map(i => ({
      id: i.id,
      name: i.name,
      price: i.price,
      originalPrice: i.originalPrice,
      image: i.image,
      category: i.category,
      quantity: i.quantity,
    }));

    const payload = { ...orderData, items: itemsSnapshot, user_id: userId };

    try {
        const { data, error } = await supabase.from("orders").insert(payload).select().single();
        if (error) throw error;
        
        clearCart(); // Limpia el estado y la base de datos
        return { ok: true, data };
    } catch(error) {
        console.error("Error creando la orden:", error);
        return { ok: false, error };
    }
  }, [cart, userId, clearCart]);

  const value = useMemo(() => ({
    cart,
    globalPromo,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    createOrder,
  }), [cart, globalPromo, loading, addToCart, removeFromCart, updateQuantity, clearCart, createOrder]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};