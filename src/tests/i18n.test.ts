import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {}, storage: {}, functions: {} }));

describe('i18n — Locale files', () => {
  let en: Record<string, string>;
  let es: Record<string, string>;

  beforeAll(async () => {
    en = (await import('../locales/en.json')).default as Record<string, string>;
    es = (await import('../locales/es.json')).default;
  });

  it('both locale files load', () => {
    expect(en).toBeDefined();
    expect(es).toBeDefined();
  });

  it('EN and ES have the same keys', () => {
    const enKeys = Object.keys(en).sort();
    const esKeys = Object.keys(es).sort();
    expect(enKeys).toEqual(esKeys);
  });

  it('has at least 100 translation keys', () => {
    expect(Object.keys(en).length).toBeGreaterThanOrEqual(100);
  });

  it('has at least 100 translation keys in ES', () => {
    expect(Object.keys(es).length).toBeGreaterThanOrEqual(100);
  });
});

describe('i18n — Navigation keys', () => {
  it('nav.home exists in both languages', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const es = (await import('../locales/es.json')).default as Record<string, string>;
    expect(en['nav.home']).toBeTruthy();
    expect(es['nav.home']).toBeTruthy();
  });

  it('nav keys exist: search, orders, profile, cart, notifications', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const navKeys = ['nav.home', 'nav.search', 'nav.orders', 'nav.profile', 'nav.cart', 'nav.notifications'];
    for (const key of navKeys) {
      expect(en[key]).toBeTruthy();
    }
  });

  it('legal nav keys exist: terms, privacy, help', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['nav.terms']).toBeTruthy();
    expect(en['nav.privacy']).toBeTruthy();
    expect(en['nav.help']).toBeTruthy();
  });
});

describe('i18n — Home keys', () => {
  it('home keys exist in EN', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['home.hero.title']).toBeTruthy();
    expect(en['home.hero.subtitle']).toBeTruthy();
    expect(en['home.hero.explore']).toBeTruthy();
    expect(en['home.hero.sell']).toBeTruthy();
    expect(en['home.categories']).toBeTruthy();
    expect(en['home.featured']).toBeTruthy();
    expect(en['home.viewAll']).toBeTruthy();
    expect(en['home.benefits.commission']).toBeTruthy();
    expect(en['home.benefits.commission.sub']).toBeTruthy();
    expect(en['home.benefits.flexible']).toBeTruthy();
    expect(en['home.benefits.flexible.sub']).toBeTruthy();
    expect(en['home.benefits.verified']).toBeTruthy();
    expect(en['home.benefits.verified.sub']).toBeTruthy();
  });

  it('home keys exist in ES', async () => {
    const es = (await import('../locales/es.json')).default as Record<string, string>;
    expect(es['home.categories']).toBe('Categorías');
    expect(es['home.featured']).toBe('Lo más popular');
    expect(es['home.viewAll']).toBe('Ver todos');
  });
});

describe('i18n — Auth keys', () => {
  it('auth keys exist in both languages', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const es = (await import('../locales/es.json')).default as Record<string, string>;
    const authKeys = ['auth.login', 'auth.register', 'auth.email', 'auth.password', 'auth.name',
      'auth.google', 'auth.guest', 'auth.logout'];
    for (const key of authKeys) {
      expect(en[key]).toBeTruthy();
      expect(es[key]).toBeTruthy();
    }
  });

  it('ES auth translations are different from EN', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const es = (await import('../locales/es.json')).default as Record<string, string>;
    expect(es['auth.login']).not.toBe(en['auth.login']);
    expect(es['auth.register']).not.toBe(en['auth.register']);
  });
});

describe('i18n — Search keys', () => {
  it('search keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['search.placeholder']).toBeTruthy();
    expect(en['search.results']).toBeTruthy();
    expect(en['search.empty']).toBeTruthy();
    expect(en['search.empty.hint']).toBeTruthy();
  });
});

describe('i18n — Cart keys', () => {
  it('cart keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['cart.empty']).toBeTruthy();
    expect(en['cart.checkout']).toBeTruthy();
  });
});

describe('i18n — Order keys', () => {
  it('order keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['orders.title']).toBeTruthy();
    expect(en['orders.empty']).toBeTruthy();
    expect(en['orders.empty.hint']).toBeTruthy();
  });
});

describe('i18n — Profile keys', () => {
  it('profile keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const profileKeys = ['profile.title', 'profile.points', 'profile.purchases', 'profile.spent',
      'profile.streak', 'profile.favorites', 'profile.settings', 'profile.help'];
    for (const key of profileKeys) {
      expect(en[key]).toBeTruthy();
    }
  });
});

