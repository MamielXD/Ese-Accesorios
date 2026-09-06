// src/config/campaignConfig.js

export const campaignConfig = {
  // ══════════════════════════════════════════════════════
  // CONTROL PRINCIPAL
  // ══════════════════════════════════════════════════════
  active: false, // true = modo campaña activado | false = modo normal

  // ══════════════════════════════════════════════════════
  // DATOS DE LA CAMPAÑA
  // ══════════════════════════════════════════════════════
  name: "Black Friday 2025", // Nombre interno de la campaña
  theme: "black_friday", // Tema visual (usa este nombre para cargar CSS/estilos)

  // ══════════════════════════════════════════════════════
  // IDs DE PRODUCTOS ESPECIALES (Cajas Misteriosas)
  // ══════════════════════════════════════════════════════
  specialProductIds: [
      "9919a517-210f-456e-9f72-8e11104c56c7",
  ],

  // ══════════════════════════════════════════════════════
  // TEXTOS Y LABELS
  // ══════════════════════════════════════════════════════
  labels: {
    stockBadge: "Edición Limitada", 
    ctaButton: "Reservar ahora", 
    priceBadge: "Oferta Black Friday",
    linkActived: true,
    linkButton: "https://wa.me/573142991068?text=¡Hola,%20Ese%20accesorios!%20Me%20interesa%20la%20oferta%20del%20Black%20Friday", 
  },

  // ══════════════════════════════════════════════════════
  // COPY ESPECIAL (se muestra solo en productos especiales)
  // ══════════════════════════════════════════════════════
  specialCopy: {
    show: true,
    title: "Black Friday 2025",
    description: "Del 26 al 28 de Noviembre. Si fuera tú no me lo pensaría.",
  },

  // ══════════════════════════════════════════════════════
  // CONTROL DE PRECIO
  // ══════════════════════════════════════════════════════
  hidePrice: true, // Mostrar precio para que vean el descuento

  // ══════════════════════════════════════════════════════
  // COLORES PERSONALIZADOS (CSS VARS)
  // ══════════════════════════════════════════════════════
  customColors: {
    enabled: true,
    vars: {
      // Negro profundo de fondo
      "--color-primary": "0 0% 8%",              // #141414 - Negro intenso
      "--color-primary-contrast": "0 0% 100%",   // Blanco puro
      
      // Dorado brillante (el del texto BLACK FRIDAY)
      "--color-secondary": "43 96% 56%",         // #F4C430 - Oro metálico
      "--color-secondary-contrast": "0 0% 8%",   // Negro para contraste
      
      // Superficie negra
      "--color-surface": "0 0% 10%",             // #1a1a1a - Negro suave
      "--color-surface-contrast": "0 0% 100%",   // Blanco
      
      // Gris oscuro para elementos desactivados
      "--color-muted": "0 0% 25%",               // #404040 - Gris carbón
      "--color-muted-contrast": "0 0% 90%",      // Gris claro
      
      // Dorado como acento
      "--color-accent": "43 96% 56%",            // #F4C430 - Oro brillante
      "--color-accent-contrast": "0 0% 8%",      // Negro
      
      // Rojo para destructive (mantener funcionalidad)
      "--color-destructive": "0 84% 60%",        // Rojo intenso
      "--color-destructive-contrast": "0 0% 100%", 
      
      // Dorado para edit
      "--color-edit": "43 96% 56%",              
      "--color-edit-contrast": "0 0% 8%",        
      
      // Borde dorado sutil
      "--color-border": "43 50% 30%",            // Oro oscurecido para bordes
    },
  },

  // ══════════════════════════════════════════════════════
  // IMÁGENES ADICIONALES (para productos especiales)
  // ══════════════════════════════════════════════════════
  enableExtraImages: true,
};

export const isSpecialProduct = (productId) => {
  if (!campaignConfig.active) return false;
  return campaignConfig.specialProductIds.includes(productId);
};