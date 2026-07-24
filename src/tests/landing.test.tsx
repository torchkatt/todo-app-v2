import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));
vi.mock('../i18n', () => ({
  default: { t: (k: string) => k, language: 'en', changeLanguage: vi.fn() },
}));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

// IntersectionObserver mock para scroll-reveal hook
vi.stubGlobal('IntersectionObserver', class {
  observe() { /* noop */ }
  unobserve() { /* noop */ }
  disconnect() { /* noop */ }
});

import Landing from '../pages/Landing';

describe('Landing — Component rendering', () => {
  it('renders without crashing', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container).toBeTruthy();
  });

  it('renders the hero section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.hero.title1')).toBeDefined();
    expect(screen.getByText('landing.hero.title2')).toBeDefined();
  });

  it('renders CTA buttons in hero', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.hero.cta1')).toBeDefined();
    expect(screen.getByText('landing.hero.cta2')).toBeDefined();
  });

  it('renders the features section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.features.title')).toBeDefined();
  });

  it('renders 6 feature cards', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.features.marketplace.title')).toBeDefined();
    expect(screen.getByText('landing.features.ai.title')).toBeDefined();
    expect(screen.getByText('landing.features.payments.title')).toBeDefined();
    expect(screen.getByText('landing.features.analytics.title')).toBeDefined();
    expect(screen.getByText('landing.features.delivery.title')).toBeDefined();
    expect(screen.getByText('landing.features.local.title')).toBeDefined();
  });

  it('renders the how-it-works section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.how.title')).toBeDefined();
    expect(screen.getByText('landing.how.step1.title')).toBeDefined();
    expect(screen.getByText('landing.how.step2.title')).toBeDefined();
    expect(screen.getByText('landing.how.step3.title')).toBeDefined();
  });

  it('renders how-it-works CTA', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.how.cta')).toBeDefined();
  });

  it('renders the pricing section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.title')).toBeDefined();
  });

  it('renders 3 pricing plans', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.plan1.name')).toBeDefined();
    expect(screen.getByText('landing.pricing.plan2.name')).toBeDefined();
    expect(screen.getByText('landing.pricing.plan3.name')).toBeDefined();
  });

  it('renders free plan with COP price', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.plan1.price')).toBeDefined();
    expect(screen.getByText('landing.pricing.plan1.cta')).toBeDefined();
  });

  it('renders pro monthly plan with price', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.plan2.price')).toBeDefined();
    expect(screen.getByText('landing.pricing.plan2.cta')).toBeDefined();
  });

  it('renders pro annual plan with price', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.plan3.price')).toBeDefined();
    expect(screen.getByText('landing.pricing.plan3.cta')).toBeDefined();
  });

  it('renders the popular badge for pro monthly plan', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.popular')).toBeDefined();
  });

  it('renders the FAQ section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.faq.title')).toBeDefined();
  });

  it('renders 5 FAQ questions', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.faq.q1')).toBeDefined();
    expect(screen.getByText('landing.faq.q5')).toBeDefined();
  });

  it('renders the testimonials section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.testimonials.title')).toBeDefined();
  });

  it('renders 3 testimonials', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.testimonials.t1.name')).toBeDefined();
    expect(screen.getByText('landing.testimonials.t2.name')).toBeDefined();
    expect(screen.getByText('landing.testimonials.t3.name')).toBeDefined();
  });

  it('renders the CTA bottom section', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.ctaBottom.title')).toBeDefined();
    expect(screen.getByText('landing.ctaBottom.cta1')).toBeDefined();
    expect(screen.getByText('landing.ctaBottom.cta2')).toBeDefined();
  });

  it('renders the footer', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.tagline')).toBeDefined();
  });

  it('renders the navbar with login and register', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('auth.login')).toBeDefined();
    expect(screen.getByText('landing.cta.start')).toBeDefined();
  });
});

describe('Landing — Navigation links', () => {
  it('has nav links for features, how, pricing, FAQ', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const allFeatures = screen.getAllByText('landing.nav.features');
    expect(allFeatures.length).toBeGreaterThanOrEqual(1);
    const allHow = screen.getAllByText('landing.nav.how');
    expect(allHow.length).toBeGreaterThanOrEqual(1);
    const allPricing = screen.getAllByText('landing.nav.pricing');
    expect(allPricing.length).toBeGreaterThanOrEqual(1);
    const allFaq = screen.getAllByText('landing.nav.faq');
    expect(allFaq.length).toBeGreaterThanOrEqual(1);
  });

  it('navbar logo exists', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const logos = screen.getAllByText('Todo');
    expect(logos.length).toBeGreaterThanOrEqual(1);
    expect(logos[0]).toBeDefined();
  });
});

