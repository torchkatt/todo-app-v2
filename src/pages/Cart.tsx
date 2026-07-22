import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ArrowLeft, ShoppingBag, Trash2, Minus, Plus, ArrowRight } from 'lucide-react';
import { formatCOP } from '../config/constants';
import Button from '../components/ui/Button';

const Cart: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart();

  return (
    <div className="pb-32 bg-brand-bg min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-extrabold">Carrito</h1>
          {items.length > 0 && (
            <span className="text-sm font-bold text-text-muted ml-auto">{totalItems} {totalItems === 1 ? 'item' : 'items'}</span>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={36} className="text-text-muted" />
            </div>
            <h2 className="text-lg font-extrabold text-text-primary mb-1">Tu carrito está vacío</h2>
            <p className="text-sm text-text-secondary mb-6">Explora productos y servicios increíbles</p>
            <button onClick={() => navigate('/explore')}
              className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-extrabold hover:bg-purple-700 transition-colors active:scale-95 shadow-md shadow-purple-200">
              Explorar Todo
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.listingId}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-border hover:border-purple-200 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                    {item.icon || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-extrabold text-text-primary truncate">{item.title}</div>
                    <div className="text-xs text-text-secondary font-semibold">{item.sellerName}</div>
                    <div className="text-sm font-extrabold text-purple-700 mt-0.5">
                      {formatCOP(item.price * item.quantity)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQuantity(item.listingId, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Minus size={13} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.listingId, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg border border-border flex items-center justify-center hover:bg-gray-50 transition-colors">
                      <Plus size={13} />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.listingId)}
                    className="p-2 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-semibold text-text-secondary">Subtotal</span>
              <span className="font-extrabold text-text-primary">{formatCOP(totalPrice)}</span>
            </div>

            <button onClick={clearCart}
              className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors mb-6">
              Vaciar carrito
            </button>

            {/* Sticky checkout */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 z-50">
              <div className="max-w-2xl mx-auto">
                <Button fullWidth onClick={() => navigate('/checkout')}>
                  Ir a pagar — {formatCOP(totalPrice)} <ArrowRight size={18} />
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Cart;
