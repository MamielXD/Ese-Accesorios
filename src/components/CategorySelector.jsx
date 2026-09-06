import { useEffect, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getImageUrl } from '@/utils/imageHelpers';

export default function CategorySelector({ selectedId, onSelect, searchTerm = '' }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, image_url, description')
        .order('name', { ascending: true });
      if (!error) setCategories(data);
    };
    fetchCategories();
  }, []);

  const filtered = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Disclosure>
      {({ open }) => (
        <div className="mb-6">
          <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-left bg-input rounded-sm border hover:bg-muted transition-all duration-300">
            <span className="font-light tracking-wide text-foreground">
              Seleccionar categoría
            </span>
            <ChevronUp
              className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="mt-3 max-h-80 overflow-hidden border rounded-sm bg-background/80 shadow-sm transition-all duration-300">
            <div className="p-3">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filtered.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelect(cat)}
                    className={`w-full flex items-center gap-3 p-2 border rounded-sm transition-all duration-300 hover:bg-muted ${
                      selectedId === cat.id
                        ? 'border-foreground bg-muted'
                        : 'border'
                    }`}
                  >
                    <img
                      src={getImageUrl(cat.image_url, 'small')} alt={cat.name} className="w-24 h-24 rounded-sm object-cover"
                    />
                    <div className="text-left">
                      <div className="font-light tracking-wide text-foreground">
                        {cat.name}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {cat.description}
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-1">
                    No hay coincidencias
                  </div>
                )}
              </div>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}