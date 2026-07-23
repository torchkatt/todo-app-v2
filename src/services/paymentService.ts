/**
 * Wompi payment integration.
 * Docs: https://docs.wompi.co/
 *
 * Los montos y la firma de integridad SIEMPRE vienen del backend (createTransaction
 * callable) — este servicio nunca calcula dinero, solo abre el Widget con los valores
 * ya firmados.
 */

const WOMPI_WIDGET_URL = 'https://checkout.wompi.co';
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY;

export interface WompiTransaction {
  id: string;
  amountInCents: number;
  reference: string;
  currency: 'COP';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
}

export interface OpenWompiCheckoutParams {
  amountInCents: number;
  reference: string;
  currency: string;
  integrity: string;
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  onSuccess: (tx: WompiTransaction) => void;
  onError: (err: any) => void;
}

export function openWompiCheckout(params: OpenWompiCheckoutParams) {
  const wompi = (window as any).Wompi;
  if (!wompi) {
    const script = document.createElement('script');
    script.src = `${WOMPI_WIDGET_URL}/widget.js`;
    script.onload = () => openWidget(params);
    script.onerror = () => params.onError('No se pudo cargar Wompi');
    document.body.appendChild(script);
  } else {
    openWidget(params);
  }
}

function openWidget(params: OpenWompiCheckoutParams) {
  const wompi = (window as any).Wompi;
  wompi?.checkout({
    currency: params.currency,
    amountInCents: params.amountInCents,
    reference: params.reference,
    publicKey: WOMPI_PUBLIC_KEY,
    signature: { integrity: params.integrity },
    redirectUrl: `${window.location.origin}/orders/${params.reference}`,
    customerData: {
      email: params.customerEmail,
      full_name: params.customerFullName,
      phone_number: params.customerPhone,
    },
    onSuccess: (tx: WompiTransaction) => params.onSuccess(tx),
    onError: (err: any) => params.onError(err),
    onExpired: () => params.onError('El pago expiró'),
  });
}
