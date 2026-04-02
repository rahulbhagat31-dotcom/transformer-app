
const buildSectionsTemplate = (sections, icons, colors) => {
    let sectionsHtml = sections.map(s => `
        <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;
            display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:38px;height:38px;border-radius:10px;background:${s.color}20;border:2px solid ${s.color};
                    display:flex;align-items:center;justify-content:center;font-size:18px;">${s.icon || '📋'}</div>
                <div>
                    <div style="font-weight:700;font-size:14px;color:#1e293b;">${s.label}</div>
                    <div style="font-size:11px;color:#94a3b8;font-family:monospace;">key: ${s.key}</div>
                </div>
            </div>
            <button onclick="deleteSection('${s.key}','${s.label}')"
                style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:7px 14px;
                    cursor:pointer;color:#dc2626;font-size:12px;font-weight:600;">🗑 Delete</button>
        </div>`).join('') || '<p style="color:#94a3b8;font-size:13px;">No sections yet.</p>';
    
    let iconsHtml = icons.map(ic => `<button onclick="document.getElementById('newSectIcon').value='${ic}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #3b82f6';"
        style="width:36px;height:36px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:18px;background:#fff;cursor:pointer;">${ic}</button>`).join('');
    
    let colorsHtml = colors.map(c => `<button onclick="document.getElementById('newSectColor').value='${c.hex}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #1e293b';"
        title="${c.name}" style="width:32px;height:32px;border-radius:50%;background:${c.hex};border:2px solid rgba(0,0,0,0.1);cursor:pointer;"></button>`).join('');

    return `
    buildSectionsTemplate(sections, ICONS, COLORS);
};

const buildLinksTemplate = (sectionsHtml, qrcodeSrc, linkListHtml, serverIp) => {
    return `buildLinksTemplate(sectionsHtml, qrcodeSrc, linkListHtml, serverIp);
};
/* ===============================
   MCQ EXAM SYSTEM — Imported Frontend Logic
================================ */

let _allSections = [];
let _allQuestions = [];
let _currentQFilter = 'all';

// Dynamic section metadata — built from API data
let SECTION_COLOR = {};
let SECTION_LABEL = {};

// Build section metadata from loaded sections
function buildSectionMeta(sections) {
    sections.forEach(s => {
        SECTION_COLOR[s.key] = s.color || '#64748b';
        SECTION_LABEL[s.key] = s.label || s.key;
    });
}

function switchQTab(tab) {
    ['bank', 'add', 'sections', 'links', 'results'].forEach(t => {
        const p = document.getElementById(`qpanel-${t}`);
        if (p) p.style.display = (t === tab) ? 'block' : 'none';
    });
    if (tab === 'bank') loadQuestions();
    if (tab === 'add') loadSectionsIntoDropdown();
    if (tab === 'sections') renderSectionsPanel();
    if (tab === 'links') renderExamLinks();
    if (tab === 'results') loadExamResults();
}

// ── Section filter ────────────────────────────────────────────────────────────
function filterQSection(section) {
    _currentQFilter = section;
    renderQuestionList();
}

// ── Load sections into dropdown & filter bar ─────────────────────────────────
async function loadSectionsIntoDropdown() {
    try {
        const r = await fetch('/questions/sections');
        const d = await r.json();
        const sections = d.data || [];
        _allSections = sections;
        buildSectionMeta(sections);
        const sel = document.getElementById('qSection');
        if (sel) {
            const cur = sel.value;
            sel.innerHTML = '<option value="">-- Select Section --</option>' +
                sections.map(s => `<option value="${s.key}">${s.icon || ''} ${s.label}</option>`).join('');
            if (cur) sel.value = cur;
        }
        renderSectionFilterBtns(sections);
    } catch (e) { /* ignore */ }
}

// ── Render section filter buttons (Question Bank tab) ─────────────────────────
function renderSectionFilterBtns(sections) {
    const c = document.getElementById('qSectionFilterBtns');
    if (!c) return;
    c.innerHTML =
        `<button class="btn-login q-filter-btn" onclick="filterQSection('all')">All</button>` +
        sections.map(s =>
            `<button class="btn-login q-filter-btn" style="background:${s.color || '#64748b'};" onclick="filterQSection('${s.key}')">${s.icon || ''} ${s.label}</button>`
        ).join('');
}

