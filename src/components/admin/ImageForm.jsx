import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageUploader from './ImageUploader'; // Asegúrate de que este componente maneje bien las subidas múltiples
import { Button } from '@/components/ui/button';
import ResponsiveImageGrid from './ResponsiveImageGrid';

// La URL base de Supabase para las imágenes
const SUPABASE_IMG_URL = 'https://gfbpnljevubkiefjmrnf.supabase.co/storage/v1/object/public/img';

export default function ImageForm({ mode }) {
  const [images, setImages] = useState([]);
  const [editingImage, setEditingImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // ✨ Nuevo estado para diferenciar el modo de búsqueda
  const [isSearchMode, setIsSearchMode] = useState(false);
  
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(true);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());


  const ITEMS_PER_PAGE = 50;

  // Admin check (sin cambios)
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setIsAdmin(false);
        setAdminLoading(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('admins')
          .select('id')
          .eq('id', session.user.id)
          .single();
        
        if (!error && data) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error('Error checking admin status:', err);
        setIsAdmin(false);
      } finally {
        setAdminLoading(false);
      }
    };
    checkAdmin();
  }, []);

  // Carga desde tabla `images` (sin cambios)
  const loadImages = async (reset = false) => {
    if (!reset && (!hasMore || loadingMore)) return;

    if (reset) setLoading(true);
    setLoadingMore(true);

    const currentOffset = reset ? 0 : offset;
    try {
      const { data, error } = await supabase
        .from('images')
        .select('id, name, url, filename, created_at')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      if (reset) {
        setImages(data);
        setOffset(ITEMS_PER_PAGE);
      } else {
        setImages(prev => [...prev, ...data]);
        setOffset(prev => prev + ITEMS_PER_PAGE);
      }

      setHasMore((data?.length ?? 0) === ITEMS_PER_PAGE);
    } catch (err) {
      console.error(err);
      toast.error('Error al cargar imágenes');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Búsqueda en la base de datos (sin cambios en la lógica de Supabase)
  const searchSpecificImages = async (searchTerm) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('images')
        .select('id, name, url, filename, created_at')
        .ilike('name', `%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;
      setImages(data);
      setHasMore(false); // No hay "cargar más" en los resultados de búsqueda
    } catch (err) {
      console.error(err);
      toast.error('Error al buscar imágenes');
    } finally {
      setLoading(false);
    }
  };

  // 🎯 Lógica mejorada: useEffect con debounce para búsqueda automática
  useEffect(() => {
    // Si el usuario está escribiendo, esperamos 300ms antes de buscar
    const debounceTimer = setTimeout(() => {
      if (search.trim()) {
        setIsSearchMode(true);
        searchSpecificImages(search);
      } else {
        // Si el campo está vacío, volvemos al modo normal
        if (isSearchMode) { // Solo recarga si venimos del modo búsqueda
            setIsSearchMode(false);
            loadImages(true); 
        }
      }
    }, 300);

    // Limpiamos el timer si el usuario sigue escribiendo
    return () => clearTimeout(debounceTimer);
  }, [search]); // Este efecto se ejecuta cada vez que 'search' cambia

  // Carga inicial de imágenes
  useEffect(() => {
    if (mode !== 'crear' && isAdmin && !adminLoading) loadImages(true);
  }, [mode, isAdmin, adminLoading]);

  // 🔥 Limpiar estado de subidas cuando cambia el modo
  useEffect(() => {
    setUploadingFiles(new Set());
  }, [mode]);

  const handleEdit = async (img) => {
    try {
      const res = await fetch(img.url);
      const blob = await res.blob();
      const file = new File([blob], img.filename, { type: blob.type });
      setEditingImage({ file, id: img.id, name: img.name, filename: img.filename });
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cargar la imagen para editar');
    }
  };

    const handleDelete = async (img) => {
    if (!confirm(`¿Seguro que quieres eliminar "${img.name}"?`)) return;
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('No hay sesión activa');

      // Eliminar los 3 tamaños de la imagen de Supabase Storage
      const baseName = img.filename.replace('.webp', '');
      const filesToRemove = [
        `${baseName}-small.webp`,
        `${baseName}-medium.webp`,
        `${baseName}-large.webp`
      ];

      const { data, error: storageError } = await supabase.storage
        .from('img')
        .remove(filesToRemove);

      if (storageError) {
        console.error('Error al borrar de storage:', storageError);
        // Continuamos de todas formas para borrar el registro de la BD
      }

      const { error } = await supabase.from('images').delete().eq('id', img.id);
      if (error) throw error;

      toast.success('Imagen eliminada correctamente');
      setImages(prev => prev.filter(i => i.id !== img.id));
    } catch (err) {
      console.error('Error completo al borrar:', err);
      toast.error(err.message || 'Error al borrar imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleMultipleUploadForCreate = async (results) => {
    console.log('[ImageForm] handleMultipleUploadForCreate iniciado');
    console.log('[ImageForm] Resultados recibidos:', results);
  
    if (!Array.isArray(results) || results.length === 0) {
      console.error('[ImageForm] Los resultados no son válidos:', results);
      toast.error('No se recibieron imágenes válidas para guardar');
      return;
    }
  
    setLoading(true);
    try {
      const newImagesData = results.map(item => {
        if (!item.baseFilename) {
          console.error('[ImageForm] Datos inválidos: falta baseFilename', item);
          throw new Error('Datos de imagen inválidos: falta baseFilename');
        }
  
        // Guardamos solo la URL base, sin sufijo de tamaño
        const name = item.baseFilename;
        const url = `${SUPABASE_IMG_URL}/${item.baseFilename}.webp`; // URL base
        const filename = `${item.baseFilename}.webp`; // Filename base
  
        return {
          name: name,
          url: url,
          filename: filename,
        };
      });
  
      console.log('[ImageForm] Datos a insertar en Supabase:', newImagesData);
  
      const { error } = await supabase
        .from('images')
        .insert(newImagesData);
  
      if (error) {
        console.error('[ImageForm] Error al insertar datos en Supabase:', error);
        throw error;
      }
  
      toast.success('Imágenes subidas y guardadas correctamente');
      loadImages(true);
    } catch (err) {
      console.error('[ImageForm] Error al guardar metadata de imágenes:', err);
      toast.error('Error al guardar metadata de imágenes');
    } finally {
      setLoading(false);
    }
  };


  const handleUpdate = async (results) => {
    if (!editingImage || !results || results.length === 0) {
      toast.error('No se recibieron datos válidos para actualizar.');
      return;
    }
    setLoading(true);
  
    const { baseFilename } = results[0] || {};
  
    try {
      if (!baseFilename) {
        toast.error('Datos incompletos para la actualización.');
        return;
      }
  
      const newUrl = `${SUPABASE_IMG_URL}/${baseFilename}.webp`;
      const newFileName = `${baseFilename}.webp`;
  
      // Actualizar el registro existente
      const { error: updateError } = await supabase
        .from('images')
        .update({
          name: baseFilename,
          url: newUrl,
          filename: newFileName,
        })
        .eq('id', editingImage.id);
  
      if (updateError) throw updateError;
  
      // Eliminar archivos anteriores si el nombre cambió
      if (newFileName !== editingImage.filename) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          // Eliminar los 3 tamaños del archivo anterior
          const oldBaseName = editingImage.filename.replace('.webp', '');
          const filesToRemove = [
            `${oldBaseName}-small.webp`,
            `${oldBaseName}-medium.webp`,
            `${oldBaseName}-large.webp`
          ];
          
          const { error: deleteErr } = await supabase.storage
            .from('img')
            .remove(filesToRemove);
            
          if (deleteErr) {
            console.warn(`Error al borrar archivos viejos:`, deleteErr);
          }
        }
      }
  
      toast.success('Imagen actualizada correctamente');
      setEditingImage(null);
  
      if (isSearchMode && search.trim()) {
        searchSpecificImages(search);
      } else {
        loadImages(true);
      }
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      toast.error('Error al actualizar imagen');
    } finally {
      setLoading(false);
    }
  };

  

  // --- Estados de carga y permisos (sin cambios) ---
  if (adminLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-600"></div>
        <span className="ml-2 text-neutral-600">Verificando permisos...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">No tienes permisos para administrar imágenes.</p>
      </div>
    );
  }

  // --- JSX Renderizado ---
  return (
    <div className="space-y-4">
      {mode === 'crear' && <ImageUploader supabaseClient={supabase} uploadUrl="https://eseaccesorios.com/upload.php" onUpload={handleMultipleUploadForCreate} onMultipleUpload={handleMultipleUploadForCreate} saveToSupabase={true} multiple={true} />}

      {(mode === 'editar' || mode === 'borrar') && (
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            
            {/* ✨ Contenedor del input para posicionar el botón de limpiar */}
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                placeholder="Buscar imagen..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 text-sm py-2 pl-4 pr-8 rounded-full border border-stone-200 bg-white/80 text-neutral-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 transition-all duration-300"
              />
              {/* ✨ Botón para limpiar la búsqueda */}
              {search && (
                <Button
                  onClick={() => setSearch('')}
                  variant="ghost"
                  size="icon" // Use icon size for a small button
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
                {/* ✨ Indicador visual de búsqueda activa */}
                {isSearchMode && (
                    <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        Búsqueda activa
                    </span>
                )}
                <span className="text-xs text-gray-500">
                    {images.length} {isSearchMode ? 'resultados' : `imágenes de ${offset}`}
                </span>
            </div>
          </div>

          {/*Contenedor de la grilla de imágenes */}
          <ResponsiveImageGrid
  images={images}
  mode={mode}
  handleEdit={handleEdit}
  handleDelete={handleDelete}
  loadImages={loadImages}
  hasMore={hasMore}
  isSearchMode={isSearchMode}
  loadingMore={loadingMore}
  ITEMS_PER_PAGE={ITEMS_PER_PAGE}
  className="overflow-y-auto max-h-[80vh]" // Permitir scroll vertical
/>{/* Ajustar el contenedor de la grilla para permitir scroll */}
        </>
      )}

      {/* Modal de edición (sin cambios) */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4 shadow-xl">
            <h3 className="text-lg font-medium text-gray-800">Editar Imagen</h3>
            <ImageUploader
              initialImage={editingImage.file}
              defaultFileName={editingImage.filename.replace(/\.[^/.]+$/, '')}
              supabaseClient={supabase}
              uploadUrl="https://eseaccesorios.com/upload.php"
              onMultipleUpload={handleUpdate}
            />
            <Button variant="outline" className="w-full mt-4" onClick={() => setEditingImage(null)}>Cancelar</Button>
          </div>
        </div>
      )}
    </div>
  );
}