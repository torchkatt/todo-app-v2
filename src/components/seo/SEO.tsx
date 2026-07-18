import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SEOProps {
  title?: string;
  description?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description }) => {
  const { t } = useTranslation();
  const siteName = t('app.name');
  const defaultDesc = t('app.description');

  useEffect(() => {
    document.title = title ? `${title} | ${siteName}` : `${siteName} — ${t('app.tagline')}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', description || defaultDesc);
  }, [title, description, siteName, defaultDesc, t]);

  return null;
};

export default SEO;
