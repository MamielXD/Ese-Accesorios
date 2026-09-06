import { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';

const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Eliminar tildes
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/\s+/g, '-');
};

// Define target image sizes
const IMAGE_SIZES = {
  small: 300,
  medium: 600,
  large: 1200,
};


/**
 * processImage: Recorta, redimensiona y convierte una imagen a WebP.
 * @param {string} imageSrc - La URL de la imagen original.
 * @param {object} croppedAreaPixels - El área de recorte en píxeles.
 * @param {number} targetWidth - El ancho deseado para la imagen final.
 * @returns {Promise<Blob>} - Un Blob de la imagen procesada en formato WebP.
 */
function processImage(imageSrc, croppedAreaPixels, targetWidth) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calcular el aspecto del área recortada
        const aspectRatio = croppedAreaPixels.width / croppedAreaPixels.height;

        // Calcular las nuevas dimensiones manteniendo el aspecto
        let newWidth = targetWidth;
        let newHeight = targetWidth / aspectRatio;

        // Si la imagen original recortada es más pequeña que el targetWidth, no la escalamos hacia arriba
        if (croppedAreaPixels.width < targetWidth) {
          newWidth = croppedAreaPixels.width;
          newHeight = croppedAreaPixels.height;
        }


        canvas.width = newWidth;
        canvas.height = newHeight;

        // Dibujar la parte recortada de la imagen en el canvas
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          newWidth,
          newHeight
        );

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('No se pudo crear el blob de la imagen optimizada.'));
            return;
          }
          resolve(blob);
        }, 'image/webp', 0.85); // Convertir a WebP con calidad 0.85
      } catch (error) {
        reject(new Error(`Error al procesar imagen: ${error.message}`));
      }
    };
    
    image.onerror = (error) => {
      reject(new Error(`Error al cargar imagen: ${error.message || 'Imagen no válida'}`));
    };
    
    // Verificar que la URL sea válida antes de asignar
    if (!imageSrc || typeof imageSrc !== 'string') {
      reject(new Error('URL de imagen no válida'));
      return;
    }
    
    image.src = imageSrc;
  });
}

/**
 * processAllImageSizes: Procesa una imagen recortada en múltiples tamaños definidos en IMAGE_SIZES.
 * @param {string} imageSrc - La URL de la imagen original.
 * @param {object} croppedAreaPixels - El área de recorte en píxeles.
 * @param {string} baseFilename - El nombre base del archivo (sin extensión ni descriptor de tamaño).
 * @returns {Promise<Array<{ sizeName: string, blob: Blob, filename: string }>>} - Un array de objetos con los blobs de cada tamaño.
 */
async function processAllImageSizes(imageSrc, croppedAreaPixels, baseFilename) {
  const processedBlobs = [];
  for (const sizeName in IMAGE_SIZES) {
    const targetWidth = IMAGE_SIZES[sizeName];
    try {
      const blob = await processImage(imageSrc, croppedAreaPixels, targetWidth);
      processedBlobs.push({
        sizeName,
        blob,
        filename: `${baseFilename}-${sizeName}.webp`,
      });
    } catch (error) {
      console.error(`Error procesando tamaño ${sizeName} para ${baseFilename}:`, error);
      // Opcional: manejar el error, quizás no incluir este tamaño o lanzar el error
    }
  }
  return processedBlobs;
}

/**
 * Props:
 * - onUpload: (urlOrBlob, filename) => void  // si autoUpload true recibe (url, filename), si false recibe (blob, filename)
 * - onMultipleUpload: (results) => void // para múltiples archivos, recibe array de {url/blob, filename}
 * - initialImage, defaultFileName (como antes)
 * - uploadUrl (string) -> URL de upload.php (default: https://tudominio.com/upload.php)
 * - supabaseClient (optional) -> cliente supabase (v1 o v2)
 * - authToken (optional) -> token de acceso si ya lo tienes
 * - autoUpload (bool, default true) -> si true sube automáticamente y llama onUpload con la url pública
 * - saveToSupabase (bool, default false) -> 🔥 NUEVO: controla si debe guardar automáticamente en Supabase
 */
import { supabase } from '@/lib/supabaseClient';

