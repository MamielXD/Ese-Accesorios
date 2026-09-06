import React, { memo, useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Eye, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from '@/utils/imageHelpers';
import { campaignConfig, isSpecialProduct } from '@/config/campaignConfig.js';



const ProductCard = ({ product }) => {
  const { addToCart, globalPromo } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const isCampaignProduct = isSpecialProduct(product.id);

  // ✅ Generar URL SEO-friendly con slug
  const getProductUrl = useCallback(() => {
    const shortId = product.id.substring(0, 4);
    const slug = product.slug || 'producto';
    return `/producto/${shortId}/${slug}`;
  }, [product.id, product.slug]);

  const handleAddToCart = useCallback(async () => {
    setIsLoading(true);
    
    try {
      const result = await addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image_url,
        category: product.category_name,
        stock: product.stock,
        quantity: 1
      }, 1);

      if (result.success) {
        toast({
          title: "¡Añadido al carrito!",
          description: result.message,
          action: (
            <Button variant="outline" size="sm" asChild>
              <Link to="/carrito">Ver Carrito</Link>
            </Button>
          ),
        });
      } else {
        toast({
          title: "No se pudo agregar",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error al agregar al carrito:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addToCart, product, toast]);

  const handleProductClick = useCallback(() => {
    navigate(getProductUrl());
  }, [navigate, getProductUrl]);

  const productUrl = getProductUrl();
  const categoryName = product.category_name || 'Accesorios';

  const defaultPlaceholderImage = "https://eseaccesorios.com/imagen-preview.png";
  const imageUrl = product.image_url || defaultPlaceholderImage;
  const src = getImageUrl(imageUrl, 'medium'); // Default to medium size for src
  const srcSet = `${getImageUrl(imageUrl, 'small')} 300w, ${getImageUrl(imageUrl, 'medium')} 600w, ${getImageUrl(imageUrl, 'large')} 1200w`;
  const sizes = "(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 300px"; // Keep existing sizes

  return (
    <div className="h-full transform transition-transform duration-300 hover:-translate-y-1">
      <div className="bg-background border border-border rounded-sm overflow-hidden shadow-sm hover:shadow-md transition-all duration-500 group h-full flex flex-col">
        {globalPromo && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-sm z-10 border border-primary shadow-sm">
            {globalPromo.discount_value}% OFF
          </span>
        )}

{isCampaignProduct && campaignConfig.active && (
          <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-sm z-10 border border-accent shadow-sm">
            {campaignConfig.labels.stockBadge}
          </span>
        )}        {product.stock === 0 && (
          <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs font-bold px-2 py-1 rounded-sm z-10 border border-gray-600 shadow-sm">
            Agotado
          </span>
        )}
        
        

        {/* Imagen */}
        <div className="relative aspect-square bg-muted overflow-hidden">
          <Link to={productUrl} className="block h-full w-full">
            {/* ✅ ALT mejorado para SEO */}
            <img
              src={src}
              srcSet={srcSet}
              sizes={sizes}
              alt={`${product.name} - ${categoryName} - Accesorios de alta calidad - Ese Accesorios`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 no-scale-mobile filter saturate-90"
              width="300"
              height="300"
            />
          </Link>

          {/* Overlay Ver Detalle */}
          <div className="absolute inset-0 bg-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
            <Link 
              to={productUrl}
              className="px-4 py-2 bg-background/80 border border-border text-foreground hover:bg-accent hover:border-accent-foreground rounded transition-colors duration-200 text-sm flex items-center"
            >
              <Eye className="mr-2 h-4 w-4 text-foreground" /> Ver Detalle
            </Link>
          </div>
        </div>

        {/* Información */}
        <div className="p-3 sm:p-4 space-y-2 sm:space-y-3 flex-grow flex flex-col">
          <Link to={productUrl} className="text-left w-full">
            <h3 className="text-foreground text-sm sm:text-base md:text-lg font-medium tracking-wide line-clamp-2 min-h-[2.5rem] sm:min-h-[3rem] flex items-center leading-snug hover:text-foreground/80 transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Categoría */}
          {product.category_name && (
            <p className="text-xs text-muted-foreground uppercase tracking-widest">
              {product.category_name}
            </p>
          )}

          {product.description && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-grow h-9 overflow-hidden">
              {product.description.length > 80 ? product.description.substring(0, 80) + "..." : product.description}
            </p>
          )}

          {/* Información de stock */}
          <div className="text-xs text-muted-foreground/80">
            {isCampaignProduct && campaignConfig.active ? (
              <span className="text-accent-foreground font-medium bg-accent rounded-lg px-1.5 py-0.5">
                {campaignConfig.labels.stockBadge}
              </span>
            ) : product.stock === 0 ? (
                <span className="text-muted-foreground/80 font-medium">Sin stock</span>
            ) : (
              null
            )}
          </div>

          {/* Precio */}
          {!(isCampaignProduct && campaignConfig.hidePrice) && (
            <div className="flex flex-col ">
              {globalPromo ? (
                <>
                  <span className="text-xs text-muted-foreground/80 line-through">
                    ${parseFloat(product.price).toLocaleString()}
                  </span>
                  <span className="text-foreground font-semibold tracking-wide text-sm sm:text-base md:text-lg">
                    ${(product.price * (1 - globalPromo.discount_value / 100)).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className="text-foreground font-semibold tracking-wide text-sm sm:text-base md:text-lg">
                  ${parseFloat(product.price).toLocaleString()}
                </span>
              )}
            </div>
          )}

             {/* Mensaje cuando el precio está oculto */}
                      {isCampaignProduct && campaignConfig.hidePrice && (
                        <div className="text-foreground text-md font-medium">
                          {campaignConfig.labels.priceBadge || "Precio especial de preventa"}
                        </div>
                      )}

          {/* Botones */}
          <div className="flex-shrink-0">
            {product.stock === 0 ? (
              <>
                <button
                  disabled
                  className="bg-muted text-primary-foreground h-7 w-7 sm:h-8 sm:w-8 border border-muted-foreground cursor-not-allowed sm:hidden rounded flex items-center justify-center"
                  aria-label="Producto agotado"
                >
                  <X className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
                <button
                  disabled
                  className="hidden sm:flex bg-secondary hover:bg-secondary/80 text-secondary-foreground px-3 md:px-4 py-1.5 md:py-2 border border-muted-foreground cursor-not-allowed text-xs tracking-wide uppercase items-center rounded w-full justify-center"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                  <span className="hidden md:inline">Agotado</span>
                  <span className="md:hidden">Sin Stock</span>
                </button>
              </>
            ) : (
              <>
                {isCampaignProduct && campaignConfig.active && campaignConfig.labels.linkActived ? (
                  <>
                    <Link
                      to={campaignConfig.labels.linkButton}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-primary hover:bg-primary/80 text-primary-foreground h-7 w-7 sm:h-8 sm:w-8 border border-secondary hover:border-primary transition-all duration-300 sm:hidden rounded flex items-center justify-center"
                      aria-label={campaignConfig.labels.ctaButton}
                    >
                      <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Link>
                    <Link
                      to={campaignConfig.labels.linkButton}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hidden sm:flex bg-primary hover:bg-primary/80 text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 border border-foreground hover:border-primary transition-all duration-300 text-xs tracking-wide uppercase items-center rounded w-full justify-center"
                      aria-label={campaignConfig.labels.ctaButton}
                    >
                      <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      <span className="hidden md:inline">
                        {campaignConfig.labels.ctaButton}
                      </span>
                      <span className="md:hidden">
                        {campaignConfig.labels.ctaButton}
                      </span>
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      className="bg-primary hover:bg-primary/80 text-primary-foreground h-7 w-7 sm:h-8 sm:w-8 border border-secondary hover:border-primary transition-all duration-300 sm:hidden rounded flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAddToCart}
                      disabled={isLoading}
                      aria-label={`Añadir ${product.name} al carrito`}
                    >
                      <div className="relative">
                        <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                        {!isLoading && (
                          <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold leading-none">+</span>
                        )}
                      </div>
                    </button>

                    <button
                      className="hidden sm:flex bg-primary hover:bg-primary/80 text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 border border-foreground hover:border-primary transition-all duration-300 text-xs tracking-wide uppercase items-center rounded w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={handleAddToCart}
                      disabled={isLoading}
                      aria-label={`Añadir ${product.name} al carrito`}
                    >
                      <ShoppingCart className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      <span className="hidden md:inline">
                        {isLoading ? "Agregando..." : "Añadir"}
                      </span>
                      <span className="md:hidden">
                        {isLoading ? "..." : "+"}
                      </span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);