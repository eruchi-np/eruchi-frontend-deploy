import { GROUPS } from './brandDashboardMetrics';

const ADMIN_KEY = 'eruchi.brandTracker.prefs';
const TIP_KEY = 'eruchi.brandDashboard.tipSeen';

export function readAdminPrefs() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || '{}') || {};
  } catch {
    return {};
  }
}

export function writeAdminPrefs(prefs) {
  try {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function tipSeen() {
  try {
    return localStorage.getItem(TIP_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTipSeen() {
  try {
    localStorage.setItem(TIP_KEY, '1');
  } catch {
    /* ignore */
  }
}

export function parseDashboardSearch(search) {
  const params = new URLSearchParams(search);
  const section = params.get('section') || '';
  const page = Math.max(0, GROUPS.findIndex((item) => item.id === section));
  const compare = (params.get('compare') || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
  return {
    page: page >= 0 ? page : 0,
    wave: params.get('wave') || '',
    from: params.get('from') || '',
    to: params.get('to') || '',
    compare,
  };
}

export function writeDashboardSearch({ page, wave, from, to, compare }, replace) {
  const params = new URLSearchParams(window.location.search);
  const section = GROUPS[page]?.id;
  if (section) params.set('section', section);
  else params.delete('section');
  if (wave) params.set('wave', wave);
  else params.delete('wave');
  if (from) params.set('from', from);
  else params.delete('from');
  if (to) params.set('to', to);
  else params.delete('to');
  if (compare?.length) params.set('compare', compare.join(','));
  else params.delete('compare');
  const next = `${window.location.pathname}?${params.toString()}`;
  const current = `${window.location.pathname}${window.location.search}`;
  if (next === current) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', next);
}

export function focusedBrandList(brands, focus, max = 5, offset = 0) {
  const list = (brands || []).filter(Boolean);
  if (!list.length) return [];
  if (list.length <= max) return list;
  const primary = list.includes(focus) ? focus : list[0];
  const rest = list.filter((name) => name !== primary);
  const start = rest.length ? ((offset % rest.length) + rest.length) % rest.length : 0;
  const window = [...rest.slice(start), ...rest.slice(0, start)].slice(0, max - 1);
  return [primary, ...window];
}

export function exportRowsCsv(filename, rows) {
  if (!rows?.length) return;
  const keys = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const body = [keys.join(','), ...rows.map((row) => keys.map((key) => escape(row[key])).join(','))].join('\n');
  const blob = new Blob([body], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function pinSvgSizes(root) {
  const pinned = [];
  root.querySelectorAll('.recharts-wrapper svg').forEach((svg) => {
    const wrapper = svg.closest('.recharts-wrapper');
    const width = Math.ceil(wrapper?.getBoundingClientRect().width || svg.clientWidth || 0);
    const height = Math.ceil(wrapper?.getBoundingClientRect().height || svg.clientHeight || 0);
    if (width < 8 || height < 8) return;
    pinned.push({
      svg,
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      styleWidth: svg.style.width,
      styleHeight: svg.style.height,
    });
    svg.setAttribute('width', String(width));
    svg.setAttribute('height', String(height));
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
  });
  return () => {
    pinned.forEach((item) => {
      if (item.width != null) item.svg.setAttribute('width', item.width);
      else item.svg.removeAttribute('width');
      if (item.height != null) item.svg.setAttribute('height', item.height);
      else item.svg.removeAttribute('height');
      item.svg.style.width = item.styleWidth || '';
      item.svg.style.height = item.styleHeight || '';
    });
  };
}

async function canvasFromElement(element) {
  if (!element) return null;
  element.scrollIntoView({ block: 'center', inline: 'nearest' });
  window.dispatchEvent(new Event('resize'));
  await new Promise((resolve) => window.requestAnimationFrame(() => resolve()));
  await new Promise((resolve) => window.setTimeout(resolve, 120));
  const restore = pinSvgSizes(element);
  try {
    const { toCanvas } = await import('html-to-image');
    return await toCanvas(element, {
      pixelRatio: 1.5,
      cacheBust: true,
      backgroundColor: '#ffffff',
      preferredFontFormat: 'woff2',
      filter: (node) => {
        if (!(node instanceof Element)) return true;
        // Keep chart nodes; drop floating chrome that can confuse the clone.
        if (node.tagName === 'BUTTON' && node.closest('.fixed')) return false;
        return true;
      },
    });
  } finally {
    restore();
  }
}

function pdfPageMetrics(pdf) {
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 24;
  const gap = 14;
  return {
    margin,
    gap,
    usableWidth: pageWidth - margin * 2,
    usableHeight: pageHeight - margin * 2,
    pageHeight,
  };
}

/** Pack chart images top-to-bottom on A4; new page only when the next chart won't fit. */
function createPdfPacker(pdf) {
  const metrics = pdfPageMetrics(pdf);
  let cursorY = metrics.margin;
  let pageStarted = false;

  const ensurePage = () => {
    if (!pageStarted) {
      pageStarted = true;
      return;
    }
    pdf.addPage();
    cursorY = metrics.margin;
  };

  const addCanvas = (canvas) => {
    if (!canvas || canvas.width < 2 || canvas.height < 2) return;
    const image = canvas.toDataURL('image/jpeg', 0.82);
    const drawWidth = metrics.usableWidth;
    const drawHeight = (canvas.height * drawWidth) / canvas.width;

    // Tall single chart: slice across pages.
    if (drawHeight > metrics.usableHeight) {
      ensurePage();
      let remaining = drawHeight;
      let offsetY = 0;
      while (remaining > 0) {
        if (offsetY > 0) {
          pdf.addPage();
          cursorY = metrics.margin;
        }
        pdf.addImage(image, 'JPEG', metrics.margin, metrics.margin - offsetY, drawWidth, drawHeight);
        remaining -= metrics.usableHeight;
        offsetY += metrics.usableHeight;
      }
      cursorY = metrics.margin + metrics.usableHeight;
      return;
    }

    const needed = drawHeight + (cursorY > metrics.margin ? metrics.gap : 0);
    if (!pageStarted || cursorY + needed > metrics.margin + metrics.usableHeight) {
      ensurePage();
    } else if (cursorY > metrics.margin) {
      cursorY += metrics.gap;
    }

    pdf.addImage(image, 'JPEG', metrics.margin, cursorY, drawWidth, drawHeight);
    cursorY += drawHeight;
  };

  return { addCanvas };
}

export async function exportPanelPdf(element, filename) {
  if (!element) return;
  // Capture cards one-by-one (reliable for Recharts), then pack several per page.
  const cards = [...element.querySelectorAll('[data-export-chart]')];
  if (cards.length) {
    await exportElementsPdf(cards, filename);
    return;
  }
  const { jsPDF } = await import('jspdf');
  const canvas = await canvasFromElement(element);
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const packer = createPdfPacker(pdf);
  packer.addCanvas(canvas);
  pdf.save(filename);
}

export async function exportElementsPdf(elements, filename) {
  const list = (elements || []).filter(Boolean);
  if (!list.length) return;
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const packer = createPdfPacker(pdf);
  let wrote = false;
  for (let index = 0; index < list.length; index += 1) {
    const canvas = await canvasFromElement(list[index]);
    if (!canvas || canvas.width < 2 || canvas.height < 2) continue;
    packer.addCanvas(canvas);
    wrote = true;
  }
  if (wrote) pdf.save(filename);
}
