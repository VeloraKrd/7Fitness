/* 7F Fitness Club — главная страница
   React + Tailwind + Framer Motion (single-file app)
   Отредактируй тексты здесь, затем пересобери: см. README (npm run build).
   Быстрая правка без сборки: можно менять и assets/app.js напрямую. */

const {
  useState,
  useEffect,
  useRef
} = React;

/* ---- Framer Motion со страховкой, если UMD-глобал отличается ---- */
const FM = window.Motion || window.FramerMotion || window.framerMotion || {};
const AnimatePresence = FM.AnimatePresence || (({
  children
}) => children);
const useScroll = FM.useScroll || (() => ({
  scrollYProgress: {
    get: () => 0,
    onChange: () => {}
  }
}));
const useTransform = FM.useTransform || ((v, a, b) => b ? b[0] : 0);
const motion = FM.motion || new Proxy({}, {
  get: (_, tag) => React.forwardRef((props, ref) => {
    const {
      initial,
      animate,
      exit,
      transition,
      variants,
      whileInView,
      whileHover,
      whileTap,
      viewport,
      style,
      ...rest
    } = props;
    return React.createElement(typeof tag === 'string' ? tag : 'div', {
      ref,
      style,
      ...rest
    });
  })
});
const ease = [0.22, 1, 0.36, 1];

/* ---------------- Данные ---------------- */
const TRAINERS = [{
  name: 'Хайдер Алзамили',
  spec: 'Силовой тренинг · Техника',
  desc: 'Дисциплина и чистая техника — от первого повторения до личного рекорда.',
  tag: 'ДЕЖУРНЫЙ',
  photo: 'assets/trainers/haider.jpg'
}, {
  name: 'Денис Давыдов',
  spec: 'Сила · Гипертрофия',
  desc: 'Ведёт клуб к результату. Строит силу и форму без компромиссов.',
  tag: 'СТАРШИЙ',
  photo: 'assets/trainers/denis.jpg'
}, {
  name: 'Сергей Давыдов',
  spec: 'Пауэрлифтинг · Сила',
  desc: 'Тяжёлая база, чистая техника, максимальные веса под контролем.',
  tag: 'ДЕЖУРНЫЙ',
  photo: 'assets/trainers/sergey.jpg'
}, {
  name: 'Антон Ченский',
  spec: 'Функциональный тренинг',
  desc: 'Взрывная работа, выносливость и атлетичное тело.',
  tag: 'ДЕЖУРНЫЙ',
  photo: 'assets/trainers/anton.jpg'
}, {
  name: 'Елена Соболь',
  spec: 'Женский тренинг · Стретчинг',
  desc: 'Женские программы, растяжка и уверенность в каждом движении.',
  tag: 'ДЕЖУРНЫЙ',
  photo: 'assets/trainers/elena.jpg'
}, {
  name: 'Александр Кравцов',
  spec: 'Набор массы · Молодёжные программы',
  desc: 'Молодая энергия. Набор массы и первые серьёзные рекорды.',
  tag: 'ТРЕНЕР',
  photo: 'assets/trainers/alexandr.jpg'
}];
const PLANS = [{
  key: 'night',
  name: 'Ночной',
  price: '9 900',
  unit: '₽',
  note: '23:00 — 07:00',
  sub: 'Годовой абонемент'
}, {
  key: 'day',
  name: 'Дневной',
  price: '9 900',
  unit: '₽',
  note: '07:00 — 16:00',
  sub: 'Годовой абонемент'
}, {
  key: 'u12',
  name: 'Безлимит',
  price: '14 900',
  unit: '₽',
  note: '12 месяцев',
  sub: 'Безлимит · +28 дней заморозки'
}, {
  key: 'u6',
  name: 'Безлимит',
  price: '8 990',
  unit: '₽',
  note: '6 месяцев',
  sub: 'Безлимитное посещение'
}, {
  key: 'u3',
  name: 'Безлимит',
  price: '6 990',
  unit: '₽',
  note: '3 месяца',
  sub: 'Безлимитное посещение'
}, {
  key: 'u1',
  name: 'Безлимит',
  price: '4 990',
  unit: '₽',
  note: '1 месяц',
  sub: 'Безлимитное посещение'
}];
const NAV = [{
  label: 'Клуб',
  href: '#about'
}, {
  label: 'Абонементы',
  href: '#membership'
}, {
  label: 'Тренеры',
  href: '#trainers'
}, {
  label: 'Тренировки',
  href: '#classes'
}, {
  label: 'Контакты',
  href: '#contact'
}];
const PHONE = '+7 (861) 991-30-77';
const PHONE_HREF = 'tel:+78619913077';

