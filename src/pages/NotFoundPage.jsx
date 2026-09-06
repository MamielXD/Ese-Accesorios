import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Frown } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFoundPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] bg-stone-50 text-center px-4"
    >
      <Frown className="w-20 h-20 text-neutral-800 mb-6" />
      <h1 className="text-4xl sm:text-5xl font-light tracking-wide text-neutral-800 mb-2">404</h1>
      <h2 className="text-xl sm:text-2xl font-light text-stone-700 mb-4">Página no encontrada</h2>
      <p className="text-stone-600 text-base sm:text-lg mb-8 max-w-md leading-relaxed">
        La página que buscas no existe o ha sido movida. Descubre nuestras piezas exclusivas en la página principal.
      </p>
      <Button 
        asChild 
        size="lg"
        className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 uppercase"
      >
        <Link to="/">Volver al Inicio</Link>
      </Button>
    </motion.div>
  );
};

export default NotFoundPage;
