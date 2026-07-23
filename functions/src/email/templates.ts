/**
 * Plantillas de email con HTML inline (responsive, fondos blancos, tipografía limpia).
 * Diseñadas para clientes de correo que no soportan CSS externo ni flexbox avanzado.
 */

const BASE_STYLE = /*html*/ `
  body { margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; }
  .header { background: #2563eb; color: #ffffff; padding: 32px 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .body { padding: 32px 24px; color: #1f2937; }
  .body p { margin: 0 0 16px 0; font-size: 16px; line-height: 1.6; }
  .footer { padding: 24px; text-align: center; color: #9ca3af; font-size: 13px; border-top: 1px solid #e5e7eb; }
  .footer a { color: #2563eb; text-decoration: none; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 13px; color: #6b7280; border-bottom: 2px solid #e5e7eb; }
  td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 15px; }
  .btn { display: inline-block; padding: 12px 28px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; margin: 16px 0; }
  .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; }
  .badge-success { background: #dcfce7; color: #166534; }
  .badge-warning { background: #fef9c3; color: #854d0e; }
  .amount { font-size: 24px; font-weight: 700; color: #2563eb; }
  .receipt-box { border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 16px 0; }
`;

/**
 * Template para confirmación de pedido. Muestra tabla de ítems, total,
 * e info de entrega estimada.
 */
export function orderConfirmedTemplate(
  order: { id: string; items: Array<{ name: string; quantity: number; price: number }>; total: number; deliveryEstimate?: string },
  userName: string,
): string {
  const itemsRows = order.items
    .map(
      (item) => `
    <tr>
      <td>${escapeHtml(item.name)}</td>
      <td style="text-align:center">${item.quantity}</td>
      <td style="text-align:right">$${(item.price / 100).toLocaleString('es-CO')}</td>
    </tr>`,
    )
    .join('');

  const delivery = order.deliveryEstimate
    ? `<p>⏱ <strong>Entrega estimada:</strong> ${escapeHtml(order.deliveryEstimate)}</p>`
    : '';

  return /*html*/ `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${BASE_STYLE}</style></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div class="container">
    <div class="header">
      <h1>✅ Pedido Confirmado</h1>
    </div>
    <div class="body">
      <p>¡Hola <strong>${escapeHtml(userName)}</strong>!</p>
      <p>Tu pedido <strong>#${escapeHtml(order.id.slice(-8))}</strong> ha sido confirmado. Aquí están los detalles:</p>

      <table>
        <thead>
          <tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Precio</th></tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <p style="text-align:right"><span class="amount">$${(order.total / 100).toLocaleString('es-CO')}</span></p>
      ${delivery}

      <p>Puedes hacer seguimiento de tu pedido en la app.</p>
    </div>
    <div class="footer">
      <p>Todo Marketplace &copy; ${new Date().getFullYear()}</p>
      <p>Este es un correo automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Template de recibo de pago. Estilo receipt compacto con monto y ID de transacción.
 */
export function paymentReceivedTemplate(amount: number, transactionId: string): string {
  return /*html*/ `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${BASE_STYLE}</style></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div class="container">
    <div class="header">
      <h1>💰 Pago Recibido</h1>
    </div>
    <div class="body">
      <p>Tu pago ha sido procesado exitosamente.</p>

      <div class="receipt-box">
        <p style="margin:0 0 8px 0;color:#6b7280;font-size:13px;">MONTO</p>
        <p class="amount" style="margin:0">$${(amount / 100).toLocaleString('es-CO')}</p>
        <hr style="border:0;border-top:1px solid #e5e7eb;margin:12px 0;">
        <p style="margin:0;color:#6b7280;font-size:13px;">ID DE TRANSACCIÓN</p>
        <p style="margin:4px 0 0 0;font-family:monospace;font-size:14px;">${escapeHtml(transactionId)}</p>
      </div>

      <p>Gracias por tu compra. Si tienes alguna duda, contáctanos desde la app.</p>
    </div>
    <div class="footer">
      <p>Todo Marketplace &copy; ${new Date().getFullYear()}</p>
      <p>Este es un correo automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Template de bienvenida simple con CTA para explorar el marketplace.
 */
export function welcomeTemplate(userName: string): string {
  return /*html*/ `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>${BASE_STYLE}</style></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;">
  <div class="container">
    <div class="header">
      <h1>🎉 Bienvenido a Todo</h1>
    </div>
    <div class="body">
      <p>¡Hola <strong>${escapeHtml(userName)}</strong>!</p>
      <p>Gracias por unirte a Todo Marketplace. Estamos emocionados de tenerte con nosotros.</p>
      <p>Con Todo puedes:</p>
      <ul style="padding-left:20px;line-height:1.8;">
        <li>🛍️ Comprar y vender productos</li>
        <li>💬 Chatear con vendedores en tiempo real</li>
        <li>🔔 Recibir notificaciones de tus pedidos</li>
        <li>🎯 Descubrir ofertas y grupos de compra</li>
      </ul>
      <p style="text-align:center;">
        <a class="btn" href="${process.env.APP_URL || 'https://todo-marketplace.web.app'}">Explorar productos</a>
      </p>
    </div>
    <div class="footer">
      <p>Todo Marketplace &copy; ${new Date().getFullYear()}</p>
      <p>Este es un correo automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>`;
}

/** Escapa HTML básico para prevenir inyección en las plantillas. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
