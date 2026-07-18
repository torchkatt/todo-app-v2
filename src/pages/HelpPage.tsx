import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleHelp, MessageSquare, BookOpen, Mail, Shield } from 'lucide-react';

const HelpPage: React.FC = () => (
  <div className="min-h-screen bg-brand-bg">
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-border px-4 py-3">
      <div className="flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ArrowLeft size={22} /></button>
        <h1 className="text-lg font-extrabold">Ayuda</h1>
      </div>
    </header>
    <main className="max-w-2xl mx-auto px-4 py-6 space-y-3">
      {[
        { icon: <BookOpen size={20} />, title: '¿Cómo funciona Todo?', desc: 'Guía rápida del marketplace', link: 'Todo es un marketplace donde puedes comprar productos, contratar servicios y descargar contenido digital. Cada vendedor configura sus propios precios, métodos de entrega y disponibilidad.' },
        { icon: <Shield size={20} />, title: 'Pagos seguros', desc: 'Wompi, PSE, Nequi, Efecty y tarjetas', link: 'Todos los pagos se procesan a través de Wompi, garantizando la seguridad de tus datos financieros. Aceptamos tarjetas crédito/débito, PSE, Nequi, Daviplata y Efecty.' },
        { icon: <MessageSquare size={20} />, title: 'Contactar soporte', desc: 'Respuesta en 24-48 horas', link: 'Escríbenos a soporte@todoapp.co o usa el asistente AI en la app. Nuestro equipo responde en 24-48 horas hábiles.' },
        { icon: <Mail size={20} />, title: 'Reclamos y disputas', desc: 'Proceso de resolución', link: 'Si algo sale mal con tu pedido, abre una disputa desde la sección de pedidos y nuestro equipo lo revisará en máximo 48 horas.' },
      ].map((item, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-4">
          <div className="flex items-start gap-3">
            <div className="text-purple-600 mt-0.5">{item.icon}</div>
            <div><h3 className="text-sm font-extrabold text-text-primary mb-1">{item.title}</h3><p className="text-xs text-text-secondary mb-2">{item.desc}</p><p className="text-xs text-text-muted leading-relaxed">{item.link}</p></div>
          </div>
        </div>
      ))}
    </main>
  </div>
);

export default HelpPage;
