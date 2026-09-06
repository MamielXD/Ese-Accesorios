import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '@/lib/supabaseClient';

export const CategoryContext = createContext({
  categories: [],
  loading: true,
  error: null,
});

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const { data, error: fetchError } = await supabase
          .from('categories')
          .select('id, name, image_url, description, slug')
          .order('name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setCategories(data || []);
      } catch (e) {
        console.error('Error fetching categories:', e);
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []); // El array vacío asegura que se ejecute solo una vez

  const value = { categories, loading, error };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};