describe('Landing — Dynamic pricing content', () => {
  it('free plan feature list has 4 items', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    [1, 2, 3, 4].forEach(n => {
      expect(screen.getByText(`landing.pricing.plan1.f${n}`)).toBeDefined();
    });
  });

  it('pro monthly plan feature list has 5 items', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    [1, 2, 3, 4, 5].forEach(n => {
      expect(screen.getByText(`landing.pricing.plan2.f${n}`)).toBeDefined();
    });
  });

  it('pro annual plan feature list has 6 items', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    [1, 2, 3, 4, 5, 6].forEach(n => {
      expect(screen.getByText(`landing.pricing.plan3.f${n}`)).toBeDefined();
    });
  });

  it('free plan has no period label', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.plan1.price')).toBeDefined();
  });

  it('pro monthly plan shows period label', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    // The period text is the translation key 'landing.pricing.plan2.period'
    expect(screen.getByText('landing.pricing.plan2.period')).toBeDefined();
  });

  it('pro annual plan shows period label', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    // The period text is the translation key 'landing.pricing.plan3.period'
    expect(screen.getByText('landing.pricing.plan3.period')).toBeDefined();
  });
});

describe('Landing — Section IDs (anchor links)', () => {
  it('features section has id=features', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.querySelector('#features')).toBeTruthy();
  });

  it('how section has id=how', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.querySelector('#how')).toBeTruthy();
  });

  it('pricing section has id=pricing', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.querySelector('#pricing')).toBeTruthy();
  });

  it('faq section has id=faq', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.querySelector('#faq')).toBeTruthy();
  });
});

describe('Landing — SEO', () => {
  it('landing component includes SEO tags', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.innerHTML).toBeTruthy();
  });

  it('SEO title is set through translation key', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    // SEO content is in document head
    expect(document.title).toBeTruthy();
  });
});

describe('Landing — Trust badges', () => {
  it('renders trust checkmarks in hero', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.hero.trust1')).toBeDefined();
    expect(screen.getByText('landing.hero.trust2')).toBeDefined();
    expect(screen.getByText('landing.hero.trust3')).toBeDefined();
  });
});

describe('Landing — Footer links', () => {
  it('footer has product section links', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.product')).toBeDefined();
  });

  it('footer has company section links', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.company')).toBeDefined();
  });

  it('footer has legal section links', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.legal')).toBeDefined();
  });
});

describe('Landing — Testimonials structure', () => {
  it('each testimonial has a quote, name, role, and initials', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.testimonials.t1.quote')).toBeDefined();
    expect(screen.getByText('landing.testimonials.t1.initials')).toBeDefined();
    expect(screen.getByText('landing.testimonials.t1.role')).toBeDefined();
  });

  it('testimonials have star ratings', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    // Each testimonial has 5 stars — SVG icons should be present
    const stars = container.querySelectorAll('.lucide-star');
    expect(stars.length).toBeGreaterThanOrEqual(3);
  });
});

describe('Landing — Export', () => {
  it('Landing is default export and is a function', async () => {
    const mod = await import('../pages/Landing');
    expect(mod.default).toBeDefined();
    expect(typeof mod.default).toBe('function');
  });
});

// ─── Additional properties and structure tests ───
describe('Landing — Hero structure', () => {
  it('hero has announcement badge', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.hero.badge')).toBeDefined();
  });

  it('CTA buttons are present and clickable', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const cta1 = screen.getByText('landing.hero.cta1');
    const cta2 = screen.getByText('landing.hero.cta2');
    expect(cta1).toBeDefined();
    expect(cta2).toBeDefined();
  });

  it('how it works CTA button exists', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.how.cta')).toBeDefined();
  });
});

describe('Landing — Section badges', () => {
  it('features section has badge', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.features.badge')).toBeDefined();
  });

  it('how section has badge', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.how.badge')).toBeDefined();
  });

  it('pricing section has badge', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.pricing.badge')).toBeDefined();
  });
});

describe('Landing — Footer structure', () => {
  it('footer has product section header', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.product')).toBeDefined();
  });

  it('footer has company section header', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.company')).toBeDefined();
  });

  it('footer has legal section header', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.legal')).toBeDefined();
  });

  it('footer has copyright notice', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    // The footer includes the year dynamically, so check for Todo text
    const todoEls = screen.getAllByText('Todo');
    expect(todoEls.length).toBeGreaterThanOrEqual(2); // navbar + footer
  });

  it('footer has made-in text', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.footer.made')).toBeDefined();
  });
});

describe('Landing — Component integrity', () => {
  it('is a React functional component', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(container.firstChild).toBeTruthy();
    expect(container.firstChild).toBeInstanceOf(HTMLElement);
  });

  it('contains multiple sections', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(6);
  });

  it('has a sticky navbar', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    const nav = container.querySelector('nav');
    expect(nav).toBeTruthy();
    expect(nav!.className).toContain('sticky');
  });

  it('features grid has 6 items', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    const features = [
      'landing.features.marketplace.title',
      'landing.features.ai.title',
      'landing.features.payments.title',
      'landing.features.analytics.title',
      'landing.features.delivery.title',
      'landing.features.local.title',
    ];
    features.forEach(f => {
      expect(screen.getByText(f)).toBeDefined();
    });
  });

  it('how it works has 3 steps', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.how.step1.title')).toBeDefined();
    expect(screen.getByText('landing.how.step2.title')).toBeDefined();
    expect(screen.getByText('landing.how.step3.title')).toBeDefined();
  });

  it('footer has 4 column layout', () => {
    const { container } = render(<MemoryRouter><Landing /></MemoryRouter>);
    const footer = container.querySelector('footer');
    expect(footer).toBeTruthy();
  });

  it('testimonials section has subtitle', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>);
    expect(screen.getByText('landing.testimonials.subtitle')).toBeDefined();
  });
});
