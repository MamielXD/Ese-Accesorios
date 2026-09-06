import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils/imageHelpers';

export default function ImageSelector({ onSelect, selectedUrl }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const ITEMS_PER_PAGE = 50;

  const loadImages = async (reset = false) => {
    if (!reset && (!hasMore || loadingMore)) return;
    
    setLoadingMore(true);
    
    const currentOffset = reset ? 0 : offset;
    
    const { data, error } = await supabase
      .from('images')
      .select('name, filename, url')
      .order('created_at', { ascending: false })
      .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);
      
    if (error) {
      console.error('Error al obtener imágenes:', error);
      setLoadingMore(false);
      setLoading(false);
      return;
    }

    const imageUrls = data.map(img => ({
      name: img.filename || img.name,
      url: img.url
    }));

    if (reset) {
      setImages(imageUrls);
      setOffset(ITEMS_PER_PAGE);
    } else {
      setImages(prev => [...prev, ...imageUrls]);
      setOffset(prev => prev + ITEMS_PER_PAGE);
    }
    
    setHasMore(data.length === ITEMS_PER_PAGE);
    setLoading(false);
    setLoadingMore(false);
  };

  const searchInDatabase = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setIsSearchMode(false);
      loadImages(true);
      return;
    }
    
    // CAMBIO 1: No establezcas el estado de carga principal aquí
    // para no desmontar el componente. Usaremos un estado diferente
    // o manejaremos el estado `loading` de forma más inteligente.
    // Por ahora, lo mantenemos para mostrar un indicador visual.
    setLoading(true);
    setIsSearchMode(true);
    
    const { data, error } = await supabase
      .from('images')
      .select('name, filename, url')
      .or(`name.ilike.%${searchTerm}%,filename.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })
      .limit(1000);
      
    if (error) {
      console.error('Error al buscar imágenes:', error);
      setLoading(false);
      return;
    }

    const imageUrls = data.map(img => ({
      name: img.filename || img.name,
      url: img.url
    }));

    setImages(imageUrls);
    setHasMore(false);
    setOffset(0);
    setLoading(false);
  };

  useEffect(() => {
    loadImages(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchInDatabase(search);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleSearch = (value) => {
    setSearch(value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    searchInDatabase(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    setIsSearchMode(false);
    loadImages(true);
  };

  // CAMBIO 2: Condición de carga modificada.
  // Solo muestra el mensaje a pantalla completa en la carga inicial.
  if (loading && images.length === 0) {
    return <p className="text-muted-foreground text-sm">Cargando imágenes...</p>;
  }

  return (
    <div className="mb-4 space-y-3">
      {/* Información y controles */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
        <div
          onSubmit={handleSearchSubmit}
          className="flex gap-2 w-full sm:w-auto"
        >
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Buscar imagen..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full text-sm py-2 px-4 pr-10 rounded-full border bg-background/80 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
            />
            {/* CAMBIO 3: Añadir un indicador de carga para la búsqueda */}
            {loading && isSearchMode && (
              <div className="absolute right-8 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-ring"></div>
              </div>
            )}
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSearchMode && (
            <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
              Búsqueda activa
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {search
              ? `${images.length} resultados`
              : `${images.length} imágenes`}
          </span>
        </div>
      </div>

      {/* Galería */}
      {/* CAMBIO 4: Reducir la opacidad de la galería mientras se busca */}
      <div className={`max-h-[300px] overflow-y-auto border rounded-sm p-3 bg-background shadow-inner transition-opacity duration-300 ${loading && isSearchMode ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid grid-cols-3 gap-3">
          {images.length > 0 ? (
            images.map((img) => (
              <div
                key={img.url}
                onClick={() => onSelect(img.url)}
                className={`cursor-pointer border rounded-sm p-1 transition-all duration-300 hover:scale-105 ${
                  img.url === selectedUrl
                    ? 'border-foreground'
                    : 'border hover:border-border'
                }`}
              >
                <img
                  src={getImageUrl(img.url, 'small')}
                  alt={img.name}
                  className="object-cover w-full h-24 rounded-sm filter saturate-90"
                  loading="lazy"
                />
                <div className="text-xs text-muted-foreground mt-1 truncate" title={img.name}>
                  {img.name}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-sm text-muted-foreground">
              {search ? 'No se encontraron imágenes con ese criterio' : 'No se encontraron imágenes'}
            </p>
          )}
        </div>
        
        {/* Botón cargar más - solo en modo normal */}
        {hasMore && !isSearchMode && (
          <div className="text-center mt-4">
            <Button
              onClick={() => loadImages()}
              disabled={loadingMore}
              variant="secondary" // Using secondary variant for a neutral button
              className="text-sm px-4 py-2"
            >
              {loadingMore ? 'Cargando más...' : `Cargar ${ITEMS_PER_PAGE} imágenes más`}
            </Button>
          </div>
        )}
        
        {loadingMore && (
          <div className="text-center mt-2">
            <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-ring"></div>
          </div>
        )}
      </div>
    </div>
  );
}