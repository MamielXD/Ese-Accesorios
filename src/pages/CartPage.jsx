import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, PlusCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from '@/utils/imageHelpers';
import useCheckoutForm from '../hooks/useCheckoutForm';
import {  
  CheckoutProgress, 
} from '@/components/security/SecurityComponents';
const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, clearCart, globalPromo } = useCart();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState({});
  const { shippingCost } = useCheckoutForm();

  const handleQuantityChange = async (id, newQuantity, stock, itemName) => {
    const quantity = parseInt(newQuantity, 10);
    
    if (isNaN(quantity) || quantity < 0) {
      // No hacer nada si el campo está vacío o es inválido para permitir que el usuario siga escribiendo
      if (newQuantity !== '' && newQuantity !== '-') return;
    }

    if (quantity === 0) {
      handleRemoveItem(id, itemName);
      return;
    }

    if (quantity > stock) {
        toast({
            title: "Stock insuficiente",
            description: `Solo puedes agregar hasta ${stock} unidades de ${itemName}.`,
            variant: "destructive",
        });
        // Opcional: revertir al valor de stock
        // updateQuantity(id, stock); 
        return;
    }

    setIsUpdating(prev => ({ ...prev, [id]: true }));
    
    try {
      await updateQuantity(id, quantity);
    } catch (error) {
      console.error('Error actualizando cantidad:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleRemoveItem = (id, name) => {
    removeFromCart(id);
    toast({
      title: "Producto Eliminado",
      description: `${name} ha sido eliminado de tu carrito.`,
    });
  };
  
  const handleClearCart = () => {
    clearCart();
    toast({
      title: "Carrito Vacío",
      description: "Todos los productos han sido eliminados de tu carrito.",
    });
  };

  // ✅ CORREGIDO: El cálculo del subtotal ahora es simple.
  // `item.price` ya viene con el descuento aplicado desde CartContext.
  const total = cart.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
  

  
  if (cart.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-24 bg-muted bg-transparent"
      >
        <ShoppingCart className="mx-auto h-24 w-24 text-muted-foreground mb-6" />
        <h1 className="text-4xl font-light text-foreground mb-4">Tu Carrito está Vacío</h1>
        <p className="text-muted-foreground mb-10">Explora nuestra colección y descubre piezas exclusivas para ti.</p>
        <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Link to="/productos">Explorar Colección</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-12"
    >
      {/* Progress bar */}
        <CheckoutProgress currentStep={0} />

      <h1 className="text-4xl font-light tracking-wide text-center text-foreground mb-12">Tu Carrito de Compras</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-6">
          {cart.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 bg-white shadow-sm rounded-sm border border-stone-200"
            >
              <img src={getImageUrl(item.image, 'small')} alt={item.name} className="w-32 h-32 rounded-sm object-cover"/>
              
              <div className="flex-grow">
                <h2 className="text-lg font-light text-foreground">{item.name}</h2>
                <p className="text-sm text-stone-500">{item.category}</p>

                {/* ✅ CORREGIDO: Mostrar precios por unidad */}
                <div className="mt-2">
                  {globalPromo ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg text-primary font-semibold">
                        ${parseFloat(item.price).toLocaleString()}
                      </span>
                      <span className="text-sm text-muted-foreground line-through">
                        ${parseFloat(item.originalPrice).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg text-neutral-800 font-semibold">
                      ${parseFloat(item.price).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity - 1, item.stock, item.name)} disabled={item.quantity <= 1 || isUpdating[item.id]}>
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleQuantityChange(item.id, e.target.value, item.stock, item.name)}
                  className="w-16 text-center"
                  min="1"
                  max={item.stock}
                  disabled={isUpdating[item.id]}
                />
                <Button variant="ghost" size="icon" onClick={() => handleQuantityChange(item.id, item.quantity + 1, item.stock, item.name)} disabled={item.quantity >= item.stock || isUpdating[item.id]}>
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>

              <div className="text-right w-28">
                {/* ✅ CORREGIDO: Mostrar precios totales por línea de producto */}
                {globalPromo ? (
                  <>
                    <span className="text-lg text-primary font-semibold block">
                        ${(item.price * item.quantity).toLocaleString()}
                    </span>
                    <span className="text-sm text-muted-foreground line-through block">
                        ${(item.originalPrice * item.quantity).toLocaleString()}
                    </span>
                  </>
                ) : (
                  <span className="text-lg text-neutral-800 font-semibold">
                    ${(item.price * item.quantity).toLocaleString()}
                  </span>
                )}
              </div>
              
              <Button size="icon" onClick={() => handleRemoveItem(item.id, item.name)} variant="ghost" disabled={isUpdating[item.id]}>
                <Trash2 className="h-5 w-5" />
              </Button>
            </motion.div>
          ))}
          
          {cart.length > 0 && (
            <div className="text-right mt-4">
              <Button variant="outline" onClick={handleClearCart}>
                <Trash2 className="mr-2 h-4 w-4" /> Vaciar Carrito
              </Button>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200 space-y-4 sticky top-24">
            <h2 className="text-2xl font-light text-foreground">Resumen del Pedido</h2>
            <Separator />
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal (Sin envío):</span>
              <span>${total.toLocaleString()}</span>
            </div>
            <Separator />
            <div className="bg-stone-50 border-l-4 border-stone-300 text-muted-foreground p-3 text-sm">
              <div className="flex">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <p>Los costos de envío finales se calcularán en la página de pago.</p>
              </div>
            </div>
            <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90" asChild>
              <Link to="/checkout">Proceder al Pago</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/productos">Seguir Explorando</Link>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CartPage;