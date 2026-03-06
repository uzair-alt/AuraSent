import { useEffect } from "react";

function setMetaTag(name, content) {
  if (typeof document === "undefined") return;
  if (!content) return;

  let element = document.querySelector(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

export function useSeo(options) {
  const {
    title,
    description,
    canonicalUrl,
  } = options || {};

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (title) {
      document.title = title;
    }

    if (description) {
      setMetaTag("description", description);
    }

    if (canonicalUrl) {
      let link = document.querySelector("link[rel=\"canonical\"]");
      if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
      }
      link.setAttribute("href", canonicalUrl);
    }
  }, [title, description, canonicalUrl]);
}

