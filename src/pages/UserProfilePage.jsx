import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/contexts/PointsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Gift, Tag, LogOut, UserCircle, Edit3, Save, Loader2, Home as HomeIcon, MapPin, Key, Ticket, Check, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { FileText } from 'lucide-react';
import { getImageUrl } from '@/utils/imageHelpers';

const UserProfilePage = () => {
  const { user, userProfile, signOut, updateUserProfile, loading: authLoading } = useAuth();
  const { points, redeemPoints, setPointsManually } = usePoints();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: '', email: '', phone: '' });
  const [addressData, setAddressData] = useState({
    address: '',
    city: '',
    notes: ''
  });
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [locationsLoading, setLocationsLoading] = useState(false);
  
  // Estados para cupones
  const [userCoupons, setUserCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);

  // Cargar departamentos únicos desde Supabase
  useEffect(() => {
    const fetchDepartments = async () => {
      setLocationsLoading(true);
      try {
        const { data, error } = await supabase
          .from('shipping')
          .select('department')
          .not('department', 'is', null)
          .order('department');

        if (error) {
          console.error('Error fetching departments:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar los departamentos",
            variant: "destructive",
          });
          return;
        }

        const uniqueDepartments = [...new Set(data.map(item => item.department))];
        setDepartments(uniqueDepartments);
      } catch (err) {
        console.error('Error loading departments:', err);
      } finally {
        setLocationsLoading(false);
      }
    };

    fetchDepartments();
  }, [toast]);

  // Cargar cupones del usuario
  useEffect(() => {
    const fetchUserCoupons = async () => {
      if (!user?.id) return;
      
      setCouponsLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_promotions')
          .select(`
            id,
            redeemed_at,
            used,
            promotions!inner (
              id,
              title,
              description,
              discount_value,
              discount_type,
              end_date,
              image_url
            )
          `)
          .eq('user_id', user.id)
          .order('redeemed_at', { ascending: false });

        if (error) {
          console.error('Error fetching user coupons:', error);
          toast({
            title: "Error",
            description: "No se pudieron cargar tus cupones",
            variant: "destructive",
          });
        } else {
          setUserCoupons(data || []);
        }
      } catch (err) {
        console.error('Error loading user coupons:', err);
      } finally {
        setCouponsLoading(false);
      }
    };

    fetchUserCoupons();
  }, [user?.id, toast]);

  // Cargar ciudades cuando se selecciona un departamento
  const loadCitiesForDepartment = async (department) => {
    if (!department) {
      setCities([]);
      return;
    }

    setLocationsLoading(true);
    try {
      const { data, error } = await supabase
        .from('shipping')
        .select('city')
        .eq('department', department)
        .order('city');

      if (error) {
        console.error('Error fetching cities:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las ciudades",
          variant: "destructive",
        });
        return;
      }

      setCities(data.map(item => item.city));
    } catch (err) {
      console.error('Error loading cities:', err);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Obtener el departamento de una ciudad específica
  const getDepartmentFromCity = async (cityName) => {
    if (!cityName) return null;

    try {
      const { data, error } = await supabase
        .from('shipping')
        .select('department')
        .eq('city', cityName)
        .single();

      if (error) {
        console.error('Error fetching department for city:', error);
        return null;
      }

      return data.department;
    } catch (err) {
      console.error('Error getting department for city:', err);
      return null;
    }
  };

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        fullName: userProfile.full_name || user?.user_metadata?.full_name || '',
        email: userProfile.email || user?.email || '',
        phone: userProfile.phone || ''
      });
      
      const loadAddressData = async () => {
        const shippingAddress = userProfile.shipping_address || {};
        const city = userProfile.city || '';

        setAddressData({
          address: shippingAddress.address || '',
          city: city,
          notes: shippingAddress.notes || ''
        });

        if (city) {
          const department = await getDepartmentFromCity(city);
          if (department) {
            setSelectedDepartment(department);
            await loadCitiesForDepartment(department);
          }
        }
      };

      loadAddressData();
      setPointsManually(points || 0);
    } else if (user) {
      setProfileData({
        fullName: user.user_metadata?.full_name || '',
        email: user.email || '',
        phone: user.user_metadata?.phone || ''
      });
    }
  }, [user, userProfile, setPointsManually]);

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressInputChange = (e) => {
    const { name, value } = e.target;
    setAddressData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    setAddressData(prev => ({ ...prev, city: '' }));
    loadCitiesForDepartment(value);
  };

  const handleCityChange = (value) => {
    setAddressData(prev => ({ ...prev, city: value }));
  };

  const handleSaveProfile = async () => {
    try {
      const { error } = await updateUserProfile({
        full_name: profileData.fullName,
        phone: profileData.phone,
      });
      if (!error) setIsEditingProfile(false);
    } catch (err) {
      console.error('Error al guardar el perfil:', err);
    }
  };

  const handleSaveAddress = async () => {
    setFormLoading(true);
    try {
      const { error } = await updateUserProfile({ 
        shipping_address: {
          address: addressData.address,
          notes: addressData.notes
        },
        city: addressData.city
      });
      
      if (!error) {
        setIsEditingAddress(false);
        toast({
          title: "Éxito",
          description: "Dirección actualizada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar la dirección",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('Error saving address:', err);
      toast({
        title: "Error",
        description: "No se pudo actualizar la dirección",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handlePasswordChange = () => {
    navigate('/actualizar-contrasena');
  };

  const handleRedeem = (cost, type) => {
    if (points >= cost) {
      const result = redeemPoints(cost, type);
      toast({
        title: result.success ? "¡Puntos Canjeados!" : "Error al Canjear",
        description: result.message,
        variant: result.success ? "default" : "destructive",
      });
    } else {
      toast({
        title: "Puntos Insuficientes",
        description: `Necesitas al menos ${cost} puntos para esta recompensa.`,
        variant: "destructive",
      });
    }
  };

  const getCouponStatus = (coupon) => {
    const promotion = coupon.promotions;
    const isExpired = promotion.end_date && new Date(promotion.end_date) < new Date();
    
    if (coupon.used) {
      return { text: 'Usado', color: 'text-foreground', bgColor: 'bg-stone-100', icon: Clock };
    } else if (isExpired) {
      return { text: 'Expirado', color: 'text-foreground', bgColor: 'bg-stone-200', icon: AlertCircle };
    } else {
      return { text: 'Disponible', color: 'text-neutral-700', bgColor: 'bg-neutral-100', icon: Check };
    }
  };

  const isLoading = authLoading || formLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-3 sm:px-6 py-10 sm:py-14"
    >
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide text-foreground mb-8 sm:mb-10 text-center">
        Mi Perfil
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Card Perfil */}
        <Card className="lg:col-span-1 border border-accent rounded-sm shadow-sm transition-all duration-500 hover:shadow-md">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl sm:text-2xl font-light tracking-wide text-foreground flex items-center">
                <UserCircle className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-foreground/80" /> Información Personal
              </CardTitle>
              {!isEditingProfile && (
                <Button variant="ghost" size="icon" onClick={() => setIsEditingProfile(true)} className="hover:bg-neutral-50">
                  <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/80" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {isEditingProfile ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName" className="text-xs sm:text-sm text-foreground">Nombre Completo</Label>
                  <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleProfileInputChange} className="text-sm sm:text-base"/>
                </div>
                <div>
                  <Label htmlFor="email" className="text-xs sm:text-sm text-foreground">Correo Electrónico</Label>
                  <Input id="email" name="email" type="email" value={profileData.email} disabled className="text-sm sm:text-base bg-stone-100"/>
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs sm:text-sm text-foreground">Teléfono</Label>
                  <Input id="phone" name="phone" type="tel" value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} className="text-sm sm:text-base"/>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveProfile} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-800 hover:border-neutral-700 shadow-sm transition-all duration-300 px-8 py-3 text-sm tracking-wide uppercase" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Guardar
                  </Button>
                  <Button variant="outline" onClick={() => {setIsEditingProfile(false); setProfileData({fullName: userProfile?.full_name || '', email: userProfile?.email || ''});}} className="w-full">Cancelar</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm sm:text-base text-foreground/90"><span className="font-semibold">Nombre:</span> {profileData.fullName || 'No especificado'}</p>
                <p className="text-sm sm:text-base text-foreground/90"><span className="font-semibold">Correo:</span> {profileData.email}</p>
                <p className="text-sm sm:text-base text-foreground/90"><span className="font-semibold">Teléfono:</span> {profileData.phone || 'No especificado'}</p>
                <p className="text-xs sm:text-sm text-foreground/90"><span className="font-semibold">Registrado desde:</span> {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric'}) : 'N/A'}</p>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-wrap gap-3 sm:gap-4 p-6">
            <Button 
              onClick={handleSignOut}
              className="flex-1 min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase"
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" /> 
              Cerrar Sesión
            </Button>

            <Button 
              onClick={handlePasswordChange}
              className="flex-1 min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase"
              disabled={isLoading}
            >
              <Key className="mr-2 h-4 w-4" /> 
              Cambiar Contraseña
            </Button>

            <Button    
              onClick={() => navigate('/pedidos')}   
              className="flex-1 min-w-[200px] bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase"   
              disabled={isLoading} 
            >   
              <FileText className="mr-2 h-4 w-4" />    
              Mis Pedidos 
            </Button>
          </CardFooter>
        </Card>

        {/* Cards Dirección, Cupones y Puntos */}
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          {/* Card Dirección */}
          <Card className="border border-accent rounded-sm shadow-sm transition-all duration-500 hover:shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl sm:text-2xl font-light tracking-wide text-foreground flex items-center">
                  <HomeIcon className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-foreground/80" /> Dirección de Envío
                </CardTitle>
                {!isEditingAddress && (
                  <Button variant="ghost" size="icon" onClick={() => setIsEditingAddress(true)} className="hover:bg-neutral-50">
                    <Edit3 className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                  </Button>
                )}
              </div>
              <CardDescription className="text-xs sm:text-sm text-foreground/90">Guarda tu dirección para compras más rápidas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isEditingAddress ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address" className="text-xs sm:text-sm text-foreground">Dirección (Calle, Número, Apto)</Label>
                    <Input id="address" name="address" value={addressData.address} onChange={handleAddressInputChange} placeholder="Ej: Calle 5 # 10-15, Apto 201" className="text-sm sm:text-base"/>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="department" className="text-xs sm:text-sm text-foreground">Departamento</Label>
                      <Select name="department" onValueChange={handleDepartmentChange} value={selectedDepartment} disabled={locationsLoading}>
                        <SelectTrigger id="department" className="text-sm sm:text-base">
                          <SelectValue placeholder={locationsLoading ? "Cargando..." : "Selecciona un departamento"} />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map(dept => (
                            <SelectItem key={dept} value={dept} className="text-sm sm:text-base">{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="city" className="text-xs sm:text-sm text-foreground">Ciudad/Municipio</Label>
                      <Select name="city" value={addressData.city} onValueChange={handleCityChange} disabled={!selectedDepartment || cities.length === 0 || locationsLoading}>
                        <SelectTrigger id="city" className="text-sm sm:text-base">
                          <SelectValue placeholder={locationsLoading ? "Cargando..." : "Selecciona una ciudad"} />
                        </SelectTrigger>
                        <SelectContent>
                          {cities.map(city => (
                            <SelectItem key={city} value={city} className="text-sm sm:text-base">{city}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="notes" className="text-xs sm:text-sm text-foreground">Notas Adicionales (Opcional)</Label>
                    <Textarea id="notes" name="notes" value={addressData.notes} onChange={handleAddressInputChange} placeholder="Barrio, punto de referencia..." className="text-sm sm:text-base"/>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAddress} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase" disabled={isLoading || locationsLoading}>
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} Guardar Dirección
                    </Button>
                    <Button variant="outline" onClick={() => {
                      setIsEditingAddress(false);
                      const shippingAddress = userProfile?.shipping_address || {};
                      setAddressData({
                        address: shippingAddress.address || '',
                        city: userProfile?.city || '',
                        notes: shippingAddress.notes || ''
                      });
                    }} className="w-full">Cancelar</Button>
                  </div>
                </div>
              ) : (
                addressData.address || addressData.city ? (
                  <>
                    {addressData.address && <p className="text-sm sm:text-base text-foreground/90"><MapPin className="inline mr-2 h-4 w-4 text-foreground"/>{addressData.address}</p>}
                    {addressData.city && <p className="text-sm sm:text-base text-foreground/90 pl-6">{addressData.city}{selectedDepartment && `, ${selectedDepartment}`}</p>}
                    {addressData.notes && <p className="text-xs sm:text-sm text-foreground/90 pl-6">Notas: {addressData.notes}</p>}
                  </>
                ) : (
                  <p className="text-sm sm:text-base text-foreground/90">No has guardado una dirección de envío todavía.</p>
                )
              )}
            </CardContent>
          </Card>

          {/* Card Cupones Redimidos */}
          <Card className="border border-accent rounded-sm shadow-sm transition-all duration-500 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-light tracking-wide text-foreground flex items-center">
                <Ticket className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-foreground/80" /> Mis Cupones
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-foreground/90">
                Cupones que has redimido con tus puntos de lealtad.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {couponsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-foreground/80" />
                </div>
              ) : userCoupons.length > 0 ? (
                <div className="space-y-4">
                  {userCoupons.map((coupon) => {
                    const promotion = coupon.promotions;
                    const status = getCouponStatus(coupon);
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={coupon.id}
                        className="p-4 border border-accent rounded-sm bg-stone-50 hover:bg-stone-100 transition-colors duration-200"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-foreground text-sm sm:text-base">
                                {promotion.title}
                              </h3>
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${status.color} ${status.bgColor}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.text}
                              </div>
                            </div>
                            <p className="text-xs sm:text-sm text-foreground mb-2">
                              {promotion.description}
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs text-foreground/90">
                              <span>
                                Descuento: {promotion.discount_type === 'percentage' ? `${promotion.discount_value}%` : `$${promotion.discount_value}`}
                              </span>
                              {promotion.end_date && (
                                <span>
                                  • Válido hasta: {new Date(promotion.end_date).toLocaleDateString('es-CO')}
                                </span>
                              )}
                              <span>
                                • Redimido: {new Date(coupon.redeemed_at).toLocaleDateString('es-CO')}
                              </span>
                            </div>
                          </div>
                          {promotion.image_url && (
                            <img
                              src={getImageUrl(promotion.image_url, 'small')} alt={promotion.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-sm flex-shrink-0"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-foreground/80 mb-4" />
                  <p className="text-foreground/90 text-sm sm:text-base">
                    No tienes cupones redimidos todavía.
                  </p>
                  <p className="text-xs sm:text-sm text-foreground/80 mt-2">
                    Visita la página de promociones para redimir cupones con tus puntos.
                  </p>
                  <Button 
                    onClick={() => navigate('/promociones')}
                    className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 uppercase"
                  >
                    Ver Promociones
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Card Puntos de Lealtad */}
          <Card className="border border-accent rounded-sm shadow-sm transition-all duration-500 hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-xl sm:text-2xl font-light tracking-wide text-foreground flex items-center">
                <Star className="mr-2 h-6 w-6 sm:h-7 sm:w-7 text-yellow-400 fill-yellow-400" /> Tus Puntos de Lealtad
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-foreground/90">Acumula puntos con tus compras y canjéalos por recompensas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6">
              <div className="text-center p-4 sm:p-6 bg-primary/30 rounded-sm">
                <p className="text-md sm:text-lg text-foreground">Puntos Disponibles:</p>
                <p className="text-5xl sm:text-6xl font-light text-foreground/90">{points}</p>
              </div>
              <div>
                <h3 className="text-md sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">¿Cómo funciona?</h3>
                <ul className="list-disc list-inside text-foreground space-y-1 text-xs sm:text-sm">
                  <li>Ganas <strong>1 punto</strong> por cada <strong>$10,000</strong> que gastes.</li>
                  <li>Canjea tus puntos por cupones exclusivos en la página de promociones.</li>
                  <li>Los cupones te ofrecen descuentos especiales en productos seleccionados.</li>
                </ul>
              </div>
              <div>
                <h3 className="text-md sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Redimir Cupones:</h3>
                <div className="p-4 bg-primary/30 border border-accent rounded-sm">
                  <p className="text-sm text-foreground flex items-center mb-3">
                    <Ticket className="mr-2 h-4 w-4" />
                    Usa tus puntos para redimir cupones exclusivos con descuentos especiales.
                  </p>
                  <Button 
                    onClick={() => navigate('/promociones')}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 uppercase"
                  >
                    Ver Promociones y Cupones
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default UserProfilePage;