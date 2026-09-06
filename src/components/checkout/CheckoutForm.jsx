import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, MapPin, Phone, Mail, User, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getFieldValidation } from '@/utils/validationUtils';
import { ValidationIcon, ValidationMessage } from '@/components/security/SecurityComponents';

const CheckoutForm = ({ 
  formData, 
  handleInputChange, 
  handleDepartmentChange, 
  handleCityChange,
  departments,
  cities, 
  selectedDepartment,
  locationsLoading,
  formValidation
}) => {
  const [fieldValidations, setFieldValidations] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  // Validación en tiempo real para campos específicos
  useEffect(() => {
    const validations = {};
    Object.keys(formData).forEach(fieldName => {
      if (touchedFields[fieldName] || formData[fieldName]) {
        validations[fieldName] = getFieldValidation(fieldName, formData[fieldName]);
      }
    });
    setFieldValidations(validations);
  }, [formData, touchedFields]);

  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const getInputClassName = (fieldName) => {
    const baseClasses = "text-foreground border-foreground focus:border-foreground focus:ring-foreground transition-all duration-200";
    const validation = fieldValidations[fieldName];
    
    if (!validation) return baseClasses;
    
    if (validation.isValid) {
      return `${baseClasses} border-green-400 focus:border-green-500`;
    }
    if (validation.isInvalid) {
      return `${baseClasses} border-red-400 focus:border-red-500`;
    }
    return baseClasses;
  };

  return (
    <div className="bg-background backdrop-blur-sm p-6 sm:p-8 rounded-lg shadow-lg border border-accent">
      {/* Información de Contacto */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-heading tracking-wide text-foreground mb-6 flex items-center">
          <UserCircle className="mr-3 h-7 w-7 sm:h-8 sm:w-8 text-foreground" />
          Información de Contacto
          {formValidation.validFields.fullName && formValidation.validFields.email && formValidation.validFields.phone && (
            <CheckCircle2 className="ml-2 h-6 w-6 text-green-500" />
          )}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Nombre Completo */}
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-foreground text-sm font-medium flex items-center">
              <User className="h-4 w-4 mr-2 text-foreground" />
              Nombre Completo *
            </Label>
            <div className="relative">
              <Input 
                id="fullName" 
                name="fullName" 
                value={formData.fullName} 
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('fullName')}
                placeholder="Tu nombre completo" 
                required 
                className={getInputClassName('fullName')}
                autoComplete="name"
              />
              <ValidationIcon 
                isValid={fieldValidations.fullName?.isValid}
                isInvalid={fieldValidations.fullName?.isInvalid}
              />
            </div>
            <ValidationMessage 
              message={fieldValidations.fullName?.message}
              type={fieldValidations.fullName?.isValid ? "success" : "error"}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground text-sm font-medium flex items-center">
              <Mail className="h-4 w-4 mr-2 text-foreground" />
              Correo Electrónico *
            </Label>
            <div className="relative">
              <Input 
                id="email" 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange}
                onBlur={() => handleFieldBlur('email')}
                placeholder="tu@correo.com" 
                required 
                className={getInputClassName('email')}
                autoComplete="email"
              />
              <ValidationIcon 
                isValid={fieldValidations.email?.isValid}
                isInvalid={fieldValidations.email?.isInvalid}
              />
            </div>
            <ValidationMessage 
              message={fieldValidations.email?.message}
              type={fieldValidations.email?.isValid ? "success" : "error"}
            />
          </div>
        </div>

        {/* Teléfono */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground text-sm font-medium flex items-center">
            <Phone className="h-4 w-4 mr-2 text-foreground" />
            Teléfono *
          </Label>
          <div className="relative">
            <Input 
              id="phone" 
              name="phone" 
              type="tel" 
              value={formData.phone} 
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('phone')}
              placeholder="Ej: 3001234567" 
              required 
              className={getInputClassName('phone')}
              autoComplete="tel"
              maxLength="10"
            />
            <ValidationIcon 
              isValid={fieldValidations.phone?.isValid}
              isInvalid={fieldValidations.phone?.isInvalid}
            />
          </div>
          <ValidationMessage 
            message={fieldValidations.phone?.message}
            type={fieldValidations.phone?.isValid ? "success" : "error"}
          />
          <p className="text-xs text-foreground/80">Solo números, 10 dígitos</p>
        </div>
      </div>

      {/* Dirección de Envío */}
      <div className="pt-8 mt-8 border-t border-accent">
        <h3 className="text-xl sm:text-2xl font-heading tracking-wide text-foreground mb-6 flex items-center">
          <MapPin className="mr-3 h-6 w-6 sm:h-7 sm:w-7 text-foreground" />
          Dirección de Envío
          {formValidation.validFields.address && formValidation.validFields.city && formValidation.validFields.department && (
            <CheckCircle2 className="ml-2 h-6 w-6 text-green-500" />
          )}
        </h3>

        {/* Dirección */}
        <div className="mb-6 space-y-2">
          <Label htmlFor="address" className="text-foreground text-sm font-medium">
            Dirección Completa *
          </Label>
          <div className="relative">
            <Input 
              id="address" 
              name="address" 
              value={formData.address} 
              onChange={handleInputChange}
              onBlur={() => handleFieldBlur('address')}
              placeholder="Ej: Calle 5 # 10-15, Apto 201" 
              required 
              className={getInputClassName('address')}
              autoComplete="street-address"
            />
            <ValidationIcon 
              isValid={fieldValidations.address?.isValid}
              isInvalid={fieldValidations.address?.isInvalid}
            />
          </div>
          <ValidationMessage 
            message={fieldValidations.address?.message}
            type={fieldValidations.address?.isValid ? "success" : "error"}
          />
          <p className="text-xs text-foreground/80">Incluye calle, número, apartamento si aplica</p>
        </div>

        {/* Departamento y Ciudad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="department" className="text-foreground text-sm font-medium">
              Departamento *
            </Label>
            <Select 
              value={selectedDepartment} 
              onValueChange={handleDepartmentChange}
              disabled={locationsLoading}
              required 
            >
              <SelectTrigger 
                id="department" 
                className={`text-base border-accent focus:border-neutral-800 ${
                  locationsLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <SelectValue placeholder={
                  locationsLoading ? "🔄 Cargando departamentos..." : "Selecciona un departamento"
                } />
              </SelectTrigger>
              <SelectContent className="bg-background shadow-xl border-accent max-h-60">
                {departments.map(dept => (
                  <SelectItem 
                    key={dept} 
                    value={dept} 
                    className="text-base hover:bg-accent/80 cursor-pointer"
                  >
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!selectedDepartment && (
              <ValidationMessage message="Departamento es requerido" type="error" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city" className="text-foreground text-sm font-medium">
              Ciudad/Municipio *
            </Label>
            <Select 
              value={formData.city || ""} 
              onValueChange={handleCityChange}
              disabled={!selectedDepartment || cities.length === 0 || locationsLoading} 
              required
            >
              <SelectTrigger 
                id="city" 
                className={`text-foreground border-accent focus:border-neutral-800 ${
                  !selectedDepartment || locationsLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <SelectValue placeholder={
                  locationsLoading ? "🔄 Cargando ciudades..." : 
                  !selectedDepartment ? "Primero selecciona un departamento" :
                  cities.length === 0 ? "No hay ciudades disponibles" :
                  "Selecciona una ciudad"
                } />
              </SelectTrigger>
              <SelectContent className="bg-background shadow-xl border-accent max-h-60">
                {cities.map(city => (
                  <SelectItem 
                    key={city} 
                    value={city} 
                    className="text-base hover:bg-accent/80 cursor-pointer"
                  >
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!formData.city && selectedDepartment && (
              <ValidationMessage message="Ciudad es requerida" type="error" />
            )}
          </div>
        </div>

        {/* Notas Adicionales */}
        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground text-sm font-medium">
            Notas Adicionales (Opcional)
          </Label>
          <Textarea 
            id="notes" 
            name="notes" 
            value={formData.notes} 
            onChange={handleInputChange} 
            placeholder="Instrucciones especiales para la entrega, referencias adicionales, etc." 
            className="text-foreground bg-background border-accent focus:border-neutral-800 focus:ring-neutral-800 min-h-[80px] resize-none"
            maxLength="500"
          />
          <p className="text-xs text-foreground/80">
            {formData.notes?.length || 0}/500 caracteres
          </p>
        </div>
      </div>

      {/* Resumen de validación */}
      <div className="mt-8 pt-6 border-t border-accent">
        <div className="flex items-center justify-between">
          <span className="text-sm text-foreground/80">Estado del formulario:</span>
          <div className="flex items-center space-x-2">
            {formValidation.isValid ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Información completa</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-sm text-amber-600">
                  Faltan {Object.keys(formValidation.errors).length} campos
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;
