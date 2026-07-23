/**
 * @file tests/auto-reload-settings.test.tsx
 * @description Tests for AutoReloadSettings component — toggle, presets, save, monthly count.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// ─── Hoisted mocks ──────────────────────────────────────────────────────────
const { mockGetAutoReloadConfig, mockSetAutoReloadConfig } = vi.hoisted(() => ({
  mockGetAutoReloadConfig: vi.fn(),
  mockSetAutoReloadConfig: vi.fn(),
}));

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, params?: Record<string, any>) => {
      const map: Record<string, string> = {
        'giftCard.autoReload': 'Auto-recarga',
        'giftCard.autoReloadDesc': 'Recarga automática cuando tu saldo baje del umbral',
        'giftCard.autoReloadThreshold': 'Recargar cuando baje de',
        'giftCard.autoReloadAmount': 'Monto a recargar',
        'giftCard.autoReloadMonthly': params ? `Este mes: ${params.count} de ${params.max} recargas` : 'Este mes: 0 de 5 recargas',
        'giftCard.autoReloadLast': params ? `Última recarga: ${params.date}` : '',
        'giftCard.autoReloadSave': 'Guardar configuración',
        'giftCard.autoReloadSaved': 'Configuración guardada',
        'giftCard.autoReloadError': 'Error al guardar',
        'giftCard.title': 'Mis Gift Cards',
        'giftCard.noCards': 'No tienes gift cards',
        'giftCard.createFirst': 'Crear primera gift card',
        'giftCard.new': 'Nueva',
        'giftCard.statusActive': 'Activa',
        'giftCard.statusDepleted': 'Agotada',
        'giftCard.statusExpired': 'Expirada',
        'giftCard.statusCancelled': 'Cancelada',
        'giftCard.createTitle': 'Crear gift card',
        'giftCard.design': 'Diseño',
        'giftCard.designDefault': 'Default',
        'giftCard.designBirthday': 'Cumpleaños',
        'giftCard.designCelebration': 'Celebración',
        'giftCard.designThanks': 'Gracias',
        'giftCard.designHoliday': 'Navidad',
        'giftCard.name': 'Nombre de la gift card',
        'giftCard.namePlaceholder': 'Ej: Para mamá',
        'giftCard.message': 'Mensaje personalizado (opcional)',
        'giftCard.messagePlaceholder': 'Escribe un mensaje...',
        'giftCard.amount': 'Monto',
        'giftCard.amountCustom': 'Otro monto',
        'giftCard.preview': 'Vista previa',
        'giftCard.create': 'Crear gift card',
        'giftCard.creating': 'Creando...',
        'giftCard.insufficientBalance': 'Saldo insuficiente',
        'giftCard.transfer': 'Transferir saldo',
        'giftCard.deactivate': 'Desactivar gift card',
        'giftCard.transactions': 'Transacciones',
      };
      return map[k] || k;
    },
    i18n: { language: 'en' },
  }),
}));

const mockUser = { id: 'user_1', email: 'test@test.com', fullName: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    loading: false,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('../services/walletService', () => ({
  walletService: {
    getAutoReloadConfig: mockGetAutoReloadConfig,
    setAutoReloadConfig: mockSetAutoReloadConfig,
  },
}));

import AutoReloadSettings from '../components/wallet/AutoReloadSettings';
import type { AutoReloadConfig } from '../types';

// ─── Helpers ────────────────────────────────────────────────────────────────

const defaultConfig: AutoReloadConfig = {
  enabled: false,
  threshold: 50000,
  amount: 100000,
  maxMonthly: 5,
  monthlyCount: 0,
  updatedAt: new Date().toISOString(),
};

function renderComponent() {
  return render(<AutoReloadSettings />);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('AutoReloadSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAutoReloadConfig.mockResolvedValue(defaultConfig);
    mockSetAutoReloadConfig.mockImplementation(async (_uid: string, config: Partial<AutoReloadConfig>) => ({
      ...defaultConfig,
      ...config,
      updatedAt: new Date().toISOString(),
    }));
  });

  // ── 1. Renders toggle switch ──
  it('renders title and toggle switch', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recarga automática')).toBeDefined();
    });

    const toggle = screen.getByRole('switch');
    expect(toggle).toBeDefined();
    expect(toggle.getAttribute('aria-checked')).toBe('false');
  });

  // ── 2. Toggle shows/hides config options ──
  it('shows config options when toggle is enabled', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recarga automática')).toBeDefined();
    });

    // Config options should NOT be visible initially (disabled toggle)
    expect(screen.queryByText('Guardar configuración')).toBeNull();

    // Enable toggle
    fireEvent.click(screen.getByRole('switch'));

    // Config options should now be visible
    await waitFor(() => {
      expect(screen.getByText('Guardar configuración')).toBeDefined();
    });

    // Labels should appear
    expect(screen.getByText('Recargar cuando baje de')).toBeDefined();
    expect(screen.getByText('Monto a recargar')).toBeDefined();
  });

  // ── 3. Preset buttons work ──
  it('threshold preset buttons update selection', async () => {
    // Start with config enabled
    mockGetAutoReloadConfig.mockResolvedValue({
      ...defaultConfig,
      enabled: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Recargar cuando baje de')).toBeDefined();
    });

    // Click a different threshold preset: $25.000
    // Note: $25.000 only appears in threshold presets (not amount presets), so getByText is safe
    fireEvent.click(screen.getByText('$25.000'));

    // Save and check the updated config
    fireEvent.click(screen.getByText('Guardar configuración'));

    await waitFor(() => {
      expect(mockSetAutoReloadConfig).toHaveBeenCalledWith('user_1', {
        enabled: true,
        threshold: 25000,
        amount: 100000,
      });
    });
  });

  // ── 4. "Guardar" button calls walletService.setAutoReloadConfig ──
  it('"Guardar" button saves config via walletService', async () => {
    mockGetAutoReloadConfig.mockResolvedValue({
      ...defaultConfig,
      enabled: true,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Guardar configuración')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Guardar configuración'));

    await waitFor(() => {
      expect(mockSetAutoReloadConfig).toHaveBeenCalledTimes(1);
    });

    // Should show success message
    await waitFor(() => {
      expect(screen.getByText('Configuración guardada exitosamente')).toBeDefined();
    });
  });

  // ── 5. Displays monthly count ──
  it('displays monthly reload count', async () => {
    mockGetAutoReloadConfig.mockResolvedValue({
      ...defaultConfig,
      enabled: true,
      monthlyCount: 3,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/3/)).toBeDefined();
    });

    // The monthly count line should show "3 / 5 recargas"
    expect(screen.getByText(/recargas/)).toBeDefined();
  });

  // ── 6. Loading state ──
  it('shows loading spinner initially', () => {
    // Don't resolve config yet
    mockGetAutoReloadConfig.mockReturnValue(new Promise(() => {}));
    renderComponent();
    // Should show a spinner
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });
});
