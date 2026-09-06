import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useToast } from "@/components/ui/use-toast";
import { motion } from 'framer-motion';
import { Loader2, ShoppingCart, ArrowLeft, ArrowRight, Tag, Gem, Sparkles, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import ProductCard from '@/components/ProductCard';
import { POINTS_PER_AMOUNT, AMOUNT_FOR_POINTS } from '../contexts/PointsContext';
import { getImageUrl } from '@/utils/imageHelpers';
import { campaignConfig, isSpecialProduct } from '@/config/campaignConfig.js';

const ProductDetailPage = () => {
  const { productId, slug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addToCart, globalPromo } = useCart();
  const [product, setProduct] = useState(null);
  const isCampaignProduct = product ? isSpecialProduct(product.id) : false;
  const [campaignImages, setCampaignImages] = useState([]);
  const [displayImages, setDisplayImages] = useState([]); // New state for consolidated images
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // New state for current image index
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isZoomed, setIsZoomed] = useState(false);
  const [category, setCategory] = useState(null);
  const [error, setError] = useState(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const defaultImage = "https://eseaccesorios.com/imagen-preview.png";
  const siteUrl = "https://eseaccesorios.com";

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Buscar producto usando función RPC que maneja UUID
        const { data: productList, error: productError } = await supabase
          .rpc('get_product_by_short_id', { short_id: productId });

        if (productError) throw productError;

        const productData = productList && productList.length > 0 ? productList[0] : null;

        if (productError) throw productError;

        if (!productData) {
          setError('Producto no encontrado');
          return;
        }

        setProduct(productData);
        setCurrentImageIndex(0); // Reset image index when product changes

        const isCampaign = isSpecialProduct(productData.id);
        let fetchedCampaignImages = [];

        if (isCampaign && campaignConfig.enableExtraImages) {
          const { data: images } = await supabase
            .from('campaign_product_images')
            .select('image_url, display_order')
            .eq('product_id', productData.id)
            .order('display_order');
          
          if (images) fetchedCampaignImages = images;
          setCampaignImages(fetchedCampaignImages);
        } else {
          setCampaignImages([]); // Clear campaign images if not a campaign product or extra images are disabled
        }

        // Consolidate all images for display
        const allImages = [];
        if (productData.image_url) {
          allImages.push({ image_url: productData.image_url });
        }
        if (fetchedCampaignImages.length > 0) {
          allImages.push(...fetchedCampaignImages);
        }
        setDisplayImages(allImages);

        // ✅ Redirigir si la URL no tiene slug o es incorrecto
        const productSlug = productData.slug || '';
        const shortId = productData.id.substring(0, 8);
        
        if (!slug || slug !== productSlug) {
          navigate(`/producto/${shortId}/${productSlug}`, { replace: true });
        }

        if (productData.category_id) {
          const { data: categoryData, error: categoryError } = await supabase
            .from('categories')
            .select('id, name, slug')
            .eq('id', productData.category_id)
            .single();

          if (!categoryError && categoryData) {
            setCategory(categoryData);
            await fetchRelatedProducts(categoryData.id, productData.id);
          }
        }

      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Error al cargar el producto');
        toast({ 
          title: "Error", 
          description: "No se pudo cargar el producto.", 
          variant: "destructive" 
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchRelatedProducts = async (categoryId, currentProductId) => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            categories!products_category_id_fkey (
              name,
              slug
            )
          `)
          .eq('category_id', categoryId)
          .neq('id', currentProductId) 
          .limit(4);

        if (!error && data) {
          setRelatedProducts(data);
        }
      } catch (err) {
        console.error('Error fetching related products:', err);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId, slug, navigate, toast]);

  const handleAddToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);

    try {
      const productToAdd = {
        id: product.id,
        name: product.name || 'Producto sin nombre',
        price: parseFloat(product.price) || 0,
        image: product.image_url || defaultImage,
        category: category?.name || 'Sin Categoría',
        stock: product.stock || 0,
        quantity: 1
      };

      const result = await addToCart(productToAdd, 1);

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
      setIsAddingToCart(false);
    }
  };

  const isOutOfStock = () => {
    if (typeof product?.stock === 'number') {
      return product.stock <= 0;
    }
    return false;
  };

  const getDisplayPrice = () => {
    const basePrice = parseFloat(product?.price) || 0;
    if (globalPromo) {
      return basePrice * (1 - globalPromo.discount_value / 100);
    }
    return basePrice;
  };

  const calculatePoints = () => {
    const price = getDisplayPrice();
    return Math.floor(price / AMOUNT_FOR_POINTS) * POINTS_PER_AMOUNT;
  };

  // ✅ Generar Schema.org JSON-LD
  const generateProductSchema = () => {
    if (!product) return null;

    const shortId = product.id.substring(0, 8);
    const productUrl = `${siteUrl}/producto/${shortId}/${product.slug}`;

    return {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": product.image_url || defaultImage,
      "description": product.description || `Compra ${product.name} en Ese Accesorios. Accesorios de alta calidad en rodio y acero.`,
      "sku": product.id.substring(0, 8).toUpperCase(),
      "brand": {
        "@type": "Brand",
        "name": "Ese Accesorios"
      },
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "COP",
        "price": getDisplayPrice(),
        "priceValidUntil": new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        "availability": isOutOfStock() ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        "itemCondition": "https://schema.org/NewCondition"
      }
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-foreground" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-light tracking-wide text-neutral-800">
          {error || 'Producto no encontrado'}
        </h1>
        <Button asChild className="mt-4 bg-neutral-800 hover:bg-neutral-700 text-white">
          <Link to="/productos">Volver a Productos</Link>
        </Button>
      </div>
    );
  }

  const categoryName = category?.name || 'Sin Categoría';
  const categorySlug = category?.slug;
  const backUrl = categorySlug ? `/productos/${categorySlug}` : "/productos";
  const shortId = product.id.substring(0, 8);
  const productUrl = `${siteUrl}/producto/${shortId}/${product.slug}`;
  const metaDescription = product.description 
    ? product.description.substring(0, 155) 
    : `Compra ${product.name} en Ese Accesorios. Accesorios de alta calidad en rodio y acero. Envíos a toda Colombia.`;

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? displayImages.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === displayImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  // ... (rest of the component)

  return (
    <>
      <Helmet>
        <title>{`${product.name} - ${categoryName} | Ese Accesorios`}</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={`${product.name} | Ese Accesorios`} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={product.image_url || defaultImage} />
        <meta property="og:url" content={productUrl} />
        <meta property="og:type" content="product" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${product.name} | Ese Accesorios`} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={product.image_url || defaultImage} />
        {generateProductSchema() && (
          <script type="application/ld+json">
            {JSON.stringify(generateProductSchema())}
          </script>
        )}
      </Helmet>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8"
      >

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">
          <div>
            <motion.div 
              className="relative group rounded-sm overflow-hidden shadow-sm border border-stone-200 bg-white max-w-md mx-auto md:mx-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {globalPromo && (
                <span className="absolute top-2 left-2 bg-neutral-800 text-white text-xs font-bold px-2 py-1 rounded-sm z-10 border border-neutral-700 shadow-sm">
                  {globalPromo.discount_value}% OFF
                </span>
              )}



        {isCampaignProduct && campaignConfig.active && (
                  <span className="absolute top-2 right-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-sm z-10 border border-accent shadow-sm">
                    {campaignConfig.labels.stockBadge}
                  </span>
                )}        {product.stock === 0 && (
                  <span className="absolute top-2 right-2 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-sm z-10 border border-gray-600 shadow-sm">
                    Agotado
                  </span>
                )}

              {/* Navigation Buttons */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Previous image"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleNextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                    aria-label="Next image"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Main Image */}
              <img
                src={getImageUrl(displayImages[currentImageIndex]?.image_url || defaultImage, 'large')}
                alt={`${product.name} - ${categoryName} - Accesorios de alta calidad en rodio y acero - Ese Accesorios`}
                className={`w-full aspect-square object-cover cursor-pointer transition-transform duration-500 filter saturate-90`}
                onClick={() => setIsZoomed(!isZoomed)} // Keep zoom functionality for the current image
                width="800"
                height="800"
                loading="eager"
              />
              {isZoomed && (
                <div 
                  className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4"
                  onClick={() => setIsZoomed(false)}
                >
                  <motion.img
                    src={`${displayImages[currentImageIndex]?.image_url.replace('.webp', '-large.webp')}` || defaultImage}
                    alt={`${product.name} - Zoom - Ese Accesorios`}
                    className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm shadow-2xl"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  />
                </div>
              )}
            </motion.div>
            {/* Thumbnail navigation */}
            {displayImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-2">
                {displayImages.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <img
                      src={getImageUrl(image.image_url, 'small')}
                      alt={`${product.name} - thumbnail ${index + 1}`}
                      className={`w-full aspect-square object-cover rounded-sm shadow-sm border-2 ${
                        index === currentImageIndex ? 'border-accent' : 'border-primary/50'
                      } cursor-pointer`}
                      onClick={() => setCurrentImageIndex(index)}
                      loading="lazy"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <motion.div 
            className="space-y-6 md:col-span-2"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {category && categoryName !== 'Sin Categoría' && (
              <Link 
                to={`/productos/${category.slug}`} 
                className="inline-block text-xs uppercase tracking-wide text-accent-foreground bg-accent px-3 py-1 rounded-full hover:bg-accent/80 transition-colors"
              >
                {categoryName}
              </Link>
            )}
            
            <h1 className="text-3xl md:text-4xl font-light tracking-wide text-foreground">
              {product.name || 'Producto sin nombre'}
            </h1>
            
            {!(isCampaignProduct && campaignConfig.hidePrice) && (
              <div className="flex flex-col">
                {globalPromo ? (
                  <>
                    <span className="text-lg text-stone-400 line-through text-foreground">
                      ${parseFloat(product.price || 0).toLocaleString()} COP
                    </span>
                    <span className="text-2xl md:text-3xl font-semibold text-foreground">
                      ${getDisplayPrice().toLocaleString()} COP
                    </span>
                    <span className="text-sm text-neutral-600 mt-1">
                      ¡Ahorras ${(parseFloat(product.price || 0) - getDisplayPrice()).toLocaleString()} COP!
                    </span>
                  </>
                ) : (
                  <span className="text-2xl md:text-3xl font-semibold text-foreground">
                    ${parseFloat(product.price || 0).toLocaleString()} COP
                  </span>
                )}
              </div>
            )}

            {/* Mensaje cuando el precio está oculto */}
            {isCampaignProduct && campaignConfig.hidePrice && (
              <div className="text-sm text-foreground font-medium">
                {campaignConfig.labels.priceBadge || "Precio especial de preventa"}
              </div>
            )}
            
            <div className="text-sm">
  {isCampaignProduct && campaignConfig.active ? (
    <span className="text-foreground font-medium animate-pulse">
      {campaignConfig.labels.stockBadge}
    </span>
  ) : product.stock > 0 ? (
    null
  ) : (
    <span className="text-stone-400 font-medium">Sin stock</span>
  )}
</div>
            {!isCampaignProduct && (
            <p className="text-xs text-muted-foreground bg-muted rounded-md px-2 py-1 mt-1 shadow-sm">
              Con esta compra ganarás <strong>{calculatePoints()} puntos</strong>.
            </p>
          )}
            

            <Separator />

            {product.description && (
              <div>
                <h2 className="text-sm font-medium text-foreground/80 mb-1">Descripción</h2>
                <p className="text-sm text-foreground/60 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
            
            {isCampaignProduct && campaignConfig.active && campaignConfig.specialCopy.show && (
  <div className="bg-gradient-to-r from-accent/90 to-accent/70 rounded-lg border border-primary rounded-lg px-4 py-3 space-y-2">
    <h3 className="text-sm font-semibold text-accent-foreground">
      {campaignConfig.specialCopy.title}
    </h3>
    <p className="text-xs text-accent-foreground leading-relaxed">
      {campaignConfig.specialCopy.description}
    </p>
  </div>
)}

            <div className="text-xs text-muted-foreground bg-muted border border-accent rounded-lg px-3 py-2 leading-relaxed">
              <span className="text-muted-foreground"><Gem className="h-4 w-4 inline mr-1" /></span> Piezas en <strong>rodio y acero</strong> de excelente calidad. <Sparkles className="h-4 w-4 inline mr-1" /> Sin embargo, es importante tener en cuenta que, para conservarlas en perfecto estado, se requiere un buen cuidado.
Te recomendamos evitar el contacto con agua (ducha, piscina o mar), sudor, cremas, perfumes y otros productos químicos. 
              <div className="my-2" />
              <span className="text-muted-foreground/80"> Además, el pH de cada persona también puede influir en la duración del baño de la pieza.
Con los cuidados adecuados, podrás disfrutar de tus accesorios por mucho más tiempo. <Heart className="h-4 w-4 inline mr-1" />.</span>
            </div>


            
            {isCampaignProduct && campaignConfig.active && campaignConfig.labels.linkActived ? (
              <Link
                to={campaignConfig.labels.linkButton}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full md:w-auto bg-primary hover:bg-primary/80 text-white px-8 py-3 tracking-wide uppercase flex items-center justify-center rounded-md text-lg font-medium transition-colors"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {campaignConfig.labels.ctaButton}
              </Link>
            ) : (
              <Button 
                size="lg" 
                className="w-full md:w-auto bg-primary hover:bg-primary/80 text-white px-8 py-3 tracking-wide uppercase disabled:bg-neutral-400 disabled:cursor-not-allowed" 
                onClick={handleAddToCart}
                disabled={isOutOfStock() || isAddingToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" /> 
                {isAddingToCart 
                  ? "Agregando..." 
                  : isOutOfStock() 
                  ? "Agotado" 
                  : "Añadir al Carrito"
                }
              </Button>
            )}

            <div className="flex items-center space-x-4 pt-4">
              <div className="flex items-center text-sm text-foreground/50">
                <Tag className="h-4 w-4 mr-1 text-foreground/50" />
                <span>SKU: {product.id?.substring(0,8)?.toUpperCase() || 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <Separator className="my-8" />
            <h2 className="text-2xl md:text-3xl font-light tracking-wide text-center mb-8 text-foreground/90">
              También te podría interesar
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map((relatedProduct) => (
                <ProductCard 
                  key={relatedProduct.id} 
                  product={{
                    ...relatedProduct, 
                    category_name: relatedProduct.categories?.name || 'Sin Categoría' 
                  }} 
                />
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default ProductDetailPage;