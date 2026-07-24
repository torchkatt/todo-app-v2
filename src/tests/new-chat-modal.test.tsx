/**
 * @file tests/new-chat-modal.test.tsx
 * @description Tests for NewChatModal — search input, results, P2P chat initiation.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockSearch = vi.fn();
const mockGetOrCreateP2PChat = vi.fn();
const mockOpenChat = vi.fn();
const mockUseAuth = vi.fn();
const mockUseChatUI = vi.fn();

vi.mock('../services/userSearchService', () => ({
  userSearchService: {
    search: (...args: any[]) => mockSearch(...args),
    getUserById: vi.fn(),
  },
}));

vi.mock('../services/chatService', () => ({
  getOrCreateP2PChat: (...args: any[]) => mockGetOrCreateP2PChat(...args),
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../context/ChatUIContext', () => ({
  useChatUI: () => mockUseChatUI(),
  ChatUIProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

import NewChatModal from '../components/chat/NewChatModal';
import { UserRole } from '../types';
import type { User } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const mockUser: User = {
  id: 'user-me',
  email: 'me@example.com',
  fullName: 'Current User',
  roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER,
  isActive: true,
  isGuest: false,
  isVerified: true,
  impact: { points: 0, level: 'NOVICE' as any, totalSpent: 0, totalTransactions: 0, streak: { current: 0, best: 0, multiplier: 1, lastTransactionDate: '' } },
  createdAt: '',
};

const searchResults: User[] = [
  {
    id: 'user-1',
    email: 'alice@example.com',
    fullName: 'Alice Smith',
    roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER,
    isActive: true,
    isGuest: false,
    isVerified: true,
    impact: { points: 0, level: 'NOVICE' as any, totalSpent: 0, totalTransactions: 0, streak: { current: 0, best: 0, multiplier: 1, lastTransactionDate: '' } },
    createdAt: '',
  },
  {
    id: 'user-2',
    email: 'bob@example.com',
    fullName: 'Bob Jones',
    roles: [UserRole.CUSTOMER], primaryRole: UserRole.CUSTOMER,
    isActive: true,
    isGuest: false,
    isVerified: true,
    impact: { points: 0, level: 'NOVICE' as any, totalSpent: 0, totalTransactions: 0, streak: { current: 0, best: 0, multiplier: 1, lastTransactionDate: '' } },
    createdAt: '',
  },
];

const renderModal = (isOpen: boolean, onClose = vi.fn()) =>
  render(
    <MemoryRouter>
      <NewChatModal isOpen={isOpen} onClose={onClose} />
    </MemoryRouter>
  );

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('NewChatModal — Search input', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockUseChatUI.mockReturnValue({ openChat: mockOpenChat, closeChat: vi.fn() });
    mockSearch.mockResolvedValue([]);
  });

  it('renders search input when open', () => {
    renderModal(true);
    const input = screen.getByPlaceholderText('Buscar usuarios por nombre...');
    expect(input).toBeDefined();
  });

  it('does not render when isOpen=false', () => {
    const { container } = renderModal(false);
    expect(container.innerHTML).toBe('');
  });

  it('shows modal title', () => {
    renderModal(true);
    expect(screen.getByText('Nueva conversación')).toBeDefined();
  });
});

describe('NewChatModal — Search results display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockUseChatUI.mockReturnValue({ openChat: mockOpenChat, closeChat: vi.fn() });
    mockSearch.mockResolvedValue(searchResults);
    mockGetOrCreateP2PChat.mockResolvedValue('chat-p2p-123');
  });

  it('displays search results with user names', async () => {
    renderModal(true);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeDefined();
    });

    expect(screen.getByText('Bob Jones')).toBeDefined();
  });

  it('displays user emails in results', async () => {
    renderModal(true);

    await waitFor(() => {
      expect(screen.getByText('alice@example.com')).toBeDefined();
      expect(screen.getByText('bob@example.com')).toBeDefined();
    });
  });

  it('shows "No se encontraron usuarios" when results empty', async () => {
    mockSearch.mockResolvedValue([]);
    renderModal(true);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron usuarios')).toBeDefined();
    });
  });
});

describe('NewChatModal — Click user initiates P2P chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockUseChatUI.mockReturnValue({ openChat: mockOpenChat, closeChat: vi.fn() });
    mockSearch.mockResolvedValue(searchResults);
    mockGetOrCreateP2PChat.mockResolvedValue('chat-p2p-123');
  });

  it('clicking a user calls getOrCreateP2PChat and openChat', async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    await waitFor(() => {
      expect(screen.getByText('Alice Smith')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Alice Smith'));

    await waitFor(() => {
      expect(mockGetOrCreateP2PChat).toHaveBeenCalledWith('user-1');
    });

    await waitFor(() => {
      expect(mockOpenChat).toHaveBeenCalledWith('chat-p2p-123', 'p2p');
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('clicking second user calls with correct user id', async () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    await waitFor(() => {
      expect(screen.getByText('Bob Jones')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Bob Jones'));

    await waitFor(() => {
      expect(mockGetOrCreateP2PChat).toHaveBeenCalledWith('user-2');
    });
  });
});

describe('NewChatModal — Overlay/popup behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser, isAuthenticated: true });
    mockUseChatUI.mockReturnValue({ openChat: mockOpenChat, closeChat: vi.fn() });
    mockSearch.mockResolvedValue([]);
  });

  it('closes on close button click', () => {
    const onClose = vi.fn();
    renderModal(true, onClose);

    // Close button is the × button
    const buttons = screen.getAllByRole('button');
    // The close button should be the second button (first is the one next to the title)
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
