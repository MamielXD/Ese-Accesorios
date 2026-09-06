// src/components/ResponsiveImageGrid.jsx
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils/imageHelpers';

export default function ResponsiveImageGrid({
  images = [],
  mode,
  handleEdit = () => {},
  handleDelete = () => {},
  loadImages,
  hasMore,
  isSearchMode,
  loadingMore,
  ITEMS_PER_PAGE,
}) {
  useEffect(() => {
    console.log('[ResponsiveImageGrid] Props recibidas:', {
      images,
      mode,
      hasMore,
      isSearchMode,
      loadingMore,
      ITEMS_PER_PAGE,
    });
  }, [images, mode, hasMore, isSearchMode, loadingMore, ITEMS_PER_PAGE]);

  const n = images.length;

  const baseGridStyle = {
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 300px)',
    gap: '1rem',
    width: '100%',
  };

  let containerClasses = "";
  let additionalStyle = {};

  if (n === 1) {
    containerClasses = "flex justify-center items-center p-4";
  } else if (n >= 2) {
    containerClasses = "grid grid-cols-2 md:grid-cols-4";
  }

  return (
    <>

      <div className={containerClasses} style={{ ...baseGridStyle, ...additionalStyle }} data-debug-columns={containerClasses}>
        {images.map(img => {
          // item style: square for multiple, wide for single
          const itemStyle = n === 1
            ? { width: '100%', maxWidth: '900px', display: 'flex', flexDirection: 'column' }
            : { width: '100%', aspectRatio: '1 / 1', display: 'flex', flexDirection: 'column' };

          return (
            <div key={img.id} className="border p-2 rounded-sm bg-background shadow-sm" style={itemStyle}>
              <div style={{ flex: 1, overflow: 'hidden', borderRadius: 6 }}>
                <img
                  src={getImageUrl(img.url, 'medium')}
                  alt={img.name}
                  loading="lazy"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: n === 1 ? 'contain' : 'cover',
                    display: 'block',
                  }}
                />
              </div>

              <p className="text-xs mt-2 truncate text-muted-foreground" title={img.filename} style={{ marginTop: 8 }}>
                {img.filename}
              </p>

              {mode === 'editar' && (
                <Button
                  variant="warning"
                  size="xs"
                  className="mt-2 w-full text-xs bg-edit hover:bg-edit/90 text-edit-foreground py-1 rounded transition-colors"
                  onClick={() => {
                    console.log('[ResponsiveImageGrid] Editar imagen:', img);
                    handleEdit(img);
                  }}
                >
                  Editar
                </Button>
              )}

              {mode === 'borrar' && (
                <Button
                  variant="destructive"
                  size="xs"
                  className="mt-2 w-full text-xs hover:bg-destructive/90 text-destructive-foreground py-1 rounded transition-colors"
                  onClick={() => {
                    console.log('[ResponsiveImageGrid] Borrar imagen:', img);
                    handleDelete(img);
                  }}
                >
                  Borrar
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {images.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {isSearchMode
              ? 'No se encontraron imágenes con ese criterio'
              : 'No hay imágenes disponibles'}
          </p>
        </div>
      )}

      {hasMore && !isSearchMode && images.length > 0 && (
        <div className="text-center mt-6">
          <Button
            onClick={() => {
              console.log('[ResponsiveImageGrid] Cargar más imágenes');
              loadImages();
            }}
            disabled={loadingMore}
            variant="secondary"
            className="px-6 py-2"
          >
            {loadingMore
              ? 'Cargando más...'
              : `Cargar ${ITEMS_PER_PAGE} imágenes más`}
          </Button>
        </div>
      )}

      {loadingMore && (
        <div className="text-center mt-2">
          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-ring"></div>
        </div>
      )}
    </>
  );
}
