import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageSelector from '@/components/ImageSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils/imageHelpers';
import { Edit2, Trash2, HelpCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Componente de Tooltip / Ayuda simple
function FieldHelp({ text }) {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
      <HelpCircle size={12} /> {text}
    </p>
  );
}

export default function PromotionForm({ mode = 'crear', searchTerm = '' }) {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
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

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (mode === 'editar' || mode === 'borrar') {
      fetchPromotions();
    }
  }, [mode]);

  const fetchPromotions = async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('title', { ascending: true });
    if (!error) setPromotions(data);
  };

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

  const clearForm = () => {
    setForm({
      id: null,
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
  };

  const openEditModal = (promo) => {
    setForm({
      id: promo.id,
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
    setIsEditModalOpen(true);
  };

  const handleDelete = async (promo) => {
    if (!window.confirm(`¿Estás seguro de eliminar la promoción "${promo.title}"?`)) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('promotions').delete().eq('id', promo.id);
      if (error) throw error;
      toast.success('Promoción eliminada exitosamente');
      fetchPromotions();
    } catch (err) {
      toast.error('Error al eliminar promoción');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
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
      if (isNaN(discount) || discount < 1 || (discount_type === 'percentage' && discount > 100)) {
        toast.error('El descuento ingresado es inválido.');
        setLoading(false);
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const isActive = start_date <= today && today <= end_date;

      if (!title || !description || !image_url || !start_date || !end_date) {
        toast.error('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      if (promotion_type === 'coupon' && (!points_cost || parseInt(points_cost) < 1)) {
        toast.error('Un cupón necesita un costo en puntos válido');
        setLoading(false);
        return;
      }

      const dataObj = {
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
      };

      if (form.id) { // Es edición
        const { error } = await supabase
          .from('promotions')
          .update(dataObj)
          .eq('id', form.id);
          
        if (error) throw error;
        toast.success('Promoción actualizada correctamente');
        setIsEditModalOpen(false);
        clearForm();
        fetchPromotions();
      } else { // Es creación
        dataObj.usage_count = 0;
        dataObj.applicable_products = null;
        const { error } = await supabase.from('promotions').insert([dataObj]);
        if (error) throw error;
        toast.success('Promoción creada exitosamente');
        clearForm();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al procesar la promoción.');
    } finally {
      setLoading(false);
    }
  };

  const filteredPromotions = promotions.filter((p) => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label>Tipo de promoción</Label>
        <Select
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
        <FieldHelp text="Elige si aplica para todos o si se canjea con puntos." />
      </div>

      <div>
        <Label htmlFor="title">Título</Label>
        <Input 
          id="title" name="title" 
          value={form.title} onChange={handleChange} 
          placeholder="Ej: Oferta de Verano" 
        />
        <FieldHelp text="Nombre llamativo para tu promoción." />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input 
          id="description" name="description" 
          value={form.description} onChange={handleChange} 
          placeholder="Ej: Descuento en toda la tienda..." 
        />
        <FieldHelp text="Explica de qué trata la oferta." />
      </div>

      <div>
        <Label>Imagen de la Promoción</Label>
        <div className="mt-2 border rounded p-4 bg-muted/20">
          <ImageSelector 
            selectedUrl={form.image_url} 
            onSelect={(url) => setForm({ ...form, image_url: url })} 
          />
        </div>
        <FieldHelp text="Banner o imagen para mostrar en la web." />
      </div>

      {form.promotion_type === 'global' && (
        <div>
          <Label htmlFor="discount_value">Descuento (%)</Label>
          <Input 
            id="discount_value" name="discount_value" type="number" min="1" max="100"
            value={form.discount_value} onChange={handleChange} 
            placeholder="Ej: 20" 
          />
          <FieldHelp text="Porcentaje de descuento global (ej. 20 para 20%)." />
        </div>
      )}

      {form.promotion_type === 'coupon' && (
        <div className="space-y-4 border p-4 rounded-lg bg-muted/10">
          <h4 className="font-medium text-sm text-foreground">Configuración de Cupón</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de descuento</Label>
              <Select
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
            </div>
            
            <div>
              <Label htmlFor="discount_value">Valor del descuento</Label>
              <Input 
                id="discount_value" name="discount_value" type="number" min="1"
                value={form.discount_value} onChange={handleChange} 
                placeholder={form.discount_type === 'percentage' ? 'Ej: 20' : 'Ej: 15000'} 
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="points_cost">Costo (Puntos)</Label>
              <Input 
                id="points_cost" name="points_cost" type="number" min="1"
                value={form.points_cost} onChange={handleChange} 
                placeholder="Ej: 500" 
              />
            </div>
            <div>
              <Label htmlFor="max_uses">Máx globales</Label>
              <Input 
                id="max_uses" name="max_uses" type="number" min="1"
                value={form.max_uses} onChange={handleChange} 
                placeholder="Opcional" 
              />
            </div>
            <div>
              <Label htmlFor="max_uses_per_user">Máx por usuario</Label>
              <Input 
                id="max_uses_per_user" name="max_uses_per_user" type="number" min="1"
                value={form.max_uses_per_user} onChange={handleChange} 
                placeholder="Opcional" 
              />
            </div>
          </div>
          <FieldHelp text="Reglas especiales para cuando el usuario canjee sus puntos." />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Fecha de inicio</Label>
          <Input 
            id="start_date" name="start_date" type="date"
            value={form.start_date} onChange={handleChange} 
          />
        </div>
        <div>
          <Label htmlFor="end_date">Fecha de fin</Label>
          <Input 
            id="end_date" name="end_date" type="date"
            value={form.end_date} onChange={handleChange} 
          />
        </div>
      </div>
    </div>
  );

  if (mode === 'crear') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-background p-6 rounded-lg shadow-sm border transition-all duration-300">
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-medium">Crear Nueva Promoción</h3>
          <p className="text-sm text-muted-foreground mt-1">Lanza ofertas globales o cupones de fidelidad.</p>
        </div>
        
        {renderFormFields()}

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear Promoción'}
        </Button>
      </form>
    );
  }

  // Vista de Tabla/Grid para Editar / Borrar
  return (
    <div className="space-y-4">
      {filteredPromotions.length === 0 ? (
        <div className="text-center py-12 bg-background border rounded-lg">
          <p className="text-muted-foreground">No se encontraron promociones.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPromotions.map(promo => (
            <div key={promo.id} className="bg-background border rounded-lg overflow-hidden flex shadow-sm hover:shadow-md transition-shadow">
              <div className="w-1/3 bg-muted relative">
                <img 
                  src={getImageUrl(promo.image_url, 'small')} 
                  alt={promo.title} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col flex-1 w-2/3">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-lg leading-tight">{promo.title}</h4>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${
                    promo.promotion_type === 'global' ? 'bg-primary/10 text-primary' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {promo.promotion_type}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                  {promo.description}
                </p>
                
                <div className="text-sm mt-2 text-stone-600">
                  Válido: {promo.start_date} al {promo.end_date}
                </div>
                
                <div className="mt-auto pt-3 flex gap-2">
                  {mode === 'editar' ? (
                    <Button 
                      variant="outline" size="sm"
                      className="w-full gap-1 border-edit text-edit hover:bg-edit hover:text-edit-foreground"
                      onClick={() => openEditModal(promo)}
                    >
                      <Edit2 size={14} /> Editar
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" size="sm"
                      className="w-full gap-1"
                      onClick={() => handleDelete(promo)}
                      disabled={loading}
                    >
                      <Trash2 size={14} /> Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Edición */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Promoción</DialogTitle>
            <DialogDescription>
              Modifica la información de "{form.title}".
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {renderFormFields()}
            
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-edit hover:bg-edit/90 text-edit-foreground">
                {loading ? 'Actualizando...' : 'Actualizar Promoción'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
