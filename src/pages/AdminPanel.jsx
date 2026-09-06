import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Plus, Edit, Trash2, Package, Tag, Percent, Image, ShoppingCart, Download, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Importar los componentes reales
import ProductForm from '../components/admin/ProductForm';
import CategoryForm from '../components/admin/CategoryForm';
import PromotionForm from '../components/admin/PromotionForm';
import ImageForm from '../components/admin/ImageForm'; // Usar la versión que funciona
import OrderView from '../components/admin/OrderView';
import ExportFacebookCatalogButton from '../components/admin/ExportFacebookCatalogButton';
import { useAdminStats } from '../hooks/useAdminStats';

// Componente de Loading
function LoadingSpinner({ size = 16 }) {
  return <Loader2 size={size} className="animate-spin" />;
}

// Componente de Confirmación
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          {type === 'danger' && <AlertTriangle className="text-destructive" size={24} />}
          {type === 'success' && <CheckCircle className="text-success" size={24} />}
          <h3 id="confirm-dialog-title" className="text-lg font-medium">{title}</h3>
        </div>
        <p id="confirm-dialog-description" className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant={type === 'danger' ? 'destructive' : 'default'} 
            onClick={onConfirm}
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}

// Componente de Breadcrumbs
function Breadcrumbs({ items }) {
  return (
    <nav className="flex text-sm text-muted-foreground mb-4">
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <span className="mx-2">/</span>}
          <span className={index === items.length - 1 ? "text-foreground font-medium" : "hover:text-foreground/80 cursor-pointer"}>
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
}

// Dashboard de métricas
function AdminDashboard({ stats, loading, error }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div className="bg-background/90 rounded-lg p-4 border text-center">
        <Package className="mx-auto mb-2 text-primary" size={24} />
        <div className="text-2xl font-bold text-foreground">{stats.productos}</div>
        <div className="text-sm text-muted-foreground">Productos</div>
      </div>
      <div className="bg-background/90 rounded-lg p-4 border text-center">
        <Tag className="mx-auto mb-2 text-success" size={24} />
        <div className="text-2xl font-bold text-foreground">{stats.categorias}</div>
        <div className="text-sm text-muted-foreground">Categorías</div>
      </div>
      <div className="bg-background/90 rounded-lg p-4 border text-center">
        <Percent className="mx-auto mb-2 text-edit" size={24} />
        <div className="text-2xl font-bold text-foreground">{stats.promociones}</div>
        <div className="text-sm text-muted-foreground">Promociones</div>
      </div>
      <div className="bg-background/90 rounded-lg p-4 border text-center">
        <ShoppingCart className="mx-auto mb-2 text-destructive" size={24} />
        <div className="text-2xl font-bold text-foreground">{stats.pedidosPendientes}</div>
        <div className="text-sm text-muted-foreground">Pedidos Aprobados</div>
      </div>
      <div className="bg-background/90 rounded-lg p-4 border text-center">
        <Download className="mx-auto mb-2 text-primary" size={24} />
        <div className="text-2xl font-bold text-foreground">{stats.ventasHoy}</div>
        <div className="text-sm text-muted-foreground">Ventas Hoy</div>
      </div>
    </div>
  );
}

