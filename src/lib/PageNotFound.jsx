import { Link, useLocation } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

// The app-wide catch-all (path="*" in App.jsx) - every mistyped or dead URL
// lands here, so it must never itself fail. It used to call
// base44.auth.me() (via react-query) to decide whether to show a Base44-
// builder-specific "ask the AI to implement this page" hint - meaningless
// in production and an unnecessary call to a backend this app no longer
// authenticates against. Simplified to what a 404 page actually needs.
export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.replace(/^\//, '');

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F4F4F4]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-[#C9C9C9]">404</h1>
          <div className="h-0.5 w-16 bg-[#E1E1E1] mx-auto" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-[#202223]">Page introuvable</h2>
          <p className="text-[#6D7175] leading-relaxed">
            La page <span className="font-medium text-[#202223]">« {pageName || '/'} »</span> n'existe pas.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#202223] bg-white border border-[#E1E1E1] rounded-full hover:bg-black/5 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#008060] rounded-full hover:bg-[#00694d] transition"
          >
            <Home className="w-4 h-4" /> Accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
