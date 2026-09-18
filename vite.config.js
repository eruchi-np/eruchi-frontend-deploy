import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const PRODUCTION_ORIGIN = 'https://eruchi.com.np'
const PRODUCTION_GTM_ID = 'GTM-5NT24MPD'
const PRODUCTION_PIXEL_ID = '4160020660801265'

const sanitizeAnalyticsId = (value) => String(value || '').trim().replace(/[^A-Za-z0-9_-]/g, '')

const analyticsSnippets = (gtmId, pixelId) => {
  const gtmHead = gtmId
    ? `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');</script>
<!-- End Google Tag Manager -->`
    : ''

  const gtmNoscript = gtmId
    ? `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=${gtmId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`
    : ''

  const pixelHead = pixelId
    ? `<!-- Meta Pixel Code -->
    <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
    fbq('track', 'PageView');
    </script>
    <!-- End Meta Pixel Code -->`
    : ''

  const pixelNoscript = pixelId
    ? `<!-- Meta Pixel noscript -->
    <noscript><img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"
    /></noscript>
    <!-- End Meta Pixel noscript -->`
    : ''

  return { gtmHead, gtmNoscript, pixelHead, pixelNoscript }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteOrigin = (
    env.VITE_SITE_ORIGIN ||
    (mode === 'production' ? PRODUCTION_ORIGIN : 'http://localhost:5173')
  ).replace(/\/$/, '')

  // Production keeps current IDs if env is unset. Empty string omits scripts (staging/local).
  const gtmId = sanitizeAnalyticsId(
    env.VITE_GTM_ID !== undefined
      ? env.VITE_GTM_ID
      : (mode === 'production' ? PRODUCTION_GTM_ID : '')
  )
  const pixelId = sanitizeAnalyticsId(
    env.VITE_META_PIXEL_ID !== undefined
      ? env.VITE_META_PIXEL_ID
      : (mode === 'production' ? PRODUCTION_PIXEL_ID : '')
  )
  const snippets = analyticsSnippets(gtmId, pixelId)

  const apiOrigin = (() => {
    try {
      return new URL(env.VITE_API_BASE_URL || 'http://localhost:5000/api').origin
    } catch {
      return 'http://localhost:5000'
    }
  })()

  const securityHeaders = {
    // Lets Google's sign-in popup report back to this page.
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    'Referrer-Policy': 'no-referrer-when-downgrade',
    'Strict-Transport-Security': mode === 'production' ? 'max-age=15552000; includeSubDomains; preload' : undefined,
    'Content-Security-Policy': [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.googletagmanager.com https://connect.facebook.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      `connect-src 'self' ${apiOrigin} http://localhost:5000 http://localhost:5001 https://eruchi.com.np https://www.eruchi.com.np https://accounts.google.com https://www.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.facebook.com`,
      "frame-src https://accounts.google.com https://www.googletagmanager.com",
      "form-action 'self'",
    ].join('; '),
  }
  if (!securityHeaders['Strict-Transport-Security']) {
    delete securityHeaders['Strict-Transport-Security']
  }

  return {
    server: {
      headers: securityHeaders,
    },
    preview: {
      headers: securityHeaders,
    },
    plugins: [
      react({ jsxRuntime: 'automatic' }),
      {
        name: 'html-site-config',
        transformIndexHtml(html) {
          return html
            .replaceAll('%VITE_SITE_ORIGIN%', siteOrigin)
            .replace('<!-- ANALYTICS_GTM_HEAD -->', snippets.gtmHead)
            .replace('<!-- ANALYTICS_PIXEL_HEAD -->', snippets.pixelHead)
            .replace('<!-- ANALYTICS_GTM_NOSCRIPT -->', snippets.gtmNoscript)
            .replace('<!-- ANALYTICS_PIXEL_NOSCRIPT -->', snippets.pixelNoscript)
        },
      },
    ],
  }
})
