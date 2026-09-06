import { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getImageUrl } from '@/utils/imageHelpers';

const ProductSelector = forwardRef(function ProductSelector(
  { selectedId, onSelect, searchTerm = '' },
  ref
) {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, price, image_url, stock, description, category_id')
      .order('name', { ascending: true });
    if (!error) setProducts(data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useImperativeHandle(ref, () => ({
    refresh: fetchProducts,
  }));

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Disclosure>
      {({ open }) => (
        <div className="mb-6">
          <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-left bg-input rounded-sm border hover:bg-muted transition-all duration-300">
            <span className="font-light tracking-wide text-neutral-800">
              Seleccionar pieza
            </span>
            <ChevronUp
              className={`w-5 h-5 text-stone-600 transition-transform duration-500 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </Disclosure.Button>
          <Disclosure.Panel className="mt-2 max-h-80 overflow-hidden border border-stone-200 rounded-sm bg-white/80 shadow-sm transition-all duration-500">
            <div className="p-3">
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => onSelect(product)}
                    className={`w-full flex items-center gap-3 p-2 border rounded-sm transition-all duration-300 hover:scale-[1.02] ${
                      selectedId === product.id
                        ? 'border-neutral-800 bg-neutral-100'
                        : 'border-stone-200 hover:bg-neutral-50'
                    }`}
                  >
                    <img
                      src={getImageUrl(product.image_url, 'small')} alt={product.name} className="w-24 h-24 rounded-sm object-cover"
                    />
                    <div className="text-left">
                      <div className="font-light tracking-wide text-neutral-800">
                        {product.name}
                      </div>
                      <div className="text-sm text-stone-600">
                        ${product.price} – Stock: {product.stock}
                      </div>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && (
                  <div className="text-sm text-stone-500 px-2 py-1">
                    No hay piezas coincidentes
                  </div>
                )}
              </div>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
});

export default ProductSelector;
