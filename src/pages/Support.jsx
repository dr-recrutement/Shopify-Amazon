import { useState } from 'react';
import { LifeBuoy, Search, BookOpen, Video, MessageSquare, ChevronDown, Mail, Zap } from 'lucide-react';

const CATEGORIES = [
  { id: 'start', label: 'Démarrage', icon: Zap, articles: [
    { t: 'Créer votre boutique en 5 minutes', body: 'Choisissez un thème, ajoutez vos premiers produits, et publiez votre boutique instantanément.' },
    { t: 'Configurer votre domaine personnalisé', body: 'Connectez un domaine existant ou achetez-en un directement via Sellia avec Cloudflare Registrar.' },
    { t: 'Inviter des employés', body: 'Ajoutez des membres à votre équipe et définissez leurs permissions d\'accès dans Gestion du personnel.' },
  ] },
  { id: 'sell', label: 'Vendre', icon: BookOpen, articles: [
    { t: 'Ajouter et gérer vos produits', body: 'Créez des produits avec variantes, images, prix et stock. Organisez-les en collections.' },
    { t: 'Traiter une commande', body: 'Suivez les commandes du paiement à la livraison. Mettez à jour les statuts automatiquement.' },
    { t: 'Gérer les avis clients', body: 'Approuvez, rejetez ou répondez aux avis laissés par vos clients sur vos produits.' },
  ] },
  { id: 'ship', label: 'Livraison', icon: LifeBuoy, articles: [
    { t: 'Configurer vos zones de livraison', body: 'Définissez des zones par pays, choisissez vos transporteurs et fixez vos tarifs d\'expédition.' },
    { t: 'Proposer la livraison gratuite', body: 'Activez la livraison gratuite au-dessus d\'un montant minimum dans chaque zone.' },
  ] },
  { id: 'pay', label: 'Paiements', icon: Zap, articles: [
    { t: 'Connecter votre PSP', body: 'Sellia prend en charge 25+ prestataires de paiement mondiaux. Connectez votre compte et acceptez les paiements sans redirection.' },
    { t: 'Accepter Mobile Money', body: 'Activez les paiements mobiles pour vos clients en Afrique : Orange Money, Wave, MTN, Airtel et plus.' },
  ] },
  { id: 'theme', label: 'Thèmes et design', icon: BookOpen, articles: [
    { t: 'Personnaliser votre thème', body: 'Modifiez les couleurs, polices, sections et contenu via l\'éditeur visuel avec aperçu en temps réel.' },
    { t: 'Utiliser l\'Sellia Assistant', body: 'Générez automatiquement du contenu premium adapté à votre commerce avec un seul clic.' },
  ] },
];

export default function Support() {
  const [query, setQuery] = useState('');
  const [openCat, setOpenCat] = useState('start');
  const [openArt, setOpenArt] = useState(null);

  const filtered = CATEGORIES.map((c) => ({ ...c, articles: c.articles.filter((a) => !query || a.t.toLowerCase().includes(query.toLowerCase()) || a.body.toLowerCase().includes(query.toLowerCase())) })).filter((c) => c.articles.length > 0);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-6"><LifeBuoy className="w-5 h-5 text-[#6D7175]" /><h1 className="text-xl font-bold text-[#202223]">Centre d'aide</h1></div>

      <div className="flex items-center gap-2 bg-white border border-[#E1E1E1] rounded-lg px-4 py-3 mb-6">
        <Search className="w-5 h-5 text-[#6D7175]" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher dans la documentation…" className="outline-none text-sm w-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <a href="mailto:support@sellia.liafrik.com" className="bg-white rounded-xl border border-[#E1E1E1] p-4 hover:border-[#008060] transition"><Mail className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">Contacter le support</p><p className="text-xs text-[#6D7175]">Réponse sous 24h</p></a>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><Video className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">Tutoriels vidéo</p><p className="text-xs text-[#6D7175]">Apprenez visuellement</p></div>
        <div className="bg-white rounded-xl border border-[#E1E1E1] p-4"><MessageSquare className="w-5 h-5 text-[#008060] mb-2" /><p className="text-sm font-bold text-[#202223]">Communauté</p><p className="text-xs text-[#6D7175]">Échangez avec d'autres marchands</p></div>
      </div>

      <div className="space-y-2">
        {filtered.map((cat) => (
          <div key={cat.id} className="bg-white rounded-xl border border-[#E1E1E1] overflow-hidden">
            <button onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-[#F4F4F4]">
              <div className="flex items-center gap-2.5"><cat.icon className="w-4 h-4 text-[#008060]" /><span className="text-sm font-bold text-[#202223]">{cat.label}</span><span className="text-xs text-[#6D7175]">({cat.articles.length})</span></div>
              <ChevronDown className={`w-4 h-4 text-[#6D7175] transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`} />
            </button>
            {openCat === cat.id && (
              <div className="border-t border-[#E1E1E1] divide-y divide-[#E1E1E1]">
                {cat.articles.map((a, i) => (
                  <div key={i}>
                    <button onClick={() => setOpenArt(openArt === cat.id + i ? null : cat.id + i)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#F4F4F4] text-left">
                      <span className="text-sm font-medium text-[#202223]">{a.t}</span>
                      <ChevronDown className={`w-4 h-4 text-[#6D7175] transition-transform ${openArt === cat.id + i ? 'rotate-180' : ''}`} />
                    </button>
                    {openArt === cat.id + i && <div className="px-4 pb-4 text-sm text-[#6D7175] leading-relaxed">{a.body}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}