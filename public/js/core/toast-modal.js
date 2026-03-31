/**
 * ========================================================
 *  TOAST + MODAL SYSTEM  —  Global window.Toast & window.Modal
 * ========================================================
 *
 *  Toast API:
 *    Toast.success('Saved!')
 *    Toast.error('Something went wrong', { title: 'Upload Failed', duration: 6000 })
 *    Toast.warning('Stage not complete')
 *    Toast.info('Loading data...')
 *
 *  Modal API (all return Promises):
 *    await Modal.alert({ title, message, icon })
 *    const ok = await Modal.confirm({ title, message, icon, confirmText, intent })
 *    const value = await Modal.prompt({ title, message, placeholder, defaultValue })
 *    const choice = await Modal.select({ title, message, options: ['A','B','C'] })
 * ========================================================
 */

; (function (window) {
    'use strict';

    /* ───────────────────────────────────────────
       INTERNAL: Ensure DOM containers exist
    ─────────────────────────────────────────── */
    function ensureContainers() {
        if (!document.getElementById('toastContainer')) {
            const c = document.createElement('div');
            c.id = 'toastContainer';
            document.body.appendChild(c);
        }
        if (!document.getElementById('modalBackdrop')) {
            const b = document.createElement('div');
            b.id = 'modalBackdrop';
            b.innerHTML = '<div class="modal-dialog" id="modalDialog"></div>';
            document.body.appendChild(b);

            // Close on backdrop click
            b.addEventListener('click', function (e) {
                if (e.target === b) _modalReject && _modalReject('backdrop');
            });

            // Close on Escape
            document.addEventListener('keydown', function (e) {
                if (e.key === 'Escape' && b.classList.contains('modal-visible')) {
                    _modalReject && _modalReject('escape');
                }
            });
        }
    }

    /* ───────────────────────────────────────────
       TOAST ENGINE
    ─────────────────────────────────────────── */
    const TOAST_DEFAULTS = { duration: 4000 };

    const TOAST_META = {
        success: { icon: '✅', title: 'Success', cssClass: 'toast-success' },
        error: { icon: '❌', title: 'Error', cssClass: 'toast-error' },
        warning: { icon: '⚠️', title: 'Warning', cssClass: 'toast-warning' },
        info: { icon: 'ℹ️', title: 'Info', cssClass: 'toast-info' }
    };

    function showToast(type, message, opts = {}) {
        ensureContainers();
        const container = document.getElementById('toastContainer');
        const meta = TOAST_META[type] || TOAST_META.info;
        const duration = opts.duration || TOAST_DEFAULTS.duration;
        const title = opts.title || meta.title;

        const toast = document.createElement('div');
        toast.className = `toast ${meta.cssClass}`;
        toast.style.setProperty('--toast-duration', duration + 'ms');
        toast.innerHTML = `
            <span class="toast-icon">${meta.icon}</span>
            <div class="toast-body">
                <div class="toast-title">${_esc(title)}</div>
                <div class="toast-message">${_esc(message)}</div>
            </div>
            <button class="toast-close" aria-label="Dismiss">✕</button>
        `;

        // Dismiss handlers
        const dismiss = () => {
            toast.classList.add('toast-hiding');
            toast.addEventListener('animationend', () => toast.remove(), { once: true });
        };
        toast.querySelector('.toast-close').addEventListener('click', dismiss);
        toast.addEventListener('click', dismiss);

        // Auto-dismiss
        const timer = setTimeout(dismiss, duration);
        toast.addEventListener('click', () => clearTimeout(timer), { once: true });

        container.appendChild(toast);
        return toast;
    }

    const Toast = {
        success: (msg, opts) => showToast('success', msg, opts),
        error: (msg, opts) => showToast('error', msg, opts),
        warning: (msg, opts) => showToast('warning', msg, opts),
        info: (msg, opts) => showToast('info', msg, opts)
    };

    /* ───────────────────────────────────────────
       MODAL ENGINE
    ─────────────────────────────────────────── */
    let _modalResolve = null;
    let _modalReject = null;

    const INTENT_META = {
        success: { icon: '✅', confirmClass: 'modal-btn-confirm', confirmText: 'OK' },
        danger: { icon: '🗑️', confirmClass: 'modal-btn-danger', confirmText: 'Delete' },
        warning: { icon: '⚠️', confirmClass: 'modal-btn-danger', confirmText: 'Proceed' },
        info: { icon: 'ℹ️', confirmClass: 'modal-btn-primary', confirmText: 'OK' },
        default: { icon: '💬', confirmClass: 'modal-btn-confirm', confirmText: 'OK' }
    };

    function openModal(html, intentClass) {
        ensureContainers();
        const backdrop = document.getElementById('modalBackdrop');
        const dialog = document.getElementById('modalDialog');

        // Reset intent classes
        dialog.className = 'modal-dialog ' + (intentClass || '');
        dialog.innerHTML = html;

        backdrop.classList.add('modal-visible');
        backdrop.style.display = 'flex';

        // Focus first interactive element
        const first = dialog.querySelector('button, input, textarea, select');
        if (first) setTimeout(() => first.focus(), 60);

        return new Promise((resolve, reject) => {
            _modalResolve = resolve;
            _modalReject = (reason) => { closeModal(); reject(reason); };
        });
    }

    function closeModal() {
        const backdrop = document.getElementById('modalBackdrop');
        if (backdrop) {
            backdrop.classList.remove('modal-visible');
            backdrop.style.display = 'none';
        }
        _modalResolve = null;
        _modalReject = null;
    }

    /* ── Modal.alert ─── */
    function modalAlert({ title = 'Notice', message = '', icon = null, intent = 'info' } = {}) {
        const meta = INTENT_META[intent] || INTENT_META.info;
        const displayIcon = icon || meta.icon;

        const html = `
            <div class="modal-header">
                <span class="modal-header-icon">${displayIcon}</span>
                <div class="modal-header-text">
                    <h3>${_esc(title)}</h3>
                </div>
            </div>
            <div class="modal-body">${_esc(message)}</div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-primary" id="modalOK">OK</button>
            </div>`;

        const p = openModal(html, `modal-intent-${intent}`);
        document.getElementById('modalOK').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(true);
        });
        return p;
    }

    /* ── Modal.confirm ─── */
    function modalConfirm({
        title = 'Confirm',
        message = 'Are you sure?',
        icon = null,
        intent = 'default',
        confirmText = null,
        cancelText = 'Cancel'
    } = {}) {
        const meta = INTENT_META[intent] || INTENT_META.default;
        const displayIcon = icon || meta.icon;
        const btnText = confirmText || meta.confirmText;

        const html = `
            <div class="modal-header">
                <span class="modal-header-icon">${displayIcon}</span>
                <div class="modal-header-text">
                    <h3>${_esc(title)}</h3>
                    <p>${_esc(message)}</p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-cancel" id="modalCancel">${_esc(cancelText)}</button>
                <button class="modal-btn ${meta.confirmClass}" id="modalConfirm">${_esc(btnText)}</button>
            </div>`;

        const p = openModal(html, `modal-intent-${intent}`);

        document.getElementById('modalConfirm').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(true);
        });
        document.getElementById('modalCancel').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(false);
        });
        return p;
    }

    /* ── Modal.prompt ─── */
    function modalPrompt({
        title = 'Enter value',
        message = '',
        placeholder = '',
        defaultValue = '',
        multiline = false,
        confirmText = 'Submit',
        cancelText = 'Cancel',
        intent = 'info'
    } = {}) {
        const inputEl = multiline
            ? `<textarea id="modalInput" rows="4" placeholder="${_esc(placeholder)}">${_esc(defaultValue)}</textarea>`
            : `<input type="text" id="modalInput" placeholder="${_esc(placeholder)}" value="${_esc(defaultValue)}">`;

        const html = `
            <div class="modal-header">
                <span class="modal-header-icon">${INTENT_META[intent]?.icon || '✏️'}</span>
                <div class="modal-header-text">
                    <h3>${_esc(title)}</h3>
                    ${message ? `<p>${_esc(message)}</p>` : ''}
                </div>
            </div>
            <div class="modal-body">${inputEl}</div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-cancel" id="modalCancel">${_esc(cancelText)}</button>
                <button class="modal-btn modal-btn-primary" id="modalConfirm">${_esc(confirmText)}</button>
            </div>`;

        const p = openModal(html, `modal-intent-${intent}`);

        const submit = () => {
            const val = document.getElementById('modalInput').value.trim();
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(val || null);
        };

        document.getElementById('modalConfirm').addEventListener('click', submit);
        document.getElementById('modalCancel').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(null);
        });

        // Enter key submits (single-line only)
        if (!multiline) {
            document.getElementById('modalInput').addEventListener('keydown', e => {
                if (e.key === 'Enter') submit();
            });
        }

        return p;
    }

    /* ── Modal.select ─── (replaces prompt-based number pickers) */
    function modalSelect({
        title = 'Choose an option',
        message = '',
        options = [],   // array of strings
        confirmText = 'Select',
        cancelText = 'Cancel'
    } = {}) {
        const optHtml = options
            .map((o, i) => `<option value="${i}">${_esc(o)}</option>`)
            .join('');

        const html = `
            <div class="modal-header">
                <span class="modal-header-icon">📋</span>
                <div class="modal-header-text">
                    <h3>${_esc(title)}</h3>
                    ${message ? `<p>${_esc(message)}</p>` : ''}
                </div>
            </div>
            <div class="modal-body">
                <select id="modalSelect" style="width:100%;padding:10px 14px;background:#282e40;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e8eaf0;font-size:14px;margin-top:10px;">
                    ${optHtml}
                </select>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-cancel" id="modalCancel">${_esc(cancelText)}</button>
                <button class="modal-btn modal-btn-primary" id="modalConfirm">${_esc(confirmText)}</button>
            </div>`;

        const p = openModal(html, 'modal-intent-info');

        document.getElementById('modalConfirm').addEventListener('click', () => {
            const idx = parseInt(document.getElementById('modalSelect').value, 10);
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve({ index: idx + 1, value: options[idx] });  // 1-based index for compat
        });
        document.getElementById('modalCancel').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(null);
        });
        return p;
    }

    /* ── Modal.qaSignOff ─── (special: approve/reject with notes) */
    function modalQASignOff({ title = '🔍 QA Sign-Off', wo = '', stage = '' } = {}) {
        const html = `
            <div class="modal-header">
                <span class="modal-header-icon">🔍</span>
                <div class="modal-header-text">
                    <h3>${_esc(title)}</h3>
                    <p>${wo ? `W.O: ${_esc(wo)} — ${_esc(stage)}` : ''}</p>
                </div>
            </div>
            <div class="modal-body">
                <label style="font-size:13px;font-weight:600;color:#9098b1;display:block;margin-bottom:6px;">Decision</label>
                <select id="qaDecision" style="width:100%;padding:10px 14px;background:#282e40;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e8eaf0;font-size:14px;">
                    <option value="approved">✅ Approve</option>
                    <option value="rejected">❌ Reject</option>
                </select>
                <label style="font-size:13px;font-weight:600;color:#9098b1;display:block;margin:14px 0 6px;">Notes (optional)</label>
                <textarea id="qaNotes" rows="3" placeholder="Add sign-off notes..." style="width:100%;padding:10px 14px;background:#282e40;border:1px solid rgba(255,255,255,0.12);border-radius:8px;color:#e8eaf0;font-size:14px;resize:vertical;"></textarea>
            </div>
            <div class="modal-footer">
                <button class="modal-btn modal-btn-cancel" id="modalCancel">Cancel</button>
                <button class="modal-btn modal-btn-confirm" id="modalConfirm">Sign Off</button>
            </div>`;

        const p = openModal(html, 'modal-intent-success');

        document.getElementById('modalConfirm').addEventListener('click', () => {
            const status = document.getElementById('qaDecision').value;
            const notes = document.getElementById('qaNotes').value.trim();
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve({ status, notes });
        });
        document.getElementById('modalCancel').addEventListener('click', () => {
            const resolve = _modalResolve;
            closeModal();
            resolve && resolve(null);
        });
        return p;
    }

    const Modal = { alert: modalAlert, confirm: modalConfirm, prompt: modalPrompt, select: modalSelect, qaSignOff: modalQASignOff };

    /* ───────────────────────────────────────────
       HELPERS
    ─────────────────────────────────────────── */
    function _esc(str) {
        if (str == null) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    /* ───────────────────────────────────────────
       EXPORT GLOBALS
    ─────────────────────────────────────────── */
    window.Toast = Toast;
    window.Modal = Modal;

    // Init containers immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureContainers);
    } else {
        ensureContainers();
    }

})(window);
