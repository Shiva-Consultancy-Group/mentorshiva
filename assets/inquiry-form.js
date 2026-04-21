/**
 * Standalone Inquiry Submission Form
 * Replicates the 3-step form at https://inquiry.msmeintelligence.in/inquiry-submission-form
 *
 * Usage:
 *   <div id="scg-inquiry-root" data-source-page="intelligence"></div>
 *   <script type="module" src="/assets/inquiry-form.js"></script>
 *
 * Dependencies:
 *   - /assets/config.js     (Supabase URL + anon key)
 *   - /assets/supabase.js   (supabase client)
 *   - /assets/inquiry-form.css (styles)
 */

import { supabase } from './supabase.js';

const BUSINESS_TYPES = [
  'Private Limited Company',
  'Limited Liability Partnership (LLP)',
  'Partnership Firm',
  'Proprietorship',
  'Public Limited Company',
  'Section 8 Company (NGO)',
  'One Person Company (OPC)',
  'Startup (DPIIT Recognized)',
  'MSME Registered',
  'Other'
];

const IN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana',
  'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur',
  'Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana',
  'Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi',
  'Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
];

const SERVICE_AREAS = [
  'Lobbying & Liaisoning',
  'MSME Growth & Mentoring',
  'Intelligence & Research',
  'Sustainability & ESG',
  'Regulatory Compliance',
  'Investment Banking / Capital',
  'Corporate Mentoring',
  'Other'
];

const URGENCY_OPTIONS = [
  'Immediate (within 7 days)',
  'This quarter',
  'Next quarter',
  'Exploratory / no rush'
];

const BUDGET_BANDS = [
  'Under ₹1 Lakh',
  '₹1–5 Lakhs',
  '₹5–15 Lakhs',
  '₹15–50 Lakhs',
  '₹50 Lakhs+',
  'To be discussed'
];

const state = {
  step: 1,
  sourcePage: 'other',
  data: {
    // Step 1
    organization: '', business_type: '', gst_number: '', city: '', state_region: '', website: '',
    full_name: '', designation: '', email: '', phone: '', alt_phone: '',
    // Step 2
    service_areas: [], current_challenge: '', goals: '', urgency: '', budget_band: '',
    existing_advisor: false,
    // Step 3
    preferred_channel: 'email', best_time: '', newsletter_opt_in: true,
    consent_to_contact: true, files: []
  },
  errors: {},
  submitting: false,
  submissionRef: null,
  root: null
};

function el(tag, attrs = {}, ...kids) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v === true) node.setAttribute(k, '');
    else if (v === false || v == null) {}
    else node.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null) continue;
    node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  }
  return node;
}

function required(name) {
  return el('span', { class: 'req' }, '*');
}

function fieldText({ key, label, type = 'text', placeholder = '', hint = '', req = false }) {
  const fld = el('div', { class: 'scg-inquiry__field' });
  const lab = el('label', { class: 'scg-inquiry__label' }, label);
  if (req) lab.append(required());
  fld.append(lab);
  const input = el('input', {
    class: 'scg-inquiry__input',
    type, name: key, placeholder,
    value: state.data[key] || '',
    oninput: (e) => { state.data[key] = e.target.value; clearError(key); }
  });
  fld.append(input);
  if (hint) fld.append(el('div', { class: 'scg-inquiry__hint' }, hint));
  fld.append(el('div', { class: 'scg-inquiry__error', 'data-error-for': key }));
  return fld;
}

function fieldSelect({ key, label, options, req = false, placeholder = 'Select…' }) {
  const fld = el('div', { class: 'scg-inquiry__field' });
  const lab = el('label', { class: 'scg-inquiry__label' }, label);
  if (req) lab.append(required());
  fld.append(lab);
  const sel = el('select', {
    class: 'scg-inquiry__select',
    name: key,
    onchange: (e) => { state.data[key] = e.target.value; clearError(key); }
  },
    el('option', { value: '' }, placeholder),
    ...options.map(o => el('option', { value: o, selected: state.data[key] === o ? 'selected' : false }, o))
  );
  fld.append(sel);
  fld.append(el('div', { class: 'scg-inquiry__error', 'data-error-for': key }));
  return fld;
}

function fieldTextarea({ key, label, placeholder, req = false, rows = 4 }) {
  const fld = el('div', { class: 'scg-inquiry__field scg-inquiry__field--full' });
  const lab = el('label', { class: 'scg-inquiry__label' }, label);
  if (req) lab.append(required());
  fld.append(lab);
  const ta = el('textarea', {
    class: 'scg-inquiry__textarea', rows, name: key, placeholder,
    oninput: (e) => { state.data[key] = e.target.value; clearError(key); }
  });
  ta.value = state.data[key] || '';
  fld.append(ta);
  fld.append(el('div', { class: 'scg-inquiry__error', 'data-error-for': key }));
  return fld;
}

