/* ================================================
   USER MANAGEMENT — Admin Only
   List, create, edit and delete users
================================================ */

const ROLE_COLORS = {
    admin:      { bg: '#ffeaa7', color: '#d35400', icon: '&#x1F451;' },
    quality:    { bg: '#d5f5e3', color: '#1e8449', icon: '&#x1F52C;' },
    production: { bg: '#d6eaf8', color: '#1a5276', icon: '&#x1F3ED;' },
    customer:   { bg: '#f2f3f4', color: '#626567', icon: '&#x1F4BC;' }
};

/* ─── Load and render users table ─── */
async function loadUsers() {
    const container = document.getElementById('usersTableContainer');
    if (!container) return;

    try {
        const res = await apiRequest('/api/users');
        const users = res.data || [];

        if (users.length === 0) {
            container.innerHTML = `
                <div style="text-align:center; padding:48px; color:#999;">
                    <div style="font-size:36px; margin-bottom:12px;">&#x1F465;</div>
                    <p>No users found. Click <strong>+ Add User</strong> to create one.</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <thead>
                    <tr style="background:#f8f9fa; border-bottom:2px solid #e8ecf0;">
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">User ID</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Name</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Email</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Role</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Department</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Customer ID</th>
                        <th style="padding:14px 20px; text-align:left; font-weight:700; color:#2c3e50;">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(u => {
        const rc = ROLE_COLORS[u.role] || ROLE_COLORS.production;
        return `
                        <tr style="border-bottom:1px solid #f0f0f0; transition:background 0.15s;"
                            onmouseover="this.style.background='#f8f9fa'" onmouseout="this.style.background=''">
                            <td style="padding:14px 20px; font-weight:600; color:#2c3e50; font-family:monospace;">${u.userId}</td>
                            <td style="padding:14px 20px;">${u.name || '—'}</td>
                            <td style="padding:14px 20px; color:#7f8c8d;">${u.email || '—'}</td>
                            <td style="padding:14px 20px;">
                                <span style="background:${rc.bg}; color:${rc.color}; padding:4px 10px; border-radius:20px; font-size:12px; font-weight:700;">
                                    ${rc.icon} ${u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                                </span>
                            </td>
                            <td style="padding:14px 20px; color:#7f8c8d;">${u.department || '—'}</td>
                            <td style="padding:14px 20px; color:#7f8c8d; font-family:monospace; font-size:12px;">${u.customerId || '—'}</td>
                            <td style="padding:14px 20px;">
                                <div style="display:flex; gap:8px;">
                                    <button onclick="openEditUserModal(${JSON.stringify(u).replace(/"/g, '&quot;')})"
                                        style="background:#3498db; color:#fff; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">
                                        &#x270E; Edit
                                    </button>
                                    <button onclick="confirmDeleteUser('${u.userId}', '${u.name}')"
                                        style="background:#e74c3c; color:#fff; border:none; padding:6px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600;">
                                        &#x1F5D1; Delete
                                    </button>
                                </div>
                            </td>
                        </tr>`;
    }).join('')}
                </tbody>
            </table>`;
    } catch (err) {
        container.innerHTML = `<div style="padding:24px; color:#e74c3c;">&#x274C; Failed to load users: ${err.message}</div>`;
    }
}

/* ─── Add User Modal ─── */
window.openAddUserModal = function () {
    showUserModal({ mode: 'add' });
};

/* ─── Edit User Modal ─── */
window.openEditUserModal = function (user) {
    showUserModal({ mode: 'edit', user });
};

