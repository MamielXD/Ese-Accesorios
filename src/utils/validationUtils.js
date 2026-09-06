// Utilities para validación de formularios

export const validators = {
  email: (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // Convert to string and handle null/undefined
    const stringValue = value ? String(value) : '';
    if (!stringValue) return { isValid: false, message: 'Email es requerido' };
    if (!emailRegex.test(stringValue)) return { isValid: false, message: 'Email no válido' };
    return { isValid: true, message: 'Email válido' };
  },

  phone: (value) => {
    const phoneRegex = /^[0-9]{10}$/;
    // Safely convert to string and clean
    const stringValue = value ? String(value) : '';
    const cleanValue = stringValue.replace(/[^\d]/g, '');
    if (!cleanValue) return { isValid: false, message: 'Teléfono es requerido' };
    if (!phoneRegex.test(cleanValue)) return { isValid: false, message: 'Teléfono debe tener 10 dígitos' };
    return { isValid: true, message: 'Teléfono válido' };
  },

  fullName: (value) => {
    const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{2,50}$/;
    const stringValue = value ? String(value) : '';
    if (!stringValue) return { isValid: false, message: 'Nombre es requerido' };
    if (stringValue.length < 2) return { isValid: false, message: 'Nombre muy corto' };
    if (stringValue.length > 50) return { isValid: false, message: 'Nombre muy largo' };
    if (!nameRegex.test(stringValue)) return { isValid: false, message: 'Solo letras y espacios' };
    return { isValid: true, message: 'Nombre válido' };
  },

  address: (value) => {
    const stringValue = value ? String(value) : '';
    if (!stringValue) return { isValid: false, message: 'Dirección es requerida' };
    if (stringValue.length < 10) return { isValid: false, message: 'Dirección muy corta' };
    if (stringValue.length > 100) return { isValid: false, message: 'Dirección muy larga' };
    return { isValid: true, message: 'Dirección válida' };
  },

  required: (value, fieldName) => {
    const stringValue = value ? String(value).trim() : '';
    if (!stringValue) {
      return { isValid: false, message: `${fieldName} es requerido` };
    }
    return { isValid: true, message: `${fieldName} válido` };
  }
};

export const sanitizeData = (data) => {
  const sanitized = {};
  
  Object.keys(data).forEach(key => {
    let value = data[key];
    
    // Convert to string and handle null/undefined
    if (value != null) {
      value = String(value);
      
      // Trim whitespace
      value = value.trim();
      
      // Sanitize specific fields
      switch (key) {
        case 'email':
          value = value.toLowerCase();
          break;
        case 'phone':
          value = value.replace(/[^\d]/g, '');
          break;
        case 'fullName':
        case 'address':
          // Remove potentially dangerous characters but keep accents and basic punctuation
          value = value.replace(/[<>\"'&]/g, '');
          break;
        default:
          value = value.replace(/[<>\"'&]/g, '');
      }
    } else {
      value = '';
    }
    
    sanitized[key] = value;
  });
  
  return sanitized;
};

export const validateForm = (formData) => {
  const errors = {};
  const validFields = {};
  
  // Required fields validation
  const requiredFields = [
    { key: 'fullName', label: 'Nombre completo' },
    { key: 'email', label: 'Correo electrónico' },
    { key: 'phone', label: 'Teléfono' },
    { key: 'address', label: 'Dirección' },
    { key: 'city', label: 'Ciudad' },
    { key: 'department', label: 'Departamento' }
  ];
  
  requiredFields.forEach(field => {
    const value = formData[field.key];
    const stringValue = value ? String(value).trim() : '';
    if (!stringValue) {
      errors[field.key] = `${field.label} es requerido`;
    }
  });
  
  // Specific field validation
  if (formData.email) {
    const emailValidation = validators.email(formData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.message;
    } else {
      validFields.email = true;
    }
  }
  
  if (formData.phone) {
    const phoneValidation = validators.phone(formData.phone);
    if (!phoneValidation.isValid) {
      errors.phone = phoneValidation.message;
    } else {
      validFields.phone = true;
    }
  }
  
  if (formData.fullName) {
    const nameValidation = validators.fullName(formData.fullName);
    if (!nameValidation.isValid) {
      errors.fullName = nameValidation.message;
    } else {
      validFields.fullName = true;
    }
  }
  
  if (formData.address) {
    const addressValidation = validators.address(formData.address);
    if (!addressValidation.isValid) {
      errors.address = addressValidation.message;
    } else {
      validFields.address = true;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validFields
  };
};

export const getFieldValidation = (fieldName, value) => {
  // Handle null/undefined values safely
  const stringValue = value ? String(value) : '';
  if (!stringValue) return { isValid: false, isInvalid: false, message: '' };
  
  let validation;
  switch (fieldName) {
    case 'email':
      validation = validators.email(value);
      break;
    case 'phone':
      validation = validators.phone(value);
      break;
    case 'fullName':
      validation = validators.fullName(value);
      break;
    case 'address':
      validation = validators.address(value);
      break;
    default:
      validation = validators.required(value, fieldName);
  }
  
  return {
    isValid: validation.isValid,
    isInvalid: !validation.isValid && stringValue.length > 0,
    message: validation.isValid ? '' : validation.message
  };
};