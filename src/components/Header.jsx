import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Tag, Home, Package, Star as StarIcon, LogIn, LogOut, Menu, X, Grid3X3, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { usePoints } from '@/contexts/PointsContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCategories } from '@/contexts/CategoryContext';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const ListItem = React.forwardRef(({ className, title, children, to, ...props }, ref) => (
  <li>
    <NavigationMenuLink asChild>
      <Link
        ref={ref}
        to={to}
        className={cn(
          "block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-all duration-300 hover:bg-muted hover:text-foreground focus:bg-muted",
          className
        )}
        {...props}
      >
        <div className="text-sm font-semibold tracking-wide text-foreground">{title}</div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {children}
        </p>
      </Link>
    </NavigationMenuLink>
  </li>
));
ListItem.displayName = "ListItem";

const Header = () => {
  const { cart } = useCart();
  const { points } = usePoints();
  const { user, signOut, loading } = useAuth();
  const { categories } = useCategories(); // <-- Usando el contexto
  const navigate = useNavigate();
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('admins')
          .select('*')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const MobileNavLink = ({ to, children, IconComponent, onClick }) => (
    <SheetClose asChild>
      <NavLink
        to={to}
        onClick={() => { 
          if(onClick) onClick(); 
          setMobileMenuOpen(false); 
        }}
        className={({ isActive }) =>
          cn(
            "flex items-center p-3 rounded-sm text-base font-medium hover:bg-neutral-50 hover:text-neutral-800 transition-all duration-300",
            isActive ? "bg-neutral-50 text-neutral-800" : "text-neutral-700"
          )
        }
      >
        {IconComponent && <IconComponent className="mr-3 h-5 w-5" />}
        {children}
      </NavLink>
    </SheetClose>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md shadow-sm transition-all duration-500">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Brand Name */}
        <div className="flex items-center space-x-3">
          <Link to="/">
            <img src="/logo.webp" alt="logo de Ese Accesorios" className="w-10 h-10 object-contain rounded-sm" width="40" height="40" />
          </Link>
          <Link to="/" className="text-2xl md:text-3xl font-light tracking-wide text-foreground" style={{ fontFamily: 'serif' }}>
            Ese Accesorios
          </Link>
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavLink to="/" className={navigationMenuTriggerStyle()}>
                <Home className="h-4 w-4 mr-2" /> Inicio
              </NavLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger className={navigationMenuTriggerStyle()}>
                <Package className="h-4 w-4 mr-2" /> Productos
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-4 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                  {categories.map((category) => (
                    <ListItem key={category.slug} title={category.name} to={`/productos/${category.slug}`}>
                      {category.description}
                    </ListItem>
                  ))}
                  <ListItem key="todos" title="Todos los Productos" to="/productos" >
                    Explora nuestro catálogo completo.
                  </ListItem>
                  <ListItem key="all-categories" title="Todas las Categorías" to="/categorias">
                    Navega por todas nuestras categorías.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavLink to="/promociones" className={navigationMenuTriggerStyle()}>
                <Tag className="h-4 w-4 mr-2" /> Promociones
              </NavLink>
            </NavigationMenuItem>
            {isAdmin && (
              <NavigationMenuItem>
                <NavLink to="/admin" className={navigationMenuTriggerStyle()}>
                  <Grid3X3 className="h-4 w-4 mr-2" /> Admin Panel
                </NavLink>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right Side Actions */}
        <div className="flex items-center space-x-3">
          {/* User Menu (Desktop) */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Abrir menú de usuario">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
                  {points > 0 && (
                    <span className="absolute -top-1 -right-0.5 inline-flex items-center justify-center px-1 py-0.5 text-[9px] md:text-[10px] font-bold leading-none text-edit-foreground bg-edit rounded-full">
                      <StarIcon className="h-2 w-2 md:h-2.5 md:w-2.5 mr-0.5 fill-current" /> {points}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-light truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/perfil">
                    <User className="mr-2 h-4 w-4" /> 
                    Mi Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/pedidos">
                    <FileText className="mr-2 h-4 w-4" /> 
                    Mis Pedidos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4" /> 
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" asChild className="hidden lg:inline-flex">
              <Link to="/auth">
                <LogIn className="mr-2 h-4 w-4" /> Iniciar Sesión
              </Link>
            </Button>
          )}

          {/* Cart Button */}
          <Button variant="ghost" size="icon" asChild>
            <Link to="/carrito" className="relative" aria-label="Ver carrito de compras">
              <ShoppingBag className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 md:px-2 md:py-1 text-[10px] md:text-xs font-bold leading-none text-background bg-foreground rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Abrir menú de navegación">
                <Menu className="h-6 w-6 text-foreground" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] p-6">
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex justify-between items-center mb-6">
                  <Link 
                    to="/" 
                    className="text-2xl font-light tracking-wide text-foreground" 
                    style={{ fontFamily: 'serif' }} 
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Ese Accesorios
                  </Link>
                  <SheetClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Cerrar menú de navegación">
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-grow space-y-2">
                  <MobileNavLink to="/" IconComponent={Home}>
                    Inicio
                  </MobileNavLink>
                  <MobileNavLink to="/productos" IconComponent={Package}>
                    Todos los Productos
                  </MobileNavLink>
                  <MobileNavLink to="/categorias" IconComponent={Grid3X3}>
                    Categorías
                  </MobileNavLink>
                  <MobileNavLink to="/promociones" IconComponent={Tag}>
                    Promociones
                  </MobileNavLink>
                  {isAdmin && (
                    <MobileNavLink to="/admin" IconComponent={Grid3X3}>
                      Admin Panel
                    </MobileNavLink>
                  )}
                </nav>

                {/* Mobile User Section */}
                <div className="mt-auto pt-6 border-t">
                  {user ? (
                    <>
                      <MobileNavLink to="/perfil" IconComponent={User}>
                        Mi Perfil
                      </MobileNavLink>
                      <MobileNavLink to="/pedidos" IconComponent={FileText}>
                        Mis Pedidos
                      </MobileNavLink>
                      <SheetClose asChild>
                        <button
                          onClick={handleSignOut}
                          disabled={loading}
                          className={cn(
                            "flex items-center p-3 rounded-sm text-base font-medium hover:bg-muted hover:text-foreground transition-all duration-300 w-full text-left text-muted-foreground"
                          )}
                        >
                          <LogOut className="mr-3 h-5 w-5" /> 
                          Cerrar Sesión
                        </button>
                      </SheetClose>
                    </>
                  ) : (
                    <MobileNavLink to="/auth" IconComponent={LogIn}>
                      Iniciar Sesión
                    </MobileNavLink>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;