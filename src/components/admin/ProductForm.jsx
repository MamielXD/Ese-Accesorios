import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageSelector from '@/components/ImageSelector';
import ProductSelector from '@/components/ProductSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


export default function ProductForm({ mode = 'crear', searchTerm = '' }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    stock: '',
    category_id: '',
  });

  const [categories, setCategories] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const productSelectorRef = useRef(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) {
        toast.error('Error al cargar categorías');
        console.error(error);
      } else {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (url) => {
    setForm((prev) => ({ ...prev, image_url: url }));
  };

  const handleNameBlur = () => {
    const capitalized = form.name.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    setForm((prev) => ({ ...prev, name: capitalized }));
  };

  const clearForm = () => {
    setForm({
      name: '',
      description: '',
      price: '',
      image_url: '',
      stock: '',
      category_id: '',
    });
    setSelectedProductId(null);
    setSelectedProduct(null);
  };

  const [loading, setLoading] = useState(false);

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


    if (mode === 'crear') {
      if (!name || !description || price === '' || !image_url || stock === '' || !category_id) {
        toast.error('Por favor completa todos los campos');
        setLoading(false);
        return;
      }
      if (!Number.isFinite(price) || !Number.isFinite(stock)) {
        toast.error('Precio o stock inválido');
        setLoading(false);
        return;
      }

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
      productSelectorRef.current?.refresh?.();
    }

    if (mode === 'editar') {
      if (!selectedProductId || !selectedProduct) {
        toast.error('Selecciona un producto para editar');
        setLoading(false);
        return;
      }

      // Normalizamos ambos lados a strings para comparar sin enredos
      const fieldsToUpdate = {};
      const keys = Object.keys(form);
      for (const key of keys) {
        const newVal = (form[key] ?? '').toString().trim();
        const oldVal = (selectedProduct[key] ?? '').toString().trim();
        if (newVal !== '' && newVal !== oldVal) {
          if (key === 'price') {
            fieldsToUpdate[key] = parseFloat(newVal);
          } else if (key === 'stock') {
            fieldsToUpdate[key] = parseInt(newVal, 10);
          } else {
            fieldsToUpdate[key] = newVal;
          }
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        toast('No hiciste ningún cambio');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('products')
        .update(fieldsToUpdate)
        .eq('id', selectedProductId);

      if (error) throw error;

      toast.success('Producto editado correctamente');
      clearForm();
      productSelectorRef.current?.refresh?.();
    }

    if (mode === 'borrar') {
      if (!selectedProductId) {
        toast.error('Selecciona un producto para eliminar');
        setLoading(false);
        return;
      }

      const { error } = await supabase.from('products').delete().eq('id', selectedProductId);
      if (error) throw error;

      toast.success('Producto eliminado correctamente');
      clearForm();
      productSelectorRef.current?.refresh?.();
    }
  } catch (err) {
    console.error(err);
    toast.error(err?.message || 'Algo falló. Revisa la consola.');
  } finally {
    setLoading(false);
  }
};


  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-xl mx-auto bg-background/80 p-6 rounded-sm shadow-lg border transition-all duration-500"
    >
      {mode !== 'crear' && (
        <ProductSelector
          ref={productSelectorRef}
          selectedId={selectedProductId}
          searchTerm={searchTerm}
          onSelect={(product) => {
            setSelectedProductId(product.id);
            setSelectedProduct(product);
            setForm({
              name: product.name || '',
              description: product.description || '',
              price: product.price?.toString() || '',
              image_url: product.image_url || '',
              stock: product.stock?.toString() || '',
              category_id: product.category_id?.toString() || '',
            });
          }}
        />
      )}

      {mode !== 'borrar' && (
        <>
          <input
            type="text"
            name="name"
            placeholder="Nombre del producto"
            value={form.name}
            onChange={handleChange}
            onBlur={handleNameBlur}
            className="w-full px-3 py-2 border rounded-sm bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />
          <input
            type="text"
            name="description"
            placeholder="Descripción"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-sm bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            placeholder="Precio"
            value={form.price}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-sm bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />
          <ImageSelector selectedUrl={form.image_url} onSelect={handleImageSelect} />
          <input
            type="number"
            name="stock"
            step="1"
            min="0"
            placeholder="Stock disponible"
            value={form.stock}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-sm bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />
          <Select
            name="category_id"
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
        {mode === 'crear' ? 'Guardar Producto' : mode === 'editar' ? 'Actualizar Producto' : 'Eliminar Producto'}
      </button>
    </form>
  );
}
