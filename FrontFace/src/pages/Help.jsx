import React from "react";

const Help = () => {
  return (
    <div className="w-full min-h-screen text-white px-6 pt-28 pb-32 bg-gradient-to-b from-black to-gray-900">

      {/* Título */}
      <h1 className="text-4xl font-bold text-center mb-10 tracking-wide">
        Help & Support
      </h1>

      {/* Sección 1 - FAQ */}
      <section className="max-w-4xl mx-auto mb-12 bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10">
        <h2 className="text-2xl font-semibold mb-3">Preguntas Frecuentes</h2>

        <div className="space-y-6 text-gray-300">

          {/* Pregunta 1 */}
          <div>
            <p className="text-white font-semibold">
              ¿Cómo funciona MerqNet?
            </p>
            <p>
              Creas una solicitud, los vendedores pujan con sus mejores precios, 
              y tú eliges la oferta que prefieras. No hay asignaciones automáticas.
            </p>
          </div>

          {/* Pregunta 2 */}
          <div>
            <p className="text-white font-semibold">
              ¿Los vendedores pueden escribirme sin mi permiso?
            </p>
            <p>
              No. Solo pueden contactarte cuando tú aceptas su puja o si tú presionas "Ask the Seller".
            </p>
          </div>

          {/* Pregunta 3 */}
          <div>
            <p className="text-white font-semibold">
              ¿Puedo añadir varias direcciones de envío?
            </p>
            <p>
              Sí. Puedes añadir hasta tres direcciones desde Settings y elegir una como predeterminada.
            </p>
          </div>

          {/* Pregunta 4 */}
          <div>
            <p className="text-white font-semibold">
              ¿Aceptan métodos de pago?
            </p>
            <p>
              Sí, MerqNet usa Stripe para procesar tarjetas de forma segura.
            </p>
          </div>

          {/* Pregunta 5 */}
          <div>
            <p className="text-white font-semibold">
              ¿Qué hago si tengo un problema con una puja?
            </p>
            <p>
              Puedes contactar soporte directamente usando el email oficial.
            </p>
          </div>

        </div>
      </section>

      {/* Sección 2 - Contacto */}
      <section className="max-w-4xl mx-auto bg-white/5 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/10 text-center">
        <h2 className="text-2xl font-semibold mb-3">Soporte Técnico</h2>
        <p className="text-gray-300">
          Si necesitas asistencia directa, contáctanos en:
        </p>
        <p className="text-white font-semibold mt-2 text-lg">
          support@merqnet.com
        </p>
      </section>

    </div>
  );
};

export default Help;