function fieldCheckboxGroup({ key, label, options }) {
  const fld = el('div', { class: 'scg-inquiry__field scg-inquiry__field--full' });
  fld.append(el('label', { class: 'scg-inquiry__label' }, label));
  const grid = el('div', { class: 'scg-inquiry__grid' });
  options.forEach(opt => {
    const id = `${key}-${opt.replace(/\W+/g, '-').toLowerCase()}`;
    const wrap = el('label', { class: 'scg-inquiry__checkbox', for: id });
    const cb = el('input', {
      type: 'checkbox', id, value: opt, name: key,
      onchange: (e) => {
        const set = new Set(state.data[key] || []);
        e.target.checked ? set.add(opt) : set.delete(opt);
        state.data[key] = Array.from(set);
      }
    });
    if ((state.data[key] || []).includes(opt)) cb.checked = true;
    wrap.append(cb, el('span', {}, opt));
    grid.append(wrap);
  });
  fld.append(grid);
  return fld;
}

function setError(key, msg) {
  state.errors[key] = msg;
  const node = state.root.querySelector(`[data-error-for="${key}"]`);
  if (node) node.textContent = msg;
}

function clearError(key) {
  delete state.errors[key];
  const node = state.root.querySelector(`[data-error-for="${key}"]`);
  if (node) node.textContent = '';
}

function isEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }
function isPhone(s) { return /^[+\d\s\-()]{7,20}$/.test(s); }

function validateStep(step) {
  state.errors = {};
  const d = state.data;
  if (step === 1) {
    if (!d.organization.trim()) setError('organization', 'Required');
    if (!d.business_type) setError('business_type', 'Required');
    if (!d.city.trim()) setError('city', 'Required');
    if (!d.state_region) setError('state_region', 'Required');
    if (!d.full_name.trim()) setError('full_name', 'Required');
    if (!d.designation.trim()) setError('designation', 'Required');
    if (!d.email.trim()) setError('email', 'Required');
    else if (!isEmail(d.email)) setError('email', 'Enter a valid email');
    if (!d.phone.trim()) setError('phone', 'Required');
    else if (!isPhone(d.phone)) setError('phone', 'Enter a valid phone number');
  }
  if (step === 2) {
    if (!d.service_areas.length) setError('service_areas', 'Select at least one');
    if (!d.current_challenge.trim()) setError('current_challenge', 'Required');
    if (!d.urgency) setError('urgency', 'Required');
  }
  if (step === 3) {
    if (!d.consent_to_contact) setError('consent_to_contact', 'Required to proceed');
  }
  return Object.keys(state.errors).length === 0;
}

function render() {
  state.root.replaceChildren();
  state.root.className = 'scg-inquiry';

  if (state.submissionRef) return renderSuccess();

  // Header
  const header = el('div', { class: 'scg-inquiry__header' },
    el('span', { class: 'scg-inquiry__eyebrow' }, 'Engagement Request'),
    el('h2', { class: 'scg-inquiry__title' }, 'Submit a Service Inquiry'),
    el('p', { class: 'scg-inquiry__subtitle' },
      'Tell us about your business needs. Our consultants will respond within 24 hours.')
  );
  state.root.append(header);

  // Progress
  const pct = (state.step / 3) * 100;
  const progress = el('div', { class: 'scg-inquiry__progress' },
    el('span', {}, `Step ${state.step} of 3`),
    el('div', { class: 'scg-inquiry__progress-bar' },
      el('div', { class: 'scg-inquiry__progress-fill', style: `width:${pct}%;` })),
    el('span', {}, `${Math.round(pct)}% complete`)
  );
  state.root.append(progress);

  if (state.step === 1) renderStep1();
  else if (state.step === 2) renderStep2();
  else if (state.step === 3) renderStep3();
}