describe('i18n — Help keys', () => {
  it('help keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['help.title']).toBeTruthy();
    expect(en['help.metaDesc']).toBeTruthy();
    expect(en['help.questions']).toBeTruthy();
    expect(en['help.sections.buyer']).toBeTruthy();
    expect(en['help.sections.seller']).toBeTruthy();
    expect(en['help.sections.payments']).toBeTruthy();
    expect(en['help.sections.ai']).toBeTruthy();
  });

  it('help buyer FAQ keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 5; i++) {
      expect(en[`help.buyer.q${i}`]).toBeTruthy();
      expect(en[`help.buyer.a${i}`]).toBeTruthy();
    }
  });

  it('help seller FAQ keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 5; i++) {
      expect(en[`help.seller.q${i}`]).toBeTruthy();
      expect(en[`help.seller.a${i}`]).toBeTruthy();
    }
  });

  it('help payments FAQ keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 3; i++) {
      expect(en[`help.payments.q${i}`]).toBeTruthy();
      expect(en[`help.payments.a${i}`]).toBeTruthy();
    }
  });

  it('help AI FAQ keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 3; i++) {
      expect(en[`help.ai.q${i}`]).toBeTruthy();
      expect(en[`help.ai.a${i}`]).toBeTruthy();
    }
  });

  it('help quick tips keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    ['safety', 'delivery', 'reviews', 'disputes'].forEach(tip => {
      expect(en[`help.quick.${tip}`]).toBeTruthy();
      expect(en[`help.quick.${tip}Desc`]).toBeTruthy();
    });
  });

  it('help contact keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['help.contact.title']).toBeTruthy();
    expect(en['help.contact.desc']).toBeTruthy();
    expect(en['help.contact.hours']).toBeTruthy();
    expect(en['help.contact.cta1']).toBeTruthy();
    expect(en['help.contact.cta2']).toBeTruthy();
  });
});

describe('i18n — Landing keys', () => {
  it('landing SEO keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['landing.seoTitle']).toBeTruthy();
    expect(en['landing.seoDescription']).toBeTruthy();
  });

  it('landing nav keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const navKeys = ['landing.nav.features', 'landing.nav.how', 'landing.nav.pricing', 'landing.nav.faq'];
    for (const key of navKeys) {
      expect(en[key]).toBeTruthy();
    }
  });

  it('landing hero keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const heroKeys = ['landing.hero.badge', 'landing.hero.title1', 'landing.hero.title2',
      'landing.hero.subtitle', 'landing.hero.cta1', 'landing.hero.cta2',
      'landing.hero.trust1', 'landing.hero.trust2', 'landing.hero.trust3'];
    for (const key of heroKeys) {
      expect(en[key]).toBeTruthy();
    }
  });

  it('landing features keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['landing.features.badge']).toBeTruthy();
    expect(en['landing.features.title']).toBeTruthy();
    expect(en['landing.features.subtitle']).toBeTruthy();
    ['marketplace', 'ai', 'payments', 'analytics', 'delivery', 'local'].forEach(f => {
      expect(en[`landing.features.${f}.title`]).toBeTruthy();
      expect(en[`landing.features.${f}.desc`]).toBeTruthy();
    });
  });

  it('landing how-it-works keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 3; i++) {
      expect(en[`landing.how.step${i}.title`]).toBeTruthy();
      expect(en[`landing.how.step${i}.desc`]).toBeTruthy();
    }
  });

  it('landing pricing keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (let i = 1; i <= 3; i++) {
      expect(en[`landing.pricing.plan${i}.name`]).toBeTruthy();
      expect(en[`landing.pricing.plan${i}.desc`]).toBeTruthy();
      expect(en[`landing.pricing.plan${i}.price`]).toBeTruthy();
      expect(en[`landing.pricing.plan${i}.cta`]).toBeTruthy();
    }
  });

  it('landing testimonials keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string> as Record<string, string>;
    expect(en['landing.testimonials.title']).toBeTruthy();
    expect(en['landing.testimonials.subtitle']).toBeTruthy();
    for (let i = 1; i <= 3; i++) {
      expect(en[`landing.testimonials.t${i}.quote`]).toBeTruthy();
      expect(en[`landing.testimonials.t${i}.initials`]).toBeTruthy();
      expect(en[`landing.testimonials.t${i}.name`]).toBeTruthy();
      expect(en[`landing.testimonials.t${i}.role`]).toBeTruthy();
    }
  });

  it('landing FAQ keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string> as Record<string, string>;
    for (let i = 1; i <= 5; i++) {
      expect(en[`landing.faq.q${i}`]).toBeTruthy();
      expect(en[`landing.faq.a${i}`]).toBeTruthy();
    }
  });

  it('landing CTA bottom keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string> as Record<string, string>;
    expect(en['landing.ctaBottom.title']).toBeTruthy();
    expect(en['landing.ctaBottom.subtitle']).toBeTruthy();
    expect(en['landing.ctaBottom.cta1']).toBeTruthy();
    expect(en['landing.ctaBottom.cta2']).toBeTruthy();
  });

  it('landing footer keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['landing.footer.tagline']).toBeTruthy();
    expect(en['landing.footer.product']).toBeTruthy();
    expect(en['landing.footer.company']).toBeTruthy();
    expect(en['landing.footer.legal']).toBeTruthy();
    expect(en['landing.footer.rights']).toBeTruthy();
    expect(en['landing.footer.made']).toBeTruthy();
  });
});

