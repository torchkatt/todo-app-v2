import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEO from '../components/seo/SEO';
import { Home, ArrowLeft, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-4 text-center">
      <SEO title="404 — Página no encontrada — Todo" description="La página que buscas no existe" />

      <div className="text-8xl font-black text-gray-200 mb-4 select-none">404</div>

      <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mb-6">
        <Search size={36} className="text-red-400" />
      </div>

      <h1 className="text-2xl font-black text-text-primary mb-2">
        {t('notFound.title', 'Esta página no existe')}
      </h1>
      <p className="text-sm text-text-secondary max-w-sm mb-8">
        {t('notFound.description', 'La página que buscas fue movida, eliminada o nunca existió. Revisa la URL o vuelve al inicio.')}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-3 rounded-xl border border-gray-200 text-sm font-extrabold text-text-primary
            hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          {t('common.back', 'Volver')}
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-xl bg-purple-600 text-white text-sm font-extrabold
            hover:bg-purple-700 transition-all active:scale-95 shadow-lg shadow-purple-200 flex items-center justify-center gap-2"
        >
          <Home size={16} />
          {t('notFound.goHome', 'Ir al inicio')}
        </button>
      </div>
    </div>
  );
};

export default NotFoundPage;
