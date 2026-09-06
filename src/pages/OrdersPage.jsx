import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { getImageUrl } from '@/utils/imageHelpers';
import { 
  Calendar, 
  Package, 
  CreditCard, 
  MapPin, 
  User, 
  Eye, 
  EyeOff, 
  Loader2, 
  Search, 
  MessageSquare,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Filter,
  Phone,
  Mail,
  Copy,
  ExternalLink,
  Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';

// Función helper para parsear items de forma segura
const parseOrderItems = (itemsString) => {
  if (!itemsString) return [];
  
  try {
    const parsed = JSON.parse(itemsString);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing order items:', error);
    return [];
  }
};

// Función helper para formatear precio
const formatPrice = (price) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(price);
};

// Función helper para formatear fecha
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Función helper para formatear fecha relativa
const getRelativeTime = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Hace menos de 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `Hace ${diffInDays} días`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `Hace ${diffInWeeks} semanas`;
  
  return formatDate(dateString);
};

const OrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching orders:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar las órdenes",
            variant: "destructive",
          });
          return;
        }

        setOrders(data || []);
        setFilteredOrders(data || []);
      } catch (err) {
        console.error('Error loading orders:', err);
        toast({
          title: "Error",
          description: "Error al cargar las órdenes",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  // Filtros y búsqueda
  useEffect(() => {
    let filtered = orders;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        parseOrderItems(order.items).some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter
      );
    }

    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const handleCancelOrder = async (orderId) => {
    if (!confirm("¿Estás seguro de que deseas cancelar esta orden?")) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Orden cancelada",
        description: "La orden ha sido cancelada correctamente.",
        variant: "success",
      });

      // Actualizar la lista localmente
      setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'cancelled'} : o));
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "No se pudo cancelar la orden.",
        variant: "destructive",
      });
    }
  };

  const handleContactSupport = (order) => {
    const orderNumber = order.reference.toUpperCase();
    const items = parseOrderItems(order.items);
    const itemsList = items.map(item => `• ${item.name} (x${item.quantity})`).join('\n');
    
    const message = `¡Hola! Necesito ayuda con mi orden #${orderNumber}
    
📦 *Detalles de la orden:*
${itemsList}

💰 *Total:* ${formatPrice(order.total)}
📅 *Fecha:* ${formatDate(order.created_at)}
📍 *Estado:* ${getStatusText(order.status)}

Por favor, ayúdame con esta consulta. ¡Gracias!`;

    const phoneNumber = '573142991068';
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappURL, '_blank');
  };

  const copyOrderId = (orderId) => {
    const orderNumber = orderId.toUpperCase();
    navigator.clipboard.writeText(orderNumber);
    toast({
      title: "Copiado",
      description: "Número de orden copiado al portapapeles",
      variant: "success",
    });
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'pending':
      case 'pendiente':
        return 'bg-accent text-accent-foreground border-accent/50';
      case 'processing':
      case 'procesando':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      case 'shipped':
      case 'enviado':
        return 'bg-accent text-accent-foreground border-accent/50';
      case 'delivered':
      case 'entregado':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'cancelled':
      case 'cancelado':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
      case 'pendiente':
        return <Clock className="h-4 w-4" />;
      case 'processing':
      case 'procesando':
        return <Package className="h-4 w-4" />;
      case 'shipped':
      case 'enviado':
        return <Truck className="h-4 w-4" />;
      case 'delivered':
      case 'entregado':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
      case 'cancelado':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'Pago Aprobado';
      case 'pending': return 'Pago Pendiente';
      case 'processing': return 'Procesando Orden';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status || 'Desconocido';
    }
  };
  const getPaymentText = (paymentMethod) => {
    switch (paymentMethod?.toLowerCase()) {
      case 'card': return 'Tarjeta de Crédito/Débito';
      case 'pse': return 'PSE';
      case 'bancolombia_collect': return 'Pago Corresponsal Bancolombia';
      case 'bancolombia_transfer': return 'Transferencia Bancolombia';
      case 'bancolombia_qr': return 'Pago QR Bancolombia';
      case 'daviplata': return 'Pago con Daviplata';
      case 'nequi': return 'Pago con Nequi';
      default: return paymentMethod; // Retorna el método original si no coincide con ninguno
    }
  };

  const getOrderStats = () => {
    const stats = orders.reduce((acc, order) => {
      const status = order.status?.toLowerCase();
      acc[status] = (acc[status] || 0) + 1;
      acc.total += order.total;
      return acc;
    }, { total: 0 });

    return {
      total: orders.length,
      totalSpent: stats.total,
      pending: stats.pending || stats.pendiente || 0,
      processing: stats.processing || stats.procesando || 0,
      shipped: stats.shipped || stats.enviado || 0,
      delivered: stats.delivered || stats.entregado || 0,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando tus órdenes...</p>
        </div>
      </div>
    );
  }

  const stats = getOrderStats();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-6 sm:py-10 max-w-7xl"
    >
      {/* Header */}
      <div className="text-center mb-8">
  <h1 className="text-3xl sm:text-4xl font-heading font-light tracking-wide text-foreground mb-2">
    Mis Órdenes
  </h1>
  <p className="text-muted-foreground">Gestiona y rastrea tus compras</p>
