import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Package, User, Mail, Phone, CheckCircle, Clock, AlertCircle, Truck, Save, Text } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getImageUrl } from '@/utils/imageHelpers';

export default function OrderList() {
    const [orders, setOrders] = useState([]);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [expandedForms, setExpandedForms] = useState(new Set());
    const [statusUpdates, setStatusUpdates] = useState({});
    const [shippingGuides, setShippingGuides] = useState({});
    const [statusFilter, setStatusFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    const { toast } = useToast();

    useEffect(() => {
        async function fetchOrders() {
            const { data, error } = await supabase
                .from('orders')
                .select('id, transaction_id, full_name, email, phone, status, items, address, created_at, shipping_guide, shipping_price, department_order, city_order, notes')
                .order('created_at', { ascending: false });
            if (!error) {
                setOrders(data || []);
                const initialStatus = {};
                const initialGuides = {};
                data.forEach(order => {
                    initialStatus[order.id] = order.status;
                    initialGuides[order.id] = order.shipping_guide || '';
                });
                setStatusUpdates(initialStatus);
                setShippingGuides(initialGuides);
            } else {
                toast({
                    title: "Error",
                    description: "No se pudieron cargar las órdenes",
                    variant: "destructive",
                });
            }
        }
        fetchOrders();
    }, [toast]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('es-CO', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour12: false
        });
    };

    const parseItems = (itemsString) => {
        try {
            return JSON.parse(itemsString);
        } catch (error) {
            console.error('Error parsing items:', error);
            return [];
        }
    };

    const toggleOrder = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const toggleForm = (orderId) => {
        const newExpanded = new Set(expandedForms);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedForms(newExpanded);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'approved':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Pago Aprobado' };
            case 'pending':
                return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', text: 'Pago Pendiente' };
            case 'declined':
                return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Pago Rechazado' };
            case 'processing':
                return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', text: 'Procesando' };
            case 'shipped':
                return { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-50', text: 'Enviado' };
            case 'delivered':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', text: 'Entregado' };
            case 'cancelled':
                return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', text: 'Cancelado' };
            default:
                return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', text: 'Error de Pago' };
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    };

    const handleStatusChange = (orderId, value) => {
        setStatusUpdates(prev => ({ ...prev, [orderId]: value }));
    };

    const handleShippingGuideChange = (orderId, value) => {
        setShippingGuides(prev => ({ ...prev, [orderId]: value }));
    };

    const updateOrder = async (orderId) => {
        const newStatus = statusUpdates[orderId];
        const newShippingGuide = shippingGuides[orderId];
      
        // ⚠️ Confirmación si el nuevo estado es "cancelled"
        if (newStatus === "cancelled") {
          const confirmed = window.confirm(
            "¿Seguro que quieres cancelar esta orden? Esta acción no se puede deshacer."
          );
          if (!confirmed) {
            return; // Se cancela la actualización
          }
        }
      
        const { error } = await supabase
          .from("orders")
          .update({
            status: newStatus,
            shipping_guide: newShippingGuide || null,
          })
          .eq("id", orderId);
      
        if (error) {
          console.error("Error updating order:", error);
          toast({
            title: "Error",
            description: "No se pudo actualizar la orden",
            variant: "destructive",
          });
        } else {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === orderId
                ? { ...order, status: newStatus, shipping_guide: newShippingGuide }
                : order
            )
          );
          toast({
            title: "Éxito",
            description: "Orden actualizada correctamente",
          });
        }
      };
      

    return (
        <div className="w-full max-w-7xl mx-auto p-2 xs:p-3 sm:p-6">
            <div className="mb-4 sm:mb-6 lg:mb-8">
                <h2 className="text-xl xs:text-2xl sm:text-3xl font-light text-gray-800 mb-1 sm:mb-2">
                    Lista de Órdenes
                </h2>
                <p className="text-gray-600 text-xs xs:text-sm sm:text-base">Gestiona y revisa todas las órdenes de tu tienda</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6">
  {/* Filtro por estado */}
  <Select value={statusFilter} onValueChange={setStatusFilter}>
    <SelectTrigger className="w-full sm:w-48">
      <SelectValue placeholder="Filtrar por estado" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">Todos</SelectItem>
      <SelectItem value="pending">Pendiente</SelectItem>
      <SelectItem value="approved">Aprobado</SelectItem>
      <SelectItem value="processing">Procesando</SelectItem>
      <SelectItem value="shipped">Enviado</SelectItem>
      <SelectItem value="delivered">Entregado</SelectItem>
      <SelectItem value="declined">Rechazado</SelectItem>
      <SelectItem value="cancelled">Cancelado</SelectItem>
    </SelectContent>
  </Select>

  {/* Buscador */}
  <Input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Buscar por nombre o correo..."
    className="flex-1"
  />
</div>

            
            <div className="space-y-2 xs:space-y-3 sm:space-y-4 max-h-[75vh] xs:max-h-[70vh] overflow-y-auto pr-1 sm:pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {orders
                .filter(order => {
                    const matchStatus = statusFilter === "all" || order.status === statusFilter;
                    const matchSearch =
                      order.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      order.email.toLowerCase().includes(searchQuery.toLowerCase());
                    return matchStatus && matchSearch;
                  })

                .map(order => {
                    const items = parseItems(order.items);
                    const isExpanded = expandedOrders.has(order.id);
                    const isFormExpanded = expandedForms.has(order.id);
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;
                    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + (order.shipping_price || 0);
                    
                    const canShowForm = order.status === 'approved' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered';
                    const isDeclined = order.status === 'declined';
                    const isPending = order.status === 'pending';
                    const hideGuideInput = order.status === 'shipped' || order.status === 'delivered';

                    return (
                        <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                            <div 
                                className="p-3 xs:p-4 sm:p-6 cursor-pointer"
                                onClick={() => toggleOrder(order.id)}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 min-w-0 flex-1">
                                        <div className="flex-shrink-0">
                                            {isExpanded ? (
                                                <ChevronDown className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-gray-400" />
                                            )}
                                        </div>
                                        
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col xs:flex-row xs:items-center space-y-1 xs:space-y-0 xs:space-x-2 sm:space-x-3 mb-1">
                                                <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 truncate">
                                                    {order.full_name}
                                                </h3>
                                                <span className="text-xs xs:text-xs sm:text-sm font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 xs:px-2 xs:py-1 rounded w-fit whitespace-nowrap">
                                                    {formatDate(order.created_at)}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-col xs:flex-row xs:items-center space-y-0.5 xs:space-y-0 xs:space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                    <span className="xs:hidden">{items.length}</span>
                                                    <span className="hidden xs:inline">{items.length} {items.length === 1 ? 'producto' : 'productos'}</span>
                                                </span>
                                                <span className="font-medium text-gray-900 text-sm xs:text-sm sm:text-base">
                                                    {formatPrice(total)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center ml-1 sm:ml-3">
                                        <div className={`inline-flex items-center px-1.5 py-1.5 sm:px-3 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                                            <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                                            <span className="hidden sm:inline">{statusConfig.text}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {isExpanded && (
                                <div className="border-t border-gray-100">
                                    <div className="p-3 xs:p-4 sm:p-6 bg-gray-50">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 xs:gap-4 sm:gap-6 mb-3 xs:mb-4 sm:mb-6">
                                            <div className="space-y-2 xs:space-y-3">
                                                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                    Información de Contacto
                                                </h4>
                                                <div className="space-y-1.5 xs:space-y-2">
                                                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                                        <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{order.full_name}</span>
                                                    </div>
                                                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                                        <Mail className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{order.email}</span>
                                                    </div>
                                                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                                                        <Phone className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{order.phone}</span>
                                                    </div>
                                                    <div className="flex items-start text-xs sm:text-sm text-gray-600">
                                                        <Truck className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                                        <span className="break-words text-xs xs:text-xs sm:text-sm leading-relaxed">{order.address}, {order.city_order}, {order.department_order}</span>
                                                    </div>
                                                    <div className="flex items-start text-xs sm:text-sm text-gray-600">
                                                        <Text className="w-3 h-3 sm:w-4 sm:h-4 mr-2 text-gray-400 flex-shrink-0 mt-0.5" />
                                                        <span className="break-words text-xs xs:text-xs sm:text-sm leading-relaxed"> {order.notes}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-3">
                                                <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
                                                    Detalles de la Orden
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="text-xs sm:text-sm text-gray-600">
                                                        <span className="font-medium">ID de Transacción:</span> {order.transaction_id}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600">
                                                        <span className="font-medium">Estado:</span> {statusConfig.text}
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-gray-600">
                                                        <span className="font-medium">Guía de Envío:</span> {order.shipping_guide || 'Procesando pedido'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
  {(canShowForm) && (
    <button
      type="button"
      onClick={() => toggleForm(order.id)}
      className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-4 py-2 text-left shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition"
    >
      <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">
        Actualizar Orden
      </h4>
      {isFormExpanded ? (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronRight className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )}


                                            {!isPending && (
                                                <>
                                                    {isDeclined ? (
                                                        <Button
                                                            onClick={() => window.open(`https://wa.me/57${order.phone}?text=Hola%20${order.full_name}%2C%20somos%20Ese%20Accesorios%2C%20notamos%20que%20tu%20pago%20fue%20rechazado.%20¿Necesitas%20soporte%3F`, '_blank')}
                                                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                                                        >
                                                            Contactar al usuario
                                                        </Button>
                                                    ) : (
                                                        canShowForm && isFormExpanded && (
                                                            <div className="space-y-3">
                                                                <div>
                                                                    <label className="text-xs sm:text-sm font-medium text-gray-600">Estado de la Orden</label>
                                                                    <Select
                                                                        value={statusUpdates[order.id] || order.status}
                                                                        onValueChange={(value) => handleStatusChange(order.id, value)}
                                                                    >
                                                                        <SelectTrigger className="w-full mt-1">
                                                                            <SelectValue placeholder="Seleccionar estado" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="processing">Procesando</SelectItem>
                                                                            <SelectItem value="shipped">Enviado</SelectItem>
                                                                            <SelectItem value="delivered">Entregado</SelectItem>
                                                                            <SelectItem value="cancelled">Cancelado</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                </div>
                                                                {!hideGuideInput && (
                                                                    <div>
                                                                        <label className="text-xs sm:text-sm font-medium text-gray-600">Guía de Envío</label>
                                                                        <Input
                                                                            value={shippingGuides[order.id] || ''}
                                                                            onChange={(e) => handleShippingGuideChange(order.id, e.target.value)}
                                                                            placeholder="Ingresar número de guía o detalles de envío"
                                                                            className="mt-1"
                                                                        />
                                                                    </div>
                                                                )}
                                                                <Button
                                                                    onClick={() => updateOrder(order.id)}
                                                                    className="w-full bg-neutral-800 hover:bg-neutral-700 text-white"
                                                                >
                                                                    <Save className="w-4 h-4 mr-2" />
                                                                    Guardar Cambios
                                                                </Button>
                                                            </div>
                                                        )
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        
                                        <div className="mt-3 xs:mt-4 sm:mt-6">
                                            <h4 className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2 xs:mb-3">
                                                Productos Ordenados
                                            </h4>
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                {items && items.length > 0 ? (
                                                    <div className="divide-y divide-gray-200">
                                                        {items.map((item, idx) => (
                                                            <div key={idx} className="p-2.5 xs:p-3 sm:p-4">
                                                                <div className="flex items-center justify-between gap-2 xs:gap-3">
                                                                    <div className="flex items-center space-x-2 xs:space-x-3 min-w-0 flex-1">
                                                                        {item.image && (
                                                                            <img 
                                                                                src={getImageUrl(item.image, 'small')} alt={item.name}
                                                                                className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-lg object-cover bg-gray-100 flex-shrink-0"
                                                                            />
                                                                        )}
                                                                        <div className="min-w-0 flex-1">
                                                                            <h5 className="font-medium text-gray-900 text-xs xs:text-sm sm:text-base truncate leading-tight">{item.name}</h5>
                                                                            <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                                                                <span className="xs:hidden">Cant: {item.quantity}</span>
                                                                                <span className="hidden xs:inline">Cantidad: {item.quantity}</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right flex-shrink-0">
                                                                        <p className="font-medium text-gray-900 text-xs xs:text-sm sm:text-base">
                                                                            {formatPrice(item.price)}
                                                                        </p>
                                                                        <p className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                                                                            
                                                                            <span className="xs:hidden">Sub: {formatPrice(item.price * item.quantity)}</span>
                                                                            <span className="hidden xs:inline">Subtotal: {formatPrice(item.price * item.quantity)}</span>
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        
                                                        <div className="p-2.5 xs:p-3 sm:p-4 bg-gray-50 border-t border-gray-200">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm xs:text-sm sm:text-sm font-medium text-gray-700">Envío</span>
                                                                <span className="text-base xs:text-sm sm:text-sm font-medium text-gray-700">
                                                                    {formatPrice(order.shipping_price || 0)}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm xs:text-base sm:text-lg font-semibold text-gray-900">Total</span>
                                                                <span className="text-base xs:text-lg sm:text-xl font-bold text-gray-900">
                                                                    {formatPrice(total)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 xs:p-6 sm:p-8 text-center text-gray-500">
                                                        <Package className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 mx-auto mb-2 xs:mb-3 text-gray-300" />
                                                        <p className="text-xs xs:text-sm sm:text-base">No hay productos en esta orden</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                
                {orders.length === 0 && (
                    <div className="text-center py-8 xs:py-10 sm:py-12">
                        <Package className="w-10 h-10 xs:w-12 xs:h-12 sm:w-16 sm:h-16 mx-auto mb-3 xs:mb-4 text-gray-300" />
                        <h3 className="text-sm xs:text-base sm:text-lg font-medium text-gray-900 mb-1 xs:mb-2">No hay órdenes</h3>
                        <p className="text-xs xs:text-sm sm:text-base text-gray-600">No se encontraron órdenes en el sistema.</p>
                    </div>
                )}
            </div>
            
            {orders.length > 0 && (
                <div className="mt-3 xs:mt-4 text-center text-xs sm:text-sm text-gray-500">
                    Mostrando {orders.length} {orders.length === 1 ? 'orden' : 'órdenes'} - Ordenadas por fecha más reciente
                </div>
            )}
        </div>
    );
}