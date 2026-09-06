import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import ProductFilters, { SORT_OPTIONS } from '@/components/products/ProductFilters';
import ProductGrid from '@/components/products/ProductGrid';

// --- Custom Hook para Debounce ---
// Este hook retrasa la ejecución de una función, lo que es ideal para la búsqueda.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    // Limpia el temporizador si el valor cambia antes de que se cumpla el retraso.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

const ProductsPage = () => {
  const { category: categorySlug } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  // --- OPTIMIZACIÓN ---
  // Usamos el valor "debounced" para el filtrado, evitando re-renderizados en cada tecleo.
  const debouncedSearchTerm = useDebounce(searchTerm, 300); 
  
  const [priceRange, setPriceRange] = useState([0, 1000000]); 
  const [maxPrice, setMaxPrice] = useState(1000000);
  const [sortOption, setSortOption] = useState(SORT_OPTIONS.RELEVANCE.value);
  const [showFilters, setShowFilters] = useState(false);
  const [allCategories, setAllCategories] = useState([]);
  const [selectedCategoryName, setSelectedCategoryName] = useState("Todos los Productos");

  // --- OPTIMIZACIÓN ---
  // Se eliminó `priceRange` de las dependencias. La carga de datos solo
  // debe ocurrir cuando cambia la categoría, no con cada ajuste del slider.
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('id, name, slug');

      if (categoryError) throw categoryError;

      const formattedCategories = categoryData
        .map(cat => ({ id: cat.id, name: cat.name, slug: cat.slug }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAllCategories(formattedCategories);
      
      let categoryIdToFilter = null;
      if (categorySlug) {
        const currentCategory = formattedCategories.find(c => c.slug === categorySlug);
        if (currentCategory) {
          setSelectedCategoryName(currentCategory.name);
          categoryIdToFilter = currentCategory.id;
        } else {
          setSelectedCategoryName("Categoría Desconocida");
          toast({ title: "Error", description: `La categoría "${categorySlug}" no fue encontrada.`, variant: "destructive" });
          navigate("/productos", { replace: true }); 
          return;
        }
      } else {
        setSelectedCategoryName("Todos los Productos");
      }

      let query = supabase
        .from('products')
        .select('*, category:categories(name, slug)');

      if (categoryIdToFilter) {
        query = query.eq('category_id', categoryIdToFilter);
      }
      
      const { data: productData, error: productError } = await query;
      if (productError) throw productError;
      
      const productsWithCategoryName = productData.map(p => ({
        ...p,
        category_name: p.category ? p.category.name : 'Sin Categoría',
        category_slug: p.category ? p.category.slug : null
      }));
      setProducts(productsWithCategoryName || []);
      
      if (productData && productData.length > 0) {
        const maxProductPrice = Math.max(...productData.map(p => p.price));
        const newMaxPrice = maxProductPrice > 0 ? Math.ceil(maxProductPrice / 10000) * 10000 : 1000000;
        setMaxPrice(newMaxPrice);
        setPriceRange([0, newMaxPrice]);
      } else if (!categoryIdToFilter) {
        setMaxPrice(1000000);
        setPriceRange([0, 1000000]);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar los productos.');
      toast({ title: "Error de Carga", description: err.message || 'No se pudieron cargar los productos.', variant: "destructive" });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, toast, navigate]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredAndSortedProducts = useMemo(() => {
    let tempProducts = [...products];

    // Se usa el término de búsqueda con debounce
    if (debouncedSearchTerm) {
      tempProducts = tempProducts.filter(product =>
        product.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
        (product.category_name && product.category_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
      );
    }

    tempProducts = tempProducts.filter(product => product.price >= priceRange[0] && product.price <= priceRange[1]);

    // La lógica de ordenación permanece igual
    switch (sortOption) {
      case SORT_OPTIONS.PRICE_ASC.value:
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case SORT_OPTIONS.PRICE_DESC.value:
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case SORT_OPTIONS.NAME_ASC.value:
        tempProducts.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case SORT_OPTIONS.NAME_DESC.value:
        tempProducts.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case SORT_OPTIONS.NEWEST.value:
        tempProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      default:
        break;
    }
    return tempProducts;
  }, [products, debouncedSearchTerm, priceRange, sortOption]);

  const handleCategorySelect = useCallback((name, slug) => {
    if (slug) {
      navigate(`/productos/${slug}`);
    } else {
      navigate('/productos');
    }
  }, [navigate]);
  
  const pageTitle = categorySlug ? selectedCategoryName : "Todos los Productos";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12"
    >
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-foreground mb-2">{pageTitle}</h1>
        <p className="text-base sm:text-lg text-foreground/80">Explora nuestra selección exclusiva de productos.</p>
      </div>

      <ProductFilters
        searchTerm={searchTerm}
        onSearchTermChange={setSearchTerm}
        priceRange={priceRange}
        onPriceChange={setPriceRange}
        maxPrice={maxPrice}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        showFilters={showFilters}
        onShowFiltersToggle={() => setShowFilters(!showFilters)}
        allCategories={allCategories}
        selectedCategoryName={selectedCategoryName}
        onCategorySelect={handleCategorySelect}
        currentCategorySlug={categorySlug}
      />

      <ProductGrid
        products={filteredAndSortedProducts}
        loading={loading}
        error={error}
        currentCategorySlug={categorySlug}
      />
    </motion.div>
  );
};

export default ProductsPage;