</div>

      {orders.length === 0 ? (
        <Card className="max-w-md mx-auto text-center p-8 bg-muted/50">
        <Package className="mx-auto h-16 w-16 text-muted-foreground mb-6" />
        <h3 className="text-xl font-medium text-foreground mb-2">No tienes órdenes aún</h3>
        <p className="text-muted-foreground mb-6">Cuando realices tu primera compra, aparecerá aquí.</p>
        <Button>
          Explorar productos
        </Button>
      </Card>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
  <Card className="text-center p-4">
    <div className="text-2xl font-bold text-foreground">{stats.total}</div>
    <div className="text-sm text-muted-foreground">Total órdenes</div>
  </Card>
  <Card className="text-center p-4">
    <div className="text-2xl font-bold text-primary">{formatPrice(stats.totalSpent)}</div>
    <div className="text-sm text-muted-foreground">Total gastado</div>
  </Card>
  <Card className="text-center p-4">
    <div className="text-2xl font-bold text-secondary">{stats.processing}</div>
    <div className="text-sm text-muted-foreground">Procesando</div>
  </Card>
  <Card className="text-center p-4">
    <div className="text-2xl font-bold text-primary">{stats.delivered}</div>
    <div className="text-sm text-muted-foreground">Entregadas</div>
  </Card>
</div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
    <Input
      placeholder="Buscar por número de orden o producto..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      className="pl-10"
    />
  </div>
  <div className="flex gap-2">
    <Select value={statusFilter} onValueChange={setStatusFilter}>
      <SelectTrigger className="w-[180px]">
        <Filter className="h-4 w-4 mr-2" />
        <span>{statusFilter === 'all' ? 'Todos los estados' : getStatusText(statusFilter)}</span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todos los estados</SelectItem>
        <SelectItem value="pending">Pendiente</SelectItem>
        <SelectItem value="processing">Procesando</SelectItem>
        <SelectItem value="shipped">Enviado</SelectItem>
        <SelectItem value="delivered">Entregado</SelectItem>
        <SelectItem value="cancelled">Cancelado</SelectItem>
      </SelectContent>
    </Select>
  </div>
</div>

          {/* Orders List */}
          <div className="space-y-6">
            <AnimatePresence>
              {filteredOrders.map((order, index) => {
                const isExpanded = expandedOrders.has(order.id);
                const items = parseOrderItems(order.items);
                const itemCount = items.length;

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    layout
                  >
                    <Card className="bg-white border border-stone-200 shadow-sm hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-4">
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <CardTitle className="text-lg font-medium text-neutral-800 flex items-center gap-2">
                                <Package className="h-5 w-5 text-neutral-600" />
                                Orden #{order.reference.toUpperCase()}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyOrderId(order.reference)}
                                className="h-6 px-2"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-neutral-600">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                {formatDate(order.created_at)}
                              </div>
                              <span className="hidden sm:block">•</span>
                              <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                                {getRelativeTime(order.created_at)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <Badge className={`border ${getStatusColor(order.status)} flex items-center gap-1 px-3 py-1`}>
                              {getStatusIcon(order.status)}
                              {getStatusText(order.status)}
                            </Badge>
                            <div className="text-right">
                              <p className="text-xl font-semibold text-neutral-800">
                                {formatPrice(order.total)}
                              </p>
                              <p className="text-xs text-neutral-500">
                                {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
  {/* Vista resumida - primeros productos */}
  <div className="space-y-3 mb-4">
    {items.slice(0, isExpanded ? items.length : 2).map((item, itemIndex) => (
      <motion.div 
        key={itemIndex} 
        className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg border border-border"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: itemIndex * 0.1 }}
      >
        <div className="relative">
          <img 
            src={getImageUrl(item.image, 'small')} alt={item.name} className="w-24 h-24 rounded-sm object-cover"
            onError={(e) => {
              e.target.src = '/imagen-preview.jpg';
            }}
          />
          <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {item.quantity}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground line-clamp-2">{item.name}</h4>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-sm text-muted-foreground">
              {formatPrice(item.price)} c/u
            </p>
            <p className="text-sm font-medium text-foreground">
              Subtotal: {formatPrice(item.price * item.quantity)}
            </p>
          </div>
          {item.variant && (
            <p className="text-xs text-muted-foreground mt-1">
              Variante: {item.variant}
            </p>
          )}
        </div>
      </motion.div>
    ))}
  </div>

  {/* Botón para expandir/contraer */}
  {items.length > 2 && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleOrderExpansion(order.id)}
      className="w-full mb-4 border-dashed hover:bg-muted"
    >
      {isExpanded ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Mostrar menos productos
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Ver {items.length - 2} productos más
        </>
      )}
    </Button>
  )}
  {/* Botón para mostrar más info */}
  {items.length < 3 && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => toggleOrderExpansion(order.id)}
      className="w-full mb-4 border-dashed hover:bg-muted"
    >
      {isExpanded ? (
        <>
          <EyeOff className="h-4 w-4 mr-2" />
          Mostrar menos información
        </>
      ) : (
        <>
          <Eye className="h-4 w-4 mr-2" />
          Más información
        </>
      )}
    </Button>
  )}

  <Separator className="my-4" />

  {/* Información detallada expandida */}
  <AnimatePresence>
    {isExpanded && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información de envío */}
          {order.shipping_address && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Dirección de Envío</h4>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg border border-accent">
                <div className="text-sm text-foreground space-y-2">
                  {typeof order.shipping_address === 'string' ? (
                    <p>{order.shipping_address}</p>
                  ) : (
                    <>
                      <p className="font-medium">{order.shipping_address.address}</p>
                      <p>{order.shipping_address.city}</p>
                      {order.shipping_address.notes && (
                        <div className="mt-2 p-2 bg-background rounded border-l-4 border-accent">
                          <p className="text-xs font-medium">Notas especiales:</p>
                          <p className="text-xs">{order.shipping_address.notes}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Información de usuario */}
          {order.user_info && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Información del Cliente</h4>
              </div>
              <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                <div className="text-sm text-foreground space-y-2">
                  {typeof order.user_info === 'string' ? (
                    <p>{order.user_info}</p>
                  ) : (
                    <>
                      {order.user_info.full_name && (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-primary" />
                          <span>{order.user_info.full_name}</span>
                        </div>
                      )}
                      {order.user_info.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-primary" />
                          <span>{order.user_info.email}</span>
                        </div>
                      )}
                      {order.user_info.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary" />
                          <span>{order.user_info.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información de guía de envío y pago */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Guía de envío */}
          {(order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'enviado') && order.shipping_guide && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-muted-foreground" />
                <h4 className="font-medium text-foreground">Guía de Envío</h4>
              </div>
              <div className="bg-accent/50 p-4 rounded-lg border border-accent">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono text-accent-foreground">{order.shipping_guide}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(order.shipping_guide);
                      toast({
                        title: "Copiado",
                        description: "Guía de envío copiada al portapapeles",
                      });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto text-accent-foreground hover:text-foreground"
                  onClick={() => window.open(`https://wa.me/573142991068?text=Hola,%20Ese%20Accesorios,%20quiero%20consultar%20el%20estado%20actual%20de%20mi%20envío.%20Rastreo:%20${order.shipping_guide}`, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Rastrear envío
                </Button>
              </div>
            </div>
          )}

          {/* Método de pago */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <h4 className="font-medium text-foreground">Método de Pago</h4>
            </div>
            <div className="bg-muted p-4 rounded-lg border border-border">
              <p className="text-sm text-foreground font-medium">
                {getPaymentText(order.payment_method) || 'Pago en línea'}
              </p>
              {order.payment_status && (
                <p className="text-xs text-muted-foreground mt-1">
                  Estado: {order.payment_status}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline o progreso de la orden */}
        <div className="space-y-3">
          <h4 className="font-medium text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Historial de la orden
          </h4>
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">Orden creada</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(order.created_at)}
                </span>
              </div>
              {order.status !== 'pending' && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-muted-foreground">Estado actual: {getStatusText(order.status)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Footer con acciones */}
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6 pt-4 border-t border-border">
    <div className="space-y-1">
      <p className="text-sm text-muted-foreground">Total pagado:</p>
      <p className="text-2xl font-bold text-foreground">
        {formatPrice(order.total)}
      </p>
      {items.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Promedio por producto: {formatPrice(order.total / items.reduce((sum, item) => sum + item.quantity, 0))}
        </p>
      )}
    </div>
    <div className="flex flex-wrap gap-2">
      {(order.status?.toLowerCase() === 'approved' || order.status?.toLowerCase() === 'Pago Aprobado') && (
        <Button
          variant="destructive"
          onClick={() => handleCancelOrder(order.id)}
        > Cancelar orden</Button>
      )}
      <Button variant="outline" onClick={() => handleContactSupport(order)}>
        Contactar soporte
      </Button> 
    </div>
  </div>
</CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>  
        </>
      )}
    </motion.div>
  );
}
export default OrdersPage;