// Componente Acordeón mejorado
function ImprovedAccordion({ title, children, defaultOpen = false, icon }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg shadow-sm border bg-background/90 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-muted transition-colors"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-lg font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown 
          size={20} 
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-100" : "opacity-0 max-h-0"
        }`}
        style={{
          maxHeight: isOpen ? '1000px' : '0',
          overflow: 'hidden'
        }}
      >
        <div className="px-6 pb-6 border-t border">
          {children}
        </div>
      </div>
    </div>
  );
}

// Navegación unificada
function UnifiedNavigation({ activeSection, setActiveSection, activeAction, setActiveAction }) {
  const sections = [
    { id: 'producto', label: 'Productos', icon: <Package size={18} /> },
    { id: 'categoria', label: 'Categorías', icon: <Tag size={18} /> },
    { id: 'promocion', label: 'Promociones', icon: <Percent size={18} /> },
    { id: 'imagen', label: 'Imágenes', icon: <Image size={18} /> }
  ];

  const actions = [
    { id: 'crear', label: 'Crear', icon: <Plus size={16} />, variant: 'default' },
    { id: 'editar', label: 'Gestionar', icon: <Edit size={16} />, variant: 'outline' },
    { id: 'borrar', label: 'Eliminar', icon: <Trash2 size={16} />, variant: 'destructive' }
  ];

  return (
    <div className="space-y-4">
      {/* Selector de Sección */}
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-2">¿Qué quieres gestionar?</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {sections.map((section) => (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              variant={activeSection === section.id ? 'default' : 'outline'}
              className="flex items-center gap-2 h-12"
            >
              {section.icon}
              <span className="hidden sm:inline">{section.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Selector de Acción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">¿Qué acción quieres realizar?</label>
        <div className="flex flex-wrap gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              onClick={() => setActiveAction(action.id)}
              variant={activeAction === action.id ? action.variant : 'outline'}
              className="flex items-center gap-2"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Componente principal mejorado
export default function ImprovedAdminPanel() {
  const [activeSection, setActiveSection] = useState('producto');
  const [activeAction, setActiveAction] = useState('crear');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notification, setNotification] = useState(null);

  // Estadísticas del administrador
  const { stats, loading: statsLoading, error: statsError } = useAdminStats();

  // Breadcrumbs dinámicos
  const breadcrumbItems = [
    'Admin',
    activeSection.charAt(0).toUpperCase() + activeSection.slice(1),
    activeAction.charAt(0).toUpperCase() + activeAction.slice(1)
  ];

  // Manejar confirmaciones para acciones destructivas
  const handleDestructiveAction = () => {
    if (activeAction === 'borrar') {
      setShowConfirmDialog(true);
    }
  };

  const executeAction = () => {
    setIsLoading(true);
    setShowConfirmDialog(false);
    
    // Simular operación async
    setTimeout(() => {
      setIsLoading(false);
      setNotification({
        type: 'success',
        message: `${activeSection} ${activeAction === 'crear' ? 'creado' : activeAction === 'editar' ? 'actualizado' : 'eliminado'} exitosamente`
      });
      setTimeout(() => setNotification(null), 3000);
    }, 1500);
  };

  // Título dinámico
  const getActionTitle = () => {
    const sectionName = activeSection.charAt(0).toUpperCase() + activeSection.slice(1);
    switch (activeAction) {
      case 'crear': return `Crear Nuevo ${sectionName}`;
      case 'editar': return `Gestionar ${sectionName}`;
      case 'borrar': return `Eliminar ${sectionName}`;
      default: return sectionName;
    }
  };

  // Renderizar el formulario correspondiente
  const renderActiveForm = () => {
    const commonProps = { mode: activeAction, searchTerm };

    switch (activeSection) {
      case 'producto':
        return <ProductForm {...commonProps} />;
      case 'categoria':
        return <CategoryForm {...commonProps} />;
      case 'promocion':
        return <PromotionForm {...commonProps} />;
      case 'imagen':
        return <ImageForm {...commonProps} />;
      default:
        return (
          <div className="text-center py-8 text-muted-foreground">
            Selecciona una sección para comenzar
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-background">
      <div className="px-4 py-6 max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-light text-foreground mb-2 tracking-wide">
            Panel de Administración
          </h1>
          <p className="text-muted-foreground">Gestiona tu tienda de manera eficiente</p>
        </div>

        {/* Dashboard de métricas */}
        {statsLoading && <div>Cargando estadísticas...</div>}
{statsError && <div>Error: {statsError}</div>}
{!statsLoading && !statsError && <AdminDashboard stats={stats} loading={statsLoading} error={statsError}/>}

        {/* Funciones Secundarias */}
        <div className="grid md:grid-cols-2 gap-6">
          <ImprovedAccordion 
            title="Gestionar Pedidos" 
            icon={<ShoppingCart size={20} />}
          >
            <div className="mt-4">
              <OrderView />
            </div>
          </ImprovedAccordion>

          <ImprovedAccordion 
            title="Exportar Catálogo" 
            icon={<Download size={20} />}
          >
            <div className="mt-4">
              <p className="text-muted-foreground mb-4">Exporta tu catálogo para Facebook.</p>
              <ExportFacebookCatalogButton />
            </div>
          </ImprovedAccordion>
        </div>

        {/* Contenido Principal */}
        <div className="bg-background/90 rounded-lg shadow-sm border p-6">
          <Breadcrumbs items={breadcrumbItems} />
          
          <h2 className="text-2xl font-light text-foreground mb-6">
            {getActionTitle()}
          </h2>

          {/* Navegación Unificada */}
          <UnifiedNavigation 
            activeSection={activeSection}
            setActiveSection={setActiveSection}
            activeAction={activeAction}
            setActiveAction={setActiveAction}
          />

          {/* Barra de búsqueda (para gestionar y eliminar) */}
          {(activeAction === 'editar' || activeAction === 'borrar') && activeSection !== 'imagen' && (
            <div className="mt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/80" size={20} />
                <Input
                  placeholder={`Buscar ${activeSection}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Área de contenido principal - Ahora renderiza los componentes reales */}
          <div className="mt-8">
            {renderActiveForm()}
          </div>
        </div>

        {/* Notificaciones */}
        {notification && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-40 ${
            notification.type === 'success' ? 'bg-success text-success-foreground' : 'bg-destructive text-white'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
              {notification.message}
            </div>
          </div>
        )}

        {/* Dialog de Confirmación */}
        <ConfirmDialog
          isOpen={showConfirmDialog}
          onClose={() => setShowConfirmDialog(false)}
          onConfirm={executeAction}
          title="¿Estás seguro?"
          message={`Esta acción eliminará permanentemente los ${activeSection} seleccionados. No se puede deshacer.`}
          type="danger"
        />
      </div>
    </div>
  );
}
