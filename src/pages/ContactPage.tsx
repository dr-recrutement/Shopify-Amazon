import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { Mail, Phone, MapPin, Send, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', subject: '', message: '' });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Contactez-nous</h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">Une question ? Notre équipe vous répond. Email officiel : <strong>info@liafrik.com</strong></p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center mx-auto mb-3"><Mail size={20} className="text-orange-600" /></div>
            <h3 className="font-semibold text-gray-900">Email</h3>
            <p className="text-sm text-gray-600 mt-1">info@liafrik.com</p>
            <p className="text-xs text-gray-400 mt-1">Réponse sous 24h</p>
          </div>
          <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-3"><Phone size={20} className="text-green-600" /></div>
            <h3 className="font-semibold text-gray-900">Téléphone</h3>
            <p className="text-sm text-gray-600 mt-1">+237 6 00 00 00 00</p>
            <p className="text-xs text-gray-400 mt-1">Lun-Ven, 9h-18h (GMT+1)</p>
          </div>
          <div className="p-6 bg-white border border-gray-100 rounded-2xl text-center">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-3"><MapPin size={20} className="text-blue-600" /></div>
            <h3 className="font-semibold text-gray-900">Adresse</h3>
            <p className="text-sm text-gray-600 mt-1">Yaoundé, Cameroun 🇨🇲</p>
            <p className="text-xs text-gray-400 mt-1">Direction Générale LIYAH GROUP</p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-2xl p-6 sm:p-8 shadow-sm">
          {sent && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              <CheckCircle2 size={16} /> Message envoyé ! Nous vous répondrons sous 24h.
            </div>
          )}
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sujet</label>
              <input required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea required rows={5} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <button type="submit" className="w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2">
              Envoyer le message <Send size={16} />
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
