const FLAGS = [
  'us','fr','gb','de','es','pt','it','nl','be','ru','se','no','fi','dk','pl','ch','at','ie','gr','cz',
  'cn','jp','kr','in','id','th','vn','my','ph','sg','hk','tw','sa','ae','qa','kw','om','jo','lb','il',
  'tr','ir','iq','pk','bd','lk','kz','uz','mn','kh','mm','af','np','az','am','ge',
  'sn','ng','ci','gh','cm','eg','za','ke','ma','tz','ug','et','dz','tn','ly','ml','bf','ne','tg','bj',
  'cd','cg','ga','mg','rw','mu','sc','cv','st','gq','td','lr','sl','mr','er','dj','so','sz','ls','bw',
  'na','zm','zw','mz','ao','gh','ng','sn',
  'br','mx','ar','co','cl','pe','ve','ec','bo','py','uy','cr','pa','do','gt','hn','sv','ni','cu','pr',
  'us','ca','au','nz',
];

export default function LandingFlags() {
  const list = [...FLAGS.slice(0, 80), ...FLAGS.slice(0, 80)];
  return (
    <section className="py-10 bg-[#F8F9FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center mb-5">
        <p className="text-sm font-bold text-[#202223] uppercase tracking-wide">Disponible dans le monde entier</p>
        <p className="text-xs text-[#6D7175] mt-1">Vendez partout — Sellia est une plateforme globale</p>
      </div>
      <div className="relative overflow-hidden">
        <div className="flex gap-2 w-max animate-scroll-x-slow">
          {list.map((code, i) => (
            <div key={i} className="shrink-0 w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm hover:scale-110 transition-transform duration-300">
              <img src={`https://flagcdn.com/w80/${code}.png`} alt={code} className="w-full h-full object-cover" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}