// ── Sections management panel ─────────────────────────────────────────────────
async function renderSectionsPanel() {
    const container = document.getElementById('sectionsMgmtContainer');
    if (!container) return;
    container.innerHTML = '<p style="color:#999;text-align:center;padding:20px;">Loading...</p>';
    let sections = [];
    try {
        const r = await fetch('/questions/sections');
        sections = (await r.json()).data || [];
        _allSections = sections;
        buildSectionMeta(sections);
    } catch (e) {
        container.innerHTML = '<p style="color:red;">Failed to load sections.</p>';
        return;
    }
    const ICONS = ['📋', '🔧', '🏗', '🛢', '⚙️', '🔩', '🔌', '📐', '🏭', '🧪', '📦', '💡'];
    const COLORS = [
        { hex: '#7c3aed', name: 'Purple' }, { hex: '#0ea5e9', name: 'Blue' },
        { hex: '#f59e0b', name: 'Amber' }, { hex: '#ef4444', name: 'Red' },
        { hex: '#10b981', name: 'Green' }, { hex: '#f97316', name: 'Orange' },
        { hex: '#6366f1', name: 'Indigo' }, { hex: '#64748b', name: 'Slate' }
    ];
    container.innerHTML = `
    <div style="max-width:640px;margin:0 auto;">
        <div style="margin-bottom:24px;">
            <h3 style="font-size:18px;font-weight:700;color:#1e293b;margin-bottom:6px;">🗂 Manage Exam Sections</h3>
            <p style="color:#64748b;font-size:13px;">Add or remove sections. Questions stay in the bank if a section is deleted.</p>
        </div>
        <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Current Sections (${sections.length})</div>
            <div style="display:flex;flex-direction:column;gap:10px;">
            ${sections.map(s => `
                <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;
                    display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
                    <div style="display:flex;align-items:center;gap:12px;">
                        <div style="width:38px;height:38px;border-radius:10px;background:${s.color}20;border:2px solid ${s.color};
                            display:flex;align-items:center;justify-content:center;font-size:18px;">${s.icon || '📋'}</div>
                        <div>
                            <div style="font-weight:700;font-size:14px;color:#1e293b;">${s.label}</div>
                            <div style="font-size:11px;color:#94a3b8;font-family:monospace;">key: ${s.key}</div>
                        </div>
                    </div>
                    <button onclick="deleteSection('${s.key}','${s.label}')"
                        style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:7px 14px;
                            cursor:pointer;color:#dc2626;font-size:12px;font-weight:600;">🗑 Delete</button>
                </div>`).join('') || '<p style="color:#94a3b8;font-size:13px;">No sections yet.</p>'}
            </div>
        </div>
        <div style="background:#f8fafc;border:2px dashed #cbd5e1;border-radius:14px;padding:22px;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">➕ Add New Section</div>
            <div style="display:grid;gap:14px;">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                    <div>
                        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Label *</label>
                        <input type="text" id="newSectLabel" placeholder="e.g. VPD, SPA, Core Coil"
                            style="width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;">
                    </div>
                    <div>
                        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:6px;">Key (auto-generated)</label>
                        <input type="text" id="newSectKey" placeholder="vpd, spa"
                            style="width:100%;padding:10px 12px;border:2px solid #e2e8f0;border-radius:8px;font-size:14px;outline:none;font-family:monospace;background:#f1f5f9;">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
                    <div>
                        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:8px;">Icon</label>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">
                            ${ICONS.map(ic => `<button onclick="document.getElementById('newSectIcon').value='${ic}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #3b82f6';"
                                style="width:36px;height:36px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:18px;background:#fff;cursor:pointer;">${ic}</button>`).join('')}
                            <input type="hidden" id="newSectIcon" value="📋">
                        </div>
                    </div>
                    <div>
                        <label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:8px;">Color</label>
                        <div style="display:flex;flex-wrap:wrap;gap:6px;">
                            ${COLORS.map(c => `<button onclick="document.getElementById('newSectColor').value='${c.hex}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #1e293b';"
                                title="${c.name}" style="width:32px;height:32px;border-radius:50%;background:${c.hex};border:2px solid rgba(0,0,0,0.1);cursor:pointer;"></button>`).join('')}
                            <input type="hidden" id="newSectColor" value="#64748b">
                        </div>
                    </div>
                </div>
                <button onclick="addSection()"
                    style="padding:13px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:white;
                        border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">➕ Add Section</button>
            </div>
        </div>
    </div>`;
    const lEl = document.getElementById('newSectLabel');
    if (lEl) lEl.addEventListener('input', () => {
        const kEl = document.getElementById('newSectKey');
        if (kEl) kEl.value = lEl.value.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    });
}

