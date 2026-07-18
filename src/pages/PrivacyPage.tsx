import React from 'react';

const PrivacyPage: React.FC = () => (
  <div className="min-h-screen bg-brand-bg px-4 py-8 max-w-2xl mx-auto">
    <h1 className="text-2xl font-extrabold mb-6">Política de Privacidad</h1>
    <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
      <p><strong className="text-text-primary">1. Información que recopilamos</strong><br />Nombre, correo electrónico, teléfono, dirección de envío, datos de pago procesados por Wompi (no almacenamos números de tarjeta).</p>
      <p><strong className="text-text-primary">2. Uso de la información</strong><br />Usamos tus datos para procesar transacciones, mejorar la plataforma, enviar notificaciones relevantes y cumplir obligaciones legales.</p>
      <p><strong className="text-text-primary">3. Compartir información</strong><br />Compartimos datos con Wompi (pagos), Firebase (infraestructura) y vendedores (solo lo necesario para completar tu pedido). No vendemos datos personales.</p>
      <p><strong className="text-text-primary">4. Seguridad</strong><br />Implementamos medidas técnicas y organizativas para proteger tus datos: encriptación en tránsito y reposo, acceso restringido, auditorías periódicas.</p>
      <p><strong className="text-text-primary">5. Tus derechos</strong><br />Puedes solicitar acceso, corrección, eliminación o portabilidad de tus datos escribiendo a privacidad@todoapp.co. Respondemos en máximo 15 días hábiles.</p>
      <p><strong className="text-text-primary">6. Cookies</strong><br />Usamos cookies esenciales para el funcionamiento de la app y analíticas para mejorar la experiencia. Puedes deshabilitarlas desde tu navegador.</p>
      <p><strong className="text-text-primary">7. Retención de datos</strong><br />Conservamos tus datos mientras tu cuenta esté activa. Al eliminarla, los datos transaccionales se conservan por obligaciones legales (5 años).</p>
      <p><strong className="text-text-primary">8. Contacto</strong><br />Para cualquier consulta sobre privacidad: privacidad@todoapp.co · Bucaramanga, Colombia.</p>
      <p className="text-text-muted text-xs mt-8">Última actualización: Julio 2026 · Cumple con la Ley 1581 de 2012 (Colombia)</p>
    </div>
  </div>
);

export default PrivacyPage;
