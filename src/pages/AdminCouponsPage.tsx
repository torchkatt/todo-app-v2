import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Ticket, Plus, X, Calendar, Loader2, Trash2 } from 'lucide-react';
import { UserRole } from '../types';
import { couponService } from '../services/couponService';
import { formatCOP } from '../config/constants';
import type { Coupon } from '../types';
import Button from '../components/ui/Button';

const AdminCouponsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (!user || user.role !== UserRole.SUPER_ADMIN) {
      navigate('/');
      return;
    }
    loadCoupons();
  }, [user, navigate]);

  const loadCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await couponService.getCoupons(true);
      setCoupons(result);
    } catch (e: any) {
      setError(e?.message || 'Error al cargar cupones');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('PERCENTAGE');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setMaxUses('');
    setExpiresAt('');
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreate = async () => {
    setFormError(null);
    setFormSuccess(null);

    if (!description.trim()) { setFormError('La descripción es requerida'); return; }
    if (!discountValue || Number(discountValue) <= 0) { setFormError('El valor de descuento debe ser mayor a 0'); return; }
    if (discountType === 'PERCENTAGE' && Number(discountValue) > 50) { setFormError('El porcentaje máximo es 50%'); return; }
    if (!maxUses || Number(maxUses) <= 0) { setFormError('Los usos máximos deben ser > 0'); return; }
    if (!expiresAt) { setFormError('La fecha de expiración es requerida'); return; }

    setSubmitting(true);
    try {
      await couponService.create({
        code: code.trim() || undefined,
        description: description.trim(),
        discountType,
        discountValue: Number(discountValue),
        minPurchase: minPurchase ? Number(minPurchase) : undefined,
        maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
        maxUses: Number(maxUses),
        expiresAt: new Date(expiresAt).toISOString(),
        createdBy: user!.id,
      });
      setFormSuccess('¡Cupón creado exitosamente!');
      resetForm();
      setShowForm(false);
      await loadCoupons();
    } catch (e: any) {
      setFormError(e?.message || 'Error al crear cupón');
    }
    setSubmitting(false);
  };

  const handleDeactivate = async (couponId: string) => {
    try {
      await couponService.deactivate(couponId);
      setCoupons(prev => prev.map(c => c.id === couponId ? { ...c, isActive: false } : c));
    } catch (e: any) {
      setError(e?.message || 'Error al desactivar');
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (!user || user.role !== UserRole.SUPER_ADMIN) return null;

  return (
    <div className="pb-24 bg-brand-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold flex items-center gap-2">
            <Ticket size={20} className="text-purple-600" /> Cupones
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Error global */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Create button */}
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-text-secondary">
            {coupons.length} cupón(es)
          </span>
          <button
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-extrabold hover:bg-purple-700 transition-all active:scale-95 shadow-md shadow-purple-200"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancelar' : 'Crear cupón'}
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-border p-5 space-y-3">
            <h3 className="text-sm font-extrabold flex items-center gap-2">
              <Plus size={16} className="text-purple-600" /> Nuevo cupón
            </h3>

            {formError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-700">
                {formSuccess}
              </div>
            )}

            {/* Código */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">
                Código (opcional — se auto-genera)
              </label>
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Ej: BIENVENIDO10 (dejar vacío para auto)"
                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1">Descripción *</label>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ej: 10% de descuento para nuevos usuarios"
                className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
              />
            </div>

            {/* Tipo + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Tipo *</label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as 'PERCENTAGE' | 'FIXED')}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
                >
                  <option value="PERCENTAGE">Porcentaje (%)</option>
                  <option value="FIXED">Monto fijo ($)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Valor *</label>
                <input
                  type="number"
                  min="0"
                  value={discountValue}
                  onChange={e => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'PERCENTAGE' ? '10 = 10%' : '50000 = $50K'}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Compra mínima + Tope (solo %) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Compra mínima</label>
                <input
                  type="number"
                  min="0"
                  value={minPurchase}
                  onChange={e => setMinPurchase(e.target.value)}
                  placeholder="Ej: 50000"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">
                  {discountType === 'PERCENTAGE' ? 'Tope máx descuento' : '—'}
                </label>
                <input
                  type="number"
                  min="0"
                  value={maxDiscount}
                  onChange={e => setMaxDiscount(e.target.value)}
                  disabled={discountType !== 'PERCENTAGE'}
                  placeholder="Ej: 20000"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Usos + Expira */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Usos máximos *</label>
                <input
                  type="number"
                  min="1"
                  value={maxUses}
                  onChange={e => setMaxUses(e.target.value)}
                  placeholder="Ej: 100"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Expira *</label>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm outline-none focus:border-purple-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            <Button
              fullWidth
              onClick={handleCreate}
              loading={submitting}
              disabled={submitting}
            >
              <Plus size={14} className="mr-1" /> Crear cupón
            </Button>
          </div>
        )}

        {/* Coupons list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={28} className="animate-spin text-purple-600" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-border p-8 text-center">
            <Ticket size={40} className="mx-auto mb-3 text-text-muted" />
            <p className="text-sm font-bold text-text-muted mb-1">No hay cupones aún</p>
            <p className="text-xs text-text-muted">Crea tu primer cupón con el botón superior</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map(coupon => {
              const isExpired = new Date(coupon.expiresAt) < new Date();
              const isUsedUp = coupon.currentUses >= coupon.maxUses;
              const statusColor = !coupon.isActive
                ? 'bg-gray-50 text-gray-500 border-gray-200'
                : isExpired || isUsedUp
                  ? 'bg-red-50 text-red-500 border-red-200'
                  : 'bg-emerald-50 text-emerald-500 border-emerald-200';

              return (
                <div
                  key={coupon.id}
                  className={`bg-white rounded-xl border p-4 transition-opacity ${!coupon.isActive ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Code + description */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-extrabold text-purple-600 font-mono">
                          {coupon.code}
                        </span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${statusColor}`}>
                          {!coupon.isActive
                            ? 'Inactivo'
                            : isExpired
                              ? 'Expirado'
                              : isUsedUp
                                ? 'Agotado'
                                : 'Activo'}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{coupon.description}</p>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-text-muted font-semibold">
                        <span>
                          {coupon.discountType === 'PERCENTAGE'
                            ? `${coupon.discountValue}% desc.`
                            : `${formatCOP(coupon.discountValue)} desc.`}
                          {coupon.maxDiscount && coupon.discountType === 'PERCENTAGE'
                            ? ` (máx ${formatCOP(coupon.maxDiscount)})`
                            : ''}
                        </span>
                        {coupon.minPurchase && (
                          <span>Mín {formatCOP(coupon.minPurchase)}</span>
                        )}
                        <span className={isUsedUp ? 'text-red-500 font-bold' : ''}>
                          {coupon.currentUses}/{coupon.maxUses} usos
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {isExpired ? (
                            <span className="text-red-500">Expiró {formatDate(coupon.expiresAt)}</span>
                          ) : (
                            <span>Expira {formatDate(coupon.expiresAt)}</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Deactivate button */}
                    {coupon.isActive && (
                      <button
                        onClick={() => handleDeactivate(coupon.id)}
                        className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0"
                        title="Desactivar cupón"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCouponsPage;
