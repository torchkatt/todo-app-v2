import React from 'react';

const TermsPage: React.FC = () => (
  <div className="min-h-screen bg-brand-bg px-4 py-8 max-w-2xl mx-auto">
    <h1 className="text-2xl font-extrabold mb-6">Términos y Condiciones</h1>
    <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
      <p><strong className="text-text-primary">1. Aceptación de términos</strong><br />Al usar Todo, aceptas estos términos. Si no estás de acuerdo, no uses la plataforma.</p>
      <p><strong className="text-text-primary">2. Descripción del servicio</strong><br />Todo es un marketplace que conecta compradores con vendedores de productos, servicios y contenido digital. No somos responsables directos de las transacciones entre usuarios.</p>
      <p><strong className="text-text-primary">3. Registro de cuenta</strong><br />Debes proporcionar información veraz. Eres responsable de mantener la confidencialidad de tus credenciales.</p>
      <p><strong className="text-text-primary">4. Conducta del usuario</strong><br />No puedes publicar contenido ilegal, engañoso o que infrinja derechos de terceros. Todo se reserva el derecho de eliminar cuentas que violen estos términos.</p>
      <p><strong className="text-text-primary">5. Pagos</strong><br />Los pagos se procesan a través de Wompi. Todo no almacena información financiera. Las comisiones se informan antes de cada transacción.</p>
      <p><strong className="text-text-primary">6. Devoluciones y reembolsos</strong><br />Las políticas de devolución son definidas por cada vendedor. Todo puede mediar en disputas pero no garantiza reembolsos.</p>
      <p><strong className="text-text-primary">7. Limitación de responsabilidad</strong><br />Todo no se hace responsable por daños directos o indirectos derivados del uso de la plataforma.</p>
      <p><strong className="text-text-primary">8. Modificaciones</strong><br />Podemos modificar estos términos en cualquier momento. Notificaremos cambios con 30 días de antelación.</p>
      <p className="text-text-muted text-xs mt-8">Última actualización: Julio 2026 · Colombia</p>
    </div>
  </div>
);

export default TermsPage;