/* ---------------- Хелперы ---------------- */
const Reveal = ({
  children,
  delay = 0,
  y = 28,
  className = ''
}) => /*#__PURE__*/React.createElement(motion.div, {
  className: className,
  initial: {
    opacity: 0,
    y
  },
  whileInView: {
    opacity: 1,
    y: 0
  },
  viewport: {
    once: true,
    margin: '-80px'
  },
  transition: {
    duration: 0.9,
    delay,
    ease
  }
}, children);
const Logo = ({
  className = ''
}) => /*#__PURE__*/React.createElement("a", {
  href: "#top",
  className: "flex items-center gap-2 select-none " + className
}, /*#__PURE__*/React.createElement("span", {
  className: "font-display font-extrabold text-2xl tracking-tight leading-none"
}, /*#__PURE__*/React.createElement("span", {
  className: "text-white"
}, "7"), /*#__PURE__*/React.createElement("span", {
  className: "text-accent"
}, "F")), /*#__PURE__*/React.createElement("span", {
  className: "hidden sm:block text-[10px] tracking-[0.32em] text-mute font-medium pt-1"
}, "\u0424\u0418\u0422\u041D\u0415\u0421-\u041A\u041B\u0423\u0411"));

/* ---------------- Хедер ---------------- */
function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
  }, [open]);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(motion.header, {
    initial: {
      y: -40,
      opacity: 0
    },
    animate: {
      y: 0,
      opacity: 1
    },
    transition: {
      duration: 0.8,
      ease,
      delay: 0.2
    },
    className: "fixed top-0 inset-x-0 z-50 transition-all duration-500 " + (scrolled ? "bg-black/50 backdrop-blur-xl border-b border-white/10 py-3" : "bg-transparent py-5")
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px] px-5 sm:px-8 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("nav", {
    className: "hidden lg:flex items-center gap-9"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.label,
    href: n.href,
    className: "text-[13px] tracking-wide text-white/70 hover:text-white transition-colors relative group"
  }, n.label, /*#__PURE__*/React.createElement("span", {
    className: "absolute -bottom-1.5 left-0 h-px w-0 bg-accent group-hover:w-full transition-all duration-300"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#membership",
    className: "hidden sm:inline-flex items-center rounded-full bg-white text-ink text-[13px] font-semibold px-5 py-2.5 hover:bg-accent hover:text-white transition-colors duration-300"
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F"), /*#__PURE__*/React.createElement("button", {
    "aria-label": "\u041C\u0435\u043D\u044E",
    onClick: () => setOpen(true),
    className: "lg:hidden inline-flex flex-col gap-[5px] p-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block h-px w-6 bg-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "block h-px w-6 bg-white"
  }), /*#__PURE__*/React.createElement("span", {
    className: "block h-px w-6 bg-white"
  }))))), /*#__PURE__*/React.createElement(AnimatePresence, null, open && /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0
    },
    animate: {
      opacity: 1
    },
    exit: {
      opacity: 0
    },
    className: "fixed inset-0 z-[60] bg-ink/95 backdrop-blur-xl lg:hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between px-5 py-5 border-b border-white/10"
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("button", {
    "aria-label": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    onClick: () => setOpen(false),
    className: "p-2 text-2xl leading-none"
  }, "\u2715")), /*#__PURE__*/React.createElement("nav", {
    className: "flex flex-col px-6 pt-10 gap-2"
  }, NAV.map((n, i) => /*#__PURE__*/React.createElement(motion.a, {
    key: n.label,
    href: n.href,
    onClick: () => setOpen(false),
    initial: {
      opacity: 0,
      x: 20
    },
    animate: {
      opacity: 1,
      x: 0
    },
    transition: {
      delay: 0.05 * i + 0.1
    },
    className: "font-display font-extrabold text-4xl py-3 border-b border-white/5 tracking-tight"
  }, n.label)), /*#__PURE__*/React.createElement("a", {
    href: "#membership",
    onClick: () => setOpen(false),
    className: "mt-8 inline-flex justify-center rounded-full bg-accent text-white font-semibold px-6 py-4 text-lg"
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F")))));
}

/* ---------------- Hero ---------------- */
function Hero() {
  const heroVars = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3
      }
    }
  };
  const line = {
    hidden: {
      y: '110%'
    },
    show: {
      y: '0%',
      transition: {
        duration: 1.1,
        ease
      }
    }
  };
  return /*#__PURE__*/React.createElement("section", {
    id: "top",
    className: "relative h-[100svh] w-full overflow-hidden grain"
  }, /*#__PURE__*/React.createElement("video", {
    className: "kenburns absolute inset-0 h-full w-full object-cover",
    src: "assets/hero.mp4",
    autoPlay: true,
    muted: true,
    loop: true,
    playsInline: true,
    preload: "auto"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/45"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 h-full mx-auto max-w-[1400px] px-5 sm:px-8 flex flex-col justify-center"
  }, /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      delay: 0.2,
      duration: 0.8,
      ease
    },
    className: "mb-6 inline-flex items-center gap-3 w-max rounded-full border border-white/20 bg-white/5 backdrop-blur px-4 py-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "h-1.5 w-1.5 rounded-full bg-accent animate-pulse"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] tracking-[0.28em] text-white/80 font-medium"
  }, "7F \xB7 \u041F\u0420\u0415\u041C\u0418\u0423\u041C-\u041A\u041B\u0423\u0411 \xB7 24/7")), /*#__PURE__*/React.createElement(motion.h1, {
    variants: heroVars,
    initial: "hidden",
    animate: "show",
    className: "font-display font-extrabold text-white display-tight text-[clamp(3.1rem,10vw,8rem)]"
  }, /*#__PURE__*/React.createElement("span", {
    className: "block overflow-hidden"
  }, /*#__PURE__*/React.createElement(motion.span, {
    variants: line,
    className: "block"
  }, "\u0422\u0420\u0415\u041D\u0418\u0420\u0423\u0419\u0421\u042F")), /*#__PURE__*/React.createElement("span", {
    className: "block overflow-hidden"
  }, /*#__PURE__*/React.createElement(motion.span, {
    variants: line,
    className: "block"
  }, "\u0411\u0415\u0417 ", /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, "\u0413\u0420\u0410\u041D\u0418\u0426")))), /*#__PURE__*/React.createElement(motion.p, {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      delay: 1,
      duration: 0.9,
      ease
    },
    className: "mt-7 max-w-md text-mute text-base sm:text-lg leading-relaxed"
  }, "\u041F\u0440\u043E\u0441\u0442\u0440\u0430\u043D\u0441\u0442\u0432\u043E, \u0433\u0434\u0435 \u0441\u0438\u043B\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u043F\u0440\u0438\u0432\u044B\u0447\u043A\u043E\u0439. \u041E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435, \u0442\u0440\u0435\u043D\u0435\u0440\u044B \u0438 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0430 \u0443\u0440\u043E\u0432\u043D\u044F, \u043A\u043E\u0442\u043E\u0440\u043E\u0433\u043E \u0442\u044B \u0435\u0449\u0451 \u043D\u0435 \u0432\u0441\u0442\u0440\u0435\u0447\u0430\u043B."), /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0,
      y: 20
    },
    animate: {
      opacity: 1,
      y: 0
    },
    transition: {
      delay: 1.15,
      duration: 0.9,
      ease
    },
    className: "mt-9 flex flex-col sm:flex-row gap-3 sm:gap-4"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#membership",
    className: "group inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white font-semibold px-8 py-4 text-[15px] hover:bg-accentSoft transition-all duration-300 hover:scale-[1.03]"
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F ", /*#__PURE__*/React.createElement("span", {
    className: "transition-transform group-hover:translate-x-1"
  }, "\u2192")), /*#__PURE__*/React.createElement("a", {
    href: "#about",
    className: "inline-flex items-center justify-center rounded-full border border-white/25 bg-white/5 backdrop-blur text-white font-medium px-8 py-4 text-[15px] hover:bg-white/10 hover:border-white/40 transition-all duration-300"
  }, "\u0423\u0437\u043D\u0430\u0442\u044C \u0431\u043E\u043B\u044C\u0448\u0435"))), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] tracking-[0.3em] text-white/60"
  }, "\u0412\u041D\u0418\u0417"), /*#__PURE__*/React.createElement(motion.span, {
    animate: {
      y: [0, 8, 0]
    },
    transition: {
      duration: 1.8,
      repeat: Infinity,
      ease: 'easeInOut'
    },
    className: "text-white/70 text-lg leading-none"
  }, "\u2193")));
}

