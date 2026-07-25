/* 7F Fitness Club — главная страница
   React + Tailwind + Framer Motion (single-file app)
   Отредактируй тексты здесь, затем пересобери: см. README (npm run build).
   Быстрая правка без сборки: можно менять и assets/app.js напрямую. */

const { useState, useEffect, useRef } = React;

/* ---- Framer Motion со страховкой, если UMD-глобал отличается ---- */
const FM = window.Motion || window.FramerMotion || window.framerMotion || {};
const AnimatePresence = FM.AnimatePresence || (({ children }) => children);
const useScroll = FM.useScroll || (() => ({ scrollYProgress: { get: () => 0, onChange: () => {} } }));
const useTransform = FM.useTransform || ((v, a, b) => (b ? b[0] : 0));
const motion = FM.motion || new Proxy({}, {
  get: (_, tag) => React.forwardRef((props, ref) => {
    const { initial, animate, exit, transition, variants, whileInView, whileHover, whileTap, viewport, style, ...rest } = props;
    return React.createElement(typeof tag === 'string' ? tag : 'div', { ref, style, ...rest });
  })
});

const ease = [0.22, 1, 0.36, 1];

/* ---------------- Данные ---------------- */
const TRAINERS = [
  { name:'Хайдер Алзамили', spec:'Силовой тренинг · Техника',
    desc:'Дисциплина и чистая техника — от первого повторения до личного рекорда.', tag:'ДЕЖУРНЫЙ', photo:'assets/trainers/haider.jpg' },
  { name:'Денис Давыдов', spec:'Сила · Гипертрофия',
    desc:'Ведёт клуб к результату. Строит силу и форму без компромиссов.', tag:'СТАРШИЙ', photo:'assets/trainers/denis.jpg' },
  { name:'Сергей Давыдов', spec:'Пауэрлифтинг · Сила',
    desc:'Тяжёлая база, чистая техника, максимальные веса под контролем.', tag:'ДЕЖУРНЫЙ', photo:'assets/trainers/sergey.jpg' },
  { name:'Антон Ченский', spec:'Функциональный тренинг',
    desc:'Взрывная работа, выносливость и атлетичное тело.', tag:'ДЕЖУРНЫЙ', photo:'assets/trainers/anton.jpg' },
  { name:'Елена Соболь', spec:'Женский тренинг · Стретчинг',
    desc:'Женские программы, растяжка и уверенность в каждом движении.', tag:'ДЕЖУРНЫЙ', photo:'assets/trainers/elena.jpg' },
  { name:'Александр Кравцов', spec:'Набор массы · Молодёжные программы',
    desc:'Молодая энергия. Набор массы и первые серьёзные рекорды.', tag:'ТРЕНЕР', photo:'assets/trainers/alexandr.jpg' },
];

const PLANS = [
  { key:'night', name:'Ночной',  price:'9 900',  unit:'₽', note:'23:00 — 07:00', sub:'Годовой абонемент' },
  { key:'day',   name:'Дневной', price:'9 900',  unit:'₽', note:'07:00 — 16:00', sub:'Годовой абонемент' },
  { key:'u12',   name:'Безлимит',price:'14 900', unit:'₽', note:'12 месяцев',    sub:'Безлимит · +28 дней заморозки' },
  { key:'u6',    name:'Безлимит',price:'8 990',  unit:'₽', note:'6 месяцев',     sub:'Безлимитное посещение' },
  { key:'u3',    name:'Безлимит',price:'6 990',  unit:'₽', note:'3 месяца',      sub:'Безлимитное посещение' },
  { key:'u1',    name:'Безлимит',price:'4 990',  unit:'₽', note:'1 месяц',       sub:'Безлимитное посещение' },
];

const NAV = [
  { label:'Клуб', href:'#about' },
  { label:'Абонементы', href:'#membership' },
  { label:'Тренеры', href:'#trainers' },
  { label:'Тренировки', href:'#classes' },
  { label:'Контакты', href:'#contact' },
];

const PHONE = '+7 (861) 991-30-77';
const PHONE_HREF = 'tel:+78619913077';

/* ---------------- Хелперы ---------------- */
const Reveal = ({ children, delay=0, y=28, className='' }) => (
  <motion.div className={className}
    initial={{ opacity:0, y }} whileInView={{ opacity:1, y:0 }}
    viewport={{ once:true, margin:'-80px' }} transition={{ duration:0.9, delay, ease }}>
    {children}
  </motion.div>
);