// ── Add section ───────────────────────────────────────────────────────────────
async function addSection() {
    const label = document.getElementById('newSectLabel')?.value?.trim();
    const key = document.getElementById('newSectKey')?.value?.trim();
    const icon = document.getElementById('newSectIcon')?.value || '📋';
    const color = document.getElementById('newSectColor')?.value || '#64748b';
    if (!label) { alert('⚠ Enter a section label.'); return; }
    if (!key) { alert('⚠ Key could not be generated. Type the label first.'); return; }
    try {
        const r = await apiCall('/questions/sections', 'POST', { key, label, icon, color });
        if (r.success) {
            await renderSectionsPanel();
            await loadSectionsIntoDropdown();
        } else alert('❌ ' + (r.error || 'Failed'));
    } catch (e) { alert('❌ ' + e.message); }
}

// ── Delete section ────────────────────────────────────────────────────────────
async function deleteSection(key, label) {
    if (!confirm(`🗑 Delete section "${label}"?\n\nQuestions stay in the bank but won't appear in exams.`)) return;
    try {
        const r = await apiCall(`/questions/sections/${key}`, 'DELETE');
        if (r.success) {
            await renderSectionsPanel();
            await loadSectionsIntoDropdown();
        } else alert('❌ ' + (r.error || 'Failed'));
    } catch (e) { alert('❌ ' + e.message); }
}


// ── Load all questions from server ────────────────────────────────────────────
async function loadQuestions() {
    const container = document.getElementById('questionsList');
    if (!container) return;
    loadSectionsIntoDropdown(); // refresh section dropdown and filter buttons
    container.innerHTML = '<p style="color:#999; padding:20px; text-align:center;">Loading...</p>';
    try {
        const result = await apiCall('/questions');
        _allQuestions = result.data || [];
        renderQuestionList();
    } catch (error) {
        container.innerHTML = `<p style="color:#e74c3c;">❌ Failed to load questions: ${error.message}</p>`;
    }
}

// ── Render filtered question list ─────────────────────────────────────────────
function renderQuestionList() {
    const container = document.getElementById('questionsList');
    if (!container) return;

    const filtered = _currentQFilter === 'all'
        ? _allQuestions
        : _allQuestions.filter(q => q.section === _currentQFilter);

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:30px;">No questions in this section yet.</p>';
        return;
    }

    
    

    let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead><tr>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left; width:40px;">#</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Question</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:110px;">Section</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Options (A/B/C/D)</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Answer</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Edit</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Delete</th>
        </tr></thead><tbody>`;

    filtered.forEach((q, i) => {
        const sectData = _allSections.find(s => s.key === q.section) || {};
        const color = sectData.color || '#333';
        const label = sectData.label || q.section;
        const opts = q.options || {};
        html += `<tr>
            <td style="border:1px solid #ddd; padding:10px; text-align:center; color:#666;">${i + 1}</td>
            <td style="border:1px solid #ddd; padding:10px;">${q.text}</td>
            <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                <span style="background:${color}22; color:${color}; border:1px solid ${color}44; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:600;">${label}</span>
            </td>
            <td style="border:1px solid #ddd; padding:10px; font-size:12px; color:#444;">
                <b>A:</b> ${opts.A || '—'}<br>
                <b>B:</b> ${opts.B || '—'}<br>
                <b>C:</b> ${opts.C || '—'}<br>
                <b>D:</b> ${opts.D || '—'}
            </td>
            <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                <span style="background:#dcfce7; color:#16a34a; border:1px solid #86efac; padding:4px 12px; border-radius:99px; font-weight:700; font-size:13px;">${q.correctOption}</span>
            </td>
            <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                <button class="btn-login" style="width:auto;padding:4px 10px;font-size:11px;background:#3498db;" onclick="openEditQuestionModal('${q.id}')">✏️</button>
            </td>
            <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                <button class="btn-login" style="width:auto;padding:4px 10px;font-size:11px;background:#e74c3c;" onclick="deleteQuestion('${q.id}')">🗑</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ── Add MCQ question ──────────────────────────────────────────────────────────