export default function ImageUploader({
  onMultipleUpload,
  initialImage = null,
  defaultFileName = '',
  uploadUrl = 'https://eseaccesorios.com/upload.php',
  supabaseClient = null,
  authToken = null,
}) {
  // Estados para modo múltiple
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🔥 Estado para evitar subidas duplicadas
  const [processedFiles, setProcessedFiles] = useState(new Set());

  // Limpiar object URLs solo al desmontar el componente
  useEffect(() => {
    return () => {
      // Limpiar URLs de archivos múltiples solo al desmontar
      multipleFiles.forEach(fileData => {
        if (fileData.previewUrl && fileData.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fileData.previewUrl);
        }
      });
    };
  }, []); // Solo ejecutar al desmontar, no cuando cambien las dependencias

  useEffect(() => {
    // Si hay una imagen inicial, la tratamos como un archivo múltiple para edición
    if (initialImage) {
      const initialFileData = {
        file: initialImage instanceof File ? initialImage : null,
        previewUrl: initialImage instanceof File ? URL.createObjectURL(initialImage) : initialImage,
        customName: defaultFileName || `imagen-${Date.now()}`,
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        processed: false
      };
      setMultipleFiles([initialFileData]);
      setSelectedImageIndex(0);
    } else {
      setMultipleFiles([]);
      setSelectedImageIndex(null);
    }
    setProcessedFiles(new Set());
  }, [initialImage, defaultFileName]);

  const handleMultipleFileChange = (e) => {
    console.log('[ImageUploader] handleMultipleFileChange ejecutado');
    console.log('[ImageUploader] Archivos seleccionados:', e.target.files);
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) {
      console.warn('[ImageUploader] No se seleccionaron archivos');
      return;
    }

    const filesToProcess = selectedFiles.slice(0, 9);
    console.log('[ImageUploader] Archivos a procesar (máx. 9):', filesToProcess);

    // Limpiar URLs previas antes de crear nuevas
    multipleFiles.forEach(fileData => {
      if (fileData.previewUrl && fileData.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(fileData.previewUrl);
      }
    });

    const filesData = filesToProcess.map((file, index) => {
      // Validar que el archivo es una imagen
      if (!file.type.startsWith('image/')) {
        toast.error(`Archivo ${file.name} no es una imagen válida`);
        console.warn(`Archivo ${file.name} no es una imagen válida`);
        return null;
      }

      const originalName = file.name.replace(/\.[^/.]+$/, ''); // 🔥 Usar nombre original sin extensión

      return {
        file,
        previewUrl: URL.createObjectURL(file),
        customName: sanitizeName(originalName), // 🔥 Nombre por defecto basado en el archivo
        crop: { x: 0, y: 0 },
        zoom: 1,
        croppedAreaPixels: null,
        processed: false
      };
    }).filter(Boolean); // Filtrar archivos inválidos

    console.log('[ImageUploader] Datos de archivos procesados:', filesData);

    setMultipleFiles(filesData);
    setSelectedImageIndex(filesData.length > 0 ? 0 : null);
    // 🔥 Limpiar archivos procesados al cambiar archivos múltiples
    setProcessedFiles(new Set());
  };

  const onCropComplete = useCallback((_, croppedAreaPixels) => {
    if (selectedImageIndex !== null) {
      setMultipleFiles(prev => prev.map((item, index) => 
        index === selectedImageIndex 
          ? { ...item, croppedAreaPixels }
          : item
      ));
    }
  }, [selectedImageIndex]);

  const handleFileNameChange = (e) => {
    const value = sanitizeName(e.target.value);
    if (selectedImageIndex !== null) {
      setMultipleFiles(prev => prev.map((item, index) => 
        index === selectedImageIndex 
          ? { ...item, customName: value }
          : item
      ));
    }
  };

  const handleCropChange = (crop) => {
    if (selectedImageIndex !== null) {
      setMultipleFiles(prev => prev.map((item, index) => 
        index === selectedImageIndex 
          ? { ...item, crop }
          : item
      ));
    }
  };

  const handleZoomChange = (zoom) => {
    if (selectedImageIndex !== null) {
      setMultipleFiles(prev => prev.map((item, index) => 
        index === selectedImageIndex 
          ? { ...item, zoom }
          : item
      ));
    }
  };

  // extrae token desde props o supabase client (v2 o v1)
  const getAuthToken = async () => {
    if (authToken) return authToken;

    if (!supabaseClient) return null;

    try {
      //supabase-js v2
      if (supabaseClient.auth && typeof supabaseClient.auth.getSession === 'function') {
        const r = await supabaseClient.auth.getSession();
        return r?.data?.session?.access_token ?? null;
      }
      // supabase-js v1
      if (supabaseClient.auth && typeof supabaseClient.auth.session === 'function') {
        const s = supabaseClient.auth.session();
        return s?.access_token ?? null;
      }
    } catch (err) {
      console.warn('No se pudo obtener token desde supabaseClient', err);
      return null;
    }

    return null;
  };

  const uploadToServer = async (blob, filename) => {
    return new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabase.storage
          .from('img')
          .upload(filename, blob, {
            contentType: 'image/webp',
            upsert: true
          });

        if (error) {
          reject(new Error(error.message));
        } else {
          // Obtener la URL pública
          const { data: { publicUrl } } = supabase.storage
            .from('img')
            .getPublicUrl(filename);
          
          resolve(publicUrl);
        }
      } catch (err) {
        reject(new Error('Error de red durante la subida a Supabase'));
      }
    });
  };

  const handleMultipleUpload = async () => {
    console.log('[ImageUploader] handleMultipleUpload iniciado');
    const filesToProcess = multipleFiles.filter(item => item.croppedAreaPixels && item.customName);
  
    if (filesToProcess.length !== multipleFiles.length) {
      toast.error('Asegúrate de recortar y asignar un nombre a todas las imágenes antes de subir.');
      return;
    }
  
    const toastId = toast.loading(`Procesando ${filesToProcess.length} imágenes...`);
    const allUploadedResults = [];
  
    try {
      setLoading(true);
  
      for (let i = 0; i < filesToProcess.length; i++) {
        const item = filesToProcess[i];
        console.log(`[ImageUploader] Procesando imagen ${i + 1}:`, item);
        
        // 1. Procesar la imagen a múltiples tamaños (small, medium, large)
        const sizedBlobs = await processAllImageSizes(item.previewUrl, item.croppedAreaPixels, item.customName);
        console.log(`[ImageUploader] Blobs generados para ${item.customName}:`, sizedBlobs);
  
        // 2. Subir cada tamaño al servidor
        let allUploaded = true;
        for (const { sizeName, blob, filename } of sizedBlobs) {
          try {
            const uploadResult = await uploadToServer(blob, filename);
            console.log(`[ImageUploader] ✅ Subido: ${filename} -> ${uploadResult}`);
          } catch (uploadError) {
            console.error(`[ImageUploader] ❌ Error subiendo ${filename}:`, uploadError);
            toast.error(`Error subiendo ${filename}: ${uploadError.message}`);
            allUploaded = false;
            break; // Si falla uno, no seguimos con esta imagen
          }
        }
  
        // 3. Si se subieron todos los tamaños, agregamos el resultado
            // We only need to pass the baseFilename to ImageForm, as it will construct the URL.
            // sizedUrls is no longer needed by ImageForm.
            if (item.customName) { // Ensure baseFilename exists
                allUploadedResults.push({
                    baseFilename: item.customName,
                });
            }
        
        const progressPercent = Math.round(((i + 1) / filesToProcess.length) * 100);
        setProgress(progressPercent);
        toast.loading(`Subiendo imágenes... ${progressPercent}%`, { id: toastId });
      }
  
      if (allUploadedResults.length > 0) {
        toast.success(`${allUploadedResults.length} imágenes procesadas y subidas correctamente`, { id: toastId });
        console.log('[ImageUploader] Resultados finales:', allUploadedResults);
        onMultipleUpload(allUploadedResults);
        setMultipleFiles([]);
        setSelectedImageIndex(null);
      } else {
        toast.error('No se pudieron procesar o subir las imágenes', { id: toastId });
      }
  
      setProgress(0);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error al procesar múltiples imágenes:', err);
      toast.error(err.message || 'Error procesando las imágenes', { id: toastId });
      setLoading(false);
    }
  };

  const selectImageForEditing = (index) => {
    setSelectedImageIndex(index);
  };

  const getCurrentCrop = () => {
    return multipleFiles[selectedImageIndex]?.crop || { x: 0, y: 0 };
  };

  const getCurrentZoom = () => {
    return multipleFiles[selectedImageIndex]?.zoom || 1;
  };

  const getCurrentPreviewUrl = () => {
    return multipleFiles[selectedImageIndex]?.previewUrl;
  };

  const getCurrentFileName = () => {
    return multipleFiles[selectedImageIndex]?.customName || '';
  };

  return (
    <div className="space-y-4">
      {/* Input para carga múltiple */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subir imágenes (máx. 9)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            console.log('[ImageUploader] Evento onChange disparado');
            handleMultipleFileChange(e);
          }}
          className="block w-full text-sm text-stone-600 file:mr-3 file:py-2 file:px-3
            file:rounded-sm file:border-0 file:text-sm file:font-medium
            file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 transition-all duration-300"
          disabled={loading}
        />
      </div>

      {/* Matriz para múltiples archivos */}
      {multipleFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Imágenes cargadas (haz clic para editar):</h3>
          <div className={`grid grid-cols-${Math.min(multipleFiles.length, 3)} gap-2 mb-4`}>
            {multipleFiles.map((fileData, index) => (
              <div
                key={index}
                className={`aspect-square border-2 rounded-sm overflow-hidden cursor-pointer transition-all ${ 
                  selectedImageIndex === index
                    ? 'border-blue-500 shadow-lg'
                    : fileData.croppedAreaPixels
                    ? 'border-green-400'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => selectImageForEditing(index)}
              >
                {fileData ? (
                  <div className="relative w-full h-full">
                    <img
                      src={fileData.previewUrl}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {fileData.croppedAreaPixels && (
                      <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 rounded">
                        ✓
                      </div>
                    )}
                    {selectedImageIndex === index && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <span className="text-white font-bold">EDITANDO</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Vacío
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input para nombre de archivo */}
      {selectedImageIndex !== null && (
        <input
          type="text"
          placeholder="Nombre de la imagen (sin extensión)"
          value={getCurrentFileName()}
          onChange={handleFileNameChange}
          className="border border-stone-200 rounded-sm px-3 py-2 w-full bg-stone-50 text-neutral-800 text-sm focus:outline-none focus:border-neutral-400 transition"
        />
      )}

      {/* Cropper */}
      {getCurrentPreviewUrl() && (
        <div className="relative w-full h-64 bg-black rounded-sm overflow-hidden">
          <Cropper
            image={getCurrentPreviewUrl()}
            crop={getCurrentCrop()}
            zoom={getCurrentZoom()}
            aspect={1}
            onCropChange={handleCropChange}
            onZoomChange={handleZoomChange}
            onCropComplete={onCropComplete}
          />
        </div>
      )}

      {/* Botones de acción */}
      {multipleFiles.length > 0 && (
        <div className="space-y-2">
          <Button
            onClick={handleMultipleUpload}
            variant="default"
            className="w-full px-6 py-2 uppercase"
            disabled={loading || multipleFiles.every(item => !item.croppedAreaPixels)}
          >
            {loading 
              ? `Procesando ${progress}%` 
              : `Procesar ${multipleFiles.filter(item => item.croppedAreaPixels).length} Imágenes Recortadas`
            }
          </Button>
          
          {selectedImageIndex !== null && (
            <p className="text-sm text-gray-600 text-center">
              Editando: {multipleFiles[selectedImageIndex]?.customName || `Imagen ${selectedImageIndex + 1}`}
            </p>
          )}
        </div>
      )}

      {/* Barra de progreso */}
      {loading && (
        <div className="w-full bg-neutral-200 h-2 rounded-sm overflow-hidden">
          <div
            style={{ width: `${progress}%` }}
            className="h-full bg-neutral-800 transition-all"
          />
        </div>
      )}
    </div>
  );
}
