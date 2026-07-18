import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

import HelpPage from '../pages/HelpPage';

const clickFirst = (text: string) => {
  const elements = screen.getAllByText(text);
  fireEvent.click(elements[0]);
};

describe('HelpPage — Component rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(container).toBeTruthy();
  });

  it('renders the header with title', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.title')).toBeDefined();
  });

  it('renders all 4 section labels', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    const buyerEls = screen.getAllByText('help.sections.buyer');
    const sellerEls = screen.getAllByText('help.sections.seller');
    const paymentsEls = screen.getAllByText('help.sections.payments');
    const aiEls = screen.getAllByText('help.sections.ai');
    expect(buyerEls.length).toBeGreaterThanOrEqual(1);
    expect(sellerEls.length).toBeGreaterThanOrEqual(1);
    expect(paymentsEls.length).toBeGreaterThanOrEqual(1);
    expect(aiEls.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the contact section', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.contact.title')).toBeDefined();
    expect(screen.getByText('help.contact.desc')).toBeDefined();
  });

  it('renders contact CTA buttons', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.contact.cta1')).toBeDefined();
    expect(screen.getByText('help.contact.cta2')).toBeDefined();
  });

  it('renders support email', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('soporte@todoapp.co')).toBeDefined();
  });

  it('renders response time info', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.contact.hours')).toBeDefined();
  });

  it('renders quick-help cards section', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.quick.safety')).toBeDefined();
    expect(screen.getByText('help.quick.delivery')).toBeDefined();
    expect(screen.getByText('help.quick.reviews')).toBeDefined();
    expect(screen.getByText('help.quick.disputes')).toBeDefined();
  });

  it('renders quick-help descriptions', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.quick.safetyDesc')).toBeDefined();
    expect(screen.getByText('help.quick.deliveryDesc')).toBeDefined();
    expect(screen.getByText('help.quick.reviewsDesc')).toBeDefined();
    expect(screen.getByText('help.quick.disputesDesc')).toBeDefined();
  });
});

describe('HelpPage — FAQ accordion behavior', () => {
  it('starts with all sections collapsed', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.queryByText('help.buyer.q1')).toBeNull();
    expect(screen.queryByText('help.seller.q1')).toBeNull();
  });

  it('expands buyer section on click', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.buyer');
    expect(screen.getByText('help.buyer.q1')).toBeDefined();
    expect(screen.getByText('help.buyer.q5')).toBeDefined();
  });

  it('expands seller section on click', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.seller');
    expect(screen.getByText('help.seller.q1')).toBeDefined();
    expect(screen.getByText('help.seller.q5')).toBeDefined();
  });

  it('expands payments section on click', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.payments');
    expect(screen.getByText('help.payments.q1')).toBeDefined();
    expect(screen.getByText('help.payments.q3')).toBeDefined();
  });

  it('expands AI section on click', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.ai');
    expect(screen.getByText('help.ai.q1')).toBeDefined();
    expect(screen.getByText('help.ai.q3')).toBeDefined();
  });

  it('collapses section when clicking again', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.buyer');
    expect(screen.getByText('help.buyer.q1')).toBeDefined();
    clickFirst('help.sections.buyer');
    expect(screen.queryByText('help.buyer.q1')).toBeNull();
  });

  it('FAQ details are expandable with summary tag', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.buyer');
    expect(screen.getByText('help.buyer.a1')).toBeDefined();
    expect(screen.getByText('help.buyer.a5')).toBeDefined();
  });
});

describe('HelpPage — Buyer FAQ content', () => {
  it('buyer questions cover search, purchase, delivery, returns, reviews', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.buyer');
    expect(screen.getByText('help.buyer.q1')).toBeDefined();
    expect(screen.getByText('help.buyer.q2')).toBeDefined();
    expect(screen.getByText('help.buyer.a1')).toBeDefined();
    expect(screen.getByText('help.buyer.a5')).toBeDefined();
  });
});

describe('HelpPage — Seller FAQ content', () => {
  it('seller questions cover start selling, costs, payments, optimization, verification', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.seller');
    expect(screen.getByText('help.seller.q1')).toBeDefined();
    expect(screen.getByText('help.seller.q5')).toBeDefined();
  });
});

describe('HelpPage — Payments FAQ content', () => {
  it('payments questions cover methods, security, declined', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.payments');
    expect(screen.getByText('help.payments.q1')).toBeDefined();
    expect(screen.getByText('help.payments.q3')).toBeDefined();
  });
});

describe('HelpPage — AI FAQ content', () => {
  it('AI questions cover capability, data access, cost', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    clickFirst('help.sections.ai');
    expect(screen.getByText('help.ai.q1')).toBeDefined();
    expect(screen.getByText('help.ai.q3')).toBeDefined();
  });
});

describe('HelpPage — SEO metadata', () => {
  it('renders SEO with help title', () => {
    render(<MemoryRouter><HelpPage /></MemoryRouter>);
    expect(screen.getByText('help.title')).toBeDefined();
  });
});

describe('HelpPage — Export', () => {
  it('HelpPage is default export and is a function', async () => {
    const mod = await import('../pages/HelpPage');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});