function renderStep1() {
  const company = el('div', { class: 'scg-inquiry__section' },
    el('h3', { class: 'scg-inquiry__section-title' }, 'Company Details'),
    el('div', { class: 'scg-inquiry__grid' },
      fieldText({ key: 'organization', label: 'Company / Organization', req: true }),
      fieldSelect({ key: 'business_type', label: 'Business Type', options: BUSINESS_TYPES, req: true }),
      fieldText({ key: 'gst_number', label: 'GST Number', placeholder: '15-digit GSTIN if registered' }),
      fieldText({ key: 'website', label: 'Website' }),
      fieldText({ key: 'city', label: 'City', req: true }),
      fieldSelect({ key: 'state_region', label: 'State', options: IN_STATES, req: true })
    )
  );
  const contact = el('div', { class: 'scg-inquiry__section' },
    el('h3', { class: 'scg-inquiry__section-title' }, 'Primary Contact Person'),
    el('div', { class: 'scg-inquiry__grid' },
      fieldText({ key: 'full_name', label: 'Full Name', req: true }),
      fieldText({ key: 'designation', label: 'Designation', req: true }),
      fieldText({ key: 'email', label: 'Email Address', type: 'email', req: true, hint: 'Confirmation will be sent to this email' }),
      fieldText({ key: 'phone', label: 'Mobile Number', type: 'tel', req: true }),
      fieldText({ key: 'alt_phone', label: 'Alternate Phone', type: 'tel' })
    )
  );

  const actions = el('div', { class: 'scg-inquiry__actions' },
    el('span', {}, ''),
    el('button', {
      class: 'scg-inquiry__btn scg-inquiry__btn--primary', type: 'button',
      onclick: () => { if (validateStep(1)) { state.step = 2; render(); } else render(); }
    }, 'Continue to Service Requirements')
  );
  state.root.append(company, contact, actions);
  renderPrivacyNote();
}

function renderStep2() {
  const sec = el('div', { class: 'scg-inquiry__section' },
    el('h3', { class: 'scg-inquiry__section-title' }, 'Service Requirements'),
    fieldCheckboxGroup({ key: 'service_areas', label: 'Which services do you need? (select all that apply)', options: SERVICE_AREAS }),
    fieldTextarea({ key: 'current_challenge', label: 'Current business challenge', placeholder: 'Describe the problem you are trying to solve…', req: true }),
    fieldTextarea({ key: 'goals', label: 'Desired outcome (next 12 months)', placeholder: 'What does success look like?' }),
    el('div', { class: 'scg-inquiry__grid' },
      fieldSelect({ key: 'urgency', label: 'Engagement urgency', options: URGENCY_OPTIONS, req: true }),
      fieldSelect({ key: 'budget_band', label: 'Indicative budget (INR)', options: BUDGET_BANDS })
    ),
    el('label', { class: 'scg-inquiry__checkbox' },
      el('input', {
        type: 'checkbox',
        onchange: (e) => { state.data.existing_advisor = e.target.checked; }
      }),
      el('span', {}, 'We currently work with another advisor on this matter')
    )
  );
  const actions = el('div', { class: 'scg-inquiry__actions' },
    el('button', {
      class: 'scg-inquiry__btn scg-inquiry__btn--secondary', type: 'button',
      onclick: () => { state.step = 1; render(); }
    }, '← Back'),
    el('button', {
      class: 'scg-inquiry__btn scg-inquiry__btn--primary', type: 'button',
      onclick: () => { if (validateStep(2)) { state.step = 3; render(); } else render(); }
    }, 'Continue to Preferences')
  );
  state.root.append(sec, actions);
  renderPrivacyNote();
}

function renderStep3() {
  const sec = el('div', { class: 'scg-inquiry__section' },
    el('h3', { class: 'scg-inquiry__section-title' }, 'Preferences & Files'),
    el('div', { class: 'scg-inquiry__grid' },
      fieldSelect({
        key: 'preferred_channel', label: 'Preferred contact channel',
        options: ['Email', 'Phone', 'WhatsApp', 'Video call']
      }),
      fieldText({ key: 'best_time', label: 'Best time to reach you', placeholder: 'e.g. Weekdays 10:00–13:00 IST' })
    ),
    el('div', { class: 'scg-inquiry__field scg-inquiry__field--full' },
      el('label', { class: 'scg-inquiry__label' }, 'Attach supporting documents (optional)'),
      (() => {
        const drop = el('label', { class: 'scg-inquiry__file-drop', for: 'scg-inq-files' },
          el('strong', {}, 'Click to browse'), ' — PDF, DOCX, XLSX, PNG up to 10 MB each');
        const input = el('input', {
          id: 'scg-inq-files', type: 'file', multiple: true, style: 'display:none',
          accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.txt,.csv,.zip',
          onchange: (e) => {
            for (const f of e.target.files) {
              if (f.size > 10 * 1024 * 1024) continue;
              state.data.files.push(f);
            }
            render();
          }
        });
        drop.append(input);
        return drop;
      })(),
      (() => {
        const list = el('ul', { class: 'scg-inquiry__file-list' });
        state.data.files.forEach((f, i) => {
          list.append(el('li', {},
            el('span', {}, f.name),
            el('button', {
              type: 'button', onclick: () => { state.data.files.splice(i, 1); render(); }
            }, 'Remove')
          ));
        });
        return list;
      })()
    ),
    el('label', { class: 'scg-inquiry__checkbox' },
      (() => {
        const cb = el('input', {
          type: 'checkbox',
          onchange: (e) => { state.data.newsletter_opt_in = e.target.checked; }
        });
        if (state.data.newsletter_opt_in) cb.checked = true;
        return cb;
      })(),
      el('span', {}, 'Send me the monthly Institutional Wisdom brief')
    ),
    el('label', { class: 'scg-inquiry__checkbox' },
      (() => {
        const cb = el('input', {
          type: 'checkbox',
          onchange: (e) => { state.data.consent_to_contact = e.target.checked; clearError('consent_to_contact'); }
        });
        if (state.data.consent_to_contact) cb.checked = true;
        return cb;
      })(),
      el('span', {}, 'I consent to being contacted about this inquiry. ',
        el('span', { class: 'req' }, '*'))
    ),
    el('div', { class: 'scg-inquiry__error', 'data-error-for': 'consent_to_contact' })
  );
  const actions = el('div', { class: 'scg-inquiry__actions' },
    el('button', {
      class: 'scg-inquiry__btn scg-inquiry__btn--secondary', type: 'button',
      disabled: state.submitting,
      onclick: () => { state.step = 2; render(); }
    }, '← Back'),
    el('button', {
      class: 'scg-inquiry__btn scg-inquiry__btn--primary', type: 'button',
      disabled: state.submitting,
      onclick: submit
    }, state.submitting ? 'Submitting…' : 'Submit Inquiry')
  );
  state.root.append(sec, actions);
  renderPrivacyNote();
}