/* ---------------- 7F Kinetic Core (3D-секция) ----------------
   HTML-текст живёт здесь (SEO/доступность), 3D — в assets/kinetic-core.js,
   грузится лениво при приближении секции. Классами .is-on управляет 3D-модуль. */
const KC_ITEMS = ['СИЛА', 'ВЫНОСЛИВОСТЬ', 'СКОРОСТЬ', 'МОБИЛЬНОСТЬ', 'ДИСЦИПЛИНА', 'ВОССТАНОВЛЕНИЕ', 'РЕЗУЛЬТАТ'];
function KineticCore() {
  const rootRef = useRef(null);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const params = new URLSearchParams(location.search);
    const reduced = params.has('kc-reduced') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glOk = !params.has('kc-nowebgl') && (() => {
      try {
        const c = document.createElement('canvas');
        return !!(c.getContext('webgl2') || c.getContext('webgl'));
      } catch (e) {
        return false;
      }
    })();
    const showAll = () => root.querySelectorAll('.kc-el, .kc-item, .kc-final').forEach(el => el.classList.add('is-on'));
    if (reduced) {
      root.classList.add('kc-reduced');
      showAll();
    }
    if (!glOk) {
      root.classList.add('kc-fallback');
      showAll();
      return;
    }
    let destroyed = false,
      api = null;
    const io = new IntersectionObserver(es => {
      if (!es.some(e => e.isIntersecting)) return;
      io.disconnect();
      import('./kinetic-core.js').then(m => {
        if (!destroyed) api = m.initKineticCore({
          root,
          reduced
        });
      }).catch(() => {
        root.classList.add('kc-fallback');
        showAll();
      });
    }, {
      rootMargin: '450px 0px'
    });
    /* не грузить 3D раньше, чем страница (включая hero-видео) закончит загрузку */
    const startObserving = () => {
      if (!destroyed) io.observe(root);
    };
    if (document.readyState === 'complete') startObserving();else window.addEventListener('load', startObserving, {
      once: true
    });
    return () => {
      destroyed = true;
      window.removeEventListener('load', startObserving);
      io.disconnect();
      if (api) api.destroy();
    };
  }, []);
  return /*#__PURE__*/React.createElement("section", {
    id: "kinetic",
    ref: rootRef,
    className: "kc-section relative bg-ink"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kc-sticky grain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kc-canvas",
    "aria-hidden": "true"
  }), /*#__PURE__*/React.createElement("div", {
    className: "kc-poster",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("span", null, "7", /*#__PURE__*/React.createElement("em", null, "F"))), /*#__PURE__*/React.createElement("div", {
    className: "kc-content mx-auto max-w-[1400px] px-5 sm:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "kc-text"
  }, /*#__PURE__*/React.createElement("p", {
    className: "kc-el text-accent text-xs tracking-[0.35em] font-medium mb-6"
  }, "7F KINETIC CORE"), /*#__PURE__*/React.createElement("h2", {
    className: "kc-el font-display font-extrabold display-tight text-[clamp(2.3rem,5vw,4.4rem)]"
  }, "\u0422\u0412\u041E\u0419 \u041F\u0420\u041E\u0413\u0420\u0415\u0421\u0421", /*#__PURE__*/React.createElement("br", null), "\u0418\u041C\u0415\u0415\u0422 \u0424\u041E\u0420\u041C\u0423"), /*#__PURE__*/React.createElement("p", {
    className: "kc-el mt-6 text-mute leading-relaxed"
  }, "7 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432.", /*#__PURE__*/React.createElement("br", null), "\u041E\u0434\u043D\u0430 \u0441\u0438\u0441\u0442\u0435\u043C\u0430.", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, "\u041B\u0443\u0447\u0448\u0438\u0439 \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442.")), /*#__PURE__*/React.createElement("ul", {
    className: "kc-list mt-9"
  }, KC_ITEMS.map((w, i) => /*#__PURE__*/React.createElement("li", {
    key: w,
    "data-kc-item": i,
    className: "kc-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "kc-item-n"
  }, "0", i + 1), /*#__PURE__*/React.createElement("span", {
    className: "kc-item-w"
  }, w))))), /*#__PURE__*/React.createElement("p", {
    className: "kc-final font-display font-extrabold display-tight text-[clamp(1.9rem,4.2vw,3.6rem)]"
  }, "\u0412\u0421\u0401 \u0421\u0425\u041E\u0414\u0418\u0422\u0421\u042F", /*#__PURE__*/React.createElement("br", null), "\u0412 \u041E\u0414\u041D\u041E\u041C \u041C\u0415\u0421\u0422\u0415"))));
}

