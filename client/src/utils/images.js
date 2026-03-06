const CDN_BASE = import.meta.env.VITE_IMAGE_CDN_URL || "";

export function getImageUrl(src) {
  if (!src) {
    return "";
  }

  if (!CDN_BASE) {
    return src;
  }

  if (/^https?:\/\//i.test(src) || src.startsWith("//")) {
    return src;
  }

  const base = CDN_BASE.replace(/\/+$/, "");
  const path = src.startsWith("/") ? src : `/${src}`;

  return `${base}${path}`;
}