function showUserModal({ mode, user = {} }) {
    const isEdit = mode === 'edit';
    const title = isEdit ? '&#x270E; Edit User' : '&#x2795; Add User';

    const backdrop = document.createElement('div');
    backdrop.id = 'userModalBackdrop';
    backdrop.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99998;display:flex;align-items:center;justify-content:center;';

    backdrop.innerHTML = `
        <div style="background:#fff;border-radius:16px;padding:36px 40px;max-width:500px;width:94%;box-shadow:0 20px 60px rgba(0,0,0,0.25);position:relative;">
            <button onclick="closeUserModal()" style="position:absolute;top:14px;right:18px;background:none;border:none;font-size:22px;cursor:pointer;color:#999;">&#x2715;</button>
            <h2 style="margin:0 0 24px;font-size:20px;font-weight:800;color:#2c3e50;">${title}</h2>
            <form id="userForm" onsubmit="submitUserForm(event, '${mode}', '${user.userId || ''}')" autocomplete="off">
                <div style="display:grid;gap:14px;">
                    ${!isEdit ? `
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">User ID *</label>
                        <input name="userId" required minlength="3" maxlength="30" value=""
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="e.g. john_doe">
                    </div>` : ''}
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Full Name *</label>
                        <input name="name" required value="${user.name || ''}"
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="Full Name">
                    </div>
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Email</label>
                        <input name="email" type="email" value="${user.email || ''}"
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="email@company.com">
                    </div>
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Role *</label>
                        <select name="role" required style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;">
                            ${['admin','quality','production','customer'].map(r =>
        `<option value="${r}" ${user.role===r?'selected':''}>${r.charAt(0).toUpperCase()+r.slice(1)}</option>`
    ).join('')}
                        </select>
                    </div>
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Department</label>
                        <input name="department" value="${user.department || ''}"
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="e.g. Engineering">
                    </div>
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Customer ID <span style="color:#aaa;">(for customer role)</span></label>
                        <input name="customerId" value="${user.customerId || ''}"
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="e.g. CUST001">
                    </div>
                    <div>
                        <label style="font-size:13px;font-weight:600;color:#555;display:block;margin-bottom:5px;">Password ${isEdit ? '<span style="color:#aaa;">(leave blank to keep current)</span>' : '*'}</label>
                        <input name="password" type="password" ${!isEdit ? 'required minlength="6"' : ''}
                            style="width:100%;padding:10px 14px;border:1.5px solid #dde1e7;border-radius:8px;font-size:14px;box-sizing:border-box;"
                            placeholder="${isEdit ? 'Leave blank to keep current' : 'Min 6 characters'}">
                    </div>
                </div>
                <div id="userFormError" style="display:none;color:#e74c3c;font-size:13px;margin-top:12px;"></div>
                <div style="display:flex;gap:12px;margin-top:24px;">
                    <button type="submit"
                        style="flex:1;background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:12px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">
                        ${isEdit ? '&#x2714; Save Changes' : '&#x2795; Create User'}
                    </button>
                    <button type="button" onclick="closeUserModal()"
                        style="background:#f1f2f6;color:#555;border:none;padding:12px 20px;border-radius:8px;font-size:14px;cursor:pointer;">
                        Cancel
                    </button>
                </div>
            </form>
        </div>`;

    document.body.appendChild(backdrop);
}

window.closeUserModal = function () {
    const el = document.getElementById('userModalBackdrop');
    if (el) el.remove();
};

/* ─── Submit user form (add or edit) ─── */
window.submitUserForm = async function (e, mode, userId) {
    e.preventDefault();
    const form = e.target;
    const errDiv = document.getElementById('userFormError');
    const data = Object.fromEntries(new FormData(form).entries());

    // Remove password if blank (edit mode)
    if (!data.password) delete data.password;

    try {
        const url = mode === 'edit' ? `/api/users/${userId}` : '/api/users';
        const method = mode === 'edit' ? 'PUT' : 'POST';
        const res = await apiRequest(url, { method, body: JSON.stringify(data) });

        if (!res.success) throw new Error(res.error || 'Operation failed');
        closeUserModal();
        loadUsers();
        if (typeof Toast !== 'undefined') {
            Toast.success(mode === 'edit' ? 'User updated successfully!' : 'User created successfully!');
        }
    } catch (err) {
        if (errDiv) {
            errDiv.textContent = '&#x274C; ' + err.message;
            errDiv.style.display = 'block';
        }
    }
};

/* ─── Delete user confirmation ─── */
window.confirmDeleteUser = function (userId, name) {
    if (!confirm(`Delete user "${name}" (${userId})? This cannot be undone.`)) return;
    deleteUser(userId, name);
};

async function deleteUser(userId, name) {
    try {
        const res = await apiRequest(`/api/users/${userId}`, { method: 'DELETE' });
        if (!res.success) throw new Error(res.error || 'Delete failed');
        loadUsers();
        if (typeof Toast !== 'undefined') {
            Toast.success(`User "${name}" deleted.`);
        }
    } catch (err) {
        if (typeof Toast !== 'undefined') Toast.error('Delete failed: ' + err.message);
    }
}

/* ─── Auto-load when usersSection becomes active ─── */
// Wait until all defer scripts have executed before capturing showTab,
// so we don't accidentally capture undefined if users.js loads before main.js.
document.addEventListener('DOMContentLoaded', function () {
    const _origShowTab = typeof window.showTab === 'function' ? window.showTab : null;
    window.showTab = function (tabId, el) {
        if (typeof _origShowTab === 'function') _origShowTab(tabId, el);
        if (tabId === 'usersSection') {
            loadUsers();
        }
    };
});

// Also expose loadUsers globally
window.loadUsers = loadUsers;
