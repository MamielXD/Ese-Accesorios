import React from 'react';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';

const ShippingInfoPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 max-w-3xl"
    >
      <div className="text-center mb-12">
        <Truck className="mx-auto h-14 w-14 text-neutral-800 mb-4" />
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-neutral-800 mb-2">
          Información de Envíos
        </h1>
        <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
          Última actualización: 31 de agosto de 2025
        </p>
      </div>

      <div className="bg-white/80 p-6 sm:p-8 rounded-sm shadow-sm border border-stone-200 space-y-6 text-neutral-800">
        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">1. Cobertura de Envío</h2>
        <p className="text-stone-600 leading-relaxed">
          Realizamos envíos a todo el territorio nacional de Colombia a través de diversas empresas transportadoras de confianza como Servientrega, InterRapidísimo, y Envía, buscando siempre la mejor opción para tu ubicación.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">2. Tiempos de Procesamiento y Entrega</h2>
        <p className="text-stone-600 leading-relaxed">
          Una vez confirmado tu pago, procesaremos tu pedido en un plazo de <strong>1 a 2 días hábiles</strong>. Después de ser despachado, los tiempos de entrega estimados son:
        </p>
        <ul className="list-disc list-inside text-stone-600 space-y-1 mt-2">
          <li><strong>Ciudades Principales:</strong> 2 a 5 días hábiles.</li>
          <li><strong>Otras Ciudades y Municipios:</strong> 3 a 7 días hábiles.</li>
        </ul>
        <p className="text-stone-600 leading-relaxed">
          Ten en cuenta que estos tiempos son estimados y pueden variar por factores externos a Ese Accesorios, como condiciones climáticas o logísticas de la transportadora.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">3. Costos de Envío</h2>
        <p className="text-stone-600 leading-relaxed">
          El costo estimado del envío se calculará automáticamente al momento de finalizar tu compra, basado en tu ubicación. El precio del envío puede variar si no es una ciudad principal. Ofrecemos <strong>envío gratuito</strong> para clientes que tengan referidos (se debe solicitar este beneficio por <strong>correo electrónico o WhatsApp</strong>).
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">4. Seguimiento de Pedidos</h2>
        <p className="text-stone-600 leading-relaxed">
          Una vez que tu pedido sea despachado, recibirás un correo electrónico con el número de guía para que puedas rastrearlo directamente en el sitio web de la empresa transportadora.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">5. Pedidos No Entregados</h2>
        <p className="text-stone-600 leading-relaxed">
          Si un pedido es devuelto a nosotros debido a una dirección incorrecta proporcionada por el cliente o porque no fue posible realizar la entrega, nos pondremos en contacto contigo para coordinar un nuevo envío. En estos casos, el cliente deberá asumir los costos adicionales de reenvío.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">6. Daños Durante el Envío</h2>
        <p className="text-stone-600 leading-relaxed">
          En el improbable caso de que tu pedido llegue con daños, es importante que nos lo reportes dentro de las <strong>48 horas</strong> siguientes a la recepción. Por favor, envía un correo a <strong>contacto@eseaccesorios.com</strong> o escríbenos a nuestra línea de WhatsApp con fotos claras del empaque y del producto dañado para que podamos ayudarte.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">7. Cambios en la Dirección de Envío</h2>
        <p className="text-stone-600 leading-relaxed">
          Si necesitas realizar un cambio en la dirección de envío, por favor contáctanos lo antes posible. Haremos todo lo posible por ayudarte, pero no podemos garantizar el cambio si el pedido ya ha sido despachado.
        </p>

        <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">8. Contacto</h2>
        <p className="text-stone-600 leading-relaxed">
          Si tienes alguna pregunta sobre nuestra política de envíos, no dudes en contactarnos a través de nuestro correo electrónico <strong>contacto@eseaccesorios.com</strong> o a través de nuestra línea de WhatsApp: <strong>+57 314 2991068</strong>.
        </p>
      </div>
    </motion.div>
  );
};

export default ShippingInfoPage;