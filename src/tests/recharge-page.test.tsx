import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'es' } }),
}));

// Mock window.alert
const mockAlert = vi.fn();
window.alert = mockAlert;

import RechargePage from '../pages/RechargePage';

describe('RechargePage — Type selector', () => {
  it('shows category selector with Celular, Servicios, Juegos', () => {
    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Celular')).toBeDefined();
    expect(screen.getByText('Servicios')).toBeDefined();
    expect(screen.getByText('Juegos')).toBeDefined();
    expect(screen.getByText('¿Qué quieres recargar?')).toBeDefined();
  });
});

describe('RechargePage — Operator selector', () => {
  it('shows operator selector with cellular operators by default', () => {
    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Operador')).toBeDefined();
    expect(screen.getByText('Claro')).toBeDefined();
    expect(screen.getByText('Movistar')).toBeDefined();
    expect(screen.getByText('Tigo')).toBeDefined();
    expect(screen.getByText('WOM')).toBeDefined();
  });

  it('switches operators when category changes to Servicios', () => {
    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('Servicios'));

    expect(screen.getByText('ENEL')).toBeDefined();
    expect(screen.getByText('EPM')).toBeDefined();
    expect(screen.queryByText('Claro')).toBeNull();
  });
});

describe('RechargePage — Amount presets', () => {
  it('shows amount presets and selects one on click', () => {
    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Monto')).toBeDefined();
    expect(screen.getByText('$5.000')).toBeDefined();
    expect(screen.getByText('$10.000')).toBeDefined();
    expect(screen.getByText('$20.000')).toBeDefined();
    expect(screen.getByText('$50.000')).toBeDefined();

    // Click on $10.000 amount
    fireEvent.click(screen.getByText('$10.000'));

    // Button should be active (purple background)
    const activeBtn = screen.getByText('$10.000');
    expect(activeBtn.className).toContain('bg-purple-600');
  });
});

describe('RechargePage — Pay button', () => {
  it('pay button is disabled when fields are empty', () => {
    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    const payBtn = screen.getByText('💳 Pagar');
    expect(payBtn).toBeDefined();
    expect((payBtn as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows confirmation alert when all fields are filled', () => {
    mockAlert.mockClear();

    render(
      <MemoryRouter>
        <RechargePage />
      </MemoryRouter>
    );

    // Select Claro operator
    fireEvent.click(screen.getByText('Claro'));

    // Type phone number
    const input = screen.getByPlaceholderText('Ej: 3001234567');
    fireEvent.change(input, { target: { value: '3001234567' } });

    // Select amount
    fireEvent.click(screen.getByText('$10.000'));

    // Now pay button should be enabled
    const payBtn = screen.getByText('💳 Pagar $10.000');
    expect((payBtn as HTMLButtonElement).disabled).toBe(false);

    // Click pay
    fireEvent.click(payBtn);

    expect(mockAlert).toHaveBeenCalledTimes(1);
    const alertMsg = mockAlert.mock.calls[0][0];
    expect(alertMsg).toContain('Recarga procesada exitosamente');
    expect(alertMsg).toContain('Claro');
    expect(alertMsg).toContain('3001234567');
    expect(alertMsg).toContain('$10.000');
  });
});
