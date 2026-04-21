// Shared admin helpers: layout render, session guard, sign out, flash messages
import { supabase, currentProfile, signOut } from './supabase.js';

const NAV = [
  { href: '/admin/index.html', label: 'Dashboard', icon: '🏛' },
  { href: '/admin/inquiries.html', label: 'Inquiries', icon: '✉' },
  { href: '/admin/contacts.html', label: 'Contacts CRM', icon: '👤' },
  { href: '/admin/documents.html', label: 'Document Vault', icon: '📄' },
  { href: '/admin/profile.html', label: 'Account', icon: '⚙' }
];

export async function mountShell({ activePath, title, subtitle }) {
  const profile = await currentProfile();
  if (!profile) {
    window.location.href = '/admin/login.html?next=' + encodeURIComponent(window.location.pathname);
    return null;
  }

  const shell = document.createElement('div');
  shell.className = 'shell';

  // Sidebar
  const side = document.createElement('aside');
  side.className = 'sidebar';
  side.innerHTML = `
    <div class="sidebar__brand">
      <strong>SCG</strong>
      <small>Partner Portal</small>
    </div>
    <nav class="sidebar__nav">
      ${NAV.map(n => `
        <a href="${n.href}" class="${n.href === activePath ? 'active' : ''}">
          <span style="width:1em">${n.icon}</span>${n.label}
        </a>`).join('')}
    </nav>
    <div class="sidebar__footer">
      Signed in as<br/>
      <strong style="color:#fff">${escapeHtml(profile.full_name || '')}</strong>
      <div style="color:#a17f3b;font-size:.65rem;letter-spacing:.1em;text-transform:uppercase;margin-top:.25rem">${profile.role}</div>
      <button id="scg-signout" type="button">Sign out</button>
    </div>
  `;

  // Main
  const main = document.createElement('main');
  main.className = 'main';
  const head = document.createElement('div');
  head.className = 'pagehead';
  head.innerHTML = `
    <div>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
    </div>
    <div id="pagehead-actions"></div>
  `;
  main.append(head);
  const body = document.createElement('div');
  body.id = 'scg-main-body';
  main.append(body);

  shell.append(side, main);

  // Replace body content
  document.body.innerHTML = '';
  document.body.append(shell);

  document.getElementById('scg-signout')?.addEventListener('click', signOut);

  // Warn on unchanged password
  if (profile.must_change_password) {
    flash(body, 'You are using the seeded admin password. Visit Account to change it.', 'warn');
  }

  return { profile, main, body, actions: document.getElementById('pagehead-actions') };
}

export function flash(parent, message, kind = 'ok') {
  const n = document.createElement('div');
  n.className = 'flash flash--' + kind;
  n.textContent = message;
  parent.prepend(n);
  setTimeout(() => { n.style.opacity = '0'; n.style.transition = 'opacity .6s'; setTimeout(() => n.remove(), 700); }, 6000);
  return n;
}

export function escapeHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

export function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function openModal(html) {
  let back = document.getElementById('scg-modal-backdrop');
  if (!back) {
    back = document.createElement('div');
    back.id = 'scg-modal-backdrop';
    back.className = 'modal-backdrop';
    document.body.append(back);
    back.addEventListener('click', (e) => { if (e.target === back) closeModal(); });
  }
  back.innerHTML = `<div class="modal">${html}</div>`;
  back.classList.add('open');
  back.querySelector('[data-close]')?.addEventListener('click', closeModal);
  return back.querySelector('.modal');
}

export function closeModal() {
  const back = document.getElementById('scg-modal-backdrop');
  if (back) back.classList.remove('open');
}
