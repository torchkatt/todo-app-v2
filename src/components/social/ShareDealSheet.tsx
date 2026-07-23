import React, { useEffect, useState } from 'react';
import { X, Share2, Copy, Check, Loader2, Gift, Users, Zap } from 'lucide-react';
import { groupDealService } from '../../services/groupDealService';
import type { GroupDeal } from '../../types';

interface ShareDealSheetProps {
  deal: GroupDeal;
  isOpen: boolean;
  onClose: () => void;
}

const ShareDealSheet: React.FC<ShareDealSheetProps> = ({ deal, isOpen, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger enter animation on next frame
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      setCopied(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const shareUrl = groupDealService.getShareUrl(deal.id, deal.createdBy);
  const shareText = groupDealService.getShareText(deal);
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const handleCopyLink = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setCopying(false);
  };

  const handleWhatsApp = () => {
    window.open(whatsappUrl, '_blank');
  };

  const progress = deal.minParticipants > 0
    ? Math.min((deal.currentCount / deal.minParticipants) * 100, 100)
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-lg bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-2">
          <h2 className="text-lg font-extrabold text-text-primary flex items-center gap-2">
            <Share2 size={20} className="text-purple-600" />
            Compartir oferta grupal
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-text-muted" />
          </button>
        </div>

        {/* Preview Card */}
        <div className="mx-5 mb-4 p-4 bg-gradient-to-br from-purple-50 via-white to-indigo-50 rounded-xl border border-purple-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-3xl">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold text-text-primary truncate">
                {deal.title}
              </h3>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-lg font-extrabold text-purple-700">
                  ${deal.groupPrice.toLocaleString('es-CO')}
                </span>
                <span className="text-xs text-text-muted line-through font-semibold">
                  ${deal.originalPrice.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 bg-red-100 text-red-700 font-extrabold rounded-full">
              -{deal.discountPercent}%
            </span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 font-bold rounded-full flex items-center gap-1">
              <Users size={12} />
              {deal.currentCount}/{deal.minParticipants} personas
            </span>
            {deal.status === 'COMPLETED' && (
              <span className="px-2 py-1 bg-green-100 text-green-700 font-extrabold rounded-full flex items-center gap-1">
                <Zap size={12} /> ¡Completado!
              </span>
            )}
          </div>

          {/* Mini progress */}
          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 space-y-3">
          {/* WhatsApp */}
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 text-white font-extrabold rounded-xl transition-colors text-sm shadow-lg shadow-green-200"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Compartir en WhatsApp
          </button>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            disabled={copying}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-text-primary font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {copying ? (
              <Loader2 size={18} className="animate-spin" />
            ) : copied ? (
              <Check size={18} className="text-green-600" />
            ) : (
              <Copy size={18} />
            )}
            {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareDealSheet;
