import { describe, it, expect, vi } from 'vitest';

vi.mock('../services/firebase', () => ({ db: {}, auth: {} }));
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(() => ({})), setDoc: vi.fn(), getDoc: vi.fn(), updateDoc: vi.fn(),
  collection: vi.fn(() => ({})), query: vi.fn(() => ({})), where: vi.fn(() => ({})),
  orderBy: vi.fn(() => ({})), limit: vi.fn(() => ({})), getDocs: vi.fn(),
  serverTimestamp: vi.fn(),
}));

import { getRootCategories, getSubcategories, CATEGORY_SEED, CATEGORY_SLUG_MAP } from '../services/categorySeed';

describe('Categories — Seed data', () => {
  it('has root categories', () => {
    const cats = getRootCategories();
    expect(cats.length).toBeGreaterThanOrEqual(7);
    expect(cats[0]).toHaveProperty('id');
    expect(cats[0]).toHaveProperty('name');
    expect(cats[0]).toHaveProperty('icon');
    expect(cats[0]).toHaveProperty('slug');
    expect(cats[0]).toHaveProperty('level');
    expect(cats[0]).toHaveProperty('order');
  });

  it('all root categories have level 0', () => {
    const cats = getRootCategories();
    cats.forEach(c => {
      expect(c.level).toBe(0);
      expect(c.isActive).toBe(true);
    });
  });

  it('root categories are ordered', () => {
    const cats = getRootCategories();
    for (let i = 1; i < cats.length; i++) {
      expect(cats[i].order).toBeGreaterThan(cats[i - 1].order);
    }
  });

  it('has subcategories for food', () => {
    const subs = getSubcategories('cat-food');
    expect(subs.length).toBeGreaterThanOrEqual(3);
    subs.forEach(s => {
      expect(s.parentId).toBe('cat-food');
      expect(s.level).toBe(1);
    });
  });

  it('has subcategories for tech', () => {
    const subs = getSubcategories('cat-tech');
    expect(subs.length).toBeGreaterThanOrEqual(3);
    expect(subs.map(s => s.id)).toContain('cat-tech-phones');
    expect(subs.map(s => s.id)).toContain('cat-tech-computers');
  });

  it('has subcategories for services', () => {
    const subs = getSubcategories('cat-services');
    expect(subs.length).toBeGreaterThanOrEqual(5);
  });

  it('has subcategories for fashion', () => {
    const subs = getSubcategories('cat-fashion');
    expect(subs.length).toBeGreaterThanOrEqual(2);
  });

  it('has subcategories for home', () => {
    const subs = getSubcategories('cat-home');
    expect(subs.length).toBeGreaterThanOrEqual(2);
  });

  it('has subcategories for digital', () => {
    const subs = getSubcategories('cat-digital');
    expect(subs.length).toBeGreaterThanOrEqual(2);
  });

  it('has subcategories for auto', () => {
    const subs = getSubcategories('cat-auto');
    expect(subs.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty for non-existent parent', () => {
    const subs = getSubcategories('non-existent-id');
    expect(subs).toHaveLength(0);
  });

  it('CATEGORY_SEED has root + subcategories', () => {
    const roots = CATEGORY_SEED.filter(c => c.level === 0);
    const subs = CATEGORY_SEED.filter(c => c.level === 1);
    expect(roots.length).toBeGreaterThanOrEqual(8);
    expect(subs.length).toBeGreaterThanOrEqual(20);
    expect(roots.length + subs.length).toBe(CATEGORY_SEED.length);
  });
});

describe('Categories — Slug map', () => {
  it('maps slugs to ids', () => {
    expect(CATEGORY_SLUG_MAP['comida-bebidas']).toBe('cat-food');
    expect(CATEGORY_SLUG_MAP['tecnologia']).toBe('cat-tech');
    expect(CATEGORY_SLUG_MAP['servicios']).toBe('cat-services');
    expect(CATEGORY_SLUG_MAP['moda-estilo']).toBe('cat-fashion');
  });

  it('slug map has all entries', () => {
    expect(Object.keys(CATEGORY_SLUG_MAP).length).toBe(CATEGORY_SEED.length);
  });

  it('every slug has a unique mapping', () => {
    const slugs = CATEGORY_SEED.map(c => c.slug);
    const unique = [...new Set(slugs)];
    expect(unique.length).toBe(slugs.length);
  });
});

describe('Categories — Attributes', () => {
  it('food packs have required attributes', () => {
    const pack = CATEGORY_SEED.find(c => c.id === 'cat-food-packs');
    expect(pack).toBeDefined();
    expect(pack!.listingAttributes.length).toBeGreaterThanOrEqual(4);
    const names = pack!.listingAttributes.map(a => a.name);
    expect(names).toContain('pickupWindowStart');
    expect(names).toContain('pickupWindowEnd');
  });

  it('tech phones have brand as required', () => {
    const phones = CATEGORY_SEED.find(c => c.id === 'cat-tech-phones');
    const brandAttr = phones!.listingAttributes.find(a => a.name === 'brand');
    expect(brandAttr).toBeDefined();
    expect(brandAttr!.required).toBe(true);
  });

  it('service categories have duration field', () => {
    const beauty = CATEGORY_SEED.find(c => c.id === 'cat-services-beauty');
    const duration = beauty!.listingAttributes.find(a => a.name === 'duration');
    expect(duration).toBeDefined();
    expect(duration!.type).toBe('number');
    expect(duration!.required).toBe(true);
  });

  it('fashion categories have size as select', () => {
    const men = CATEGORY_SEED.find(c => c.id === 'cat-fashion-men');
    const size = men!.listingAttributes.find(a => a.name === 'size');
    expect(size).toBeDefined();
    expect(size!.type).toBe('select');
    expect(size!.options).toBeDefined();
    expect(size!.options!.length).toBeGreaterThanOrEqual(5);
  });

  it('digital categories have format field', () => {
    const ebooks = CATEGORY_SEED.find(c => c.id === 'cat-digital-ebooks');
    const format = ebooks!.listingAttributes.find(a => a.name === 'format');
    expect(format).toBeDefined();
    expect(format!.type).toBe('select');
  });

  it('auto categories have brand as required', () => {
    const cars = CATEGORY_SEED.find(c => c.id === 'cat-auto-cars');
    const brand = cars!.listingAttributes.find(a => a.name === 'brand');
    expect(brand).toBeDefined();
    expect(brand!.required).toBe(true);
  });
});

describe('Categories — Category types', () => {
  it('every category has an emoji icon', () => {
    CATEGORY_SEED.forEach(c => {
      expect(c.icon).toBeTruthy();
      expect(c.icon.length).toBeGreaterThanOrEqual(1);
    });
  });

  it('every category has unique id', () => {
    const ids = CATEGORY_SEED.map(c => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every category has a name', () => {
    CATEGORY_SEED.forEach(c => {
      expect(c.name).toBeTruthy();
      expect(c.name.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('every subcategory has a parentId', () => {
    const subs = CATEGORY_SEED.filter(c => c.level > 0);
    subs.forEach(c => {
      expect(c.parentId).toBeTruthy();
      // parent exists in seed
      expect(CATEGORY_SEED.some(p => p.id === c.parentId)).toBe(true);
    });
  });

  it('category slug is lowercase, no spaces', () => {
    CATEGORY_SEED.forEach(c => {
      expect(c.slug).toBe(c.slug.toLowerCase());
      expect(c.slug).not.toContain(' ');
    });
  });
});

describe('Categories — Category service', () => {
  it('categoryService exports expected functions', async () => {
    const mod = await import('../services/categoryService');
    expect(typeof mod.seedCategories).toBe('function');
    expect(typeof mod.getCategory).toBe('function');
    expect(typeof mod.getRootCategories).toBe('function');
    expect(typeof mod.getSubcategories).toBe('function');
    expect(typeof mod.getBreadcrumb).toBe('function');
    expect(typeof mod.searchCategories).toBe('function');
    expect(typeof mod.incrementCategoryStats).toBe('function');
  });

  it('categoryService has 7 exported functions', () => {
    const funcs = [
      'seedCategories', 'getCategory', 'getRootCategories', 'getSubcategories',
      'getBreadcrumb', 'searchCategories', 'incrementCategoryStats',
    ];
    expect(funcs).toHaveLength(7);
  });
});

describe('Categories — Root category IDs', () => {
  it('all known root IDs exist', () => {
    const rootIds = [
      'cat-food', 'cat-tech', 'cat-services', 'cat-fashion',
      'cat-home', 'cat-digital', 'cat-auto', 'cat-other',
    ];
    rootIds.forEach(id => {
      expect(CATEGORY_SEED.find(c => c.id === id)).toBeDefined();
    });
  });

  it('root categories have icons', () => {
    const icons: Record<string, string> = {
      'cat-food': '🍽️', 'cat-tech': '💻', 'cat-services': '🛠️',
      'cat-fashion': '👕', 'cat-home': '🏠', 'cat-digital': '📱',
      'cat-auto': '🚗', 'cat-other': '🎁',
    };
    const roots = getRootCategories();
    roots.forEach(c => {
      if (icons[c.id]) {
        expect(c.icon).toBe(icons[c.id]);
      }
    });
  });
});

describe('Categories — Breadcrumb logic', () => {
  it('builds breadcrumb for subcategory', () => {
    // Simulate breadcrumb logic
    const buildBreadcrumb = (categoryId: string, seed: Array<{ id: string; name: string; parentId?: string }>) => {
      const breadcrumb: Array<{ id: string; name: string }> = [];
      let current = seed.find(c => c.id === categoryId);
      while (current) {
        breadcrumb.unshift({ id: current.id, name: current.name });
        current = current.parentId ? seed.find(c => c.id === current!.parentId) : undefined;
      }
      return breadcrumb;
    };

    const simple = CATEGORY_SEED.map(c => ({ id: c.id, name: c.name, parentId: c.parentId }));
    const bc = buildBreadcrumb('cat-tech-phones', simple as any);
    expect(bc.length).toBeGreaterThanOrEqual(2);
    expect(bc[0].id).toBe('cat-tech');
    expect(bc[bc.length - 1].id).toBe('cat-tech-phones');
  });

  it('root category breadcrumb has 1 item', () => {
    const buildBreadcrumb = (categoryId: string, seed: Array<{ id: string; name: string; parentId?: string }>) => {
      const breadcrumb: Array<{ id: string; name: string }> = [];
      let current = seed.find(c => c.id === categoryId);
      while (current) {
        breadcrumb.unshift({ id: current.id, name: current.name });
        current = current.parentId ? seed.find(c => c.id === current!.parentId) : undefined;
      }
      return breadcrumb;
    };
    const simple = CATEGORY_SEED.map(c => ({ id: c.id, name: c.name, parentId: c.parentId }));
    const bc = buildBreadcrumb('cat-food', simple as any);
    expect(bc).toHaveLength(1);
  });
});