const Logo = ({ className='' }) => (
  <a href="#top" className={"flex items-center gap-2 select-none "+className}>
    <span className="font-display font-extrabold text-2xl tracking-tight leading-none">
      <span className="text-white">7</span><span className="text-accent">F</span>
    </span>
    <span className="hidden sm:block text-[10px] tracking-[0.32em] text-mute font-medium pt-1">ФИТНЕС-КЛУБ</span>
  </a>
);

/* ---------------- Хедер ---------------- */
function Header(){
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(()=>{
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll(); window.addEventListener('scroll', onScroll, { passive:true });
    return () => window.removeEventListener('scroll', onScroll);
  },[]);
  useEffect(()=>{ document.body.style.overflow = open ? 'hidden' : ''; },[open]);

  return (
    <>
      <motion.header
        initial={{ y:-40, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.8, ease, delay:0.2 }}
        className={"fixed top-0 inset-x-0 z-50 transition-all duration-500 "+
          (scrolled ? "bg-black/50 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5")}>
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 flex items-center justify-between">
          <Logo />
          <nav className="hidden lg:flex items-center gap-9">
            {NAV.map(n=>(
              <a key={n.label} href={n.href}
                 className="text-[13px] tracking-wide text-white/70 hover:text-white transition-colors relative group">
                {n.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent group-hover:w-full transition-all duration-300"></span>
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a href="#membership"
               className="hidden sm:inline-flex items-center rounded-full bg-white text-ink text-[13px] font-semibold px-5 py-2.5 hover:bg-accent hover:text-white transition-colors duration-300">
              Записаться
            </a>
            <button aria-label="Меню" onClick={()=>setOpen(true)} className="lg:hidden inline-flex flex-col gap-[5px] p-2">
              <span className="block h-px w-6 bg-white"></span>
              <span className="block h-px w-6 bg-white"></span>
              <span className="block h-px w-6 bg-white"></span>
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="fixed inset-0 z-[60] bg-ink/95 backdrop-blur-xl lg:hidden">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/10">
              <Logo />
              <button aria-label="Закрыть" onClick={()=>setOpen(false)} className="p-2 text-2xl leading-none">✕</button>
            </div>
            <nav className="flex flex-col px-6 pt-10 gap-2">
              {NAV.map((n,i)=>(
                <motion.a key={n.label} href={n.href} onClick={()=>setOpen(false)}
                  initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} transition={{ delay:0.05*i+0.1 }}
                  className="font-display font-extrabold text-4xl py-3 border-b border-white/5 tracking-tight">
                  {n.label}
                </motion.a>
              ))}
              <a href="#membership" onClick={()=>setOpen(false)}
                 className="mt-8 inline-flex justify-center rounded-full bg-accent text-white font-semibold px-6 py-4 text-lg">
                Записаться
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------------- Hero ---------------- */
function Hero(){
  const heroVars = { hidden:{}, show:{ transition:{ staggerChildren:0.12, delayChildren:0.3 } } };
  const line = { hidden:{ y:'110%' }, show:{ y:'0%', transition:{ duration:1.1, ease } } };
  return (
    <section id="top" className="relative h-[100svh] w-full overflow-hidden grain">
      <video className="kenburns absolute inset-0 h-full w-full object-cover"
        src="assets/hero.mp4" autoPlay muted loop playsInline preload="auto" />
      <div className="absolute inset-0 bg-black/45"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>

      <div className="relative z-10 h-full mx-auto max-w-[1400px] px-5 sm:px-8 flex flex-col justify-center">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2,duration:0.8,ease}}
          className="mb-6 inline-flex items-center gap-3 w-max rounded-full border border-white/20 bg-white/5 backdrop-blur px-4 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse"></span>
          <span className="text-[11px] tracking-[0.28em] text-white/80 font-medium">7F · ПРЕМИУМ-КЛУБ · 24/7</span>
        </motion.div>

        <motion.h1 variants={heroVars} initial="hidden" animate="show"
          className="font-display font-extrabold text-white display-tight text-[clamp(3.1rem,10vw,8rem)]">
          <span className="block overflow-hidden"><motion.span variants={line} className="block">ТРЕНИРУЙСЯ</motion.span></span>
          <span className="block overflow-hidden"><motion.span variants={line} className="block">БЕЗ <span className="text-accent">ГРАНИЦ</span></motion.span></span>
        </motion.h1>

        <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1,duration:0.9,ease}}
          className="mt-7 max-w-md text-mute text-base sm:text-lg leading-relaxed">
          Пространство, где сила становится привычкой. Оборудование, тренеры и атмосфера уровня, которого ты ещё не встречал.
        </motion.p>

        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:1.15,duration:0.9,ease}}
          className="mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <a href="#membership"
             className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white font-semibold px-8 py-4 text-[15px] hover:bg-accentSoft transition-all duration-300 hover:scale-[1.03]">
            Записаться <span className="transition-transform group-hover:translate-x-1">→</span>
          </a>
          <a href="#about"
             className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur text-white font-medium px-8 py-4 text-[15px] hover:bg-white/10 hover:border-white/40 transition-all duration-300">
            Узнать больше
          </a>
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
        <span className="text-[10px] tracking-[0.3em] text-white/60">ВНИЗ</span>
        <motion.span animate={{ y:[0,8,0] }} transition={{ duration:1.8, repeat:Infinity, ease:'easeInOut' }}
          className="text-white/70 text-lg leading-none">↓</motion.span>
      </div>
    </section>
  );
}

