import React from 'react';
import { Facebook, Instagram, MessageCircle } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-background text-muted-foreground border-t border mt-24">
      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <p className="text-foreground text-xl font-light mb-4 tracking-wide" style={{ fontFamily: 'serif' }}>Contáctanos</p>
            {/* estos son enlaces sin estilos mailto y telepone */}            <p className="text-sm">
              <a href="mailto:contacto@eseaccesorios.com" className="hover:text-foreground transition-colors">
                Email: contacto@eseaccesorios.com
              </a>
            </p>
            <p className="text-sm">
              <a href="tel:+573142991068" className="hover:text-foreground transition-colors">
                Teléfono: +57 3142991068
              </a>
            </p>
            <p className="text-sm">Dirección: Colombia</p>
          </div>
          <div>
            <p className="text-foreground text-xl font-light mb-4 tracking-wide" style={{ fontFamily: 'serif' }}>Enlaces Rápidos</p>
            <ul className="space-y-2">
              <li><a href="/terminos" className="text-sm hover:text-foreground transition-colors">Términos y Condiciones</a></li>
              <li><a href="/privacidad" className="text-sm hover:text-foreground transition-colors">Política de Privacidad</a></li>
              <li><a href="/envios" className="text-sm hover:text-foreground transition-colors">Información de Envíos</a></li>
            </ul>
          </div>
          <div>
            <p className="text-foreground text-xl font-light mb-4 tracking-wide" style={{ fontFamily: 'serif' }}>Síguenos</p>
            <div className="flex justify-center md:justify-start space-x-6">
              <a href="https://www.facebook.com/profile.php?id=61576669680885" target="_blank" aria-label="Visita nuestra página de Facebook" className="text-muted-foreground hover:text-foreground transition-colors"><Facebook size={22} /></a>
              <a href="https://www.instagram.com/eseac_cesorios" target="_blank" aria-label="Visita nuestro perfil de Instagram" className="text-muted-foreground hover:text-foreground transition-colors"><Instagram size={22} /></a>
              <a href="https://wa.me/573142991068?text=¡Hola,%20Ese%20accesorios!%20Me%20interesa%20uno%20de%20tus%20productos" target="_blank" aria-label="Contáctanos por WhatsApp" className="text-muted-foreground hover:text-foreground transition-colors"><MessageCircle size={22} /></a>
            </div>
          </div>
        </div>
        <div className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">&copy; {currentYear} Ese Accesorios. Todos los derechos reservados.</p>
          <p className="text-xs text-muted-foreground/80 mt-2 italic">Desarrollado por <a className=" hover:text-muted-foreground transition-colors" href="https://brandlab.boxwill.com" target="_blank">Boxwill BrandLab</a></p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