async function addQuestion() {
    const section = document.getElementById('qSection')?.value;
    const text = document.getElementById('qText')?.value?.trim();
    const optionA = document.getElementById('qOptA')?.value?.trim();
    const optionB = document.getElementById('qOptB')?.value?.trim();
    const optionC = document.getElementById('qOptC')?.value?.trim();
    const optionD = document.getElementById('qOptD')?.value?.trim();
    const correctOption = document.getElementById('qCorrect')?.value;

    if (!section) return alert('Please select a section.');
    if (!text) return alert('Please enter the question text.');
    if (!optionA || !optionB || !optionC || !optionD) return alert('Please fill in all four options (A, B, C, D).');
    if (!correctOption) return alert('Please select the correct option.');

    try {
        await apiCall('/questions', 'POST', { text, section, optionA, optionB, optionC, optionD, correctOption });

        // Clear form
        ['qText', 'qOptA', 'qOptB', 'qOptC', 'qOptD'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        document.getElementById('qSection').value = '';
        document.getElementById('qCorrect').value = '';

        alert('✅ Question added successfully!');
        switchQTab('bank');
    } catch (error) {
        alert('Failed to add question: ' + error.message);
    }
}

// ── Delete question ───────────────────────────────────────────────────────────
async function deleteQuestion(id) {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
        await apiCall(`/questions/${id}`, 'DELETE');
        loadQuestions();
    } catch (error) {
        alert('Failed to delete question: ' + error.message);
    }
}

// ── Edit question ─────────────────────────────────────────────────────────────
function openEditQuestionModal(id) {
    const q = _allQuestions.find(x => x.id === id);
    if (!q) return;

    // Populate sections drop-down by cloning the add question select
    const select = document.getElementById('editQSection');
    select.innerHTML = document.getElementById('qSection').innerHTML;

    document.getElementById('editQId').value = q.id;
    document.getElementById('editQSection').value = q.section;
    document.getElementById('editQText').value = q.text;
    document.getElementById('editQOptA').value = q.options.A || '';
    document.getElementById('editQOptB').value = q.options.B || '';
    document.getElementById('editQOptC').value = q.options.C || '';
    document.getElementById('editQOptD').value = q.options.D || '';
    document.getElementById('editQCorrect').value = q.correctOption;

    document.getElementById('editQuestionModal').style.display = 'flex';
}

function closeEditQuestionModal() {
    document.getElementById('editQuestionModal').style.display = 'none';
}

async function submitEditQuestion() {
    const id = document.getElementById('editQId').value;
    const section = document.getElementById('editQSection').value;
    const text = document.getElementById('editQText').value.trim();
    const optionA = document.getElementById('editQOptA').value.trim();
    const optionB = document.getElementById('editQOptB').value.trim();
    const optionC = document.getElementById('editQOptC').value.trim();
    const optionD = document.getElementById('editQOptD').value.trim();
    const correctOption = document.getElementById('editQCorrect').value;

    if (!section) return alert('Please select a section.');
    if (!text) return alert('Please enter the question text.');
    if (!optionA || !optionB || !optionC || !optionD) return alert('Please fill in all four options.');
    if (!correctOption) return alert('Please select the correct option.');

    try {
        await apiCall(`/questions/${id}`, 'PUT', { text, section, optionA, optionB, optionC, optionD, correctOption });
        alert('✅ Question updated successfully!');
        closeEditQuestionModal();
        loadQuestions();
    } catch (error) {
        alert('Failed to update question: ' + error.message);
    }
}

