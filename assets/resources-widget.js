// Reusable Resources block: fetches public docs for a given page_slug
// Usage on any public page:
//   <div id="scg-resources" data-page="lobbying" data-title="Lobbying & Policy Archive"></div>
//   <script src="/assets/config.js"></script>
//   <script type="module" src="/assets/resources-widget.js"></script>
import { supabase, publicDocumentUrl, listPublicDocuments, humanFileSize, recordDownload } from './supabase.js';

const FILE_ICON = {
  pdf: '📕', doc: '📘', docx: '📘', xls: '📗', xlsx: '📗', ppt: '📙', pptx: '📙',
  png: '🖼', jpg: '🖼', jpeg: '🖼', webp: '🖼', txt: '📄', csv: '🗂', zip: '🗜'
};
function iconFor(name) {
  const ext = (name || '').split('.').pop().toLowerCase();
  return FILE_ICON[ext] || '📄';
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

async function mount(root) {
  const slug = root.dataset.page || 'shared';
  const title = root.dataset.title || 'Download Resources';
  const desc = root.dataset.description || 'Curated whitepapers, policy briefs, case studies, and templates published by our consultants.';

  root.innerHTML = `
    <section style="padding:96px 0;background:#edeeef;border-top:1px solid #c5c6cd;border-bottom:1px solid #c5c6cd">
      <div style="max-width:1280px;margin:0 auto;padding:0 2rem">
        <div style="display:flex;justify-content:space-between;align-items:flex-end;gap:2rem;margin-bottom:2rem;flex-wrap:wrap">
          <div style="max-width:640px">
            <span style="font-size:.75rem;letter-spacing:.1em;text-transform:uppercase;color:#a17f3b;font-weight:600">Resources</span>
            <h2 style="font-family:Newsreader,serif;font-weight:500;font-size:2.25rem;color:#0A192F;margin:.5rem 0 .5rem">${esc(title)}</h2>
            <p style="color:#50606f;margin:0;font-size:1rem">${esc(desc)}</p>
          </div>
          <a href="/inquiry/" style="padding:.9rem 1.75rem;background:#0A192F;color:#fff;text-decoration:none;font-size:.7rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase">Request custom briefing →</a>
        </div>
        <div id="scg-res-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:1rem"></div>
      </div>
    </section>
  `;

  const grid = root.querySelector('#scg-res-grid');
  const docs = await listPublicDocuments(slug);
  if (!docs.length) {
    grid.outerHTML = `
      <div style="padding:2rem;background:#fff;border:1px dashed #75777e;text-align:center;color:#50606f;font-family:Inter,sans-serif">
        <div style="font-family:Newsreader,serif;font-size:1.25rem;color:#0A192F;margin-bottom:.25rem">Library populating</div>
        <div>Our consultants are preparing publications for this section. Meanwhile, <a href="/inquiry/" style="color:#a17f3b">submit an inquiry</a> and we'll send tailored material.</div>
      </div>`;
    return;
  }
  grid.innerHTML = docs.map(d => `
    <a href="${publicDocumentUrl(d.storage_path)}" target="_blank" rel="noopener"
       data-doc-id="${d.id}"
       style="display:flex;flex-direction:column;gap:.75rem;padding:1.25rem;background:#fff;border:1px solid #c5c6cd;border-left:4px solid #a17f3b;text-decoration:none;color:#191c1d;transition:border-color .15s, transform .15s;font-family:Inter,sans-serif"
       onmouseover="this.style.borderLeftColor='#0A192F'" onmouseout="this.style.borderLeftColor='#a17f3b'">
      <div style="display:flex;align-items:center;gap:.5rem;justify-content:space-between">
        <span style="font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;color:#75777e;font-weight:600">${esc(d.category)}</span>
        <span style="font-size:1.5rem">${iconFor(d.file_name)}</span>
      </div>
      <div style="font-family:Newsreader,serif;font-size:1.15rem;color:#0A192F;font-weight:500;line-height:1.3">${esc(d.title)}</div>
      ${d.description ? `<div style="font-size:.85rem;color:#50606f;line-height:1.5">${esc(d.description)}</div>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:.5rem;border-top:1px solid #e1e3e4;font-size:.7rem;color:#75777e;letter-spacing:.05em;text-transform:uppercase">
        <span>${esc(d.file_name.split('.').pop().toUpperCase())} · ${humanFileSize(d.file_size)}</span>
        <span style="color:#0A192F;font-weight:700">Download ↓</span>
      </div>
    </a>
  `).join('');
  grid.querySelectorAll('[data-doc-id]').forEach(a => {
    a.addEventListener('click', () => recordDownload(a.dataset.docId));
  });
}

const root = document.getElementById('scg-resources');
if (root) mount(root);
