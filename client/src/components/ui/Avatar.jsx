import { User } from "lucide-react";

import { SERVER_BASE_URL } from "../../api/axios";

const SIZE_CLASSES = {
  xs: "h-8 w-8 text-[11px]",
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
  xl: "h-24 w-24 text-2xl",
};

function getInitials(name = "") {
  const parts = String(name)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) return "";

  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
}

function getAvatarSrc(src) {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;

  return `${SERVER_BASE_URL}${src}`;
}

function Avatar({
  name = "",
  src = "",
  size = "md",
  className = "",
}) {
  const resolvedSize = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const initials = getInitials(name);
  const avatarSrc = getAvatarSrc(src);

  if (avatarSrc) {
    return (
      <img
        src={avatarSrc}
        alt={name || "Profilna slika"}
        className={`shrink-0 rounded-full border border-white/70 object-cover shadow-sm ${resolvedSize} ${className}`.trim()}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#0b3a8f] font-black text-white shadow-sm ${resolvedSize} ${className}`.trim()}
      aria-hidden="true"
    >
      {initials || <User size={16} />}
    </div>
  );
}

export default Avatar;