/* ---------------- Бегущая строка ---------------- */
function Marquee() {
  const items = ['СИЛА', '·', 'ВЫНОСЛИВОСТЬ', '·', 'СВОБОДНЫЕ ВЕСА', '·', 'ГРУППОВЫЕ', '·', 'ДОСТУП 24/7', '·', 'ВОССТАНОВЛЕНИЕ', '·'];
  const row = [...items, ...items];
  return /*#__PURE__*/React.createElement("div", {
    className: "border-y border-white/10 bg-ink py-5 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex whitespace-nowrap marquee-track w-max"
  }, row.map((t, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    className: "mx-6 font-display font-extrabold text-2xl sm:text-3xl tracking-tight " + (t === '·' ? 'text-accent' : 'text-white/25')
  }, t))));
}

/* ---------------- Почему мы ---------------- */
function Why() {
  const cards = [{
    n: '01',
    title: 'Зал',
    text: '2 000 м² свободного пространства и премиального оборудования.'
  }, {
    n: '02',
    title: 'Свободные веса',
    text: 'Самая большая зона свободных весов в городе.'
  }, {
    n: '03',
    title: 'Восстановление',
    text: 'Сауна, зона восстановления и полотенце на каждой тренировке.'
  }];
  return /*#__PURE__*/React.createElement("section", {
    id: "about",
    className: "relative bg-ink py-24 sm:py-32"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px] px-5 sm:px-8 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-[0.35em] font-medium mb-6"
  }, "\u041F\u041E\u0427\u0415\u041C\u0423 \u041C\u042B")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.05
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-extrabold display-tight text-[clamp(2.6rem,6vw,5rem)]"
  }, "\u041D\u0435 \u043F\u0440\u043E\u0441\u0442\u043E", /*#__PURE__*/React.createElement("br", null), "\u0437\u0430\u043B.", /*#__PURE__*/React.createElement("span", {
    className: "text-mute"
  }, " \u0421\u0442\u0430\u043D\u0434\u0430\u0440\u0442."))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("p", {
    className: "mt-8 max-w-md text-mute leading-relaxed"
  }, "\u041C\u044B \u0441\u043E\u0431\u0440\u0430\u043B\u0438 \u0432\u0441\u0451, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0434\u043B\u044F \u043D\u0430\u0441\u0442\u043E\u044F\u0449\u0435\u0433\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430: \u043E\u0431\u043E\u0440\u0443\u0434\u043E\u0432\u0430\u043D\u0438\u0435, \u0442\u0440\u0435\u043D\u0435\u0440\u043E\u0432 \u0438 \u0430\u0442\u043C\u043E\u0441\u0444\u0435\u0440\u0443, \u0432 \u043A\u043E\u0442\u043E\u0440\u0443\u044E \u0445\u043E\u0447\u0435\u0442\u0441\u044F \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0442\u044C\u0441\u044F. \u041C\u0438\u043D\u0438\u043C\u0443\u043C \u043B\u0438\u0448\u043D\u0435\u0433\u043E \u2014 \u043C\u0430\u043A\u0441\u0438\u043C\u0443\u043C \u0444\u043E\u043A\u0443\u0441\u0430.")), /*#__PURE__*/React.createElement("div", {
    className: "mt-10 flex gap-10"
  }, [['5', 'Тренеров-экспертов'], ['24/7', 'Доступ в клуб'], ['2K', 'м² площади']].map(([a, b]) => /*#__PURE__*/React.createElement(Reveal, {
    key: a,
    delay: 0.15
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "font-display font-extrabold text-4xl sm:text-5xl"
  }, a), /*#__PURE__*/React.createElement("div", {
    className: "text-mute text-xs mt-1 max-w-[110px]"
  }, b)))))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-4"
  }, cards.map((c, i) => /*#__PURE__*/React.createElement(motion.div, {
    key: c.n,
    initial: {
      opacity: 0,
      y: 40
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true,
      margin: '-60px'
    },
    transition: {
      duration: 0.8,
      delay: i * 0.1,
      ease
    },
    whileHover: {
      y: -6
    },
    className: "group relative overflow-hidden rounded-3xl border border-white/10 portrait p-7 sm:p-9 grain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-display font-extrabold text-mute/40 text-5xl"
  }, c.n), /*#__PURE__*/React.createElement("span", {
    className: "h-10 w-10 rounded-full border border-white/15 flex items-center justify-center text-white/60 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-colors"
  }, "\u2192")), /*#__PURE__*/React.createElement("h3", {
    className: "mt-10 font-display font-bold text-2xl sm:text-3xl"
  }, c.title), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-mute text-sm max-w-xs"
  }, c.text))))));
}