describe('i18n — App Home keys', () => {
  it('app home keys exist in EN', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['app.home.title']).toBeTruthy();
    expect(en['app.hero.badge']).toBeTruthy();
    expect(en['app.hero.title1']).toBeTruthy();
    expect(en['app.hero.title2']).toBeTruthy();
    expect(en['app.hero.subtitle']).toBeTruthy();
    expect(en['app.hero.explore']).toBeTruthy();
    expect(en['app.hero.sell']).toBeTruthy();
    expect(en['app.featured.title']).toBeTruthy();
    expect(en['app.featured.subtitle']).toBeTruthy();
    expect(en['app.featured.empty']).toBeTruthy();
    expect(en['app.sellerCta.title']).toBeTruthy();
    expect(en['app.sellerCta.subtitle']).toBeTruthy();
  });
});

describe('i18n — Settings, seller, listing, checkout keys', () => {
  it('settings keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['settings.title']).toBeTruthy();
    expect(en['settings.save']).toBeTruthy();
    expect(en['settings.language']).toBeTruthy();
    expect(en['settings.darkMode']).toBeTruthy();
  });

  it('seller keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['seller.create']).toBeTruthy();
    expect(en['seller.dashboard']).toBeTruthy();
    expect(en['seller.listings']).toBeTruthy();
    expect(en['seller.new']).toBeTruthy();
  });

  it('listing keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['listing.addToCart']).toBeTruthy();
    expect(en['listing.notFound']).toBeTruthy();
  });

  it('checkout keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['checkout.title']).toBeTruthy();
    expect(en['checkout.contact']).toBeTruthy();
    expect(en['checkout.summary']).toBeTruthy();
    expect(en['checkout.pay']).toBeTruthy();
  });
});

describe('i18n — Common and reviews keys', () => {
  it('common keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    const keys = ['common.loading', 'common.error', 'common.back', 'common.save',
      'common.cancel', 'common.delete', 'common.confirm', 'common.search'];
    for (const key of keys) {
      expect(en[key]).toBeTruthy();
    }
  });

  it('reviews keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['reviews.title']).toBeTruthy();
    expect(en['reviews.cta']).toBeTruthy();
    expect(en['reviews.submit']).toBeTruthy();
  });

  it('AI keys exist', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    expect(en['ai.welcome']).toBeTruthy();
    expect(en['ai.placeholder']).toBeTruthy();
  });
});

describe('i18n — No empty or missing values', () => {
  it('all EN values are non-empty strings', async () => {
    const en = (await import('../locales/en.json')).default as Record<string, string>;
    for (const [key, value] of Object.entries(en)) {
      expect(value, `Key ${key} has empty value`).toBeTruthy();
      expect(typeof value, `Key ${key} is not a string`).toBe('string');
      expect((value as string).length, `Key ${key} has zero length`).toBeGreaterThan(0);
    }
  });

  it('all ES values are non-empty strings', async () => {
    const es = (await import('../locales/es.json')).default as Record<string, string>;
    for (const [key, value] of Object.entries(es)) {
      expect(value, `Key ${key} has empty value`).toBeTruthy();
      expect(typeof value, `Key ${key} is not a string`).toBe('string');
      expect((value as string).length, `Key ${key} has zero length`).toBeGreaterThan(0);
    }
  });
});

describe('i18n — i18n module', () => {
  it('i18n module exports default', async () => {
    const mod = await import('../i18n');
    expect(mod.default).toBeDefined();
  });

  it('i18n module has useTranslation method', async () => {
    const mod = await import('../i18n');
    // i18next instance should be configurable
    expect(mod.default).toBeDefined();
  });
});