/* ---------------- 7F Kinetic Core (3D-секция) ----------------
   HTML-текст живёт здесь (SEO/доступность), 3D — в assets/kinetic-core.js,
   грузится лениво при приближении секции. Классами .is-on управляет 3D-модуль. */
const KC_ITEMS = ['СИЛА','ВЫНОСЛИВОСТЬ','СКОРОСТЬ','МОБИЛЬНОСТЬ','ДИСЦИПЛИНА','ВОССТАНОВЛЕНИЕ','РЕЗУЛЬТАТ'];

function KineticCore(){
  const rootRef = useRef(null);
  useEffect(()=>{
    const root = rootRef.current;
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const reduced = params.has('kc-reduced') ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glOk = !params.has('kc-nowebgl') && (()=>{
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch(e){ return false; }
    })();

    const showAll = () => root.querySelectorAll('.kc-el, .kc-item, .kc-final')
      .forEach(el => el.classList.add('is-on'));

    if (reduced) { root.classList.add('kc-reduced'); showAll(); }
    if (!glOk) { root.classList.add('kc-fallback'); showAll(); return; }

    let destroyed = false, api = null;
    const io = new IntersectionObserver((es)=>{
      if (!es.some(e=>e.isIntersecting)) return;
      io.disconnect();
      import('./kinetic-core.js')
        .then(m => { if (!destroyed) api = m.initKineticCore({ root, reduced }); })
        .catch(() => { root.classList.add('kc-fallback'); showAll(); });
    }, { rootMargin:'450px 0px' });
    /* не грузить 3D раньше, чем страница (включая hero-видео) закончит загрузку */
    const startObserving = () => { if (!destroyed) io.observe(root); };
    if (document.readyState === 'complete') startObserving();
    else window.addEventListener('load', startObserving, { once:true });

    return ()=>{
      destroyed = true;
      window.removeEventListener('load', startObserving);
      io.disconnect();
      if (api) api.destroy();
    };
  },[]);

  return (
    <section id="kinetic" ref={rootRef} className="kc-section relative bg-ink">
      <div className="kc-sticky grain">
        <div className="kc-canvas" aria-hidden="true"></div>
        <div className="kc-poster" aria-hidden="true"><span>7<em>F</em></span></div>
        <div className="kc-content mx-auto max-w-[1400px] px-5 sm:px-8">
          <div className="kc-text">
            <p className="kc-el text-accent text-xs tracking-[0.35em] font-medium mb-6">7F KINETIC CORE</p>
            <h2 className="kc-el font-display font-extrabold display-tight text-[clamp(2.3rem,5vw,4.4rem)]">
              ТВОЙ ПРОГРЕСС<br/>ИМЕЕТ ФОРМУ
            </h2>
            <p className="kc-el mt-6 text-mute leading-relaxed">
              7 элементов.<br/>Одна система.<br/><span className="text-accent">Лучший результат.</span>
            </p>
            <ul className="kc-list mt-9">
              {KC_ITEMS.map((w,i)=>(
                <li key={w} data-kc-item={i} className="kc-item">
                  <span className="kc-item-n">0{i+1}</span>
                  <span className="kc-item-w">{w}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="kc-final font-display font-extrabold display-tight text-[clamp(1.9rem,4.2vw,3.6rem)]">
            ВСЁ СХОДИТСЯ<br/>В ОДНОМ МЕСТЕ
          </p>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Бегущая строка ---------------- */
function Marquee(){
  const items = ['СИЛА','·','ВЫНОСЛИВОСТЬ','·','СВОБОДНЫЕ ВЕСА','·','ГРУППОВЫЕ','·','ДОСТУП 24/7','·','ВОССТАНОВЛЕНИЕ','·'];
  const row = [...items, ...items];
  return (
    <div className="border-y border-white/10 bg-ink py-5 overflow-hidden">
      <div className="flex whitespace-nowrap marquee-track w-max">
        {row.map((t,i)=>(
          <span key={i} className={"mx-6 font-display font-extrabold text-2xl sm:text-3xl tracking-tight "+(t==='·'?'text-accent':'text-white/25')}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- Почему мы ---------------- */
function Why(){
  const cards = [
    { n:'01', title:'Зал', text:'2 000 м² свободного пространства и премиального оборудования.' },
    { n:'02', title:'Свободные веса', text:'Самая большая зона свободных весов в городе.' },
    { n:'03', title:'Восстановление', text:'Сауна, зона восстановления и полотенце на каждой тренировке.' },
  ];
  return (
    <section id="about" className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div>
          <Reveal><p className="text-accent text-xs tracking-[0.35em] font-medium mb-6">ПОЧЕМУ МЫ</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display font-extrabold display-tight text-[clamp(2.6rem,6vw,5rem)]">
              Не просто<br/>зал.<span className="text-mute"> Стандарт.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-md text-mute leading-relaxed">
              Мы собрали всё, что нужно для настоящего результата: оборудование, тренеров и атмосферу,
              в которую хочется возвращаться. Минимум лишнего — максимум фокуса.
            </p>
          </Reveal>
          <div className="mt-10 flex gap-10">
            {[['5','Тренеров-экспертов'],['24/7','Доступ в клуб'],['2K','м² площади']].map(([a,b])=>(
              <Reveal key={a} delay={0.15}>
                <div>
                  <div className="font-display font-extrabold text-4xl sm:text-5xl">{a}</div>
                  <div className="text-mute text-xs mt-1 max-w-[110px]">{b}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {cards.map((c,i)=>(
            <motion.div key={c.n}
              initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }}
              transition={{ duration:0.8, delay:i*0.1, ease }} whileHover={{ y:-6 }}
              className="group relative overflow-hidden rounded-3xl border border-white/10 portrait p-7 sm:p-9 grain">
              <div className="flex items-start justify-between">
                <span className="font-display font-extrabold text-mute/40 text-5xl">{c.n}</span>
                <span className="h-10 w-10 rounded-full border border-white/15 flex items-center justify-center text-white/60 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-colors">→</span>
              </div>
              <h3 className="mt-10 font-display font-bold text-2xl sm:text-3xl">{c.title}</h3>
              <p className="mt-2 text-mute text-sm max-w-xs">{c.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- Тренеры ---------------- */
function TrainerCard({ t }){
  const [imgOk, setImgOk] = useState(true);
  const initials = t.name.split(' ').map(w=>w[0]).join('');
  const showPhoto = t.photo && imgOk;
  return (
    <motion.div whileHover="hov" initial="rest" animate="rest"
      className="group relative shrink-0 w-[80vw] sm:w-auto snap-start">
      <motion.div variants={{ rest:{ y:0 }, hov:{ y:-10 } }} transition={{ duration:0.4, ease }}
        className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0c]">
        <div className="relative aspect-[4/5] overflow-hidden portrait grain">
          {showPhoto
            ? <motion.img src={t.photo} alt={t.name} onError={()=>setImgOk(false)}
                variants={{ rest:{ scale:1 }, hov:{ scale:1.06 } }} transition={{ duration:0.6, ease }}
                className="absolute inset-0 h-full w-full object-cover" />
            : <motion.div variants={{ rest:{ scale:1 }, hov:{ scale:1.06 } }} transition={{ duration:0.6, ease }}
                className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-extrabold text-white/10 text-[7rem] leading-none">{initials}</span>
              </motion.div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"></div>
          <span className="absolute top-4 left-4 text-[10px] tracking-[0.25em] text-white/80 border border-white/25 rounded-full px-3 py-1 bg-black/30 backdrop-blur">{t.tag}</span>
          <motion.a href="#contact"
            variants={{ rest:{ opacity:0, y:14 }, hov:{ opacity:1, y:0 } }} transition={{ duration:0.35, ease }}
            className="absolute bottom-4 left-4 right-4 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-semibold py-3 hover:bg-accentSoft">
            Записаться <span>→</span>
          </motion.a>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="font-display font-bold text-xl">{t.name}</h3>
          <p className="text-accent text-xs tracking-wide mt-1">{t.spec}</p>
          <p className="text-mute text-sm mt-3 leading-relaxed">{t.desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Trainers(){
  return (
    <section id="trainers" className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="flex items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <Reveal><p className="text-accent text-xs tracking-[0.35em] font-medium mb-5">КОМАНДА</p></Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display font-extrabold display-tight text-[clamp(2.6rem,7vw,5.5rem)]">ТРЕНЕРЫ</h2>
            </Reveal>
          </div>
          <Reveal delay={0.1} className="hidden sm:block">
            <p className="max-w-xs text-mute text-sm text-right leading-relaxed">
              Команда, которая доводит до результата. Выбирай тренера — или мы подберём под тебя.
            </p>
          </Reveal>
        </div>

        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6">
          {TRAINERS.map((t,i)=>(
            <Reveal key={t.name} delay={(i%3)*0.08}><TrainerCard t={t} /></Reveal>
          ))}
        </div>

        <div className="sm:hidden -mx-5 px-5 flex gap-4 overflow-x-auto no-sb snap-x-mandatory pb-2">
          {TRAINERS.map(t=> <TrainerCard key={t.name} t={t} /> )}
        </div>
        <p className="sm:hidden mt-4 text-center text-mute/60 text-xs tracking-widest">← ЛИСТАЙ →</p>
      </div>
    </section>
  );
}

/* ---------------- Абонементы ---------------- */
function PremiumCard(){
  const feats = ['Безлимитное посещение клуба','Персональный шкафчик','Все групповые тренировки','Чистое полотенце на каждой тренировке','Заморозка абонемента','Приоритетная запись к тренерам'];
  return (
    <motion.div initial={{ opacity:0, y:40 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-60px' }}
      transition={{ duration:0.9, ease }} whileHover={{ scale:1.01 }}
      className="relative overflow-hidden rounded-[2rem] p-8 sm:p-12 border border-gold/40 grain"
      style={{ background:'radial-gradient(120% 120% at 100% 0%, rgba(216,179,106,0.14), transparent 55%), linear-gradient(180deg,#0d0b07,#050505)', boxShadow:'0 0 80px -20px rgba(216,179,106,0.35)' }}>
      <div className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent"></div>
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-gold border border-gold/40 rounded-full px-3 py-1">★ ПРЕМИУМ</span>
          <h3 className="mt-6 font-display font-extrabold text-[clamp(3rem,8vw,5.5rem)] display-tight">
            29 000<span className="text-gold text-3xl align-top ml-2">₽</span>
          </h3>
          <p className="text-mute mt-2">12 месяцев · всё включено</p>
          <a href="#contact"
             className="mt-8 inline-flex items-center gap-2 rounded-full bg-gold text-ink font-semibold px-8 py-4 text-sm hover:brightness-110 transition-all hover:scale-[1.03]">
            Оформить Премиум →
          </a>
        </div>
        <ul className="space-y-3 text-sm">
          {feats.map(f=>(
            <li key={f} className="flex items-start gap-3 text-white/80">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold shrink-0"></span>{f}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}

function PlanCard({ p, i }){
  return (
    <motion.div initial={{ opacity:0, y:30 }} whileInView={{ opacity:1, y:0 }} viewport={{ once:true, margin:'-40px' }}
      transition={{ duration:0.7, delay:(i%3)*0.07, ease }} whileHover={{ scale:1.03 }}
      className="group shrink-0 w-[74vw] sm:w-auto snap-start relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a0a0a] p-7 hover:border-accent/50 transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-[0.25em] text-mute uppercase">{p.name}</span>
        <span className="text-[10px] text-white/40">{p.note}</span>
      </div>
      <div className="mt-8 font-display font-extrabold text-[clamp(2.4rem,5vw,3.4rem)] display-tight">
        {p.price}<span className="text-accent text-xl align-top ml-1">{p.unit}</span>
      </div>
      <p className="mt-2 text-mute text-sm">{p.sub}</p>
      <a href="#contact"
         className="mt-7 inline-flex w-full items-center justify-center rounded-full border border-white/15 text-white/80 text-sm font-medium py-3 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-colors">
        Выбрать
      </a>
    </motion.div>
  );
}

function Membership(){
  return (
    <section id="membership" className="relative bg-ink py-24 sm:py-32">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="mb-12 sm:mb-16 max-w-2xl">
          <Reveal><p className="text-accent text-xs tracking-[0.35em] font-medium mb-5">АБОНЕМЕНТЫ</p></Reveal>
          <Reveal delay={0.05}>
            <h2 className="font-display font-extrabold display-tight text-[clamp(2.6rem,7vw,5.5rem)]">
              Выбери свой<br/>формат.
            </h2>
          </Reveal>
        </div>

        <Reveal><PremiumCard /></Reveal>

        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {PLANS.map((p,i)=> <PlanCard key={p.key} p={p} i={i} /> )}
        </div>

        <div className="sm:hidden -mx-5 px-5 mt-6 flex gap-4 overflow-x-auto no-sb snap-x-mandatory pb-2">
          {PLANS.map((p,i)=> <PlanCard key={p.key} p={p} i={i} /> )}
        </div>
        <p className="sm:hidden mt-3 text-center text-mute/60 text-xs tracking-widest">← ЛИСТАЙ →</p>
      </div>
    </section>
  );
}

/* ---------------- Тренировки (параллакс) ---------------- */
function Classes(){
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset:['start end','end start'] });
  const y = useTransform(scrollYProgress, [0,1], ['-8%','8%']);
  return (
    <section id="classes" ref={ref} className="relative h-[70vh] overflow-hidden grain">
      <motion.div style={{ y }} className="absolute inset-0 portrait scale-110"></motion.div>
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 h-full mx-auto max-w-[1400px] px-5 sm:px-8 flex flex-col justify-center items-center text-center">
        <Reveal><p className="text-accent text-xs tracking-[0.35em] font-medium mb-6">ГРУППОВЫЕ ТРЕНИРОВКИ</p></Reveal>
        <Reveal delay={0.05}>
          <h2 className="font-display font-extrabold display-tight text-[clamp(2.8rem,9vw,7rem)] max-w-4xl">
            ДВИЖЕНИЕ БЕЗ<br/><span className="text-accent">ПАУЗ</span>
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-6 text-mute max-w-md">Силовые, функциональные и групповые форматы — расписание каждый день.</p>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- Контакты / футер ---------------- */
function Footer(){
  return (
    <footer id="contact" className="relative bg-ink pt-24 sm:pt-32 pb-10">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <div className="grid lg:grid-cols-2 gap-14 items-end pb-20 border-b border-white/10">
          <div>
            <Reveal><p className="text-accent text-xs tracking-[0.35em] font-medium mb-6">ГОТОВ?</p></Reveal>
            <Reveal delay={0.05}>
              <h2 className="font-display font-extrabold display-tight text-[clamp(2.8rem,8vw,6rem)]">НАЧНИ<br/>СЕГОДНЯ.</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <a href="#membership"
                 className="mt-9 inline-flex items-center gap-2 rounded-full bg-accent text-white font-semibold px-9 py-4 hover:bg-accentSoft transition-all hover:scale-[1.03]">
                Записаться →
              </a>
            </Reveal>
          </div>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div>
                <p className="text-white/40 text-xs tracking-widest mb-3">КЛУБ</p>
                <p className="text-white/80 leading-relaxed">Краснодар<br/>Ставропольская улица, 141/2<br/>Круглосуточно · 24/7</p>
              </div>
              <div>
                <p className="text-white/40 text-xs tracking-widest mb-3">КОНТАКТЫ</p>
                <a href={PHONE_HREF} className="block text-white/80 hover:text-accent transition-colors">{PHONE}</a>
                <a href="#" className="block text-white/80 hover:text-accent transition-colors mt-2">Instagram</a>
                <a href="#" className="block text-white/80 hover:text-accent transition-colors">Telegram</a>
              </div>
            </div>
          </Reveal>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-mute/60 text-xs">© 2026 7F Fitness Club. Все права защищены.</p>
          <div className="flex gap-6 text-xs text-white/50">
            {NAV.map(n=> <a key={n.label} href={n.href} className="hover:text-white transition-colors">{n.label}</a> )}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ---------------- App ---------------- */
function App(){
  return (
    <main className="bg-ink">
      <Header />
      <Hero />
      <KineticCore />
      <Marquee />
      <Why />
      <Trainers />
      <Membership />
      <Classes />
      <Footer />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
