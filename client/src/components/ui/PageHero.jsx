const themeStyles = {
  blue: {
    eyebrow: "text-[#0b3a8f]",
    glow: "bg-[#0b3a8f]/14",
    frame: "from-[#0b3a8f]/8 via-white to-sky-100",
    surface: "from-white via-[#f7faff] to-[#eef5ff]",
    badge: "bg-[#0b3a8f] text-white",
  },
  sky: {
    eyebrow: "text-sky-700",
    glow: "bg-sky-300/20",
    frame: "from-sky-100 via-white to-slate-50",
    surface: "from-white via-sky-50 to-slate-50",
    badge: "bg-sky-600 text-white",
  },
  emerald: {
    eyebrow: "text-emerald-700",
    glow: "bg-emerald-200/20",
    frame: "from-emerald-50 via-white to-amber-50",
    surface: "from-white via-emerald-50 to-amber-50",
    badge: "bg-emerald-600 text-white",
  },
  slate: {
    eyebrow: "text-slate-700",
    glow: "bg-slate-300/18",
    frame: "from-slate-100 via-white to-blue-50",
    surface: "from-white via-slate-50 to-blue-50",
    badge: "bg-slate-700 text-white",
  },
  amber: {
    eyebrow: "text-amber-700",
    glow: "bg-amber-200/24",
    frame: "from-amber-50 via-white to-sky-100",
    surface: "from-white via-amber-50 to-sky-50",
    badge: "bg-amber-500 text-[#10243A]",
  },
};

function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  highlights = [],
  featuredHighlight = null,
  theme = "blue",
  imageFit = "cover",
  imagePanelClassName = "bg-white",
}) {
  const styles = themeStyles[theme] || themeStyles.blue;
  const resolvedFeaturedHighlight = featuredHighlight || highlights[0];
  const FeaturedIcon = resolvedFeaturedHighlight?.icon;

  return (
    <section
      className={`relative isolate min-w-0 overflow-hidden rounded-[26px] border border-white/70 bg-gradient-to-br p-4 shadow-[0_22px_55px_rgba(15,23,42,0.10)] md:p-6 lg:p-8 ${styles.surface}`}
    >
      <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#0b3a8f]/18 to-transparent" />
      <div
        className={`pointer-events-none absolute -right-6 top-0 h-32 w-32 rounded-full blur-3xl ${styles.glow}`}
      />
      <div
        className={`studmate-float-slow pointer-events-none absolute -left-10 bottom-8 h-24 w-24 rounded-full blur-3xl ${styles.glow}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.78),transparent_36%)]" />

      <div className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,360px)] lg:items-center">
        <div className="min-w-0">
          <p
            className={`text-sm font-bold uppercase tracking-[0.18em] ${styles.eyebrow}`}
          >
            {eyebrow}
          </p>

          <h1 className="mt-3 break-words text-lg font-bold tracking-[-0.03em] text-[#10243A] md:text-2xl lg:text-[34px]">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl break-words text-sm leading-7 text-slate-500 md:text-[15px]">
            {description}
          </p>

          {highlights.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-3 py-2 text-xs font-bold text-[#10243A] shadow-[0_10px_22px_rgba(15,23,42,0.06)] backdrop-blur-sm"
                >
                  <Icon size={14} className={`shrink-0 ${styles.eyebrow}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-0 rounded-[24px] shadow-[0_22px_52px_rgba(16,36,58,0.16)]" />

          <div
            className={`relative rounded-[24px] bg-gradient-to-br p-2 ${styles.frame}`}
          >
            <div
              className={`overflow-hidden rounded-[20px] border border-white/70 ${imagePanelClassName}`}
            >
              <div className="aspect-[4/3]">
                <img
                  src={image}
                  alt={imageAlt}
                  className={`h-full w-full ${
                    imageFit === "contain"
                      ? "object-contain"
                      : "object-cover"
                  }`}
                />
              </div>
            </div>

            {resolvedFeaturedHighlight && FeaturedIcon ? (
              <div className="absolute -bottom-4 left-4 hidden items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-[0_18px_38px_rgba(15,23,42,0.14)] backdrop-blur-sm lg:flex">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${styles.badge}`}
                >
                  <FeaturedIcon size={18} />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    StudMate fokus
                  </p>
                  <p className="text-sm font-bold text-[#10243A]">
                    {resolvedFeaturedHighlight.label}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageHero;
