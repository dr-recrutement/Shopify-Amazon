import json

EN = {
  "about": {
    "meta_title": "About Sellia",
    "meta_desc": "Sellia is the premium e-commerce platform built by Liafrik so any merchant can launch, run and grow an online store internationally.",
    "h1": "About Sellia",
    "hero_p": "Sellia is built by Liafrik to give merchants everywhere a premium alternative to the big e-commerce platforms — more complete on local payments, simpler to use, and designed to sell internationally from day one.",
    "stats": [
      {"value": "12,000+", "label": "active merchants"},
      {"value": "25+", "label": "integrated payment methods"},
      {"value": "7", "label": "languages available"},
      {"value": "4.9/5", "label": "average satisfaction"}
    ],
    "mission_h2": "Our mission",
    "mission_p": "Give every merchant — from Abidjan to Paris, from Lagos to Montreal — the same premium tools as the biggest brands, without the technical complexity or hidden costs of legacy platforms.",
    "values": [
      {"title": "A global ambition", "text": "Sellia is built to sell anywhere in the world: native multi-currency, Mobile Money and international cards in one platform."},
      {"title": "Premium as the standard", "text": "Polished themes, no-redirect checkout, security and performance aren't paid add-ons — they're the baseline on every plan."},
      {"title": "Merchants, not tickets", "text": "Every feature starts from a real merchant need, not a marketing checkbox."},
      {"title": "AI at the service of commerce", "text": "Sellia Assistant generates content, themes and SEO optimizations so you can focus on your products and customers."}
    ],
    "cta_h2": "Want to join the Sellia adventure?",
    "cta_p": "Launch your store today, or check out our open roles.",
    "cta_button1": "Create my store",
    "cta_button2": "See careers"
  },
  "contact": {
    "meta_title": "Contact",
    "meta_desc": "Get in touch with the Sellia team: technical support, customer service or social media. We reply quickly to every merchant.",
    "h1": "Contact us",
    "hero_p": "A team available to answer your questions, before and after you sign up.",
    "channel1_title": "Technical support",
    "channel1_text": "A question about your store, a bug, a feature?",
    "channel2_title": "Customer service",
    "channel2_text": "Billing, orders, your merchant account.",
    "follow_title": "Follow Sellia",
    "follow_p": "Product news, updates and behind the scenes of the platform."
  },
  "careers": {
    "meta_title": "Careers",
    "meta_desc": "Join the Liafrik team building Sellia, the premium e-commerce platform. Discover our mission and how to apply.",
    "h1": "Careers at Sellia",
    "hero_p": "Sellia is built by the Liafrik team. We're growing fast and always keen to meet talented people — even outside our published openings.",
    "reasons": [
      {"title": "International impact", "text": "Your work serves merchants across several continents, from day one."},
      {"title": "A fast-moving product", "text": "New features, new markets, new payment methods — the team moves fast and ships often."},
      {"title": "A human-sized team", "text": "At Liafrik, every person counts and has a direct, visible impact on the product."}
    ],
    "spontaneous_h2": "No open role matches your profile?",
    "spontaneous_p": "Send us a spontaneous application — we read every message.",
    "spontaneous_button": "Apply by email"
  }
}
json.dump(EN, open('/tmp/i18n2/en.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

ES = {
  "about": {
    "meta_title": "Sobre Sellia",
    "meta_desc": "Sellia es la plataforma de e-commerce premium desarrollada por Liafrik para que cualquier comerciante pueda lanzar, gestionar y hacer crecer una tienda online a nivel internacional.",
    "h1": "Sobre Sellia",
    "hero_p": "Sellia está desarrollada por Liafrik para ofrecer a los comerciantes de todo el mundo una alternativa premium a las grandes plataformas de e-commerce — más completa en pagos locales, más fácil de usar, y pensada para vender a nivel internacional desde el primer día.",
    "stats": [
      {"value": "12.000+", "label": "comerciantes activos"},
      {"value": "25+", "label": "métodos de pago integrados"},
      {"value": "7", "label": "idiomas disponibles"},
      {"value": "4,9/5", "label": "satisfacción media"}
    ],
    "mission_h2": "Nuestra misión",
    "mission_p": "Dar a todo comerciante — de Abiyán a París, de Lagos a Montreal — las mismas herramientas premium que las grandes marcas, sin la complejidad técnica ni los costes ocultos de las plataformas tradicionales.",
    "values": [
      {"title": "Una ambición global", "text": "Sellia está diseñada para vender en cualquier parte del mundo: multi-moneda nativa, Mobile Money y tarjetas internacionales en una sola plataforma."},
      {"title": "Lo premium como estándar", "text": "Temas cuidados, checkout sin redirección, seguridad y rendimiento no son extras de pago — son la base de cada plan."},
      {"title": "Comerciantes, no tickets", "text": "Cada funcionalidad parte de una necesidad real del comerciante, no de una casilla de marketing."},
      {"title": "La IA al servicio del comercio", "text": "Sellia Assistant genera contenidos, temas y optimizaciones SEO para que te centres en tus productos y tus clientes."}
    ],
    "cta_h2": "¿Quieres unirte a la aventura Sellia?",
    "cta_p": "Lanza tu tienda hoy, o descubre nuestras ofertas de empleo.",
    "cta_button1": "Crear mi tienda",
    "cta_button2": "Ver carreras"
  },
  "contact": {
    "meta_title": "Contacto",
    "meta_desc": "Contacta con el equipo de Sellia: soporte técnico, atención al cliente o redes sociales. Respondemos rápido a todos los comerciantes.",
    "h1": "Contáctanos",
    "hero_p": "Un equipo disponible para responder tus preguntas, antes y después de registrarte.",
    "channel1_title": "Soporte técnico",
    "channel1_text": "¿Una pregunta sobre tu tienda, un error, una función?",
    "channel2_title": "Atención al cliente",
    "channel2_text": "Facturación, pedidos, tu cuenta de comerciante.",
    "follow_title": "Sigue a Sellia",
    "follow_p": "Novedades de producto, actualizaciones y detrás de escena de la plataforma."
  },
  "careers": {
    "meta_title": "Empleo",
    "meta_desc": "Únete al equipo de Liafrik que desarrolla Sellia, la plataforma de e-commerce premium. Descubre nuestra misión y cómo postular.",
    "h1": "Empleo en Sellia",
    "hero_p": "Sellia está desarrollada por el equipo de Liafrik. Crecemos rápido y siempre estamos atentos a perfiles con talento — incluso fuera de nuestras ofertas publicadas.",
    "reasons": [
      {"title": "Impacto internacional", "text": "Tu trabajo sirve a comerciantes en varios continentes, desde el primer día."},
      {"title": "Un producto que avanza rápido", "text": "Nuevas funcionalidades, nuevos mercados, nuevos métodos de pago — el equipo avanza rápido y lanza a menudo."},
      {"title": "Un equipo a escala humana", "text": "En Liafrik, cada persona cuenta y tiene un impacto directo y visible en el producto."}
    ],
    "spontaneous_h2": "¿Ninguna vacante coincide con tu perfil?",
    "spontaneous_p": "Envíanos tu candidatura espontánea — leemos todos los mensajes.",
    "spontaneous_button": "Postular por email"
  }
}
json.dump(ES, open('/tmp/i18n2/es.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

PT = {
  "about": {
    "meta_title": "Sobre a Sellia",
    "meta_desc": "A Sellia é a plataforma de e-commerce premium desenvolvida pela Liafrik para que qualquer comerciante possa lançar, gerir e desenvolver uma loja online a nível internacional.",
    "h1": "Sobre a Sellia",
    "hero_p": "A Sellia é desenvolvida pela Liafrik para dar aos comerciantes de todo o mundo uma alternativa premium às grandes plataformas de e-commerce — mais completa nos pagamentos locais, mais simples de usar, e pensada para vender a nível internacional desde o primeiro dia.",
    "stats": [
      {"value": "12.000+", "label": "comerciantes ativos"},
      {"value": "25+", "label": "métodos de pagamento integrados"},
      {"value": "7", "label": "idiomas disponíveis"},
      {"value": "4,9/5", "label": "satisfação média"}
    ],
    "mission_h2": "A nossa missão",
    "mission_p": "Dar a cada comerciante — de Abidjan a Paris, de Lagos a Montreal — as mesmas ferramentas premium das maiores marcas, sem a complexidade técnica nem os custos ocultos das plataformas tradicionais.",
    "values": [
      {"title": "Uma ambição global", "text": "A Sellia é concebida para vender em qualquer lugar do mundo: multi-moeda nativa, Mobile Money e cartões internacionais numa só plataforma."},
      {"title": "O premium como padrão", "text": "Temas cuidados, checkout sem redirecionamento, segurança e desempenho não são extras pagos — são a base de cada plano."},
      {"title": "Comerciantes, não tickets", "text": "Cada funcionalidade parte de uma necessidade real do comerciante, não de uma caixa de marketing."},
      {"title": "A IA ao serviço do comércio", "text": "O Sellia Assistant gera conteúdos, temas e otimizações de SEO para que se concentre nos seus produtos e clientes."}
    ],
    "cta_h2": "Quer juntar-se à aventura Sellia?",
    "cta_p": "Lance a sua loja hoje, ou descubra as nossas vagas.",
    "cta_button1": "Criar a minha loja",
    "cta_button2": "Ver carreiras"
  },
  "contact": {
    "meta_title": "Contacto",
    "meta_desc": "Contacte a equipa Sellia: suporte técnico, apoio ao cliente ou redes sociais. Respondemos rapidamente a todos os comerciantes.",
    "h1": "Contacte-nos",
    "hero_p": "Uma equipa disponível para responder às suas questões, antes e depois do registo.",
    "channel1_title": "Suporte técnico",
    "channel1_text": "Uma questão sobre a sua loja, um erro, uma funcionalidade?",
    "channel2_title": "Apoio ao cliente",
    "channel2_text": "Faturação, encomendas, a sua conta de comerciante.",
    "follow_title": "Siga a Sellia",
    "follow_p": "Novidades de produto, atualizações e bastidores da plataforma."
  },
  "careers": {
    "meta_title": "Carreiras",
    "meta_desc": "Junte-se à equipa Liafrik que desenvolve a Sellia, a plataforma de e-commerce premium. Descubra a nossa missão e como candidatar-se.",
    "h1": "Carreiras na Sellia",
    "hero_p": "A Sellia é desenvolvida pela equipa Liafrik. Estamos a crescer rapidamente e sempre atentos a perfis talentosos — mesmo fora das nossas vagas publicadas.",
    "reasons": [
      {"title": "Impacto internacional", "text": "O seu trabalho serve comerciantes em vários continentes, desde o primeiro dia."},
      {"title": "Um produto que avança rápido", "text": "Novas funcionalidades, novos mercados, novos métodos de pagamento — a equipa avança rápido e lança frequentemente."},
      {"title": "Uma equipa à escala humana", "text": "Na Liafrik, cada pessoa conta e tem um impacto direto e visível no produto."}
    ],
    "spontaneous_h2": "Nenhuma vaga aberta corresponde ao seu perfil?",
    "spontaneous_p": "Envie-nos a sua candidatura espontânea — lemos todas as mensagens.",
    "spontaneous_button": "Candidatar-se por email"
  }
}
json.dump(PT, open('/tmp/i18n2/pt.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

AR = {
  "about": {
    "meta_title": "عن Sellia",
    "meta_desc": "Sellia هي منصة التجارة الإلكترونية المتميزة التي طورتها Liafrik لتمكين أي تاجر من إطلاق متجر إلكتروني وإدارته وتطويره على الصعيد الدولي.",
    "h1": "عن Sellia",
    "hero_p": "طوّرت Liafrik منصة Sellia لتمنح التجار حول العالم بديلاً متميزاً لمنصات التجارة الإلكترونية الكبرى — أكثر اكتمالاً في وسائل الدفع المحلية، وأسهل في الاستخدام، ومصممة للبيع دولياً منذ اليوم الأول.",
    "stats": [
      {"value": "+12,000", "label": "تاجر نشط"},
      {"value": "+25", "label": "وسيلة دفع متكاملة"},
      {"value": "7", "label": "لغات متاحة"},
      {"value": "4.9/5", "label": "متوسط الرضا"}
    ],
    "mission_h2": "مهمتنا",
    "mission_p": "منح كل تاجر — من أبيدجان إلى باريس، ومن لاغوس إلى مونتريال — نفس الأدوات المتميزة التي تستخدمها أكبر العلامات التجارية، دون التعقيد التقني أو التكاليف الخفية للمنصات التقليدية.",
    "values": [
      {"title": "طموح عالمي", "text": "صُممت Sellia للبيع في أي مكان في العالم: عملات متعددة أصيلة، ودفع عبر الهاتف، وبطاقات دولية في منصة واحدة."},
      {"title": "التميز كمعيار أساسي", "text": "القوالب الأنيقة، والدفع دون إعادة توجيه، والأمان والأداء ليست خيارات إضافية مدفوعة — بل هي الأساس في كل خطة."},
      {"title": "تجار، لا تذاكر دعم", "text": "كل ميزة تنطلق من حاجة حقيقية للتاجر، لا من بند تسويقي."},
      {"title": "الذكاء الاصطناعي في خدمة التجارة", "text": "يُنشئ مساعد Sellia المحتوى والقوالب وتحسينات تحسين محركات البحث لتتفرغ لمنتجاتك وعملائك."}
    ],
    "cta_h2": "هل تريد الانضمام إلى مغامرة Sellia؟",
    "cta_p": "أطلق متجرك اليوم، أو اكتشف فرص العمل لدينا.",
    "cta_button1": "إنشاء متجري",
    "cta_button2": "عرض الوظائف"
  },
  "contact": {
    "meta_title": "اتصل بنا",
    "meta_desc": "تواصل مع فريق Sellia: الدعم الفني، خدمة العملاء أو وسائل التواصل الاجتماعي. نرد بسرعة على جميع التجار.",
    "h1": "تواصل معنا",
    "hero_p": "فريق متاح للإجابة على أسئلتك، قبل التسجيل وبعده.",
    "channel1_title": "الدعم الفني",
    "channel1_text": "سؤال حول متجرك، خلل تقني، أو ميزة معينة؟",
    "channel2_title": "خدمة العملاء",
    "channel2_text": "الفوترة، الطلبات، حساب التاجر الخاص بك.",
    "follow_title": "تابع Sellia",
    "follow_p": "أخبار المنتج، التحديثات، وكواليس المنصة."
  },
  "careers": {
    "meta_title": "الوظائف",
    "meta_desc": "انضم إلى فريق Liafrik الذي يطور Sellia، منصة التجارة الإلكترونية المتميزة. اكتشف مهمتنا وكيفية التقديم.",
    "h1": "الوظائف في Sellia",
    "hero_p": "طوّر فريق Liafrik منصة Sellia. نحن ننمو بسرعة ودائماً منفتحون على الكفاءات الموهوبة — حتى خارج الوظائف المعلنة.",
    "reasons": [
      {"title": "تأثير دولي", "text": "عملك يخدم تجاراً في عدة قارات، منذ اليوم الأول."},
      {"title": "منتج يتطور بسرعة", "text": "ميزات جديدة، أسواق جديدة، وسائل دفع جديدة — يتحرك الفريق بسرعة وينشر التحديثات باستمرار."},
      {"title": "فريق بحجم إنساني", "text": "في Liafrik، كل شخص يُحدث فرقاً وله تأثير مباشر وملموس على المنتج."}
    ],
    "spontaneous_h2": "لا توجد وظيفة شاغرة تناسب ملفك؟",
    "spontaneous_p": "أرسل لنا طلب توظيف تلقائياً — نقرأ كل رسالة.",
    "spontaneous_button": "التقديم عبر البريد الإلكتروني"
  }
}
json.dump(AR, open('/tmp/i18n2/ar.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

SW = {
  "about": {
    "meta_title": "Kuhusu Sellia",
    "meta_desc": "Sellia ni jukwaa la biashara mtandaoni la kiwango cha juu lililoundwa na Liafrik ili kuwezesha mfanyabiashara yeyote kuanzisha, kusimamia na kukuza duka la mtandaoni kimataifa.",
    "h1": "Kuhusu Sellia",
    "hero_p": "Sellia imeundwa na Liafrik kuwapa wafanyabiashara duniani kote mbadala wa kiwango cha juu kwa majukwaa makubwa ya biashara mtandaoni — kamili zaidi kuhusu malipo ya ndani, rahisi zaidi kutumia, na iliyoundwa kuuza kimataifa tangu siku ya kwanza.",
    "stats": [
      {"value": "12,000+", "label": "wafanyabiashara amilifu"},
      {"value": "25+", "label": "njia za malipo zilizounganishwa"},
      {"value": "7", "label": "lugha zinazopatikana"},
      {"value": "4.9/5", "label": "kuridhika kwa wastani"}
    ],
    "mission_h2": "Dhamira yetu",
    "mission_p": "Kumpa kila mfanyabiashara — kutoka Abidjan hadi Paris, kutoka Lagos hadi Montreal — zana zilezile za kiwango cha juu zinazotumiwa na chapa kubwa zaidi, bila utata wa kiufundi au gharama zilizofichwa za majukwaa ya zamani.",
    "values": [
      {"title": "Lengo la kimataifa", "text": "Sellia imeundwa kuuza popote duniani: sarafu nyingi asilia, Pesa za Simu na kadi za kimataifa katika jukwaa moja."},
      {"title": "Ubora kama kiwango cha kawaida", "text": "Miundo mizuri, malipo bila kuelekezwa pengine, usalama na utendaji si nyongeza za kulipia — ni msingi wa kila mpango."},
      {"title": "Wafanyabiashara, si tiketi za msaada", "text": "Kila kipengele kinaanza na hitaji halisi la mfanyabiashara, si kipengele cha uuzaji tu."},
      {"title": "AI katika huduma ya biashara", "text": "Sellia Assistant huzalisha maudhui, miundo na uboreshaji wa SEO ili uweze kuzingatia bidhaa na wateja wako."}
    ],
    "cta_h2": "Unataka kujiunga na safari ya Sellia?",
    "cta_p": "Anzisha duka lako leo, au gundua nafasi zetu za kazi.",
    "cta_button1": "Unda duka langu",
    "cta_button2": "Angalia kazi"
  },
  "contact": {
    "meta_title": "Wasiliana nasi",
    "meta_desc": "Wasiliana na timu ya Sellia: msaada wa kiufundi, huduma kwa wateja au mitandao ya kijamii. Tunajibu haraka kwa wafanyabiashara wote.",
    "h1": "Wasiliana nasi",
    "hero_p": "Timu inayopatikana kujibu maswali yako, kabla na baada ya kujisajili.",
    "channel1_title": "Msaada wa kiufundi",
    "channel1_text": "Swali kuhusu duka lako, hitilafu, au kipengele fulani?",
    "channel2_title": "Huduma kwa wateja",
    "channel2_text": "Malipo, maagizo, akaunti yako ya mfanyabiashara.",
    "follow_title": "Fuata Sellia",
    "follow_p": "Habari za bidhaa, masasisho na nyuma ya pazia ya jukwaa."
  },
  "careers": {
    "meta_title": "Kazi",
    "meta_desc": "Jiunge na timu ya Liafrik inayoendeleza Sellia, jukwaa la biashara mtandaoni la kiwango cha juu. Gundua dhamira yetu na jinsi ya kuomba kazi.",
    "h1": "Kazi katika Sellia",
    "hero_p": "Sellia imeundwa na timu ya Liafrik. Tunakua haraka na daima tuko tayari kukutana na watu wenye vipaji — hata nje ya nafasi zetu zilizochapishwa.",
    "reasons": [
      {"title": "Athari ya kimataifa", "text": "Kazi yako inahudumia wafanyabiashara katika mabara kadhaa, tangu siku ya kwanza."},
      {"title": "Bidhaa inayoenda haraka", "text": "Vipengele vipya, masoko mapya, njia mpya za malipo — timu inasonga haraka na kutoa masasisho mara kwa mara."},
      {"title": "Timu ya kibinadamu", "text": "Katika Liafrik, kila mtu ana thamani na ana athari ya moja kwa moja na inayoonekana kwenye bidhaa."}
    ],
    "spontaneous_h2": "Hakuna nafasi ya kazi inayolingana na wasifu wako?",
    "spontaneous_p": "Tutumie maombi yako ya hiari — tunasoma kila ujumbe.",
    "spontaneous_button": "Omba kwa barua pepe"
  }
}
json.dump(SW, open('/tmp/i18n2/sw.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

WO = {
  "about": {
    "meta_title": "Ci Sellia",
    "meta_desc": "Sellia mooy plateforme e-commerce bu premium bu Liafrik sos ngir marchand kepp mën na tambali, yor te yokku boutique ci internet ci àdduna bépp.",
    "h1": "Ci Sellia",
    "hero_p": "Liafrik moo sos Sellia ngir jox marchand yi ci àdduna bépp alternative bu premium ci plateforme yu mag yi — mat sëkk ci fay yu ci diggante bu am, yomb jëfandikoo, te defar ngir jaay ci àdduna bépp li dale ci bis bu njëkk.",
    "stats": [
      {"value": "12 000+", "label": "marchand yu aktiif"},
      {"value": "25+", "label": "fecc fay yu boole"},
      {"value": "7", "label": "làkk yu am"},
      {"value": "4,9/5", "label": "bànneex bu digg"}
    ],
    "mission_h2": "Sunu mission",
    "mission_p": "Jox marchand bépp — Abidjan ba Paris, Lagos ba Montréal — menn menn outil premium yi marque yu mag yi jëfandikoo, te laalul complexité technique walla depense yu nëbbu ci plateforme yu bees yi.",
    "values": [
      {"title": "Am solo ci àdduna bépp", "text": "Sellia defar nañu ko ngir jaay fu nekk ci àdduna bi: xaalis yu bari ci njëkk, Mobile Money ak kart internationale ci benn plateforme."},
      {"title": "Premium mooy standard", "text": "Thème yu rafet, checkout bu jógul fenn, kaaraange ak performance duñu option bu fay — mooy base bu plan bépp."},
      {"title": "Marchand, du ticket", "text": "Fonctionnalité bépp dafay jóge ci soxla bu marchand bu wóor, du ci case marketing rekk."},
      {"title": "IA ci service commerce", "text": "Sellia Assistant dafay jur contenu, thème ak optimisation SEO ngir nga mën a jub sa produit ak sa client."}
    ],
    "cta_h2": "Bëgg nga bokk ci aventure Sellia?",
    "cta_p": "Tambali sa boutique tey, walla xool sunu offre liggéey yi.",
    "cta_button1": "Sos sama boutique",
    "cta_button2": "Xool liggéey yi"
  },
  "contact": {
    "meta_title": "Jokkoo ak ñun",
    "meta_desc": "Jokkoo ak équipe Sellia bi: ndimbal technique, service client walla réseaux sociaux. Dañu tontu gaaw ci marchand yépp.",
    "h1": "Jokkoo ak ñun",
    "hero_p": "Benn équipe am ngir tontu say laaj, virementaire sa inscription ba ci gannaaw.",
    "channel1_title": "Ndimbal technique",
    "channel1_text": "Benn laaj ci sa boutique, benn bug, walla benn fonctionnalité?",
    "channel2_title": "Service client",
    "channel2_text": "Facturation, commande yi, sa compte marchand.",
    "follow_title": "Topp Sellia",
    "follow_p": "Xibaar produit yi, bees yi ak li ci biir plateforme bi."
  },
  "careers": {
    "meta_title": "Liggéey yi",
    "meta_desc": "Bokk ci équipe Liafrik bi di defar Sellia, plateforme e-commerce bu premium. Xam sunu mission ak nu nga mën a postulé.",
    "h1": "Liggéey ci Sellia",
    "hero_p": "Sellia dafa defar ak équipe Liafrik. Dañuy yokku gaaw te dañuy seetaan ay jëfandikukat yu am talent — hoolla su fekkee amul offre publié.",
    "reasons": [
      {"title": "Impact ci àdduna bépp", "text": "Sa liggéey day jappale marchand ci plusieurs continent, li dale ci bis bu njëkk."},
      {"title": "Produit buy yëngu gaaw", "text": "Fonctionnalité yu bees, marché yu bees, fecc fay yu bees — équipe bi dafay yëngu gaaw te di publié bés bu nekk."},
      {"title": "Équipe bu ndaw", "text": "Ci Liafrik, nit kupp am solo te am impact bu jub te feeñ ci produit bi."}
    ],
    "spontaneous_h2": "Amul poste ubbi bu mel ni say compétence?",
    "spontaneous_p": "Yónnee nu sa candidature spontanée — dañuy jàng message bépp.",
    "spontaneous_button": "Postulé ci email"
  }
}
json.dump(WO, open('/tmp/i18n2/wo.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("all 6 written")
