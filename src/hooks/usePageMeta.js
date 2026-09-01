import { useEffect } from 'react';

const SITE_ORIGIN = 'https://eruchi.com.np';

function upsertMeta(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key, value]) => {
    if (value == null) el.removeAttribute(key);
    else el.setAttribute(key, value);
  });
  return el;
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return el;
}

export default function usePageMeta({
  title,
  description,
  index = true,
  canonicalPath,
  skip = false,
} = {}) {
  useEffect(() => {
    if (skip) return;

    const pageTitle = title ? `${title} | eRuchi` : 'eRuchi';
    document.title = pageTitle;

    if (description) {
      upsertMeta('meta[name="description"]', { name: 'description', content: description });
      upsertMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    }

    upsertMeta('meta[name="robots"]', {
      name: 'robots',
      content: index ? 'index, follow' : 'noindex, nofollow',
    });
    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });

    const path = canonicalPath || window.location.pathname;
    const canonical = `${SITE_ORIGIN}${path}`;
    upsertLink('canonical', canonical);
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });

    const jsonId = 'eruchi-jsonld';
    let jsonLd = document.getElementById(jsonId);
    if (path === '/') {
      if (!jsonLd) {
        jsonLd = document.createElement('script');
        jsonLd.id = jsonId;
        jsonLd.type = 'application/ld+json';
        document.head.appendChild(jsonLd);
      }
      jsonLd.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'eRuchi',
        url: SITE_ORIGIN,
        logo: `${SITE_ORIGIN}/logo.png`,
        description,
      });
    } else if (jsonLd) {
      jsonLd.remove();
    }
  }, [title, description, index, canonicalPath, skip]);
}

export { SITE_ORIGIN };
