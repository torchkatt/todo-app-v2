import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, ShoppingBag, Bot, CreditCard, Zap,
  BarChart3, Truck, Store, ArrowRight, Check,
  Star, ChevronDown, ChevronUp, Globe, Search, UserPlus,
  MessageSquare, Gift, BookOpen,
  Send, Play,
} from 'lucide-react';
import SEO from '../components/seo/SEO';
import { useSubscriptionPlans } from '../context/SubscriptionPlanContext';
import { analytics } from '../services/analyticsService';

// ─── Util ────────────────────────────────────────────────────────────────────
const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

// ─── Scroll Reveal Hook ──────────────────────────────────────────────────────
const useScrollReveal = (threshold = 0.12) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedCounter: React.FC<{ end: number; suffix?: string; duration?: number }> = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal(0.5);

  useEffect(() => {
    if (!isVisible) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-black text-white">
      {count}{suffix}
    </span>
  );
};

// ─── Social Link ─────────────────────────────────────────────────────────────
const SOCIAL_LINKS = [
  { icon: <Globe size={20} />, href: 'https://instagram.com/todoappco', label: 'Instagram' },
  { icon: <MessageSquare size={20} />, href: 'https://x.com/todoappco', label: 'X / Twitter' },
  { icon: <Play size={20} />, href: 'https://youtube.com/@todoappco', label: 'YouTube' },
];

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { plans } = useSubscriptionPlans();
  // Precio en vivo desde Firestore (mismo dato que PricingPage) — evita que la Landing
  // muestre un precio desactualizado si se cambia en el admin. Fallback al copy de i18n
  // mientras carga o si el plan aún no existe en Firestore.
  const dynamicPrice = (planId: string, fallback: string) => {
    const plan = plans.find(p => p.id === planId);
    return plan ? fmtCOP(plan.price) : fallback;
  };
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: t('ai.welcome') },
  ]);

  // Scroll reveal refs
  const featuresReveal = useScrollReveal();
  const howReveal = useScrollReveal();
  const pricingReveal = useScrollReveal();
  const testimonialsReveal = useScrollReveal();
  const screenshotsReveal = useScrollReveal();

  const handleAiExample = (question: string) => {
    setAiMessages(prev => [...prev, { role: 'user', text: question }]);
    setTimeout(() => {
      setAiMessages(prev => [...prev, {
        role: 'bot',
        text: t('landing.aiChat.guestWarning'),
      }]);
    }, 600);
  };

  const handleAiSend = () => {
    if (!aiInput.trim()) return;
    handleAiExample(aiInput);
    setAiInput('');
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <SEO
        title={t('landing.seoTitle')}
        description={t('landing.seoDescription')}
      />

      {/* ─────────────────── NAVBAR ─────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-500/25">
                <Sparkles size={18} className="text-white" />
              </div>
              <span className="text-xl font-black text-gray-900 tracking-tight">Todo</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {[
                { key: t('landing.nav.features'), href: '#features' },
                { key: t('landing.nav.how'), href: '#how' },
                { key: t('landing.nav.pricing'), href: '#pricing' },
                { key: t('landing.nav.faq'), href: '#faq' },
              ].map(l => (
                <a key={l.key} href={l.href} className="text-sm font-semibold text-gray-600 hover:text-purple-600 transition-colors">
                  {l.key}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/login')} className="text-sm font-bold text-gray-700 hover:text-purple-600 transition-colors">
                {t('auth.login')}
              </button>
              <button onClick={() => navigate('/register')} className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all shadow-md shadow-purple-200 active:scale-95">
                {t('landing.cta.start')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─────────────────── HERO ─────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-blue-700">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold text-white mb-6 border border-white/10">
              <Sparkles size={14} className="text-amber-300" />
              {t('landing.hero.badge')}
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              {t('landing.hero.title1')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-200">
                {t('landing.hero.title2')}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-violet-200 mb-8 max-w-2xl leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'hero_register' } }); navigate('/register'); }} className="group px-8 py-4 bg-white text-violet-700 rounded-xl text-base font-extrabold shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-2">
                {t('landing.hero.cta1')}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'hero_explore' } }); navigate('/app'); }} className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl text-base font-extrabold hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                <Store size={18} />
                {t('landing.hero.cta2')}
              </button>
            </div>
            <div className="flex items-center gap-6 mt-10 text-sm text-violet-200/80">
              <div className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-400" /> {t('landing.hero.trust1')}
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-400" /> {t('landing.hero.trust2')}
              </div>
              <div className="flex items-center gap-1.5">
                <Check size={16} className="text-emerald-400" /> {t('landing.hero.trust3')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── SOCIAL PROOF ─────────────────── */}
      <section className="py-16 bg-gradient-to-r from-purple-700 to-indigo-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-sm font-bold text-purple-200 border border-white/10 mb-4">
              {t('landing.stats.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-2">
              {t('landing.stats.title')}
            </h2>
            <p className="text-purple-200 max-w-2xl mx-auto">
              {t('landing.stats.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { end: 1200, suffix: '+', key: t('landing.stats.sellers').replace('{count}', '') },
              { end: 8500, suffix: '+', key: t('landing.stats.products').replace('{count}', '') },
              { end: 32, suffix: '', key: t('landing.stats.cities').replace('{count}', '') },
              { end: 25, suffix: 'k+', key: t('landing.stats.transactions').replace('{count}', '') },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <AnimatedCounter end={stat.end} suffix={stat.suffix} />
                <p className="text-sm text-purple-200 font-semibold mt-2">{stat.key.trim()}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section id="features" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={featuresReveal.ref}>
          <div className={`text-center mb-16 transition-all duration-700 ${featuresReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-bold mb-4">
              {t('landing.features.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.features.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <ShoppingBag size={28} className="text-purple-600" />,
                title: t('landing.features.marketplace.title'),
                desc: t('landing.features.marketplace.desc'),
                color: 'bg-purple-50',
              },
              {
                icon: <Bot size={28} className="text-indigo-600" />,
                title: t('landing.features.ai.title'),
                desc: t('landing.features.ai.desc'),
                color: 'bg-indigo-50',
              },
              {
                icon: <CreditCard size={28} className="text-emerald-600" />,
                title: t('landing.features.payments.title'),
                desc: t('landing.features.payments.desc'),
                color: 'bg-emerald-50',
              },
              {
                icon: <BarChart3 size={28} className="text-amber-600" />,
                title: t('landing.features.analytics.title'),
                desc: t('landing.features.analytics.desc'),
                color: 'bg-amber-50',
              },
              {
                icon: <Truck size={28} className="text-rose-600" />,
                title: t('landing.features.delivery.title'),
                desc: t('landing.features.delivery.desc'),
                color: 'bg-rose-50',
              },
              {
                icon: <Globe size={28} className="text-cyan-600" />,
                title: t('landing.features.local.title'),
                desc: t('landing.features.local.desc'),
                color: 'bg-cyan-50',
              },
            ].map((f, i) => (
              <div key={i} className="group relative p-8 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300 bg-white">
                <div className={`w-14 h-14 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── SCREENSHOTS ─────────────────── */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={screenshotsReveal.ref}>
          <div className={`text-center mb-16 transition-all duration-700 ${screenshotsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
              {t('landing.screenshots.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.screenshots.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('landing.screenshots.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Screenshot card 1 — Marketplace */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white">
              <div className="aspect-[4/3] bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                <div className="w-48 h-64 bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2 transform group-hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <Sparkles size={14} className="text-purple-600" />
                    <span className="text-xs font-black text-gray-800">Todo</span>
                  </div>
                  <div className="h-3 w-full bg-purple-100 rounded-full" />
                  <div className="h-3 w-3/4 bg-gray-100 rounded-full" />
                  <div className="flex-1 grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-lg bg-purple-50 flex items-center justify-center text-purple-300 text-xs font-bold">🛍️</div>
                    <div className="rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-300 text-xs font-bold">📱</div>
                    <div className="rounded-lg bg-amber-50 flex items-center justify-center text-amber-300 text-xs font-bold">🎧</div>
                    <div className="rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-300 text-xs font-bold">📦</div>
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-extrabold text-gray-900">{t('landing.screenshots.caption1')}</p>
              </div>
            </div>

            {/* Screenshot card 2 — Payments */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white">
              <div className="aspect-[4/3] bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                <div className="w-48 h-64 bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2 transform group-hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <CreditCard size={14} className="text-emerald-600" />
                    <span className="text-xs font-black text-gray-800">Checkout</span>
                  </div>
                  <div className="h-8 w-full bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-500 text-xs font-bold">💰</div>
                  <div className="h-5 w-full bg-gray-50 rounded" />
                  <div className="h-5 w-full bg-gray-50 rounded" />
                  <div className="mt-auto h-10 w-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white text-xs font-extrabold">
                    PAGAR
                  </div>
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-extrabold text-gray-900">{t('landing.screenshots.caption2')}</p>
              </div>
            </div>

            {/* Screenshot card 3 — Dashboard */}
            <div className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-white">
              <div className="aspect-[4/3] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                <div className="w-48 h-64 bg-white rounded-2xl shadow-2xl p-4 flex flex-col gap-2 transform group-hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <BarChart3 size={14} className="text-amber-600" />
                    <span className="text-xs font-black text-gray-800">Dashboard</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-12 bg-amber-50 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-amber-500 text-xs font-black">$</span>
                      <span className="text-[8px] text-gray-500">Ventas</span>
                    </div>
                    <div className="flex-1 h-12 bg-purple-50 rounded-lg flex flex-col items-center justify-center">
                      <span className="text-purple-500 text-xs font-black">👁️</span>
                      <span className="text-[8px] text-gray-500">Visitas</span>
                    </div>
                  </div>
                  <div className="h-16 w-full bg-gradient-to-t from-amber-100/50 rounded-lg" />
                </div>
              </div>
              <div className="p-5">
                <p className="text-sm font-extrabold text-gray-900">{t('landing.screenshots.caption3')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── HOW IT WORKS ─────────────────── */}
      <section id="how" className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={howReveal.ref}>
          <div className={`text-center mb-16 transition-all duration-700 ${howReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
              {t('landing.how.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.how.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('landing.how.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-0.5 bg-gradient-to-r from-purple-300 via-indigo-300 to-purple-300" />
            {[
              {
                step: '01',
                icon: <UserPlus size={32} className="text-purple-600" />,
                title: t('landing.how.step1.title'),
                desc: t('landing.how.step1.desc'),
              },
              {
                step: '02',
                icon: <Search size={32} className="text-indigo-600" />,
                title: t('landing.how.step2.title'),
                desc: t('landing.how.step2.desc'),
              },
              {
                step: '03',
                icon: <Zap size={32} className="text-emerald-600" />,
                title: t('landing.how.step3.title'),
                desc: t('landing.how.step3.desc'),
              },
            ].map((s, i) => (
              <div key={i} className="relative text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white border-2 border-purple-100 flex items-center justify-center shadow-lg relative z-10">
                  {s.icon}
                </div>
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-600 text-white text-xs font-extrabold mb-4">
                  {s.step}
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <button onClick={() => navigate('/register')} className="px-8 py-3.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95">
              {t('landing.how.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────── PRICING ─────────────────── */}
      <section id="pricing" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={pricingReveal.ref}>
          <div className={`text-center mb-16 transition-all duration-700 ${pricingReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="inline-block px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold mb-4">
              {t('landing.pricing.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.pricing.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('landing.pricing.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: t('landing.pricing.plan1.name'),
                desc: t('landing.pricing.plan1.desc'),
                price: dynamicPrice('free', t('landing.pricing.plan1.price')),
                period: '',
                features: [
                  t('landing.pricing.plan1.f1'),
                  t('landing.pricing.plan1.f2'),
                  t('landing.pricing.plan1.f3'),
                  t('landing.pricing.plan1.f4'),
                ],
                cta: t('landing.pricing.plan1.cta'),
                popular: false,
              },
              {
                name: t('landing.pricing.plan2.name'),
                desc: t('landing.pricing.plan2.desc'),
                price: dynamicPrice('seller_pass_monthly', t('landing.pricing.plan2.price')),
                period: t('landing.pricing.plan2.period'),
                features: [
                  t('landing.pricing.plan2.f1'),
                  t('landing.pricing.plan2.f2'),
                  t('landing.pricing.plan2.f3'),
                  t('landing.pricing.plan2.f4'),
                  t('landing.pricing.plan2.f5'),
                ],
                cta: t('landing.pricing.plan2.cta'),
                popular: true,
              },
              {
                name: t('landing.pricing.plan3.name'),
                desc: t('landing.pricing.plan3.desc'),
                price: dynamicPrice('seller_pass_annual', t('landing.pricing.plan3.price')),
                period: t('landing.pricing.plan3.period'),
                features: [
                  t('landing.pricing.plan3.f1'),
                  t('landing.pricing.plan3.f2'),
                  t('landing.pricing.plan3.f3'),
                  t('landing.pricing.plan3.f4'),
                  t('landing.pricing.plan3.f5'),
                  t('landing.pricing.plan3.f6'),
                ],
                cta: t('landing.pricing.plan3.cta'),
                popular: false,
              },
            ].map((plan, i) => (
              <div key={i} className={`relative rounded-2xl border-2 p-8 flex flex-col ${
                plan.popular
                  ? 'border-purple-500 bg-white shadow-xl shadow-purple-100 scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-purple-200 hover:shadow-lg transition-all'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-extrabold rounded-full shadow-md">
                    {t('landing.pricing.popular')}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500">{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500 font-semibold">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-gray-600 font-medium">{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'pricing_plan', plan: plan.name } }); navigate('/register'); }}
                  className={`w-full py-3 rounded-xl text-sm font-extrabold transition-all active:scale-95 ${
                    plan.popular
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── TESTIMONIALS ─────────────────── */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" ref={testimonialsReveal.ref}>
          <div className={`text-center mb-16 transition-all duration-700 ${testimonialsReveal.isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
              {t('landing.testimonials.title')}
            </h2>
            <p className="text-lg text-violet-200 max-w-2xl mx-auto">
              {t('landing.testimonials.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-violet-100 leading-relaxed mb-4">
                  {t(`landing.testimonials.t${n}.quote`)}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-extrabold text-sm">
                    {t(`landing.testimonials.t${n}.initials`)}
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">{t(`landing.testimonials.t${n}.name`)}</div>
                    <div className="text-xs text-violet-300">{t(`landing.testimonials.t${n}.role`)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── AI CHAT PREVIEW ─────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left — Copy */}
            <div>
              <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
                <Bot size={14} className="inline mr-1 -mt-0.5" />
                {t('landing.aiChat.title')}
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                {t('landing.aiChat.subtitle')}
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                {t('landing.aiChat.desc')}
              </p>
              <div className="space-y-3 mb-8">
                {[t('landing.aiChat.example1'), t('landing.aiChat.example2'), t('landing.aiChat.example3')].map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleAiExample(ex)}
                    className="block w-full text-left px-5 py-3.5 rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group"
                  >
                    <span className="text-sm font-semibold text-gray-600 group-hover:text-purple-700">
                      <MessageSquare size={14} className="inline mr-2 -mt-0.5 text-purple-400" />
                      {ex}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-400 mb-4">{t('landing.aiChat.guestWarning')}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'ai_chat_login' } }); navigate('/login'); }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
                >
                  {t('landing.aiChat.loginCta')}
                </button>
                <button
                  onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'ai_chat_register' } }); navigate('/register'); }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                >
                  {t('landing.aiChat.registerCta')}
                </button>
              </div>
            </div>

            {/* Right — Chat mockup */}
            <div className="bg-gray-50 rounded-3xl p-4 shadow-xl border border-gray-100">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-indigo-600">
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-extrabold text-white">Todo AI</div>
                    <div className="text-xs text-purple-200">En línea</div>
                  </div>
                </div>
                {/* Messages */}
                <div className="p-4 space-y-3 max-h-[280px] overflow-y-auto">
                  {aiMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-gray-100 text-gray-700 rounded-bl-md'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
                {/* Input */}
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100">
                  <input
                    type="text"
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                    placeholder={t('landing.aiChat.placeholder')}
                    className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-300 border border-gray-200"
                  />
                  <button
                    onClick={handleAiSend}
                    className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-all shrink-0"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────── FAQ ─────────────────── */}
      <section id="faq" className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-sm font-bold mb-4">
              {t('landing.faq.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.faq.title')}
            </h2>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setFaqOpen(faqOpen === n ? null : n)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-sm font-extrabold text-gray-900 pr-4">
                    {t(`landing.faq.q${n}`)}
                  </span>
                  {faqOpen === n ? (
                    <ChevronUp size={18} className="text-purple-500 shrink-0" />
                  ) : (
                    <ChevronDown size={18} className="text-gray-400 shrink-0" />
                  )}
                </button>
                {faqOpen === n && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {t(`landing.faq.a${n}`)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── RESOURCES ─────────────────── */}
      <section className="py-20 md:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-100 text-cyan-700 rounded-full text-sm font-bold mb-4">
              <BookOpen size={14} className="inline mr-1 -mt-0.5" />
              {t('landing.resources.badge')}
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              {t('landing.resources.title')}
            </h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              {t('landing.resources.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                icon: <MessageSquare size={24} className="text-purple-600" />,
                title: t('landing.resources.helpCenter'),
                desc: t('landing.resources.helpCenterDesc'),
                onClick: () => navigate('/help'),
                color: 'bg-purple-50',
                hoverColor: 'hover:border-purple-300',
              },
              {
                icon: <Gift size={24} className="text-emerald-600" />,
                title: t('landing.resources.sellerGuides'),
                desc: t('landing.resources.sellerGuidesDesc'),
                onClick: () => navigate('/help'),
                color: 'bg-emerald-50',
                hoverColor: 'hover:border-emerald-300',
              },
              {
                icon: <BookOpen size={24} className="text-amber-600" />,
                title: t('landing.resources.blog'),
                desc: t('landing.resources.blogDesc'),
                onClick: () => navigate('/help'),
                color: 'bg-amber-50',
                hoverColor: 'hover:border-amber-300',
              },
            ].map((r, i) => (
              <button
                key={i}
                onClick={r.onClick}
                className={`group text-left p-6 rounded-2xl border border-gray-200 ${r.hoverColor} hover:shadow-lg transition-all`}
              >
                <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  {r.icon}
                </div>
                <h3 className="text-base font-extrabold text-gray-900 mb-1">{r.title}</h3>
                <p className="text-sm text-gray-500">{r.desc}</p>
              </button>
            ))}
          </div>
          <div className="text-center mt-10">
            <button
              onClick={() => navigate('/help')}
              className="px-8 py-3.5 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-200 transition-all"
            >
              {t('landing.resources.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA BANNER ─────────────────── */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            {t('landing.ctaBottom.title')}
          </h2>
          <p className="text-lg text-violet-200 mb-8 max-w-2xl mx-auto">
            {t('landing.ctaBottom.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'bottom_register' } }); navigate('/register'); }} className="px-8 py-4 bg-white text-purple-700 rounded-xl text-base font-extrabold shadow-xl hover:shadow-2xl transition-all active:scale-95">
              {t('landing.ctaBottom.cta1')}
            </button>
            <button onClick={() => { analytics.track({ name: 'click_cta', properties: { cta: 'bottom_help' } }); navigate('/help'); }} className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/20 rounded-xl text-base font-extrabold hover:bg-white/20 transition-all active:scale-95">
              {t('landing.ctaBottom.cta2')}
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Sparkles size={16} className="text-white" />
                </div>
                <span className="text-lg font-black text-white">Todo</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">
                {t('landing.footer.tagline')}
              </p>
              {/* Social media — redes sociales */}
              <div className="flex items-center gap-3">
                {SOCIAL_LINKS.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center text-gray-400 hover:bg-purple-600 hover:text-white transition-all"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">{t('landing.footer.product')}</h4>
              <div className="space-y-2">
                {[
                  { key: t('landing.nav.features'), href: '#features' },
                  { key: t('landing.nav.pricing'), href: '#pricing' },
                  { key: t('landing.nav.faq'), href: '#faq' },
                ].map(l => (
                  <a key={l.key} href={l.href} className="block text-sm text-gray-400 hover:text-white transition-colors">{l.key}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">{t('landing.footer.company')}</h4>
              <div className="space-y-2">
                {[
                  { key: t('landing.nav.how'), href: '#how' },
                  { key: t('nav.help'), href: '/help' },
                  { key: t('nav.terms'), href: '/terms' },
                ].map(l => (
                  <a key={l.key} href={l.href} className="block text-sm text-gray-400 hover:text-white transition-colors">{l.key}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white mb-4">{t('landing.footer.legal')}</h4>
              <div className="space-y-2">
                {[
                  { key: t('nav.privacy'), href: '/privacy' },
                  { key: t('nav.help'), href: '/help' },
                ].map(l => (
                  <a key={l.key} onClick={() => navigate(l.href)} className="block text-sm text-gray-400 hover:text-white transition-colors cursor-pointer">{l.key}</a>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Todo. {t('landing.footer.rights')}
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>{t('landing.footer.made')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
