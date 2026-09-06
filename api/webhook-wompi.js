import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS configuration if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const data = req.body;
    console.log("Webhook received at", new Date().toISOString());

    if (!data?.data?.transaction) {
      return res.status(400).json({ status: 'error', message: 'Transaction data missing' });
    }

    const tx = data.data.transaction;
    const reference = tx.reference || '';
    const status = (tx.status || 'pending').toLowerCase();
    const transactionId = tx.id || '';

    const mapStatus = {
        "approved": "approved",
        "declined": "declined",
        "voided": "cancelled",
        "pending": "pending",
        "error": "error"
    };
    const finalStatus = mapStatus[status] || "pending";

    // Vercel Environment Variables
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase configuration missing in environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    if (finalStatus === 'approved') {
        // Fetch order
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('status, stock_updated, items')
            .eq('reference', reference);
            
        if (orderError) throw orderError;
        
        if (orderData && orderData.length > 0) {
            const order = orderData[0];
            const stockAlreadyUpdated = !!order.stock_updated;
            
            if (!stockAlreadyUpdated && order.items) {
                const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                
                if (Array.isArray(items)) {
                    for (const item of items) {
                        const productId = item.id;
                        const quantity = parseInt(item.quantity, 10);
                        
                        const { data: productData, error: productError } = await supabase
                            .from('products')
                            .select('stock')
                            .eq('id', productId);
                            
                        if (!productError && productData && productData.length > 0) {
                            const currentStock = parseInt(productData[0].stock, 10);
                            const newStock = Math.max(0, currentStock - quantity);
                            
                            await supabase
                                .from('products')
                                .update({ stock: newStock })
                                .eq('id', productId);
                        }
                    }
                    
                    // Marcar orden como procesada
                    await supabase
                        .from('orders')
                        .update({
                            status: finalStatus,
                            stock_updated: true,
                            transaction_id: transactionId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('reference', reference);
                }
            } else {
                // Actualizar solo estado si ya se procesó stock
                await supabase
                    .from('orders')
                    .update({
                        status: finalStatus,
                        transaction_id: transactionId,
                        updated_at: new Date().toISOString()
                    })
                    .eq('reference', reference);
            }
        }
    } else {
        // Actualizar estado para transacciones no aprobadas
        await supabase
            .from('orders')
            .update({
                status: finalStatus,
                transaction_id: transactionId,
                updated_at: new Date().toISOString()
            })
            .eq('reference', reference);
    }

    return res.status(200).json({ status: 'ok', message: 'Webhook processed successfully' });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
}
