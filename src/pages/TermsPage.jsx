import React from 'react';
import { motion } from 'framer-motion';
import { ScrollText } from 'lucide-react';

const TermsPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 max-w-3xl"
    >
      <div className="text-center mb-12">
        <ScrollText className="mx-auto h-14 w-14 text-neutral-800 mb-4" />
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-neutral-800 mb-2">
          Términos y Condiciones
        </h1>
        <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
          Última actualización: 31 de agosto de 2025
        </p>
      </div>

      <div className="bg-white/80 p-6 sm:p-8 rounded-sm shadow-sm border border-stone-200 space-y-6 text-neutral-800">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">1. Introducción</h2>
        <p className="text-stone-600 leading-relaxed">
          Bienvenido a Ese Accesorios. Somos una tienda en línea dedicada a la venta de accesorios y bisutería de diseño. Al realizar una compra o navegar en nuestro sitio web, aceptas los siguientes términos y condiciones. Por favor, léelos con atención.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">2. Propiedad Intelectual</h2>
        <p className="text-stone-600 leading-relaxed">
          Todo el contenido presente en este sitio web, incluyendo, pero no limitado a, imágenes, textos, logotipos, diseños, y fotografías, es propiedad exclusiva de Ese Accesorios o de sus proveedores. Queda estrictamente prohibida su reproducción, distribución o uso sin nuestra autorización explícita y por escrito.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">3. Cuentas de Usuario</h2>
        <p className="text-stone-600 leading-relaxed">
          Para realizar compras en nuestro sitio, puedes crear una cuenta de usuario. Eres responsable de proporcionar información veraz, completa y actualizada. También eres responsable de mantener la confidencialidad de tu contraseña y de todas las actividades que ocurran en tu cuenta. Notifícanos de inmediato sobre cualquier uso no autorizado de tu cuenta.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">4. Pedidos y Pagos</h2>
        <p className="text-stone-600 leading-relaxed">
          Todos los pedidos están sujetos a disponibilidad de stock. Nos reservamos el derecho de cancelar cualquier pedido por sospecha de fraude, errores en la información del producto o cualquier otro motivo justificado. Los pagos se procesan a través de la pasarela de pagos segura Wompi. Al realizar un pago, aceptas los términos y condiciones de Wompi.
        </p>
        <p className="text-stone-600 leading-relaxed">
          Con cada compra, acumularás puntos que podrás redimir en futuras compras, de acuerdo a nuestro programa de lealtad.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">5. Envíos y Devoluciones</h2>
        <p className="text-stone-600 leading-relaxed">
          Realizamos envíos a toda Colombia. Los costos y tiempos de envío se detallan en nuestra <a href="/envios">Página de Información de Envíos</a>. El cliente es responsable de proporcionar una dirección de envío correcta y completa. Para devoluciones, por favor consulta nuestra política en la misma página.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">6. Garantías</h2>
        <p className="text-stone-600 leading-relaxed">
          Ofrecemos una garantía de 30 días por defectos de fábrica en todos nuestros productos. Esta garantía no cubre daños causados por mal uso, accidentes, contacto con productos químicos, o desgaste natural. Para hacer efectiva la garantía, contáctanos a través de nuestros canales de atención.
        </p>
        <h3>Cuidados recomendados</h3>
        <p className="text-stone-600 leading-relaxed">
          La mayoría de nuestras piezas están elaboradas en rodio y acero de excelente calidad. Para conservarlas en perfecto estado, recomendamos evitar el contacto con agua, sudor, cremas, perfumes y otros productos químicos. El pH de cada persona también puede influir en la duración del baño de la pieza.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">7. Limitación de Responsabilidad</h2>
        <p className="text-stone-600 leading-relaxed">
          Ese Accesorios no se hace responsable por daños directos, indirectos, o consecuentes que resulten del uso o la imposibilidad de uso de nuestros productos o de nuestro sitio web.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">8. Modificaciones a los Términos</h2>
        <p className="text-stone-600 leading-relaxed">
          Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Cualquier cambio será publicado en esta página y se indicará la fecha de la última actualización. Te recomendamos revisar esta página periódicamente.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">9. Condiciones Comerciales para Compras al por Mayor</h2>
        <p className="text-stone-600 leading-relaxed">
          Ofrecemos un <strong>30% de descuento</strong> sobre el valor del catálogo para compras al por mayor, con una compra mínima de <strong>$400.000 COP</strong>. Esta condición está pensada como un incentivo para emprendedores y debe ser solicitada y coordinada previamente a través de nuestros canales de contacto.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">10. Contacto</h2>
        <p className="text-stone-600 leading-relaxed">
          Si tienes alguna duda sobre estos términos, puedes contactarnos a través de nuestro correo electrónico <strong>contacto@eseaccesorios.com</strong> o a través de nuestra línea de WhatsApp: <strong>+57 314 2991068</strong>.
        </p>
      </div>
    </motion.div>
  );
};

export default TermsPage;