/* ---------------- Тренеры ---------------- */
function TrainerCard({
  t
}) {
  const [imgOk, setImgOk] = useState(true);
  const initials = t.name.split(' ').map(w => w[0]).join('');
  const showPhoto = t.photo && imgOk;
  return /*#__PURE__*/React.createElement(motion.div, {
    whileHover: "hov",
    initial: "rest",
    animate: "rest",
    className: "group relative shrink-0 w-[80vw] sm:w-auto snap-start"
  }, /*#__PURE__*/React.createElement(motion.div, {
    variants: {
      rest: {
        y: 0
      },
      hov: {
        y: -10
      }
    },
    transition: {
      duration: 0.4,
      ease
    },
    className: "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0c0c0c]"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative aspect-[4/5] overflow-hidden portrait grain"
  }, showPhoto ? /*#__PURE__*/React.createElement(motion.img, {
    src: t.photo,
    alt: t.name,
    onError: () => setImgOk(false),
    variants: {
      rest: {
        scale: 1
      },
      hov: {
        scale: 1.06
      }
    },
    transition: {
      duration: 0.6,
      ease
    },
    className: "absolute inset-0 h-full w-full object-cover"
  }) : /*#__PURE__*/React.createElement(motion.div, {
    variants: {
      rest: {
        scale: 1
      },
      hov: {
        scale: 1.06
      }
    },
    transition: {
      duration: 0.6,
      ease
    },
    className: "absolute inset-0 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-display font-extrabold text-white/10 text-[7rem] leading-none"
  }, initials)), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
  }), /*#__PURE__*/React.createElement("span", {
    className: "absolute top-4 left-4 text-[10px] tracking-[0.25em] text-white/80 border border-white/25 rounded-full px-3 py-1 bg-black/30 backdrop-blur"
  }, t.tag), /*#__PURE__*/React.createElement(motion.a, {
    href: "#contact",
    variants: {
      rest: {
        opacity: 0,
        y: 14
      },
      hov: {
        opacity: 1,
        y: 0
      }
    },
    transition: {
      duration: 0.35,
      ease
    },
    className: "absolute bottom-4 left-4 right-4 inline-flex items-center justify-center gap-2 rounded-full bg-accent text-white text-sm font-semibold py-3 hover:bg-accentSoft"
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F ", /*#__PURE__*/React.createElement("span", null, "\u2192"))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 sm:p-6"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-display font-bold text-xl"
  }, t.name), /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-wide mt-1"
  }, t.spec), /*#__PURE__*/React.createElement("p", {
    className: "text-mute text-sm mt-3 leading-relaxed"
  }, t.desc))));
}
function Trainers() {
  return /*#__PURE__*/React.createElement("section", {
    id: "trainers",
    className: "relative bg-ink py-24 sm:py-32"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px] px-5 sm:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-end justify-between gap-6 mb-12 sm:mb-16"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-[0.35em] font-medium mb-5"
  }, "\u041A\u041E\u041C\u0410\u041D\u0414\u0410")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.05
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-extrabold display-tight text-[clamp(2.6rem,7vw,5.5rem)]"
  }, "\u0422\u0420\u0415\u041D\u0415\u0420\u042B"))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1,
    className: "hidden sm:block"
  }, /*#__PURE__*/React.createElement("p", {
    className: "max-w-xs text-mute text-sm text-right leading-relaxed"
  }, "\u041A\u043E\u043C\u0430\u043D\u0434\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0434\u043E\u0432\u043E\u0434\u0438\u0442 \u0434\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430. \u0412\u044B\u0431\u0438\u0440\u0430\u0439 \u0442\u0440\u0435\u043D\u0435\u0440\u0430 \u2014 \u0438\u043B\u0438 \u043C\u044B \u043F\u043E\u0434\u0431\u0435\u0440\u0451\u043C \u043F\u043E\u0434 \u0442\u0435\u0431\u044F."))), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-6"
  }, TRAINERS.map((t, i) => /*#__PURE__*/React.createElement(Reveal, {
    key: t.name,
    delay: i % 3 * 0.08
  }, /*#__PURE__*/React.createElement(TrainerCard, {
    t: t
  })))), /*#__PURE__*/React.createElement("div", {
    className: "sm:hidden -mx-5 px-5 flex gap-4 overflow-x-auto no-sb snap-x-mandatory pb-2"
  }, TRAINERS.map(t => /*#__PURE__*/React.createElement(TrainerCard, {
    key: t.name,
    t: t
  }))), /*#__PURE__*/React.createElement("p", {
    className: "sm:hidden mt-4 text-center text-mute/60 text-xs tracking-widest"
  }, "\u2190 \u041B\u0418\u0421\u0422\u0410\u0419 \u2192")));
}