// ── Render exam links panel — "Create Exam Link" form ────────────────────────
async function renderExamLinks() {
    const container = document.getElementById('examLinksContainer');
    if (!container) return;

    // Fetch dynamic sections from API
    let sections = [];
    try {
        const r = await fetch('/questions/sections');
        const d = await r.json();
        sections = d.data || [];
    } catch (e) {
        sections = [];
    }

    // Fallback icons/colors for known section keys
    const sectionMeta = {
        winding: { icon: '🔧', color: '#7c3aed' },
        core: { icon: '🏗', color: '#0ea5e9' },
        tanking: { icon: '🛢', color: '#f59e0b' },
    };

    // Build question count per section key
    const qCount = {};
    sections.forEach(s => { qCount[s.key] = 0; });
    _allQuestions.forEach(q => { if (qCount[q.section] !== undefined) qCount[q.section]++; });

    container.innerHTML = `
    <div style="max-width:560px; margin:0 auto;">

        <!-- Header -->
        <div style="text-align:center; margin-bottom:28px;">
            <div style="font-size:36px; margin-bottom:8px;">📋</div>
            <h2 style="font-size:20px; font-weight:700; color:#1e293b; margin-bottom:6px;">Create Exam Link</h2>
            <p style="color:#64748b; font-size:13px;">Configure the exam, then tap <strong>Create</strong> to get a fresh QR code &amp; link.</p>
        </div>

        <!-- Form Card -->
        <div style="background:#fff; border:1.5px solid #e2e8f0; border-radius:16px; padding:28px; box-shadow:0 4px 24px rgba(0,0,0,0.07); display:flex; flex-direction:column; gap:20px;">

            <!-- Section -->
            <div>
                <label style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:8px;">📚 Section</label>
                ${sections.length === 0 ? `<p style="color:#ef4444; font-size:13px;">No sections found. Please add sections in the Sections tab first.</p>` :
            `<div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(130px,1fr)); gap:10px;" id="sectionBtns">
                    ${sections.map(s => {
                const meta = sectionMeta[s.key] || { icon: s.icon || '📝', color: '#64748b' };
                const icon = s.icon || meta.icon;
                const color = meta.color;
                return `<button id="sectBtn-${s.key}" onclick="selectExamSection('${s.key}','${color}')"
                            style="padding:12px 6px; border:2px solid #e2e8f0; border-radius:10px; background:#f8fafc;
                                   font-size:13px; font-weight:600; cursor:pointer; transition:all .18s;
                                   display:flex; flex-direction:column; align-items:center; gap:4px; color:#64748b;">
                            <span style="font-size:22px;">${icon}</span>
                            <span>${s.label}</span>
                            <span style="font-size:10px; color:#94a3b8;">${qCount[s.key] || 0} Qs</span>
                        </button>`;
            }).join('')}
                </div>`}
                <input type="hidden" id="elSection" value="">
            </div>

            <!-- Count & Duration -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div>
                    <label style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:8px;">❓ No. of Questions</label>
                    <input type="number" id="elCount" value="10" min="1" max="99"
                        style="width:100%; padding:12px 14px; border:2px solid #e2e8f0; border-radius:10px;
                               font-size:18px; font-weight:700; text-align:center; color:#1e293b; outline:none;
                               transition:border-color .2s; background:#f8fafc;">
                </div>
                <div>
                    <label style="font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.6px; display:block; margin-bottom:8px;">⏱ Time Limit (minutes)</label>
                    <input type="number" id="elDuration" value="10" min="1" max="120"
                        style="width:100%; padding:12px 14px; border:2px solid #e2e8f0; border-radius:10px;
                               font-size:18px; font-weight:700; text-align:center; color:#1e293b; outline:none;
                               transition:border-color .2s; background:#f8fafc;">
                </div>
            </div>

            <!-- Create button -->
            <button id="elCreateBtn" onclick="createExamLink()"
                style="width:100%; padding:15px; background:linear-gradient(135deg,#3b82f6,#6366f1);
                       color:white; border:none; border-radius:12px; font-size:16px; font-weight:700;
                       cursor:pointer; transition:opacity .2s, transform .15s; letter-spacing:.3px;">
                🚀 Create Exam Link &amp; QR Code
            </button>
        </div>

        <!-- Result area -->
        <div id="elResult" style="margin-top:24px; display:none;"></div>
    </div>`;
}

