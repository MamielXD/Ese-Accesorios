import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tag } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import { getImageUrl } from '@/utils/imageHelpers';

const CategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, image_url, description')
        .order('name', { ascending: true });
      
      if (error) {
        console.error('Error fetching categories:', error);
        toast({ title: "Error", description: "No se pudieron cargar las categorías.", variant: "destructive" });
        setCategories([]);
      } else if (data) {
        setCategories(data.map(cat => ({
          ...cat,
          slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
          image_url: cat.image_url || '/placeholder.jpg'
        })));
      }
      setLoading(false);
    };
    fetchCategories();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)] bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12"
    >
      <div className="text-center mb-10 sm:mb-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide text-foreground mb-3">Explora Nuestras Colecciones</h1>
        <p className="text-base sm:text-lg text-foreground/70 leading-relaxed">Descubre piezas exclusivas navegando por cada categoría.</p>
      </div>

      {categories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="h-full"
            >
              <Link to={`/productos/${category.slug}`} className="block h-full group">
                <Card className="w-full h-full overflow-hidden rounded-sm shadow-sm hover:shadow-md transition-all duration-500 flex flex-col">
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={getImageUrl(category.image_url, 'medium')}
                      alt={`Categoría ${category.name}`}
                      className="w-full h-full object-cover filter saturate-90 transition-transform duration-700 ease-in-out group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-background/10 group-hover:bg-transparent transition-all duration-500"></div>
                  </div>
                  <CardHeader className="p-4 flex-grow flex items-center justify-center bg-background">
                    <CardTitle className="text-center text-foreground/80 font-light tracking-wide text-md group-hover:text-foreground transition-colors duration-300">
                      {category.name}
                    </CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-stone-50 rounded-sm"
        >
          <Tag className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-stone-400 mb-4" />
          <p className="text-lg sm:text-xl font-light tracking-wide text-neutral-700 mb-2">No hay categorías disponibles</p>
          <p className="text-stone-500 text-sm sm:text-base leading-relaxed">Agrega categorías a la base de datos para que aparezcan aquí.</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default CategoriesPage;