/* ---------------- Абонементы ---------------- */
function PremiumCard() {
  const feats = ['Безлимитное посещение клуба', 'Персональный шкафчик', 'Все групповые тренировки', 'Чистое полотенце на каждой тренировке', 'Заморозка абонемента', 'Приоритетная запись к тренерам'];
  return /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0,
      y: 40
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true,
      margin: '-60px'
    },
    transition: {
      duration: 0.9,
      ease
    },
    whileHover: {
      scale: 1.01
    },
    className: "relative overflow-hidden rounded-[2rem] p-8 sm:p-12 border border-gold/40 grain",
    style: {
      background: 'radial-gradient(120% 120% at 100% 0%, rgba(216,179,106,0.14), transparent 55%), linear-gradient(180deg,#0d0b07,#050505)',
      boxShadow: '0 0 80px -20px rgba(216,179,106,0.35)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-gold to-transparent"
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-2 gap-8 items-center"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "inline-flex items-center gap-2 text-[10px] tracking-[0.3em] text-gold border border-gold/40 rounded-full px-3 py-1"
  }, "\u2605 \u041F\u0420\u0415\u041C\u0418\u0423\u041C"), /*#__PURE__*/React.createElement("h3", {
    className: "mt-6 font-display font-extrabold text-[clamp(3rem,8vw,5.5rem)] display-tight"
  }, "29 000", /*#__PURE__*/React.createElement("span", {
    className: "text-gold text-3xl align-top ml-2"
  }, "\u20BD")), /*#__PURE__*/React.createElement("p", {
    className: "text-mute mt-2"
  }, "12 \u043C\u0435\u0441\u044F\u0446\u0435\u0432 \xB7 \u0432\u0441\u0451 \u0432\u043A\u043B\u044E\u0447\u0435\u043D\u043E"), /*#__PURE__*/React.createElement("a", {
    href: "#contact",
    className: "mt-8 inline-flex items-center gap-2 rounded-full bg-gold text-ink font-semibold px-8 py-4 text-sm hover:brightness-110 transition-all hover:scale-[1.03]"
  }, "\u041E\u0444\u043E\u0440\u043C\u0438\u0442\u044C \u041F\u0440\u0435\u043C\u0438\u0443\u043C \u2192")), /*#__PURE__*/React.createElement("ul", {
    className: "space-y-3 text-sm"
  }, feats.map(f => /*#__PURE__*/React.createElement("li", {
    key: f,
    className: "flex items-start gap-3 text-white/80"
  }, /*#__PURE__*/React.createElement("span", {
    className: "mt-1 h-1.5 w-1.5 rounded-full bg-gold shrink-0"
  }), f)))));
}
function PlanCard({
  p,
  i
}) {
  return /*#__PURE__*/React.createElement(motion.div, {
    initial: {
      opacity: 0,
      y: 30
    },
    whileInView: {
      opacity: 1,
      y: 0
    },
    viewport: {
      once: true,
      margin: '-40px'
    },
    transition: {
      duration: 0.7,
      delay: i % 3 * 0.07,
      ease
    },
    whileHover: {
      scale: 1.03
    },
    className: "group shrink-0 w-[74vw] sm:w-auto snap-start relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0a0a0a] p-7 hover:border-accent/50 transition-colors"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs tracking-[0.25em] text-mute uppercase"
  }, p.name), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-white/40"
  }, p.note)), /*#__PURE__*/React.createElement("div", {
    className: "mt-8 font-display font-extrabold text-[clamp(2.4rem,5vw,3.4rem)] display-tight"
  }, p.price, /*#__PURE__*/React.createElement("span", {
    className: "text-accent text-xl align-top ml-1"
  }, p.unit)), /*#__PURE__*/React.createElement("p", {
    className: "mt-2 text-mute text-sm"
  }, p.sub), /*#__PURE__*/React.createElement("a", {
    href: "#contact",
    className: "mt-7 inline-flex w-full items-center justify-center rounded-full border border-white/15 text-white/80 text-sm font-medium py-3 group-hover:bg-accent group-hover:border-accent group-hover:text-white transition-colors"
  }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C"));
}
function Membership() {
  return /*#__PURE__*/React.createElement("section", {
    id: "membership",
    className: "relative bg-ink py-24 sm:py-32"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px] px-5 sm:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-12 sm:mb-16 max-w-2xl"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-[0.35em] font-medium mb-5"
  }, "\u0410\u0411\u041E\u041D\u0415\u041C\u0415\u041D\u0422\u042B")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.05
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-extrabold display-tight text-[clamp(2.6rem,7vw,5.5rem)]"
  }, "\u0412\u044B\u0431\u0435\u0440\u0438 \u0441\u0432\u043E\u0439", /*#__PURE__*/React.createElement("br", null), "\u0444\u043E\u0440\u043C\u0430\u0442."))), /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement(PremiumCard, null)), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-5 mt-6"
  }, PLANS.map((p, i) => /*#__PURE__*/React.createElement(PlanCard, {
    key: p.key,
    p: p,
    i: i
  }))), /*#__PURE__*/React.createElement("div", {
    className: "sm:hidden -mx-5 px-5 mt-6 flex gap-4 overflow-x-auto no-sb snap-x-mandatory pb-2"
  }, PLANS.map((p, i) => /*#__PURE__*/React.createElement(PlanCard, {
    key: p.key,
    p: p,
    i: i
  }))), /*#__PURE__*/React.createElement("p", {
    className: "sm:hidden mt-3 text-center text-mute/60 text-xs tracking-widest"
  }, "\u2190 \u041B\u0418\u0421\u0422\u0410\u0419 \u2192")));
}