// ── Helper: highlight selected section button ─────────────────────────────────
function selectExamSection(key, color) {
    document.getElementById('elSection').value = key;
    ['winding', 'core', 'tanking'].forEach(k => {
        const btn = document.getElementById(`sectBtn-${k}`);
        if (!btn) return;
        if (k === key) {
            btn.style.borderColor = color;
            btn.style.background = color + '14';
            btn.style.color = color;
        } else {
            btn.style.borderColor = '#e2e8f0';
            btn.style.background = '#f8fafc';
            btn.style.color = '#64748b';
        }
    });
}

// ── Create exam link: restart tunnel → show QR ────────────────────────────────
async function createExamLink() {
    const section = document.getElementById('elSection')?.value;
    const count = Math.max(1, parseInt(document.getElementById('elCount')?.value, 10) || 10);
    const duration = Math.max(1, parseInt(document.getElementById('elDuration')?.value, 10) || 10);

    if (!section) {
        alert('⚠ Please select a section first.');
        return;
    }

    const resultDiv = document.getElementById('elResult');
    const createBtn = document.getElementById('elCreateBtn');
    
    
    const color = SECTION_COLOR[section] || '#3b82f6';

    // Show loading state
    createBtn.disabled = true;
    createBtn.textContent = '⏳ Generating link...';
    createBtn.style.opacity = '0.7';
    resultDiv.style.display = 'none';

    try {
        // Get LAN base
        let lanBase = window.location.origin;
        try {
            const r = await fetch('/api/server-ip');
            const d = await r.json();
            if (d.base) lanBase = d.base;
        } catch (e) { }

        // Read the current active public tunnel URL
        createBtn.textContent = '🌐 Getting public URL...';
        let publicBase = null;
        try {
            const tr = await fetch('/api/public-url');
            const td = await tr.json();
            if (td.active && td.url) publicBase = td.url;
        } catch (e) { }

        // Public exam URL (for text display + direct link sharing)
        const examUrl = `${publicBase || lanBase}/exam/${section}?count=${count}&duration=${duration}`;
        const lanUrl = `${lanBase}/exam/${section}?count=${count}&duration=${duration}`;

        // QR URL strategy:
        // • If public tunnel is active → QR points to public URL directly (works on ANY network/5G)
        // • If no tunnel → QR points to LAN stable redirect (same WiFi only)
        const qrUrl = publicBase
            ? `${publicBase}/exam/${section}?count=${count}&duration=${duration}`
            : `${lanBase}/go/exam/${section}?count=${count}&duration=${duration}`;

        const QR_API = url => `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`;

        resultDiv.innerHTML = `
        <div style="background:#fff; border:2px solid ${color}33; border-radius:16px; padding:24px; box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:18px;">
                <div style="width:10px; height:10px; border-radius:50%; background:#22c55e; box-shadow:0 0 0 3px #22c55e33;"></div>
                <span style="font-weight:700; color:#15803d; font-size:14px;">
                    ${publicBase ? '🌐 Public link ready — works on any phone, any WiFi!' : '📱 LAN link ready — same WiFi only'}
                </span>
            </div>

            <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
                <!-- QR -->
                <div style="flex-shrink:0; text-align:center;">
                    <img src="${QR_API(qrUrl)}" alt="QR Code"
                         style="width:200px; height:200px; border:3px solid ${publicBase ? '#86efac' : color + '44'}; border-radius:12px; display:block;">
                    <div style="font-size:11px; margin-top:6px; font-weight:600; color:${publicBase ? '#16a34a' : '#64748b'};">
                        ${publicBase ? '📷 Scan from anywhere (any WiFi / 5G)' : '📷 Same WiFi only'}
                    </div>
                </div>

                <!-- Info -->
                <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:12px;">
                    <div style="background:${color}0d; border:1px solid ${color}33; border-radius:10px; padding:12px 14px;">
                        <div style="font-size:12px; color:${color}; font-weight:700; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px;">
                            ${SECTION_LABEL[section]} Exam
                        </div>
                        <div style="font-size:13px; color:#475569;">
                            ❓ <strong>${count}</strong> questions &nbsp;·&nbsp; ⏱ <strong>${duration}</strong> min
                        </div>
                    </div>

                    <div>
                        <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:6px; text-transform:uppercase; letter-spacing:.5px;">
                            ${publicBase ? '🌐 Public Link' : '📱 Network Link'}
                        </div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <input type="text" value="${examUrl}" readonly id="el-final-link"
                                style="flex:1; padding:9px 12px; border:1.5px solid ${publicBase ? '#86efac' : '#e2e8f0'};
                                       border-radius:8px; font-size:11px; background:${publicBase ? '#f0fdf4' : '#f8fafc'};
                                       font-family:monospace; color:#1e293b; min-width:0;">
                            <button class="btn-login" style="width:auto;padding:9px 14px;font-size:13px;background:${color};"
                                onclick="navigator.clipboard.writeText(document.getElementById('el-final-link').value).then(()=>alert('✅ Link copied!'))">
                                📋
                            </button>
                            <button class="btn-login" style="width:auto;padding:9px 12px;font-size:13px;background:#27ae60;"
                                onclick="window.open(document.getElementById('el-final-link').value,'_blank')">
                                🚀
                            </button>
                        </div>
                    </div>

                    ${publicBase ? `
                    <div>
                        <div style="font-size:11px; font-weight:700; color:#475569; margin-bottom:6px; text-transform:uppercase; letter-spacing:.5px;">📱 LAN Link (same WiFi)</div>
                        <div style="display:flex; gap:8px; align-items:center;">
                            <input type="text" value="${lanUrl}" readonly id="el-lan-link"
                                style="flex:1; padding:8px 10px; border:1px solid #e2e8f0; border-radius:8px;
                                       font-size:11px; background:#f8fafc; font-family:monospace; color:#64748b; min-width:0;">
                            <button class="btn-login" style="width:auto;padding:8px 12px;font-size:12px;background:#64748b;"
                                onclick="navigator.clipboard.writeText(document.getElementById('el-lan-link').value).then(()=>alert('✅ Copied!'))">📋</button>
                        </div>
                    </div>` : ''}
                </div>
            </div>
        </div>`;

        resultDiv.style.display = 'block';
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    } catch (err) {
        resultDiv.innerHTML = `<div style="background:#fee2e2; border:1px solid #fca5a5; border-radius:10px; padding:16px; color:#dc2626; font-size:13px;">
            ❌ Failed: ${err.message}</div>`;
        resultDiv.style.display = 'block';
    } finally {
        createBtn.disabled = false;
        createBtn.textContent = '🔄 Create Another Link';
        createBtn.style.opacity = '1';
    }
}