function renderPrivacyNote() {
  state.root.append(el('p', { class: 'scg-inquiry__privacy' },
    'Fields marked with * are required. Your information is protected under our ',
    el('a', { href: '/privacy.html' }, 'privacy policy'),
    ' and will only be used to respond to your inquiry.'
  ));
}

function renderSuccess() {
  const box = el('div', { class: 'scg-inquiry__success' },
    el('div', { class: 'scg-inquiry__success-icon' }, '✓'),
    el('h2', { class: 'scg-inquiry__success-title' }, 'Inquiry received'),
    el('p', {}, 'Thank you. One of our consultants will respond within 24 hours.'),
    el('p', {}, 'Reference: ', el('span', { class: 'scg-inquiry__ref' }, state.submissionRef)),
    el('p', { class: 'scg-inquiry__privacy' },
      'A confirmation has been recorded. For urgent matters, reach the WhatsApp concierge at ',
      el('a', { href: `https://wa.me/${(window.SCG_CONFIG?.whatsappE164 || '919979021275')}` }, '+91 99790 21275'),
      '.'
    )
  );
  state.root.append(box);
}

async function submit() {
  if (!validateStep(3)) { render(); return; }
  state.submitting = true; render();
  const d = state.data;

  // Compose message body from step-2 answers
  const msgParts = [];
  if (d.service_areas.length) msgParts.push('Service areas: ' + d.service_areas.join(', '));
  if (d.current_challenge) msgParts.push('Challenge: ' + d.current_challenge);
  if (d.goals) msgParts.push('Goals: ' + d.goals);
  if (d.urgency) msgParts.push('Urgency: ' + d.urgency);
  if (d.budget_band) msgParts.push('Budget: ' + d.budget_band);
  if (d.existing_advisor) msgParts.push('Currently working with another advisor.');
  if (d.preferred_channel) msgParts.push('Preferred channel: ' + d.preferred_channel);
  if (d.best_time) msgParts.push('Best time: ' + d.best_time);
  if (d.newsletter_opt_in) msgParts.push('Opted in to newsletter.');

  const payload = {
    source_page: state.sourcePage,
    full_name: d.full_name,
    organization: d.organization,
    email: d.email,
    phone: d.phone,
    designation: d.designation,
    industry_sector: d.business_type,
    inquiry_area: d.service_areas.join(', '),
    message: msgParts.join('\n'),
    consent_to_contact: d.consent_to_contact
  };

  const { data, error } = await supabase
    .from('inquiries')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    state.submitting = false;
    setError('consent_to_contact', 'Could not submit: ' + error.message);
    render();
    return;
  }

  // Upload attached files under inquiries/<id>/
  if (d.files.length && data?.id) {
    for (const f of d.files) {
      const safe = f.name.replace(/[^\w.\-]+/g, '_');
      const path = `inquiries/${data.id}/${Date.now()}_${safe}`;
      const { error: upErr } = await supabase.storage
        .from(window.SCG_CONFIG.storageBucket)
        .upload(path, f, { upsert: false, contentType: f.type || 'application/octet-stream' });
      if (upErr) console.error('Upload failed:', upErr);
    }
  }

  state.submitting = false;
  state.submissionRef = 'SCG-' + data.id.slice(0, 8).toUpperCase();
  render();
}

function init() {
  const root = document.getElementById('scg-inquiry-root');
  if (!root) { console.warn('[inquiry-form] #scg-inquiry-root not found'); return; }
  state.root = root;
  state.sourcePage = root.dataset.sourcePage || 'other';
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