/* ---------------- Тренировки (параллакс) ---------------- */
function Classes() {
  const ref = useRef(null);
  const {
    scrollYProgress
  } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  const y = useTransform(scrollYProgress, [0, 1], ['-8%', '8%']);
  return /*#__PURE__*/React.createElement("section", {
    id: "classes",
    ref: ref,
    className: "relative h-[70vh] overflow-hidden grain"
  }, /*#__PURE__*/React.createElement(motion.div, {
    style: {
      y
    },
    className: "absolute inset-0 portrait scale-110"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-black/50"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative z-10 h-full mx-auto max-w-[1400px] px-5 sm:px-8 flex flex-col justify-center items-center text-center"
  }, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-[0.35em] font-medium mb-6"
  }, "\u0413\u0420\u0423\u041F\u041F\u041E\u0412\u042B\u0415 \u0422\u0420\u0415\u041D\u0418\u0420\u041E\u0412\u041A\u0418")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.05
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-extrabold display-tight text-[clamp(2.8rem,9vw,7rem)] max-w-4xl"
  }, "\u0414\u0412\u0418\u0416\u0415\u041D\u0418\u0415 \u0411\u0415\u0417", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("span", {
    className: "text-accent"
  }, "\u041F\u0410\u0423\u0417"))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("p", {
    className: "mt-6 text-mute max-w-md"
  }, "\u0421\u0438\u043B\u043E\u0432\u044B\u0435, \u0444\u0443\u043D\u043A\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u0435 \u0438 \u0433\u0440\u0443\u043F\u043F\u043E\u0432\u044B\u0435 \u0444\u043E\u0440\u043C\u0430\u0442\u044B \u2014 \u0440\u0430\u0441\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C."))));
}