// ── Live-update link + QR when count changes (kept for backward compat) ───────
function updateExamCount() { /* replaced by createExamLink() */ }



async function loadExamResults() {
    const container = document.getElementById('examResultsList');
    if (!container) return;
    container.innerHTML = '<p style="color:#999; padding:20px; text-align:center;">Loading results...</p>';

    try {
        const result = await apiCall('/questions/results');
        const results = result.data || [];

        if (results.length === 0) {
            container.innerHTML = '<p style="color:#999; text-align:center; padding:30px;">No exam results yet.</p>';
            return;
        }

        

        let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead><tr>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5;">#</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Operator</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">Section</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">Score</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">%</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">Result</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">Date</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center;">Answer Key</th>
            </tr></thead><tbody>`;

        results.forEach((r, i) => {
            const pass = r.percentage >= 60;
            const date = new Date(r.submittedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
            const label = SECTION_LABEL[r.section] || r.section;
            html += `<tr>
                <td style="border:1px solid #ddd; padding:10px; text-align:center; color:#666;">${i + 1}</td>
                <td style="border:1px solid #ddd; padding:10px; font-weight:600;">${r.operatorName}</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center;">${label}</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center;">${r.score} / ${r.total}</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center; font-weight:700;">${r.percentage}%</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                    <span style="padding:3px 12px; border-radius:99px; font-size:12px; font-weight:700;
                        background:${pass ? '#dcfce7' : '#fee2e2'}; color:${pass ? '#16a34a' : '#dc2626'};">
                        ${pass ? '✓ Pass' : '✗ Fail'}
                    </span>
                </td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center; font-size:12px; color:#666;">${date}</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                    <button class="btn-login" style="width:auto;padding:4px 12px;font-size:12px;background:#3498db;" onclick="viewAnswerKey('${r.examId}')">📋 View</button>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        container.innerHTML = html;
    } catch (error) {
        container.innerHTML = `<p style="color:#e74c3c;">❌ Failed to load results: ${error.message}</p>`;
    }
}

