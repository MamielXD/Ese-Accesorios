import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Sparkles, Gift, ShoppingBag, Loader2, AlertTriangle, MessageCircle } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from '@/utils/imageHelpers';



const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [homeCategories, setHomeCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { toast } = useToast();

  const defaultProductImage = "/imagen-preview.jpg";
  const defaultCategoryImage = "/imagen-preview.jpg";

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoadingFeatured(true);
      const { data, error } = await supabase
        .from('featured_products')
        .select(`
          display_order,
          product:products (
            id,
            name,
            price,
            stock,
            image_url,
            description,
            category_id ( name, slug )
          )
        `)
        .order('display_order', { ascending: true })
        .limit(3);

      if (error) {
        console.error('Error fetching featured products:', error);
        toast({ title: "Error", description: "No se pudieron cargar los productos destacados.", variant: "destructive" });
        setFeaturedProducts([]);
      } else if (data) {
        const products = data.map(fp => ({
          ...fp.product,
          category: fp.product.category_id ? fp.product.category_id.name : 'Sin Categoría',
          image_url: fp.product.image_url || defaultProductImage
        }));
        setFeaturedProducts(products);
      }
      setLoadingFeatured(false);
    };

    const fetchHomeCategories = async () => {
      setLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, image_url')
        .order('name', { ascending: true }) 
        .limit(8);

      if (error) {
        console.error('Error fetching categories for home:', error);
        toast({ title: "Error", description: "No se pudieron cargar las categorías.", variant: "destructive" });
        setHomeCategories([]);
      } else if (data) {
        setHomeCategories(data.map(cat => ({
          ...cat,
          image_url: cat.image_url || defaultCategoryImage
        })));
      }
      setLoadingCategories(false);
    };

    fetchFeaturedProducts();
    fetchHomeCategories();
  }, [toast]);

  return (
    <div>
      {/* Contenido principal con animaciones */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="space-y-16 md:space-y-24"
      >
        {/* Hero */}
        <section className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex items-center justify-center text-center p-8 sm:p-12 bg-gradient-to-br from-muted via-background to-muted">
          <div className="absolute inset-0 z-0">
            <img
              src="/hero.webp"
              alt="Colección de joyería minimalista"
              width={1920}
              height={1080}
              className="w-full h-full object-cover"
              fetchpriority="high"
              decoding="async"
            />
          </div>
          <div className="relative z-10 max-w-3xl text-foreground bg-background/80 p-8 sm:p-12 rounded-sm backdrop-blur-sm border border-border/50 shadow-sm">
            <motion.h1 
              className="text-3xl sm:text-4xl md:text-5xl font-light mb-6 tracking-wider"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Ese Accesorios
            </motion.h1>
            <motion.p 
              className="text-base sm:text-lg md:text-xl mb-8 text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Accesorios y bisutería de diseño que combinan sobriedad, modernidad y exclusividad. 
            </motion.p>
            <Button size="lg" asChild className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 uppercase">
              <Link to="/productos">
                Descubrir Colección 
                <ShoppingBag className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Featured Products */}
        <section className="px-4 sm:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 tracking-wide">
              Piezas Destacadas
            </h2>
            <div className="w-24 h-px bg-border mx-auto"></div>
          </div>

          {loadingFeatured ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            (() => {
              const availableProducts = featuredProducts.filter(p => p.stock > 0);

              if (availableProducts.length === 0) {
                return <p className="text-center text-muted-foreground italic">Nuevas piezas llegarán pronto...</p>;
              }

              return (
                <>
                  {/* Scroll horizontal en móvil y tablet */}
                  <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide md:hidden px-1 -mx-4 sm:-mx-8 pb-4">
                    {availableProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        className="flex-shrink-0 w-48 sm:w-56 snap-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Grid en desktop */}
                  <div className="hidden md:grid grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {availableProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.2 }}
                      >
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </div>
                </>
              );
            })()
          )}

          <div className="text-center mt-12">
            <Button variant="outline" asChild className="border-border text-foreground hover:bg-accent px-8 py-2 uppercase">
              <Link to="/productos">Ver Colección Completa</Link>
            </Button>
          </div>
        </section>

        {/* Call to Action - Más Sutil y Elegante */}
        <section className="bg-muted/40 p-8 sm:p-12 md:p-16 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="w-12 h-12 mx-auto mb-6 rounded-full bg-accent flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-light text-foreground mb-6 tracking-wide">
              Colección Exclusiva
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto">
              Descubre piezas únicas seleccionadas cuidadosamente. 
              Elegancia que trasciende tendencias, diseñada para quienes aprecian lo auténtico.
            </p>
            <Button 
              size="lg" 
              asChild 
              className="bg-transparent border-2 border-primary text-muted-foreground hover:bg-primary hover:text-primary-foreground px-8 py-3 text-sm tracking-wide uppercase transition-all duration-300"
            >
              <Link to="/promociones">
                Explorar Ofertas 
                <Gift className="ml-3 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Categories - Diseño más Sofisticado */}
        <section className="px-4 sm:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-foreground mb-4 tracking-wide">
              Explora por Estilo
            </h2>
            <div className="w-24 h-px bg-border mx-auto"></div>
          </div>
          {loadingCategories ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : homeCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
              {homeCategories.map((category, index) => {
                const defaultCategoryPlaceholder = "https://gfbpnljevubkiefjmrnf.supabase.co/storage/v1/object/sign/img/Prueba.avif?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2ZjYjc4NjA3LTFjOWUtNDQzZS1hMGJhLWU5MWYwNDRkODhkNCJ9.eyJ1cmwiOiJpbWcvUHJ1ZWJhLmF2aWYiLCJpYXQiOjE3NDg4MjA5MjcsImV4cCI6MTc4MDM1NjkyN30.xqoSTSC-Rc5y9Y0qC4uOoXeyGjK3aSFifwPL0n_FEAQ";
                const imageUrl = category.image_url || defaultCategoryPlaceholder;
                const src = getImageUrl(imageUrl, 'medium'); // Default to medium size for src
                const srcSet = `${getImageUrl(imageUrl, 'small')} 300w, ${getImageUrl(imageUrl, 'medium')} 600w, ${getImageUrl(imageUrl, 'large')} 1200w`;
                const sizes = "(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 300px"; // Keep existing sizes

                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/productos/${category.slug}`} className="block group">
                      <div className="relative rounded-sm overflow-hidden aspect-square shadow-sm group-hover:shadow-md transition-all duration-500 bg-background border border-border group-hover:border-border">
                        <img 
                          src={src}
                          srcSet={srcSet}
                          sizes={sizes}
                          alt={`Categoría de ${category.name}`}
                          loading="lazy"
                          width="300"
                          height="300"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter saturate-90"/>
                        <div className="absolute inset-0 bg-foreground/10 group-hover:bg-foreground/30 transition-colors duration-500 flex items-center justify-center p-4">
                          <span className="text-background text-base sm:text-lg font-light text-center bg-foreground/40 rounded-sm px-4 py-2 backdrop-blur-sm tracking-wide">
                            {category.name}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground italic">Próximamente nuevas categorías...</p>
          )}
          <div className="text-center mt-12">
              <Button 
                variant="outline" 
                asChild 
                className="border-border text-foreground hover:bg-accent hover:border-border/80 px-8 py-2 text-sm tracking-wide uppercase transition-all duration-300"
              >
                <Link to="/categorias">Ver Todas las Categorías</Link>
              </Button>
          </div>
        </section>

      </motion.div>
    </div>
  );
};

export default HomePage;