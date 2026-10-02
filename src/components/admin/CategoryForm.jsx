import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import ImageSelector from '@/components/ImageSelector';
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

export default function CategoryForm({ mode = 'crear', searchTerm = '' }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState({
    id: null,
    name: '',
    slug: '',
    image_url: '',
    description: '',
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    if (mode === 'editar' || mode === 'borrar') {
      fetchCategories();
    }
  }, [mode]);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (!error) setCategories(data);
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

  const clearForm = () => {
    setCategory({
      id: null,
      name: '',
      slug: '',
      image_url: '',
      description: '',
    });
  };

  const openEditModal = (cat) => {
    setCategory({
      id: cat.id,
      name: cat.name || '',
      slug: cat.slug || '',
      image_url: cat.image_url || '',
      description: cat.description || '',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"? Esta acción no se puede deshacer y podría afectar a los productos asociados.`)) {
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', cat.id);
      if (error) throw error;
      toast.success('Categoría eliminada exitosamente');
      fetchCategories();
    } catch (err) {
      toast.error('Error al eliminar categoría');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      if (!category.name || !category.image_url) {
        toast.error('El nombre y la imagen son obligatorios');
        setLoading(false);
        return;
      }

      if (category.id) { // Es edición
        const { id, ...fieldsToUpdate } = category;
        const { error } = await supabase
          .from('categories')
          .update(fieldsToUpdate)
          .eq('id', id);
          
        if (error) throw error;
        toast.success('Categoría actualizada correctamente');
        setIsEditModalOpen(false);
        clearForm();
        fetchCategories();
      } else { // Es creación
        const { id, ...fieldsToInsert } = category;
        const { error } = await supabase.from('categories').insert([fieldsToInsert]);
        if (error) throw error;
        toast.success('Categoría creada exitosamente');
        clearForm();
      }
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Error al procesar la categoría.');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((c) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderFormFields = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre de la categoría</Label>
        <Input 
          id="name" name="name" 
          value={category.name} onChange={handleChange} 
          placeholder="Ej: Anillos" 
        />
        <FieldHelp text="El nombre debe ser claro. (El 'slug' se generará automáticamente)" />
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Input 
          id="description" name="description" 
          value={category.description} onChange={handleChange} 
          placeholder="Ej: Colección exclusiva de anillos..." 
        />
        <FieldHelp text="Una breve descripción opcional para esta colección." />
      </div>

      <div>
        <Label>Imagen de la Categoría</Label>
        <div className="mt-2 border rounded p-4 bg-muted/20">
          <ImageSelector 
            selectedUrl={category.image_url} 
            onSelect={(url) => setCategory({ ...category, image_url: url })} 
          />
        </div>
        <FieldHelp text="Imagen representativa que aparecerá en el menú o inicio." />
      </div>
    </div>
  );

  if (mode === 'crear') {
    return (
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto bg-background p-6 rounded-lg shadow-sm border transition-all duration-300">
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-medium">Crear Nueva Categoría</h3>
          <p className="text-sm text-muted-foreground mt-1">Organiza tus productos en colecciones claras.</p>
        </div>
        
        {renderFormFields()}

        <Button type="submit" className="w-full mt-6" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear Categoría'}
        </Button>
      </form>
    );
  }

  // Vista de Tabla/Grid para Editar / Borrar
  return (
    <div className="space-y-4">
      {filteredCategories.length === 0 ? (
        <div className="text-center py-12 bg-background border rounded-lg">
          <p className="text-muted-foreground">No se encontraron categorías.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map(cat => (
            <div key={cat.id} className="bg-background border rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
              <div className="h-32 bg-muted relative">
                <img 
                  src={getImageUrl(cat.image_url, 'small')} 
                  alt={cat.name} 
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h4 className="font-medium text-lg">{cat.name}</h4>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {cat.description || 'Sin descripción'}
                </p>
                <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted px-2 py-1 rounded w-fit">
                  /{cat.slug}
                </p>
                
                <div className="mt-4 pt-4 border-t flex gap-2">
                  {mode === 'editar' ? (
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-edit text-edit hover:bg-edit hover:text-edit-foreground"
                      onClick={() => openEditModal(cat)}
                    >
                      <Edit2 size={16} /> Editar
                    </Button>
                  ) : (
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2"
                      onClick={() => handleDelete(cat)}
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
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Categoría</DialogTitle>
            <DialogDescription>
              Modifica la información de "{category.name}". Haz clic en actualizar cuando termines.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {renderFormFields()}
            
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="bg-edit hover:bg-edit/90 text-edit-foreground">
                {loading ? 'Actualizando...' : 'Actualizar Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}