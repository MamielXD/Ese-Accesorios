import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Tag, AlertTriangle, Gift, Coins, Check, Clock } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from '@/utils/imageHelpers';

const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [userPromotions, setUserPromotions] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Obtener usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Obtener perfil del usuario para los puntos
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('points')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // Obtener todas las promociones activas
      const { data: promotionsData, error: promotionsError } = await supabase
        .from('promotions')
        .select('*')
        .eq('active', true)
        .order('end_date', { ascending: true });
      
      if (promotionsError) {
        console.error('Error fetching promotions:', promotionsError);
        toast({ title: "Error", description: "No se pudieron cargar las promociones.", variant: "destructive" });
      } else {
        // Filtrar promociones que no han expirado
        const activePromotions = promotionsData.filter(promo => 
          !promo.end_date || new Date(promo.end_date) >= new Date()
        );
        setPromotions(activePromotions);
      }

      // Obtener cupones redimidos por el usuario
      const { data: userPromotionsData, error: userPromotionsError } = await supabase
        .from('user_promotions')
        .select('promotion_id, redeemed_at, used')
        .eq('user_id', user.id);

      if (userPromotionsError) {
        console.error('Error fetching user promotions:', userPromotionsError);
      } else {
        setUserPromotions(userPromotionsData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [toast]);

  const handleRedeemCoupon = async (promotion) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Error", description: "Debes iniciar sesión para redimir cupones.", variant: "destructive" });
      return;
    }

    // Verificar si el usuario tiene suficientes puntos
    if (userProfile?.points < promotion.points_cost) {
      toast({ 
        title: "Puntos insuficientes", 
        description: `Necesitas ${promotion.points_cost} puntos para redimir este cupón.`, 
        variant: "destructive" 
      });
      return;
    }

    // Verificar si ya redimió este cupón
    const alreadyRedeemed = userPromotions.some(up => up.promotion_id === promotion.id);
    if (alreadyRedeemed) {
      toast({ 
        title: "Cupón ya redimido", 
        description: "Ya tienes este cupón en tu cuenta.", 
        variant: "destructive" 
      });
      return;
    }

    setRedeeming(prev => ({ ...prev, [promotion.id]: true }));

    try {
      // Intentar redimir el cupón (el trigger se encarga de validar límites y actualizar contadores)
      const { data, error } = await supabase
        .from('user_promotions')
        .insert({
          user_id: user.id,
          promotion_id: promotion.id,
          redeemed_at: new Date().toISOString(),
          used: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error redeeming coupon:', error);
        
        // Manejar diferentes tipos de errores
        if (error.message?.includes('max_uses')) {
          toast({ 
            title: "Cupón agotado", 
            description: "Este cupón ha alcanzado su límite de usos.", 
            variant: "destructive" 
          });
        } else if (error.message?.includes('points')) {
          toast({ 
            title: "Puntos insuficientes", 
            description: "No tienes suficientes puntos para redimir este cupón.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Error", 
            description: "No se pudo redimir el cupón. Inténtalo de nuevo.", 
            variant: "destructive" 
          });
        }
      } else {
        // Actualizar estados locales
        setUserPromotions(prev => [...prev, data]);
        
        // Actualizar puntos del usuario
        setUserProfile(prev => ({
          ...prev,
          points: prev.points - promotion.points_cost
        }));

        toast({ 
          title: "¡Cupón redimido!", 
          description: `Has redimido el cupón "${promotion.title}" por ${promotion.points_cost} puntos.`,
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({ 
        title: "Error", 
        description: "Ocurrió un error inesperado. Inténtalo de nuevo.", 
        variant: "destructive" 
      });
    } finally {
      setRedeeming(prev => ({ ...prev, [promotion.id]: false }));
    }
  };

  const isPromotionRedeemed = (promotionId) => {
    return userPromotions.some(up => up.promotion_id === promotionId);
  };

  const isPromotionUsed = (promotionId) => {
    const userPromotion = userPromotions.find(up => up.promotion_id === promotionId);
    return userPromotion?.used || false;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }

  const defaultPromotionImage = "/default-promo.jpg";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12"
    >
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide text-foreground mb-3">
          Promociones Exclusivas
        </h1>
        <p className="text-base sm:text-lg text-foreground/80 leading-relaxed">
          Explora piezas seleccionadas con beneficios especiales y elegancia única.
        </p>
        {userProfile && (
          <div className="mt-4 inline-flex items-center bg-accent border border-accent/80 rounded-full px-4 py-2">
            <Coins className="h-4 w-4 text-accent-foreground mr-2" />
            <span className="text-sm font-medium text-accent-foreground">
              Tienes {userProfile.points} puntos disponibles
            </span>
          </div>
        )}
      </div>

      {promotions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {promotions.map((promo, index) => {
            const isRedeemed = isPromotionRedeemed(promo.id);
            const isUsed = isPromotionUsed(promo.id);
            const isRedeeming = redeeming[promo.id];
            
            return (
              <motion.div
                key={promo.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="h-full"
              >
                <Card className="w-full h-full flex flex-col overflow-hidden bg-white border border-stone-200 rounded-sm shadow-sm hover:shadow-md transition-all duration-500">
                  <CardHeader className="p-0">
                    <div className="aspect-[16/9] overflow-hidden relative group">
                      <img
                        src={getImageUrl(promo.image_url || defaultPromotionImage, 'medium')}
                        alt={promo.title}
                        className="w-full h-full object-cover filter saturate-90 transition-transform duration-700 ease-in-out group-hover:scale-105"
                      />
                      
                      {/* Badge para tipo de promoción */}
                      <div className="absolute top-3 left-3">
                        {promo.promotion_type === 'coupon' ? (
                          <div className="bg-neutral-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                            <Gift className="h-3 w-3 mr-1" />
                            CUPÓN
                          </div>
                        ) : (
                          <div className="bg-neutral-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                            PROMOCIÓN
                          </div>
                        )}
                      </div>

                      {/* Badge de descuento */}
                      {promo.discount_value && (
                        <div className="absolute top-3 right-3 bg-neutral-800 text-white px-3 py-1.5 rounded-full text-xs tracking-wide shadow-md">
                          {promo.discount_type === 'percentage' ? `${promo.discount_value}% OFF` : `$${promo.discount_value} OFF`}
                        </div>
                      )}

                      {/* Badge de estado para cupones */}
                      {promo.promotion_type === 'coupon' && isRedeemed && (
                        <div className="absolute bottom-3 right-3">
                          {isUsed ? (
                            <div className="bg-gray-600 text-white px-3 py-1.5 rounded-full text-xs tracking-wide shadow-md flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              USADO
                            </div>
                          ) : (
                            <div className="bg-neutral-800 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                              <Check className="h-3 w-3 mr-1" />
                              REDIMIDO
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4 sm:p-6 flex-grow">
                    <CardTitle className="text-lg sm:text-xl font-light text-neutral-800 mb-2">
                      {promo.title}
                    </CardTitle>
                    <CardDescription className="text-sm text-stone-600 leading-relaxed mb-3">
                      {promo.description}
                    </CardDescription>
                    
                    {/* Información específica de cupones */}
                    {promo.promotion_type === 'coupon' && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center text-xs text-stone-600">
                          <Coins className="h-3 w-3 mr-1" />
                          <span>Costo: {promo.points_cost} puntos</span>
                        </div>
                        {promo.max_uses && (
                          <div className="text-xs text-stone-500">
                            Usos restantes: {Math.max(0, promo.max_uses - (promo.usage_count || 0))}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {promo.end_date && (
                      <p className="text-xs text-stone-500">
                        Válido hasta: {new Date(promo.end_date).toLocaleDateString('es-CO', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    )}
                  </CardContent>
                  
                  <CardFooter className="p-4 sm:p-6 pt-0">
                    {promo.promotion_type === 'coupon' ? (
                      // Botón de redimir para cupones
                      <Button 
                        className={`w-full px-8 py-3 text-sm tracking-wide uppercase rounded-sm transition-all ${
                          isRedeemed 
                          ? 'bg-stone-100 text-stone-600 border border-stone-300 cursor-default'
                          : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-800'
                        }`}
                        onClick={() => !isRedeemed && handleRedeemCoupon(promo)}
                        disabled={isRedeemed || isRedeeming || !userProfile}
                      >
                        
                        {isRedeeming ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Redimiendo...
                          </>
                        ) : isRedeemed ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            {isUsed ? 'Cupón Usado' : 'Cupón Redimido'}
                          </>
                        ) : (
                          <>
                            <Gift className="mr-2 h-4 w-4" />
                            Redimir por {promo.points_cost} pts
                          </>
                        )}
                      </Button>
                    ) : (
                      // Botón de ver productos para promociones globales
                      <Button 
                        className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-800 hover:border-neutral-700 shadow-sm transition-all duration-300 px-8 py-3 text-sm tracking-wide uppercase" 
                        asChild
                      >
                        <Link to={promo.applicable_products && promo.applicable_products.length > 0 ? `/productos?promo=${promo.id}` : "/productos"}>
                          <Tag className="mr-2 h-4 w-4" /> Ver Piezas
                        </Link>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-background rounded-sm"
        >
          <AlertTriangle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-foreground mb-4" />
          <p className="text-lg sm:text-xl font-light tracking-wide text-foreground mb-2">
            No hay promociones activas
          </p>
          <p className="text-foreground/80 text-sm sm:text-base leading-relaxed mb-6">
            Vuelve pronto para descubrir nuevas piezas seleccionadas.
          </p>
          <Button 
            asChild 
            className="bg-primary hover:bg-primary/80 text-primary-foreground px-8 py-3"
          >
            <Link to="/productos">Explorar Colección</Link>
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PromotionsPage;