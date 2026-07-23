import { httpsCallable } from 'firebase/functions';
import { collection, doc, addDoc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db, functions } from './firebase';
import { chatWithAI } from './aiChatService';
import { logger } from '../utils/logger';

export type ChatType = 'ai' | 'seller' | 'courier';

export interface ChatDoc {
  id: string;
  type: ChatType;
  participants: string[];
  buyerId: string;
  buyerName?: string;
  sellerId?: string;
  sellerOwnerId?: string;
  sellerName?: string;
  courierId?: string;
  courierName?: string;
  transactionId?: string;
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastMessageSenderId: string | null;
  createdAt: Timestamp;
}

export interface ChatMessageDoc {
  id: string;
  senderId: string; // uid real, o el literal 'ai'
  text: string;
  createdAt: Timestamp | null;
}

type GetOrCreateChatRequest =
  | { type: 'ai' }
  | { type: 'seller'; sellerId: string }
  | { type: 'courier'; transactionId: string };

const getOrCreateChatCallable = httpsCallable<GetOrCreateChatRequest, { chatId: string }>(functions, 'getOrCreateChat');

export async function getOrCreateAIChat(): Promise<string> {
  const { data } = await getOrCreateChatCallable({ type: 'ai' });
  return data.chatId;
}

export async function getOrCreateSellerChat(sellerId: string): Promise<string> {
  const { data } = await getOrCreateChatCallable({ type: 'seller', sellerId });
  return data.chatId;
}

export async function getOrCreateCourierChat(transactionId: string): Promise<string> {
  const { data } = await getOrCreateChatCallable({ type: 'courier', transactionId });
  return data.chatId;
}

export async function sendMessage(chatId: string, senderId: string, text: string): Promise<void> {
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });
}

/**
 * Orquesta el envío en el hilo con el asistente IA: persiste el mensaje del
 * usuario ANTES de llamar al callable (no se pierde si la respuesta falla a
 * mitad de camino), luego persiste la respuesta con senderId:'ai'. chatWithAI
 * ya atrapa sus propios errores de red y devuelve un texto de fallback — ese
 * texto se persiste igual que una respuesta normal (mismo comportamiento que
 * el chat efímero actual). Solo si la propia escritura a Firestore falla,
 * el error queda solo local (no se reintenta persistir).
 */
export async function sendAIMessage(
  chatId: string,
  userId: string,
  history: { role: string; content: string }[],
  text: string
): Promise<string> {
  await sendMessage(chatId, userId, text);
  try {
    const reply = await chatWithAI([...history, { role: 'user', content: text }] as any, userId);
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: 'ai',
      text: reply,
      createdAt: serverTimestamp(),
    });
    return reply;
  } catch (e) {
    logger.error('sendAIMessage error', e);
    return '⚠️ Ocurrió un error. Intenta nuevamente.';
  }
}

export async function markChatRead(chatId: string, uid: string): Promise<void> {
  try {
    await setDoc(doc(db, 'chats', chatId, 'reads', uid), { lastReadAt: serverTimestamp() });
  } catch (e) {
    logger.error('markChatRead error', e);
  }
}

export async function getChatReadAt(chatId: string, uid: string): Promise<Timestamp | null> {
  try {
    const snap = await getDoc(doc(db, 'chats', chatId, 'reads', uid));
    return (snap.data()?.lastReadAt as Timestamp | undefined) ?? null;
  } catch {
    return null;
  }
}
