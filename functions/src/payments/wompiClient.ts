import axios from 'axios';
import { wompiUrls } from '../config';

export interface WompiTransactionData {
  id: string;
  reference: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';
  amount_in_cents: number;
  currency: string;
  payment_method?: { type?: string };
}

/** Consulta server-to-server el estado real de una transacción en Wompi (reconciliación / fallback si el webhook no llegó). */
export async function fetchWompiTransaction(
  wompiTxId: string,
  privateKey: string
): Promise<WompiTransactionData | null> {
  try {
    const { api } = wompiUrls();
    const res = await axios.get(`${api}/transactions/${wompiTxId}`, {
      headers: { Authorization: `Bearer ${privateKey}` },
      timeout: 10_000,
    });
    return res.data?.data ?? null;
  } catch {
    return null;
  }
}
