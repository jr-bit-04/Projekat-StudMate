const themeStyles = {
  blue: {
    eyebrow: "text-[#0b3a8f]",
    glow: "bg-[#0b3a8f]/14",
    frame: "from-[#0b3a8f]/8 via-white to-sky-100",
  },
  sky: {
    eyebrow: "text-sky-700",
    glow: "bg-sky-300/20",
    frame: "from-sky-100 via-white to-slate-50",
  },
  emerald: {
    eyebrow: "text-emerald-700",
    glow: "bg-emerald-200/20",
    frame: "from-emerald-50 via-white to-amber-50",
  },
  slate: {
    eyebrow: "text-slate-700",
    glow: "bg-slate-300/18",
    frame: "from-slate-100 via-white to-blue-50",
  },
  amber: {
    eyebrow: "text-amber-700",
    glow: "bg-amber-200/24",
    frame: "from-amber-50 via-white to-sky-100",
  },
};

function PageHero({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  highlights = [],
  theme = "blue",
  imageFit = "cover",
  imagePanelClassName = "bg-white",
}) {
  const styles = themeStyles[theme] || themeStyles.blue;

  return (
    <section className="min-w-0 overflow-hidden rounded-[22px] border border-[#dbe4f0] bg-white p-4 shadow-sm md:p-6 lg:p-8">
      <div
        className={`pointer-events-none absolute right-0 top-0 h-28 w-28 rounded-full blur-3xl ${styles.glow}`}
      />

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

          <p className="mt-2 break-words text-sm text-slate-500">
            {description}
          </p>

          {highlights.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {highlights.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#dbe4f0] bg-[#F8FBFF] px-3 py-2 text-xs font-bold text-[#10243A]"
                >
                  <Icon size={14} className={`shrink-0 ${styles.eyebrow}`} />
                  <span>{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-0">
          <div className="pointer-events-none absolute inset-0 rounded-[22px] shadow-[0_18px_45px_rgba(16,36,58,0.14)]" />

          <div
            className={`relative rounded-[22px] bg-gradient-to-br p-2 ${styles.frame}`}
          >
            <div
              className={`overflow-hidden rounded-[18px] border border-white/70 ${imagePanelClassName}`}
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
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageHero;
