import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

const PrivacyPolicyPage = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-12 max-w-3xl"
    >
      <div className="text-center mb-12">
        <ShieldCheck className="mx-auto h-16 w-16 text-neutral-800 mb-4" />
        <h1 className="text-3xl sm:text-4xl font-light tracking-wide text-neutral-800 mb-2">
          Política de Privacidad
        </h1>
        <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
          Última actualización: 31 de agosto de 2025
        </p>
      </div>

      <div className="bg-white/80 p-6 sm:p-8 rounded-sm shadow-sm border border-stone-200 space-y-6 text-neutral-800">
        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">1. Introducción</h2>
          <p className="text-stone-600 leading-relaxed">
            En Ese Accesorios, valoramos tu privacidad y nos comprometemos a proteger tu información personal. Esta política de privacidad describe cómo recopilamos, usamos y compartimos tu información cuando visitas nuestro sitio web o realizas una compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">2. Información que Recopilamos</h2>
          <p className="text-stone-600 leading-relaxed">
            Recopilamos varios tipos de información para proporcionar y mejorar nuestro servicio:
          </p>
          <ul className="list-disc list-inside text-stone-600 space-y-1 mt-2">
            <li><strong>Información que nos proporcionas directamente:</strong> Nombre, apellido, dirección de correo electrónico, dirección de envío, número de teléfono y detalles de pago cuando creas una cuenta o realizas un pedido.</li>
            <li><strong>Información de uso del sitio:</strong> Recopilamos información sobre cómo interactúas con nuestro sitio web, como las páginas que visitas, los productos que ves y el tiempo que pasas en el sitio.</li>
            <li><strong>Información de proveedores de servicios:</strong> Utilizamos proveedores de servicios de terceros, como Supabase para el backend y Wompi para los pagos, que pueden recopilar información en nuestro nombre.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">3. Cómo Usamos tu Información</h2>
          <p className="text-stone-600 leading-relaxed">
            Utilizamos la información que recopilamos para los siguientes propósitos:
          </p>
          <ul className="list-disc list-inside text-stone-600 space-y-1 mt-2">
            <li>Para procesar y enviar tus pedidos.</li>
            <li>Para comunicarnos contigo sobre tu pedido o para responder a tus consultas.</li>
            <li>Para personalizar tu experiencia de compra y mostrarte productos relevantes.</li>
            <li>Para enviarte correos electrónicos de marketing y promociones, si has optado por recibirlos.</li>
            <li>Para mejorar nuestro sitio web y nuestros servicios.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">4. Cómo Compartimos tu Información</h2>
          <p className="text-stone-600 leading-relaxed">
            No vendemos ni alquilamos tu información personal a terceros. Sin embargo, podemos compartir tu información con los siguientes tipos de entidades:
          </p>
          <ul className="list-disc list-inside text-stone-600 space-y-1 mt-2">
            <li><strong>Proveedores de servicios:</strong> Compartimos información con proveedores de servicios que nos ayudan a operar nuestro negocio, como procesadores de pagos (Wompi) y empresas de envío.</li>
            <li><strong>Cumplimiento de la ley:</strong> Podemos divulgar tu información si así lo exige la ley o si creemos de buena fe que dicha acción es necesaria para cumplir con un proceso legal.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">5. Seguridad de tu Información</h2>
          <p className="text-stone-600 leading-relaxed">
            Nos tomamos muy en serio la seguridad de tu información. Utilizamos medidas de seguridad técnicas y organizativas para proteger tu información contra el acceso no autorizado, la alteración, la divulgación o la destrucción. Sin embargo, ningún método de transmisión por Internet o de almacenamiento electrónico es 100% seguro.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">6. Tus Derechos de Privacidad</h2>
          <p className="text-stone-600 leading-relaxed">
            Tienes derecho a acceder, corregir o eliminar tu información personal que tenemos. También tienes derecho a oponerte o restringir nuestro procesamiento de tu información personal. Para ejercer estos derechos, por favor contáctanos.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">7. Uso de Cookies</h2>
          <p className="text-stone-600 leading-relaxed">
            Nuestro sitio web utiliza cookies para mejorar tu experiencia de navegación. Las cookies son pequeños archivos de datos que se almacenan en tu dispositivo. Utilizamos cookies para recordar tus preferencias, para entender cómo usas nuestro sitio y para personalizar nuestro marketing. Puedes controlar el uso de cookies a nivel de navegador individual.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">8. Cambios a esta Política</h2>
          <p className="text-stone-600 leading-relaxed">
            Nos reservamos el derecho de modificar esta política de privacidad en cualquier momento. Cualquier cambio será publicado en esta página y se indicará la fecha de la última actualización. Te recomendamos revisar esta página periódicamente.
          </p>
        </section>

        <section>
          <h2 className="text-xl sm:text-2xl font-light tracking-wide mb-2">9. Contacto</h2>
          <p className="text-stone-600 leading-relaxed">
            Si tienes alguna pregunta sobre esta Política de Privacidad, puedes contactarnos a través de nuestro correo electrónico <strong>contacto@eseaccesorios.com</strong> o a través de nuestra línea de WhatsApp: <strong>+57 314 2991068</strong>.
          </p>
        </section>
      </div>
    </motion.div>
  );
};

export default PrivacyPolicyPage;