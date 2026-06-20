function ActionCtaCard({
  description,
  eyebrow,
  icon: Icon,
  onClick,
  title,
  chipLabel = "Otvori uplatu",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex w-full items-center gap-4 rounded-[22px] border border-[#1f56b3] bg-[linear-gradient(135deg,#0b3a8f_0%,#1148ad_62%,#1b5fd0_100%)] px-5 py-4 text-left text-white shadow-[0_16px_30px_rgba(11,58,143,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_36px_rgba(11,58,143,0.28)] sm:min-w-[280px] sm:w-auto"
    >
      {Icon ? (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
          <Icon size={20} />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">
          {eyebrow}
        </span>

        <span className="mt-1 text-base font-bold leading-5">{title}</span>

        {description ? (
          <span className="mt-2 text-sm leading-6 text-white/78">
            {description}
          </span>
        ) : null}

        <span className="mt-4 inline-flex w-fit rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0b3a8f]">
          {chipLabel}
        </span>
      </span>
    </button>
  );
}

export default ActionCtaCard;
