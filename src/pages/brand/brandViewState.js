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
  const margin = 28;
  const gap = 14;
  const headerH = 36;
  const footerH = 28;
  return {
    margin,
    gap,
    headerH,
    footerH,
    pageWidth,
    pageHeight,
    usableWidth: pageWidth - margin * 2,
    contentTop: margin + headerH,
    contentBottom: pageHeight - margin - footerH,
    usableHeight: pageHeight - margin * 2 - headerH - footerH,
  };
}

function formatExportStamp(date = new Date()) {
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Pack chart images on A4 with chrome + optional section page breaks. */
function createPdfPacker(pdf, { exportedAt = formatExportStamp() } = {}) {
  const metrics = pdfPageMetrics(pdf);
  let cursorY = metrics.contentTop;
  let pageStarted = false;
  let currentSection = '';

  const paintChrome = () => {
    const { margin, pageWidth, pageHeight, headerH, footerH } = metrics;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(40, 40, 40);
    pdf.text('Analytics by Ruchi Insights, powered by eRuchi.', margin, margin + 12);
    pdf.text(`Exported on ${exportedAt}`, pageWidth - margin, margin + 12, { align: 'right' });
    pdf.setDrawColor(220, 220, 220);
    pdf.line(margin, margin + headerH - 8, pageWidth - margin, margin + headerH - 8);

    const pageNo = pdf.internal.getNumberOfPages();
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Page ${pageNo}`, pageWidth / 2, pageHeight - margin + 4, { align: 'center' });
    pdf.line(margin, pageHeight - margin - footerH + 10, pageWidth - margin, pageHeight - margin - footerH + 10);
  };

  const ensurePage = (sectionTitle = '') => {
    if (!pageStarted) {
      pageStarted = true;
      paintChrome();
      cursorY = metrics.contentTop;
      if (sectionTitle) {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(15, 23, 42);
        pdf.text(sectionTitle, metrics.margin, cursorY + 4);
        cursorY += 22;
        currentSection = sectionTitle;
      }
      return;
    }
    pdf.addPage();
    paintChrome();
    cursorY = metrics.contentTop;
    if (sectionTitle) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(15, 23, 42);
      pdf.text(sectionTitle, metrics.margin, cursorY + 4);
      cursorY += 22;
      currentSection = sectionTitle;
    }
  };

  const beginSection = (sectionTitle) => {
    if (!sectionTitle) return;
    if (!pageStarted || currentSection !== sectionTitle) {
      ensurePage(sectionTitle);
    }
  };

  const addCanvas = (canvas, sectionTitle = '') => {
    if (!canvas || canvas.width < 2 || canvas.height < 2) return;
    if (sectionTitle) beginSection(sectionTitle);
    else if (!pageStarted) ensurePage();

    const image = canvas.toDataURL('image/jpeg', 0.82);
    const drawWidth = metrics.usableWidth;
    const drawHeight = (canvas.height * drawWidth) / canvas.width;
    const bottom = metrics.contentBottom;

    if (drawHeight > metrics.usableHeight) {
      ensurePage(sectionTitle && currentSection !== sectionTitle ? sectionTitle : '');
      let remaining = drawHeight;
      let offsetY = 0;
      while (remaining > 0) {
        if (offsetY > 0) ensurePage();
        pdf.addImage(image, 'JPEG', metrics.margin, metrics.contentTop - offsetY, drawWidth, drawHeight);
        remaining -= metrics.usableHeight;
        offsetY += metrics.usableHeight;
      }
      cursorY = bottom;
      return;
    }

    const needed = drawHeight + (cursorY > metrics.contentTop ? metrics.gap : 0);
    if (cursorY + needed > bottom) {
      ensurePage();
    } else if (cursorY > metrics.contentTop) {
      cursorY += metrics.gap;
    }

    pdf.addImage(image, 'JPEG', metrics.margin, cursorY, drawWidth, drawHeight);
    cursorY += drawHeight;
  };

  const finish = () => {
    const total = pdf.internal.getNumberOfPages();
    for (let page = 1; page <= total; page += 1) {
      pdf.setPage(page);
      // Re-stamp page numbers after all pages exist.
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(`Page ${page} of ${total}`, metrics.pageWidth / 2, metrics.pageHeight - metrics.margin + 4, { align: 'center' });
    }
  };

  return { addCanvas, beginSection, finish };
}

function sectionForCard(element) {
  return element?.closest?.('[data-export-section]')?.getAttribute('data-export-section') || '';
}

export async function exportPanelPdf(element, filename) {
  if (!element) return;
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
  packer.finish();
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
    const node = list[index];
    const canvas = await canvasFromElement(node);
    if (!canvas || canvas.width < 2 || canvas.height < 2) continue;
    packer.addCanvas(canvas, sectionForCard(node));
    wrote = true;
  }
  if (wrote) {
    packer.finish();
    pdf.save(filename);
  }
}
