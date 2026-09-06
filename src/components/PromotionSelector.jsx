import { useEffect, useState } from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getImageUrl } from '@/utils/imageHelpers';

export default function PromotionSelector({ selectedId, onSelect, refreshCount = 0 }) {
  const [promotions, setPromotions] = useState([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetch = async () => {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('start_date', { ascending: false });
      if (!error) setPromotions(data);
    };
    fetch();
  }, [refreshCount]);

  const filtered = promotions.filter((promo) =>
    promo.title.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Disclosure>
      {({ open }) => (
        <div className="mb-4">
          <Disclosure.Button className="flex justify-between items-center w-full px-4 py-2 text-left bg-input rounded-sm border hover:bg-muted transition-all duration-300">
            <span className="font-light tracking-wide text-foreground">Seleccionar promoción</span>
            <ChevronUp className={`w-5 h-5 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
          </Disclosure.Button>
          <Disclosure.Panel className="mt-2 max-h-80 overflow-hidden border rounded-sm bg-background shadow-sm">
            <div className="p-3">
              <input
                type="text"
                placeholder="Buscar promoción..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full py-1.5 px-3 mb-3 border rounded-full text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-all duration-300"
              />
              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {filtered.map((promo) => (
                  <button
                    key={promo.id}
                    type="button"
                    onClick={() => onSelect(promo)}
                    className={`w-full flex items-center gap-3 p-2 border rounded-sm transition-all duration-300 hover:bg-muted ${
                      selectedId === promo.id
                        ? 'border-foreground bg-muted'
                        : 'border hover:border-border'
                    }`}
                  >
                    <img
                      src={getImageUrl(promo.image_url, 'small')}
                      alt={promo.title}
                      className="w-12 h-12 object-cover rounded-sm filter saturate-90"
                    />
                    <div className="text-left">
                      <div className="font-light tracking-wide text-foreground">{promo.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {promo.discount_value}% de descuento
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground px-2 py-1">No hay coincidencias</div>
                )}
              </div>
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
}
