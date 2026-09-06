import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/lib/supabaseClient';

const useCheckoutForm = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  const initialState = {
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
    country: 'CO',
    phonePrefix: '+57',
  };

  const DEFAULT_SHIPPING_COST = 8000;

  const [formData, setFormData] = useState(initialState);
  const [departments, setDepartments] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [shippingCost, setShippingCost] = useState(DEFAULT_SHIPPING_COST);

  const loadShippingCostForCity = async (cityName) => {
    if (!cityName) {
      setShippingCost(0);
      return;
    }
  
    try {
      const { data, error } = await supabase
        .from('shipping')
        .select('base_price, department')
        .eq('city', cityName)
        .single();
  
      if (error) throw error;
  
      setShippingCost(data?.base_price || 0);
  
      // 👇 Guardar depto también
      if (data?.department) {
        setFormData(prev => ({
          ...prev,
          city: cityName,
          department: data.department,
        }));
      }
    } catch (err) {
      console.error('Error loading shipping cost:', err);
      setShippingCost(0);
    }
  };
  
  // Cargar departamentos al inicializar el hook
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

  // Prellenar formulario con datos del usuario (solo una vez)
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);
  
  useEffect(() => {
    
    if (userProfile && !hasLoadedProfile) {
      const fillFormWithUserData = async () => {
        const shippingAddress = userProfile.shipping_address || {};
        const city = userProfile.city || '';
        const department = await getDepartmentFromCity(city);
        

        // Si hay una ciudad guardada, obtener su departamento y cargar las ciudades PRIMERO
        if (city) {
          
          const department = await getDepartmentFromCity(city);
          
          if (department) {
            setSelectedDepartment(department);
            await loadCitiesForDepartment(department);
          }
          
          // Calcular el costo de envío con la ciudad del perfil
          await loadShippingCostForCity(city, department);
        }

        // Ahora actualizar el form DESPUÉS de cargar todo
        setFormData(prev => ({
          ...prev,
          fullName: userProfile.full_name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          address: shippingAddress.address || '',
          city: city, // Esta ciudad ya debe estar en la lista cargada
          department: department || '',
          notes: shippingAddress.notes || '',
        }));

        // Marcar como cargado para evitar bucles
        setHasLoadedProfile(true);
      };

      fillFormWithUserData();
    }
  }, [userProfile, hasLoadedProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDepartmentChange = (value) => {
    setSelectedDepartment(value);
    setFormData(prev => ({ ...prev, city: '' }));
    setCities([]); // Limpiar ciudades antes de cargar las nuevas
    setFormData(prev => ({ ...prev, city: '', department: value })); // 👈 Guardar depto
    loadCitiesForDepartment(value);
  };

  const handleCityChange = (value) => {
    setFormData(prev => ({ ...prev, city: value }));
    loadShippingCostForCity(value);
  };

  return {
    formData,
    setFormData,
    departments,
    cities,
    selectedDepartment,
    locationsLoading,
    handleInputChange,
    handleDepartmentChange,
    handleCityChange,
    getDepartmentFromCity,
    shippingCost,
  };
};

export default useCheckoutForm;