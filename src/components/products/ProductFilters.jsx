import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Filter, ChevronDown, ChevronUp, Search } from 'lucide-react';

export const SORT_OPTIONS = {
  RELEVANCE: { label: "Relevancia", value: "relevance" },
  PRICE_ASC: { label: "Precio: Bajo a Alto", value: "price_asc" },
  PRICE_DESC: { label: "Precio: Alto a Bajo", value: "price_desc" },
  NAME_ASC: { label: "Nombre: A-Z", value: "name_asc" },
  NAME_DESC: { label: "Nombre: Z-A", value: "name_desc" },
  NEWEST: { label: "Más Recientes", value: "newest" },
};

const ProductFilters = ({
  searchTerm,
  onSearchTermChange,
  priceRange,
  onPriceChange,
  maxPrice,
  sortOption,
  onSortOptionChange,
  showFilters,
  onShowFiltersToggle,
  allCategories,
  selectedCategoryName,
  onCategorySelect,
  currentCategorySlug
}) => {
  // Estados para manejar toques accidentales
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartTime, setTouchStartTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const sortButtonRef = useRef(null);
  const categoryButtonRef = useRef(null);

  // Función para manejar el inicio del toque
  const handleTouchStart = (e, buttonType) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setTouchStartTime(Date.now());
    setIsDragging(false);
  };

  // Función para manejar el movimiento del toque
  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const deltaY = Math.abs(touch.clientY - touchStartY);
    
    // Si el usuario se mueve más de 10px verticalmente, consideramos que está scrolleando
    if (deltaY > 10) {
      setIsDragging(true);
    }
  };

  // Función para manejar el final del toque
  const handleTouchEnd = (e, callback) => {
    const touchDuration = Date.now() - touchStartTime;
    
    // Solo ejecutar la acción si:
    // 1. No estaba arrastrando (scrolleando)
    // 2. El toque fue suficientemente corto (menos de 200ms)
    // 3. O si fue un toque más largo pero sin movimiento (tap intencional)
    if (!isDragging && (touchDuration < 200 || touchDuration > 200)) {
      // Pequeño delay para asegurar que no interfiera con el scroll
      setTimeout(() => {
        if (!isDragging) {
          callback && callback();
        }
      }, 50);
    }
    
    // Reset de estados
    setIsDragging(false);
    setTouchStartY(0);
    setTouchStartTime(0);
  };

  return (
    <div className="mb-8 p-4 sm:p-6 bg-background rounded-sm border shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="relative flex-grow md:max-w-sm">
          <Input
            type="text"
            placeholder="Buscar en la tienda..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 pr-4 py-2 border focus:border-primary focus:ring-primary rounded-sm transition-all"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <Button
            variant="outline"
            onClick={onShowFiltersToggle}
            className="flex-1 sm:flex-none"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0, marginTop: 0 }}
          animate={{ height: 'auto', opacity: 1, marginTop: '24px' }}
          exit={{ height: 0, opacity: 0, marginTop: 0 }}
          className="overflow-hidden"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t border">
            <div>
              <label htmlFor="price-range" className="block text-sm font-light text-foreground mb-2">
                Rango de Precio: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              </label>
              <Slider
                id="price-range"
                min={0}
                max={maxPrice}
                step={1000}
                value={priceRange}
                onValueChange={onPriceChange}
                className="w-full [&>span:first-child]:h-1 [&>span:first-child]:bg-muted [&_[role=slider]]:bg-primary [&_[role=slider]]:border-2 [&_[role=slider]]:border-background [&_[role=slider]]:shadow"
              />
            </div>
            
            {allCategories.length > 0 && (
              <div>
                <label htmlFor="category-filter" className="block text-sm font-light text-foreground mb-2">
                  Filtrar por Categoría
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      ref={categoryButtonRef}
                      variant="outline"
                      className="w-full justify-between border text-muted-foreground hover:bg-muted hover:border-accent-foreground px-4 py-2 rounded-sm transition-all duration-300"
                      style={{ 
                        touchAction: 'manipulation',
                        WebkitTouchCallout: 'none',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                      onTouchStart={(e) => handleTouchStart(e, 'category')}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => {
                        e.preventDefault();
                        handleTouchEnd(e, () => {
                          if (categoryButtonRef.current && !isDragging) {
                            categoryButtonRef.current.click();
                          }
                        });
                      }}
                      onClick={(e) => {
                        if ('ontouchstart' in window && isDragging) {
                          e.preventDefault();
                          e.stopPropagation();
                        }
                      }}
                    >
                      {currentCategorySlug ? selectedCategoryName : "Todas las Categorías"}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-60 overflow-y-auto bg-background shadow-lg rounded-sm border">
                    <DropdownMenuItem asChild className="hover:bg-muted">
                      <Link to="/productos" onClick={() => onCategorySelect("Todos los Productos", null)}>Todas las Categorías</Link>
                    </DropdownMenuItem>
                    {allCategories.map(cat => (
                      <DropdownMenuItem key={cat.slug} asChild className="hover:bg-muted">
                        <Link to={`/productos/${cat.slug}`} onClick={() => onCategorySelect(cat.name, cat.slug)}>{cat.name}</Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <div>
              <label htmlFor="sort-option" className="block text-sm font-light text-foreground mb-2">
                Ordenar Productos
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    ref={sortButtonRef}
                    variant="outline"
                    className="w-full justify-between border text-muted-foreground hover:bg-muted hover:border-accent-foreground px-4 py-2 rounded-sm transition-all duration-300"
                    style={{ 
                      touchAction: 'manipulation',
                      WebkitTouchCallout: 'none',
                      WebkitTapHighlightColor: 'transparent'
                    }}
                    onTouchStart={(e) => handleTouchStart(e, 'sort')}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      handleTouchEnd(e, () => {
                        if (sortButtonRef.current && !isDragging) {
                          sortButtonRef.current.click();
                        }
                      });
                    }}
                    onClick={(e) => {
                      if ('ontouchstart' in window && isDragging) {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                  >
                    <span className="truncate">
                      {Object.values(SORT_OPTIONS).find(opt => opt.value === sortOption)?.label || 'Relevancia'}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background shadow-lg rounded-sm border">
                  <DropdownMenuLabel className="font-light text-foreground">Ordenar Productos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {Object.values(SORT_OPTIONS).map(opt => (
                    <DropdownMenuItem
                      key={opt.value}
                      onSelect={() => onSortOptionChange(opt.value)}
                      className="hover:bg-muted text-muted-foreground"
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ProductFilters;