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

export default function ProductForm({ mode = 'crear', searchTerm = '' }) {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category_id: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    fetchCategories();
    if (mode === 'editar' || mode === 'borrar') {
      fetchProducts();
    }
  }, [mode]);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('categories').select('id, name');
    if (!error) setCategories(data);
  };

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, stock, description, category_id')
      .order('name', { ascending: true });
    if (!error) setProducts(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (url) => {
    setForm((prev) => ({ ...prev, image_url: url }));
  };

  const clearForm = () => {
    setForm({
      id: null,
      name: '',
      description: '',
      price: '',
      image_url: '',
      stock: '',
      category_id: '',
    });
  };

  const openEditModal = (product) => {
    setForm({
      id: product.id,
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      image_url: product.image_url || '',
      stock: product.stock?.toString() || '',
      category_id: product.category_id?.toString() || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`¿Estás seguro de eliminar el producto "${product.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('products').delete().eq('id', product.id);
      if (error) throw error;
      toast.success('Producto eliminado exitosamente');
      fetchProducts();
    } catch (err) {
      toast.error('Error al eliminar producto');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const name = form.name.trim();
      const description = form.description.trim();
      const price = form.price === '' ? '' : Number(form.price);
      const image_url = form.image_url;
      const stock = form.stock === '' ? '' : parseInt(form.stock, 10);
      const category_id = form.category_id === '' ? null : form.category_id;

      if (!name || !description || price === '' || !image_url || stock === '' || !category_id) {
        toast.error('Por favor completa todos los campos requeridos.');
        setLoading(false);
        return;
      }
      if (!Number.isFinite(price) || !Number.isFinite(stock)) {
        toast.error('Precio o stock inválido');
        setLoading(false);
        return;
      }

      if (form.id) { // Es edición
        const { error } = await supabase
          .from('products')
          .update({
            name,
            description,
            price: parseFloat(price),
            image_url,
            stock,
            category_id,
          })
          .eq('id', form.id);
        if (error) throw error;
        toast.success('Producto actualizado correctamente');
        setIsEditModalOpen(false);
        clearForm();
        fetchProducts();
      } else { // Es creación
        const { error } = await supabase.from('products').insert([
          {
            name,
            description,
            price: parseFloat(price),
            image_url,
            stock,
            category_id,
          },
        ]);
        if (error) throw error;
        toast.success('Producto agregado correctamente');
        clearForm();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al procesar el producto.');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre del producto</Label>
        <Input 
          id="name" name="name" 
          value={form.name} onChange={handleChange} 
          placeholder="Ej: Anillo de plata con esmeralda" 
        />
        <FieldHelp text="Nombre corto y descriptivo que verá el cliente." />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input 
          id="description" name="description" 
          value={form.description} onChange={handleChange} 
          placeholder="Ej: Hermoso anillo ajustable para ocasiones especiales..." 
        />
        <FieldHelp text="Describe los detalles, materiales y cuidado de la pieza." />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Precio (COP)</Label>
          <Input 
            id="price" name="price" type="number" step="0.01" min="0" 
            value={form.price} onChange={handleChange} 
            placeholder="Ej: 45000" 
          />
          <FieldHelp text="Sin puntos ni comas." />
        </div>
        <div>
          <Label htmlFor="stock">Unidades disponibles (Stock)</Label>
          <Input 
            id="stock" name="stock" type="number" step="1" min="0" 
            value={form.stock} onChange={handleChange} 
            placeholder="Ej: 10" 
          />
          <FieldHelp text="Inventario actual de la pieza." />
        </div>
      </div>

      <div>
        <Label>Categoría</Label>
        <Select
          value={form.category_id}
          onValueChange={(value) => handleChange({ target: { name: 'category_id', value } })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id.toString()}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FieldHelp text="Agrupa el producto para que sea fácil de encontrar." />
      </div>

      <div>
        <Label>Imagen del Producto</Label>
        <div className="mt-2 border rounded p-4 bg-muted/20">
          <ImageSelector selectedUrl={form.image_url} onSelect={handleImageSelect} />
        </div>
        <FieldHelp text="Selecciona o sube una imagen llamativa del producto." />
      </div>
    </div>
  );

  if (mode === 'crear') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-background p-6 rounded-lg shadow-sm border transition-all duration-300">
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-medium">Crear Nuevo Producto</h3>
          <p className="text-sm text-muted-foreground mt-1">Completa los datos para agregar una nueva pieza a tu catálogo.</p>
        </div>
        
        {renderFormFields()}

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Producto'}
        </Button>
      </form>
    );
  }

  // Vista de Tabla/Grid para Editar / Borrar
  return (
    <div className="space-y-4">
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-background border rounded-lg">
          <p className="text-muted-foreground">No se encontraron productos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-background border rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted relative">
                <img 
                  src={getImageUrl(product.image_url, 'small')} 
                  alt={product.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-medium line-clamp-1">{product.name}</h4>
                <div className="flex justify-between items-center mt-1 mb-4 text-sm text-muted-foreground">
                  <span>${Number(product.price).toLocaleString()}</span>
                  <span>Stock: {product.stock}</span>
                </div>
                
                <div className="mt-auto pt-4 border-t flex gap-2">
                  {mode === 'editar' ? (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-edit text-edit hover:bg-edit hover:text-edit-foreground"
                      onClick={() => openEditModal(product)}
                    >
                      <Edit2 size={16} /> Editar
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2"
                      onClick={() => handleDelete(product)}
                      disabled={loading}
                    >
                      <Trash2 size={16} /> Eliminar
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
            <DialogTitle>Editar Producto</DialogTitle>
            <DialogDescription>
              Modifica la información de &quot;{form.name}&quot;. Haz clic en actualizar cuando termines.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {renderFormFields()}
            
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-edit hover:bg-edit/90 text-edit-foreground">
                {loading ? 'Actualizando...' : 'Actualizar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
