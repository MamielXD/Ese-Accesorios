import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';

// Componente: Exportar Catalogo a Facebook con URLs SEO-friendly
// Uso: importa y coloca <ExportFacebookCatalogButton /> en tu panel admin.
// Requisitos: Tener configurado supabase client en '@/lib/supabaseClient' y Tailwind en tu proyecto.

export default function ExportFacebookCatalogButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const csvEscape = (val) => {
    if (val === null || val === undefined) return '';
    const s = String(val);
    return '"' + s.replace(/"/g, '""') + '"';
  };

  const mapGoogleCategory = (categoryName = '') => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('anill') || name.includes('candong')) return 'Clothing & Accessories > Jewelry > Rings';
    if (name.includes('cadena') || name.includes('neck')) return 'Clothing & Accessories > Jewelry > Necklaces & Chains';
    if (name.includes('pulser') || name.includes('bracelet')) return 'Clothing & Accessories > Jewelry > Bracelets';
    if (name.includes('arete') || name.includes('ear')) return 'Clothing & Accessories > Jewelry > Earrings';
    if (name.includes('tobiller') || name.includes('anklet')) return 'Clothing & Accessories > Jewelry > Anklets';
    if (name.includes('set')) return 'Clothing & Accessories > Jewelry > Jewelry Sets';
    return 'Clothing & Accessories > Jewelry';
  };

  const mapFbCategory = (categoryName = '') => {
    const name = (categoryName || '').toLowerCase();
    if (name.includes('anill')) return 'Joyas y relojes > Joyas > Anillos';
    if (name.includes('pulser')) return 'Joyas y relojes > Joyas > Pulseras';
    if (name.includes('collar') || name.includes('cadena')) return 'Joyas y relojes > Joyas > Collares';
    if (name.includes('arete') || name.includes('earcuff') || name.includes('candongas')) return 'Joyas y relojes > Joyas > Dijes y colgantes';
    if (name.includes('tobiller')) return 'Joyas y relojes > Joyas > Joyas para el cuerpo';
    if (name.includes('set')) return 'Joyas y relojes > Joyas > Juegos de joyas';
    return 'Joyas y relojes > Joyas';
  };

  // ✅ Generar URL SEO-friendly
  const generateProductUrl = (productId, slug) => {
    const shortId = productId.substring(0, 8);
    const productSlug = slug || 'producto';
    return `https://eseaccesorios.com/producto/${shortId}/${productSlug}`;
  };

  async function handleExport() {
    try {
      setLoading(true);
      setMessage(null);

      // 1) Traer productos y categorias desde Supabase
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });

      if (prodErr) throw prodErr;

      // Validar que los productos tengan slug
      const productsWithoutSlug = products.filter(p => !p.slug);
      if (productsWithoutSlug.length > 0) {
        console.warn(`⚠️ ${productsWithoutSlug.length} productos sin slug encontrados. Se usará fallback.`);
      }

      const { data: categories, error: catErr } = await supabase
        .from('categories')
        .select('*');

      const cats = categories || [];

      // Crear mapa de categorias por id
      const categoryMap = new Map();
      cats.forEach((c) => categoryMap.set(c.id, c));

      const header = [
        'id','title','description','availability','condition','price','link','image_link','brand','google_product_category','fb_product_category','quantity_to_sell_on_facebook','sale_price','sale_price_effective_date','item_group_id','gender','color','size','age_group','material','pattern','shipping','shipping_weight','gtin','video[0].url','video[0].tag[0]','product_tags[0]','product_tags[1]','style[0]'
      ];

      const rows = [];

      // 3) Filas para cada producto (variantes)
      for (const p of products) {
        const availability = p.stock && Number(p.stock) > 0 ? 'in stock' : 'out of stock';
        const price = p.price ? `${Number(p.price).toFixed(2)} COP` : '0 COP';
        const image = p.image_url || '';
        const color = p.color || '';
        const size = p.size || 'Única';

        // Obtener categoria para mapear google/fb categories
        const cat = categoryMap.get(p.category_id) || null;
        const googleCat = mapGoogleCategory(cat ? cat.name : '');
        const fbCat = mapFbCategory(cat ? cat.name : '');

        // ✅ Generar URL SEO-friendly
        const productUrl = generateProductUrl(p.id, p.slug);

        const row = [
          csvEscape(p.id),
          csvEscape(p.name),
          csvEscape(p.description || ''),
          csvEscape(availability),
          csvEscape('new'),
          csvEscape(price),
          csvEscape(productUrl), // ✅ URL actualizada
          csvEscape(image.replace('.webp', '-large.webp')),
          csvEscape('Ese Accesorios'),
          csvEscape(googleCat),
          csvEscape(fbCat),
          csvEscape(p.stock),
          csvEscape(''),
          csvEscape(''),
          csvEscape(`ITEM-${p.id.substring(0, 8)}`),
          csvEscape('unisex'),
          csvEscape(color),
          csvEscape(size),
          csvEscape('adult'),
          csvEscape('Rodio'),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape(''),
          csvEscape('cadenas'),
          csvEscape('accesorios'),
          csvEscape('')
        ];

        rows.push(row.join(','));
      }

      const csvContent = [header.join(','), ...rows].join('\n');

      // 4) Subir archivo a Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('catalog')
        .upload('facebook_catalogo.csv', csvContent, {
          contentType: 'text/csv',
          upsert: true
        });

      if (uploadError) throw new Error(uploadError.message || 'Error al subir CSV');

      const { data: { publicUrl } } = supabase.storage
        .from('catalog')
        .getPublicUrl('facebook_catalogo.csv');

      setMessage(`✅ Exportación lista. ${products.length} productos exportados. Archivo: ${publicUrl}`);

    } catch (error) {
      console.error(error);
      setMessage('❌ Error exportando: ' + (error.message || JSON.stringify(error)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={handleExport}
        disabled={loading}
        variant="default"
        className="px-4 py-2"
      >
        {loading ? 'Exportando...' : 'Exportar Catálogo a Facebook'}
      </Button>
      {message && (
        <div className={`text-sm p-3 rounded-md ${
          message.includes('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}