import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageSelector from '@/components/ImageSelector';
import PromotionSelector from '@/components/PromotionSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PromotionForm({ mode = 'crear' }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    discount_value: '',
    start_date: '',
    end_date: '',
    promotion_type: 'global',
    points_cost: '',
    discount_type: 'percentage',
    max_uses: '',
    max_uses_per_user: '',
  });

  const [selectedPromotionId, setSelectedPromotionId] = useState(null);
  const [selectedPromotion, setSelectedPromotion] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);

  const capitalizeWords = (str) =>
    str
      .toLowerCase()
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let val = value;

    if (name === 'title' || name === 'description') {
      val = capitalizeWords(val);
    }

    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== DEBUG ===');
    console.log('Form data:', form);
    console.log('Mode:', mode);
    
    const {
      title,
      description,
      image_url,
      discount_value,
      start_date,
      end_date,
      promotion_type,
      points_cost,
      discount_type,
      max_uses,
      max_uses_per_user,
    } = form;

    const discount = parseInt(discount_value);
    if (isNaN(discount) || discount < 1 || discount > 100) {
      toast.error('El descuento debe ser un número entre 1 y 100');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const isActive = start_date <= today && today <= end_date;

    if (mode === 'crear') {
      if (!title || !description || !image_url || !start_date || !end_date) {
        toast.error('Por favor completa todos los campos');
        return;
      }

      if (promotion_type === 'coupon' && (!points_cost || parseInt(points_cost) < 1)) {
        toast.error('Un cupón necesita un costo en puntos válido');
        return;
      }

      const dataToInsert = {
        title,
        description,
        image_url,
        discount_value: discount,
        start_date,
        end_date,
        promotion_type,
        points_cost: points_cost ? parseInt(points_cost) : 0,
        discount_type,
        max_uses: max_uses ? parseInt(max_uses) : null,
        max_uses_per_user: max_uses_per_user ? parseInt(max_uses_per_user) : null,
        active: isActive,
        usage_count: 0,
        applicable_products: null
      };

      console.log('Data to insert:', dataToInsert);

      try {
        const { data, error } = await supabase
          .from('promotions')
          .insert([dataToInsert])
          .select();

        if (error) {
          console.error('Supabase error:', error);
          toast.error(`Error: ${error.message}`);
          return;
        }

        console.log('Insert successful:', data);
        toast.success('Promoción creada');
        
        setForm({
          title: '',
          description: '',
          image_url: '',
          discount_value: '',
          start_date: '',
          end_date: '',
          promotion_type: 'global',
          points_cost: '',
          discount_type: 'percentage',
          max_uses: '',
          max_uses_per_user: '',
        });
        setRefreshCount((prev) => prev + 1);
        
      } catch (err) {
        console.error('Error general:', err);
        toast.error('Error inesperado');
      }
    }

    if (mode === 'editar') {
      if (!selectedPromotionId || !selectedPromotion) {
        toast.error('Selecciona una promoción para editar');
        return;
      }

      const fieldsToUpdate = {};
      for (const key in form) {
        if (form[key] !== '' && form[key] !== selectedPromotion[key]?.toString()) {
          if (['discount_value', 'points_cost', 'max_uses', 'max_uses_per_user'].includes(key)) {
            fieldsToUpdate[key] = parseInt(form[key]);
          } else {
            fieldsToUpdate[key] = form[key];
          }
        }
      }

      fieldsToUpdate.active = form.start_date <= today && today <= form.end_date;

      if (Object.keys(fieldsToUpdate).length === 0) {
        toast('No hiciste ningún cambio');
        return;
      }

      const { error } = await supabase
        .from('promotions')
        .update(fieldsToUpdate)
        .eq('id', selectedPromotionId);

      if (error) toast.error('Error al editar promoción');
      else {
        toast.success('Promoción editada correctamente');
        setRefreshCount((prev) => prev + 1);
      }
    }

    if (mode === 'borrar') {
      if (!selectedPromotionId) {
        toast.error('Selecciona una promoción para eliminar');
        return;
      }

      const { error } = await supabase.from('promotions').delete().eq('id', selectedPromotionId);
      if (error) toast.error('Error al eliminar promoción');
      else {
        toast.success('Promoción eliminada correctamente');
        setForm({
          title: '',
          description: '',
          image_url: '',
          discount_value: '',
          start_date: '',
          end_date: '',
          promotion_type: 'global',
          points_cost: '',
          discount_type: 'percentage',
          max_uses: '',
          max_uses_per_user: '',
        });
        setSelectedPromotionId(null);
        setSelectedPromotion(null);
        setRefreshCount((prev) => prev + 1);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 max-w-xl mx-auto bg-white/80 rounded-sm shadow-lg border border-stone-200 transition-all duration-500"
    >
      {mode !== 'crear' && (
        <PromotionSelector
          key={refreshCount}
          selectedId={selectedPromotionId}
          onSelect={(promo) => {
            setSelectedPromotionId(promo.id);
            setSelectedPromotion(promo);
            setForm({
              title: promo.title || '',
              description: promo.description || '',
              image_url: promo.image_url || '',
              discount_value: promo.discount_value?.toString() || '',
              start_date: promo.start_date || '',
              end_date: promo.end_date || '',
              promotion_type: promo.promotion_type || 'global',
              points_cost: promo.points_cost?.toString() || '',
              discount_type: promo.discount_type || 'percentage',
              max_uses: promo.max_uses?.toString() || '',
              max_uses_per_user: promo.max_uses_per_user?.toString() || '',
            });
          }}
          refreshCount={refreshCount}
        />
      )}

      {mode !== 'borrar' && (
        <>
                    <Select
            name="promotion_type"
            value={form.promotion_type}
            onValueChange={(value) => handleChange({ target: { name: 'promotion_type', value } })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tipo de promoción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="global">Promoción global</SelectItem>
              <SelectItem value="coupon">Cupón (redimible con puntos)</SelectItem>
            </SelectContent>
          </Select>

          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Título"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400 focus:ring-0 transition-all"
          />

          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Descripción"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400 focus:ring-0 transition-all"
          />

          <ImageSelector
            selectedUrl={form.image_url}
            onSelect={(url) => setForm({ ...form, image_url: url })}
          />
          {form.promotion_type === 'global' && (
            <input
            name="discount_value"
            value={form.discount_value}
            onChange={handleChange}
            placeholder="Descuento (%)"
            type="number"
            min="1"
            max="100"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400 focus:ring-0 transition-all"
          />
          )}
          

          {/* Solo si es cupón mostramos estos campos */}
          {form.promotion_type === 'coupon' && (
            <>
             <Select
                name="discount_type"
                value={form.discount_type}
                onValueChange={(value) => handleChange({ target: { name: 'discount_type', value } })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tipo de descuento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Monto fijo</SelectItem>
                </SelectContent>
              </Select>

            <input
            name="discount_value"
            value={form.discount_value}
            onChange={handleChange}
            placeholder={form.discount_type === 'percentage' ? 'Descuento (%)' : 'Descuento (monto fijo)'}
            type="number"
            min="1"
            max="100"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400 focus:ring-0 transition-all"
          />

              <input
                name="points_cost"
                value={form.points_cost}
                onChange={handleChange}
                placeholder="Costo en puntos"
                type="number"
                min="1"
                className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800"
              />

              <input
                name="max_uses"
                value={form.max_uses}
                onChange={handleChange}
                placeholder="Máx usos globales"
                type="number"
                min="1"
                className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800"
              />

              <input
                name="max_uses_per_user"
                value={form.max_uses_per_user}
                onChange={handleChange}
                placeholder="Máx usos por usuario"
                type="number"
                min="1"
                className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800"
              />
            </>
          )}

          <label className="block text-xs text-stone-500 mb-1">Fecha de inicio</label>
          <input
            name="start_date"
            value={form.start_date}
            onChange={handleChange}
            type="date"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400"
          />

          <label className="block text-xs text-stone-500 mb-1">Fecha de fin</label>
          <input
            name="end_date"
            value={form.end_date}
            onChange={handleChange}
            type="date"
            className="border border-stone-200 rounded-sm w-full px-3 py-2 bg-stone-50 text-neutral-800 focus:border-neutral-400"
          />
        </>
      )}

      <button
        type="submit"
        className={`w-full px-6 py-3 tracking-wide uppercase rounded-sm text-sm font-medium shadow-sm transition-all duration-300 ${
          mode === 'crear'
          ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
          : mode === 'editar'
          ? 'bg-edit hover:bg-edit/90 text-edit-foreground'
          : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
        }`}
      >
        {mode === 'crear' ? 'Crear Promoción' : mode === 'editar' ? 'Actualizar' : 'Eliminar'}
      </button>
    </form>
  );
}