/* ---------------- Контакты / футер ---------------- */
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    id: "contact",
    className: "relative bg-ink pt-24 sm:pt-32 pb-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mx-auto max-w-[1400px] px-5 sm:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-2 gap-14 items-end pb-20 border-b border-white/10"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Reveal, null, /*#__PURE__*/React.createElement("p", {
    className: "text-accent text-xs tracking-[0.35em] font-medium mb-6"
  }, "\u0413\u041E\u0422\u041E\u0412?")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.05
  }, /*#__PURE__*/React.createElement("h2", {
    className: "font-display font-extrabold display-tight text-[clamp(2.8rem,8vw,6rem)]"
  }, "\u041D\u0410\u0427\u041D\u0418", /*#__PURE__*/React.createElement("br", null), "\u0421\u0415\u0413\u041E\u0414\u041D\u042F.")), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("a", {
    href: "#membership",
    className: "mt-9 inline-flex items-center gap-2 rounded-full bg-accent text-white font-semibold px-9 py-4 hover:bg-accentSoft transition-all hover:scale-[1.03]"
  }, "\u0417\u0430\u043F\u0438\u0441\u0430\u0442\u044C\u0441\u044F \u2192"))), /*#__PURE__*/React.createElement(Reveal, {
    delay: 0.1
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-8 text-sm"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-white/40 text-xs tracking-widest mb-3"
  }, "\u041A\u041B\u0423\u0411"), /*#__PURE__*/React.createElement("p", {
    className: "text-white/80 leading-relaxed"
  }, "\u041A\u0440\u0430\u0441\u043D\u043E\u0434\u0430\u0440", /*#__PURE__*/React.createElement("br", null), "\u0421\u0442\u0430\u0432\u0440\u043E\u043F\u043E\u043B\u044C\u0441\u043A\u0430\u044F \u0443\u043B\u0438\u0446\u0430, 141/2", /*#__PURE__*/React.createElement("br", null), "\u041A\u0440\u0443\u0433\u043B\u043E\u0441\u0443\u0442\u043E\u0447\u043D\u043E \xB7 24/7")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-white/40 text-xs tracking-widest mb-3"
  }, "\u041A\u041E\u041D\u0422\u0410\u041A\u0422\u042B"), /*#__PURE__*/React.createElement("a", {
    href: PHONE_HREF,
    className: "block text-white/80 hover:text-accent transition-colors"
  }, PHONE), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "block text-white/80 hover:text-accent transition-colors mt-2"
  }, "Instagram"), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "block text-white/80 hover:text-accent transition-colors"
  }, "Telegram"))))), /*#__PURE__*/React.createElement("div", {
    className: "pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement(Logo, null), /*#__PURE__*/React.createElement("p", {
    className: "text-mute/60 text-xs"
  }, "\xA9 2026 7F Fitness Club. \u0412\u0441\u0435 \u043F\u0440\u0430\u0432\u0430 \u0437\u0430\u0449\u0438\u0449\u0435\u043D\u044B."), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-6 text-xs text-white/50"
  }, NAV.map(n => /*#__PURE__*/React.createElement("a", {
    key: n.label,
    href: n.href,
    className: "hover:text-white transition-colors"
  }, n.label))))));
}

/* ---------------- App ---------------- */
function App() {
  return /*#__PURE__*/React.createElement("main", {
    className: "bg-ink"
  }, /*#__PURE__*/React.createElement(Header, null), /*#__PURE__*/React.createElement(Hero, null), /*#__PURE__*/React.createElement(KineticCore, null), /*#__PURE__*/React.createElement(Marquee, null), /*#__PURE__*/React.createElement(Why, null), /*#__PURE__*/React.createElement(Trainers, null), /*#__PURE__*/React.createElement(Membership, null), /*#__PURE__*/React.createElement(Classes, null), /*#__PURE__*/React.createElement(Footer, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
