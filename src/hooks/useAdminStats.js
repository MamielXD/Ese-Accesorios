import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export const useAdminStats = () => {
    const [stats, setStats] = useState({
        productos: 0,
        categorias: 0,
        promociones: 0,
        pedidosPendientes: 0,
        ventasHoy: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {

        const fetchStats = async () => {
            try {
                setLoading(true);

                const { count: productosCount} = await supabase
                    .from('products')
                    .select('*', { count: 'exact', head: true });

                const { count: categoriasCount} = await supabase
                    .from('categories')
                    .select('*', { count: 'exact', head: true });

                const { count: promocionesCount} = await supabase
                    .from('promotions')
                    .select('*', { count: 'exact', head: true });

                const { count: pedidosPendientesCount} = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'approved');

                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);

                const { count: ventasHoyCount} = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .gte('updated_at', startOfToday.toISOString())
                    .eq('status', 'approved');

                setStats({
                    productos: productosCount || 0,
                    categorias: categoriasCount || 0,
                    promociones: promocionesCount || 0,
                    pedidosPendientes: pedidosPendientesCount || 0,
                    ventasHoy: ventasHoyCount || 0
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return { stats, loading, error };
}