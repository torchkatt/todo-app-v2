import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, BookOpen, Shield, MessageSquare, Mail, ShoppingBag, Store,
  CreditCard, Truck, Package, HelpCircle, ChevronDown, ChevronUp,
  FileText, Headphones, AlertCircle, Star, Clock, Bot, Zap,
} from 'lucide-react';
import SEO from '../components/seo/SEO';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openSection, setOpenSection] = React.useState<string | null>(null);

  const sections = [
    {
      id: 'buyer',
      icon: <ShoppingBag size={20} className="text-purple-600" />,
      title: t('help.sections.buyer'),
      color: 'from-purple-50 to-violet-50 border-purple-200',
      iconBg: 'bg-purple-100',
      faqs: [
        { q: t('help.buyer.q1'), a: t('help.buyer.a1') },
        { q: t('help.buyer.q2'), a: t('help.buyer.a2') },
        { q: t('help.buyer.q3'), a: t('help.buyer.a3') },
        { q: t('help.buyer.q4'), a: t('help.buyer.a4') },
        { q: t('help.buyer.q5'), a: t('help.buyer.a5') },
      ],
    },
    {
      id: 'seller',
      icon: <Store size={20} className="text-indigo-600" />,
      title: t('help.sections.seller'),
      color: 'from-indigo-50 to-blue-50 border-indigo-200',
      iconBg: 'bg-indigo-100',
      faqs: [
        { q: t('help.seller.q1'), a: t('help.seller.a1') },
        { q: t('help.seller.q2'), a: t('help.seller.a2') },
        { q: t('help.seller.q3'), a: t('help.seller.a3') },
        { q: t('help.seller.q4'), a: t('help.seller.a4') },
        { q: t('help.seller.q5'), a: t('help.seller.a5') },
      ],
    },
    {
      id: 'payments',
      icon: <CreditCard size={20} className="text-emerald-600" />,
      title: t('help.sections.payments'),
      color: 'from-emerald-50 to-green-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
      faqs: [
        { q: t('help.payments.q1'), a: t('help.payments.a1') },
        { q: t('help.payments.q2'), a: t('help.payments.a2') },
        { q: t('help.payments.q3'), a: t('help.payments.a3') },
      ],
    },
    {
      id: 'ai',
      icon: <Bot size={20} className="text-amber-600" />,
      title: t('help.sections.ai'),
      color: 'from-amber-50 to-yellow-50 border-amber-200',
      iconBg: 'bg-amber-100',
      faqs: [
        { q: t('help.ai.q1'), a: t('help.ai.a1') },
        { q: t('help.ai.q2'), a: t('help.ai.a2') },
        { q: t('help.ai.q3'), a: t('help.ai.a3') },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-brand-bg pb-24">
      <SEO title={t('help.title')} description={t('help.metaDesc')} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold text-text-primary">{t('help.title')}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Quick links bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {sections.map(s => (
            <button
              key={s.id}
              onClick={() => setOpenSection(openSection === s.id ? null : s.id)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center ${
                openSection === s.id
                  ? 'border-purple-500 bg-purple-50 shadow-sm'
                  : 'border-border bg-white hover:border-purple-200'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                {s.icon}
              </div>
              <span className="text-[10px] font-extrabold text-text-primary leading-tight">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Expandable FAQ sections */}
        <div className="space-y-3">
          {sections.map(section => (
            <div
              key={section.id}
              className={`rounded-2xl border bg-gradient-to-br ${section.color} overflow-hidden transition-all ${
                openSection === section.id ? 'shadow-md' : ''
              }`}
            >
              <button
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
                className="w-full flex items-center gap-3 p-5 text-left"
              >
                <div className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center shrink-0`}>
                  {section.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-extrabold text-text-primary">{section.title}</h3>
                  <p className="text-[11px] text-text-muted font-semibold">
                    {section.faqs.length} {t('help.questions')}
                  </p>
                </div>
                {openSection === section.id ? (
                  <ChevronUp size={18} className="text-purple-500 shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-text-muted shrink-0" />
                )}
              </button>
              {openSection === section.id && (
                <div className="px-5 pb-5 space-y-2">
                  {section.faqs.map((faq, i) => (
                    <details key={i} className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/50">
                      <summary className="flex items-start gap-2 cursor-pointer list-none">
                        <HelpCircle size={15} className="text-purple-500 mt-0.5 shrink-0" />
                        <span className="text-sm font-bold text-text-primary flex-1">{faq.q}</span>
                      </summary>
                      <p className="mt-3 ml-7 text-xs text-text-secondary leading-relaxed">{faq.a}</p>
                    </details>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* General quick-help cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              icon: <Shield size={20} className="text-emerald-600" />,
              title: t('help.quick.safety'),
              desc: t('help.quick.safetyDesc'),
            },
            {
              icon: <Truck size={20} className="text-indigo-600" />,
              title: t('help.quick.delivery'),
              desc: t('help.quick.deliveryDesc'),
            },
            {
              icon: <Star size={20} className="text-amber-600" />,
              title: t('help.quick.reviews'),
              desc: t('help.quick.reviewsDesc'),
            },
            {
              icon: <AlertCircle size={20} className="text-rose-600" />,
              title: t('help.quick.disputes'),
              desc: t('help.quick.disputesDesc'),
            },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl border border-border p-4 hover:border-purple-200 transition-colors">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{card.icon}</div>
                <div>
                  <h3 className="text-sm font-extrabold text-text-primary mb-1">{card.title}</h3>
                  <p className="text-xs text-text-secondary leading-relaxed">{card.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 p-6 text-white shadow-lg shadow-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <MessageSquare size={22} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold mb-2">{t('help.contact.title')}</h3>
              <p className="text-sm text-violet-200 mb-4 leading-relaxed">
                {t('help.contact.desc')}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-violet-300" />
                  <span className="text-white font-semibold">soporte@todoapp.co</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={14} className="text-violet-300" />
                  <span className="text-violet-200 font-medium">{t('help.contact.hours')}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => navigate('/register')} className="px-5 py-2.5 bg-white text-purple-700 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition-all active:scale-95">
                  {t('help.contact.cta1')}
                </button>
                <a href="mailto:soporte@todoapp.co" className="px-5 py-2.5 bg-white/15 backdrop-blur-sm text-white border border-white/20 rounded-xl text-sm font-extrabold hover:bg-white/25 transition-all active:scale-95">
                  {t('help.contact.cta2')}
                </a>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default HelpPage;