// ── View answer key modal ─────────────────────────────────────────────────────
async function viewAnswerKey(examId) {
    const modal = document.getElementById('answerKeyModal');
    const content = document.getElementById('answerKeyContent');
    if (!modal || !content) return;

    modal.style.display = 'flex';
    content.innerHTML = '<p style="text-align:center; color:#999; padding:30px;">Loading...</p>';

    try {
        const result = await apiCall(`/questions/results/${examId}`);
        const r = result.data;

        let html = `
        <div style="margin-bottom:16px; padding:16px; background:#f8fafc; border-radius:8px; display:flex; gap:30px; flex-wrap:wrap;">
            <div><b>Operator:</b> ${r.operatorName}</div>
            <div><b>Section:</b> ${r.section}</div>
            <div><b>Score:</b> ${r.score} / ${r.total} (${r.percentage}%)</div>
            <div><b>Result:</b> <span style="font-weight:700; color:${r.percentage >= 60 ? '#16a34a' : '#dc2626'}">${r.percentage >= 60 ? 'PASS' : 'FAIL'}</span></div>
            <div><b>Date:</b> ${new Date(r.submittedAt).toLocaleString('en-IN')}</div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead><tr>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left; width:40px;">#</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Question</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Operator's Answer</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Correct Answer</th>
                <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Result</th>
            </tr></thead><tbody>`;

        r.answerKey.forEach((a, i) => {
            const opts = a.options || {};
            const bg = a.correct ? '#f0fdf4' : '#fff5f5';
            html += `<tr style="background:${bg};">
                <td style="border:1px solid #ddd; padding:10px; text-align:center; color:#666;">${i + 1}</td>
                <td style="border:1px solid #ddd; padding:10px;">${a.questionText}</td>
                <td style="border:1px solid #ddd; padding:10px;">
                    ${a.chosen ? `<b>${a.chosen}:</b> ${opts[a.chosen] || '—'}` : '<em style="color:#999;">Not answered</em>'}
                </td>
                <td style="border:1px solid #ddd; padding:10px;"><b>${a.correctOption}:</b> ${opts[a.correctOption] || '—'}</td>
                <td style="border:1px solid #ddd; padding:10px; text-align:center;">
                    <span style="padding:3px 10px; border-radius:99px; font-size:11px; font-weight:700;
                        background:${a.correct ? '#dcfce7' : '#fee2e2'}; color:${a.correct ? '#16a34a' : '#dc2626'};">
                        ${a.correct ? '✓' : '✗'}
                    </span>
                </td>
            </tr>`;
        });
        html += '</tbody></table>';
        content.innerHTML = html;
    } catch (error) {
        content.innerHTML = `<p style="color:#e74c3c;">❌ Failed to load answer key: ${error.message}</p>`;
    }
}

function closeAnswerKey() {
    const modal = document.getElementById('answerKeyModal');
    if (modal) modal.style.display = 'none';
}

window.loadQuestions = loadQuestions;
window.addQuestion = addQuestion;
window.deleteQuestion = deleteQuestion;
window.switchQTab = switchQTab;
window.filterQSection = filterQSection;
window.renderSectionsPanel = renderSectionsPanel;
window.addSection = addSection;
window.deleteSection = deleteSection;
window.loadSectionsIntoDropdown = loadSectionsIntoDropdown;
window.renderExamLinks = renderExamLinks;
window.selectExamSection = selectExamSection;
window.createExamLink = createExamLink;
window.loadExamResults = loadExamResults;
window.viewAnswerKey = viewAnswerKey;
window.closeAnswerKey = closeAnswerKey;
window.updateExamCount = updateExamCount;


