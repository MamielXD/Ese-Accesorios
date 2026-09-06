import React from 'react';
import ProductCard from '@/components/ProductCard';
import { motion } from 'framer-motion';
import { Loader2, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const ProductGrid = React.memo(({ products, loading, error, currentCategorySlug }) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-400px)] bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-background p-8 rounded-sm border shadow-sm">
        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-2xl font-light tracking-wide text-foreground mb-2">Ups, algo salió mal</p>
        <p className="text-muted-foreground">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary hover:border-primary/90 shadow-sm transition-all duration-300 px-8 py-3 text-sm tracking-wide uppercase"
        >
          Intentar de nuevo
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12 bg-background p-8 rounded-sm border shadow-sm"
      >
        <PackageSearch className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <p className="text-2xl font-light tracking-wide text-foreground mb-3">No se encontraron productos</p>
        <p className="text-muted-foreground mb-6">Intenta ajustar tus filtros o revisa más tarde.</p>
        {currentCategorySlug && (
          <Button variant="link" asChild className="text-muted-foreground hover:text-foreground text-lg transition-colors duration-300">
            <Link to="/productos">Ver todos los productos</Link>
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          className="h-full"
        >
          <ProductCard product={product} />
        </motion.div>
      ))}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;