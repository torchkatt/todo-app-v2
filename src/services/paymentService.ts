/**
 * Wompi payment integration (test mode)
 * Docs: https://docs.wompi.co/
 */

const WOMPI_URL = import.meta.env.PROD 
  ? 'https://checkout.wompi.co/v2'
  : 'https://checkout.wompi.co/v2'; // Same URL for test/prod, switches by public key
const WOMPI_PUBLIC_KEY = import.meta.env.VITE_WOMPI_PUBLIC_KEY || 'pub_test_X5g4F7kD3mN2qR8wY1bV6cJ9';

export interface WompiTransaction {
  id: string;
  amountInCents: number;
  reference: string;
  currency: 'COP';
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  customerEmail?: string;
  customerData?: { full_name: string; phone_number: string };
  shippingAddress?: { address_line_1: string; city: string; phone_number: string };
}

export function openWompiCheckout(params: {
  amount: number;        // COP
  reference: string;     // Unique order ref
  customerEmail: string;
  customerFullName: string;
  customerPhone: string;
  onSuccess: (tx: WompiTransaction) => void;
  onError: (err: any) => void;
}) {
  const wompi = (window as any).Wompi;
  if (!wompi) {
    // Load Wompi SDK dynamically
    const script = document.createElement('script');
    script.src = `${WOMPI_URL}/widget.js`;
    script.onload = () => openWidget(params);
    script.onerror = () => params.onError('No se pudo cargar Wompi');
    document.body.appendChild(script);
  } else {
    openWidget(params);
  }
}

function openWidget(params: {
  amount: number; reference: string; customerEmail: string;
  customerFullName: string; customerPhone: string;
  onSuccess: (tx: WompiTransaction) => void; onError: (err: any) => void;
}) {
  const wompi = (window as any).Wompi;
  wompi?.checkout({
    currency: 'COP',
    amountInCents: params.amount * 100,
    reference: params.reference,
    publicKey: WOMPI_PUBLIC_KEY,
    redirectUrl: window.location.origin + '/orders',
    customerData: {
      email: params.customerEmail,
      full_name: params.customerFullName,
      phone_number: params.customerPhone,
    },
    taxInCents: [{ type: 'IVA', amountInCents: Math.round(params.amount * 100 * 0.19) }],
    onSuccess: (tx: WompiTransaction) => params.onSuccess(tx),
    onError: (err: any) => params.onError(err),
    onExpired: () => params.onError('El pago expiró'),
  });
}

export async function verifyWompiTransaction(transactionId: string): Promise<WompiTransaction | null> {
  try {
    const res = await fetch(`https://sandbox.wompi.co/v1/transactions/${transactionId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.data;
  } catch { return null; }
}
