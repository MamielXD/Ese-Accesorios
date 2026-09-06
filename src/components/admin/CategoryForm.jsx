import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageSelector from '@/components/ImageSelector';
import CategorySelector from '@/components/CategorySelector';
import { Button } from '@/components/ui/button';

export default function CategoryForm({ mode = 'crear', searchTerm = '' }) {
  const [category, setCategory] = useState({
    name: '',
    slug: '',
    image_url: '',
    description: '',
  });

  const [selectedId, setSelectedId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
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

    if (name === 'name' || name === 'description') {
      val = capitalizeWords(val);
    }

    const updated = {
      ...category,
      [name]: val,
    };

    if (name === 'name') {
      updated.slug = val.toLowerCase().replace(/\s+/g, '_');
    }

    setCategory(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === 'crear') {
      const { error } = await supabase.from('categories').insert([category]);
      if (error) toast.error('Error al crear categoría');
      else {
        toast.success('Categoría creada');
        setCategory({ name: '', slug: '', image_url: '', description: '' });
        setRefreshCount((prev) => prev + 1);
      }
    }

    if (mode === 'editar') {
      if (!selectedId || !selectedCategory) {
        toast.error('Selecciona una categoría para editar');
        return;
      }

      const fieldsToUpdate = {};
      for (const key in category) {
        if (category[key] !== '' && category[key] !== selectedCategory[key]?.toString()) {
          fieldsToUpdate[key] = category[key];
        }
      }

      if (Object.keys(fieldsToUpdate).length === 0) {
        toast('No hiciste ningún cambio');
        return;
      }

      const { error } = await supabase
        .from('categories')
        .update(fieldsToUpdate)
        .eq('id', selectedId);

      if (error) toast.error('Error al actualizar categoría');
      else {
        toast.success('Categoría actualizada');
        setRefreshCount((prev) => prev + 1);
      }
    }

    if (mode === 'borrar') {
      if (!selectedId) {
        toast.error('Selecciona una categoría para borrar');
        return;
      }

      const { error } = await supabase.from('categories').delete().eq('id', selectedId);
      if (error) toast.error('Error al borrar categoría');
      else {
        toast.success('Categoría eliminada');
        setCategory({ name: '', slug: '', image_url: '', description: '' });
        setSelectedId(null);
        setSelectedCategory(null);
        setRefreshCount((prev) => prev + 1);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-6 max-w-xl mx-auto bg-background/80 rounded-sm shadow-lg border transition-all duration-500"
    >
      {mode !== 'crear' && (
        <CategorySelector
          key={refreshCount}
          selectedId={selectedId}
          searchTerm={searchTerm}
          onSelect={(cat) => {
            setSelectedId(cat.id);
            setSelectedCategory(cat);
            setCategory({
              name: cat.name || '',
              slug: cat.slug || '',
              image_url: cat.image_url || '',
              description: cat.description || '',
            });
          }}
        />
      )}

      {mode !== 'borrar' && (
        <>
          <input
            name="name"
            value={category.name}
            onChange={handleChange}
            placeholder="Nombre de la categoría"
            className="border rounded-sm w-full px-3 py-2 bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />

          <ImageSelector
            selectedUrl={category.image_url}
            onSelect={(url) => setCategory({ ...category, image_url: url })}
          />

          <input
            name="description"
            value={category.description}
            onChange={handleChange}
            placeholder="Descripción"
            className="border rounded-sm w-full px-3 py-2 bg-input text-foreground focus:border-ring focus:ring-0 transition-all"
          />
        </>
      )}

      <Button
        type="submit"
        className={`w-full px-6 py-3 tracking-wide uppercase rounded-sm text-sm font-medium shadow-sm transition-all duration-300 ${
          mode === 'crear'
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
            : mode === 'editar'
            ? 'bg-edit hover:bg-edit/90 text-edit-foreground'
            : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
        }`}
      >
        {mode === 'crear' ? 'Crear Categoría' : mode === 'editar' ? 'Actualizar' : 'Eliminar'}
      </Button>
    </form>
  );
}