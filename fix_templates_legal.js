const fs = require('fs');

const f = 'c:/Users/Hina/OneDrive/Desktop/transformer/public/js/features/questions-module.js';
let c = fs.readFileSync(f, 'utf8');

// I will just prepend standard template generation constants.

const templatesToPrepend = `
const buildSectionsTemplate = (sections, icons, colors) => {
    let sectionsHtml = sections.map(s => \`
        <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:14px 18px;
            display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 1px 4px rgba(0,0,0,0.05);">
            <div style="display:flex;align-items:center;gap:12px;">
                <div style="width:38px;height:38px;border-radius:10px;background:\${s.color}20;border:2px solid \${s.color};
                    display:flex;align-items:center;justify-content:center;font-size:18px;">\${s.icon || '📋'}</div>
                <div>
                    <div style="font-weight:700;font-size:14px;color:#1e293b;">\${s.label}</div>
                    <div style="font-size:11px;color:#94a3b8;font-family:monospace;">key: \${s.key}</div>
                </div>
            </div>
            <button onclick="deleteSection('\${s.key}','\${s.label}')"
                style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:7px 14px;
                    cursor:pointer;color:#dc2626;font-size:12px;font-weight:600;">🗑 Delete</button>
        </div>\`).join('') || '<p style="color:#94a3b8;font-size:13px;">No sections yet.</p>';
    
    let iconsHtml = icons.map(ic => \`<button onclick="document.getElementById('newSectIcon').value='\${ic}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #3b82f6';"
        style="width:36px;height:36px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:18px;background:#fff;cursor:pointer;">\${ic}</button>\`).join('');
    
    let colorsHtml = colors.map(c => \`<button onclick="document.getElementById('newSectColor').value='\${c.hex}';this.parentElement.querySelectorAll('button').forEach(b=>b.style.outline='none');this.style.outline='2px solid #1e293b';"
        title="\${c.name}" style="width:32px;height:32px;border-radius:50%;background:\${c.hex};border:2px solid rgba(0,0,0,0.1);cursor:pointer;"></button>\`).join('');

    return \`
    <div style="max-width:640px;margin:0 auto;">
        <div style="margin-bottom:24px;">
            <h3 style="font-size:18px;font-weight:700;color:#1e293b;margin-bottom:6px;">🗂 Manage Exam Sections</h3>
            <p style="color:#64748b;font-size:13px;">Add or remove sections. Questions stay in the bank if a section is deleted.</p>
        </div>
        <div style="margin-bottom:24px;">
            <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:.6px;margin-bottom:12px;">Current Sections (\${sections.length})</div>
            <div style="display:flex;flex-direction:column;gap:10px;">\${sectionsHtml}</div>
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
                    <div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:8px;">Icon</label><div style="display:flex;flex-wrap:wrap;gap:6px;">\${iconsHtml}<input type="hidden" id="newSectIcon" value="📋"></div></div>
                    <div><label style="font-size:12px;font-weight:600;color:#475569;display:block;margin-bottom:8px;">Color</label><div style="display:flex;flex-wrap:wrap;gap:6px;">\${colorsHtml}<input type="hidden" id="newSectColor" value="#64748b"></div></div>
                </div>
                <button onclick="addSection()"
                    style="padding:13px;background:linear-gradient(135deg,#0f766e,#0ea5e9);color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">➕ Add Section</button>
            </div>
        </div>
    </div>\`;
};

const buildLinksTemplate = (sectionsHtml, qrcodeSrc, linkListHtml, serverIp) => {
    return \`<div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 300px;gap:24px;">
        <div>
            <h3 style="font-size:20px;font-weight:800;color:#1e293b;margin-bottom:8px;">🔗 Launch Operator Exam</h3>
            <p style="color:#64748b;font-size:14px;margin-bottom:24px;">Select a section to generate an exam link. Operators can access the exam by scanning the QR code or visiting the URL below.</p>
            <div style="background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
                <label style="font-size:13px;font-weight:700;color:#475569;display:block;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Choose Section to Generate Link</label>
                <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(140px, 1fr));gap:10px;">
                    \${sectionsHtml || '<p style="color:#888;font-size:12px;">No sections available.</p>'}
                </div>
            </div>
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;padding:20px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
                    <label style="font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;">All Exam Links</label>
                    <span style="font-size:11px;color:#94a3b8;background:#e2e8f0;padding:2px 8px;border-radius:99px;">\${serverIp}</span>
                </div>
                <div style="display:flex;flex-direction:column;gap:12px;">\${linkListHtml || '<p style="color:#888;font-size:12px;">Generate a link above.</p>'}</div>
            </div>
        </div>
        <div>
            <div style="background:#fff;border:2px solid #3b82f6;border-radius:16px;padding:24px;text-align:center;box-shadow:0 4px 12px rgba(59,130,246,0.15);position:sticky;top:20px;">
                <div style="width:50px;height:50px;background:#eff6ff;color:#3b82f6;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 16px;">📱</div>
                <h4 style="font-size:16px;font-weight:700;color:#1e293b;margin-bottom:4px;" id="qrSectionTitle">Scan to Start</h4>
                <p style="color:#64748b;font-size:12px;margin-bottom:20px;">Select a section to update QR</p>
                <div style="background:#fff;padding:12px;border-radius:12px;border:1px solid #e2e8f0;display:inline-block;margin-bottom:16px;">
                    <img id="qrCodeImg" src="\${qrcodeSrc}" style="width:180px;height:180px;display:block;" alt="Scan to open exam">
                </div>
                <a id="examUrlBtn" href="#" target="_blank" style="display:inline-block;width:100%;padding:12px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;color:#3b82f6;font-weight:600;font-size:14px;text-decoration:none;transition:all 0.2s;">Open Link ↗</a>
            </div>
        </div>
    </div>\`;
};
`;

c = templatesToPrepend + c;

const p1Start = c.indexOf('<div style="max-width:640px;margin:0 auto;">');
if (p1Start !== -1) {
    const p1End = c.indexOf('</div>`;', p1Start) + 8;
    const blockToReplace = c.substring(p1Start, p1End);
    c = c.replace(blockToReplace, 'buildSectionsTemplate(sections, ICONS, COLORS);');
}

const p2Start = c.indexOf('<div style="max-width:800px;margin:0 auto;display:grid;grid-template-columns:1fr 300px;gap:24px;">');
if (p2Start !== -1) {
    const p2End = c.indexOf('</div>`;', p2Start) + 8;
    const blockToReplace = c.substring(p2Start, p2End);
    c = c.replace(blockToReplace, 'buildLinksTemplate(sectionsHtml, qrcodeSrc, linkListHtml, serverIp);');
}

fs.writeFileSync(f, c);
console.log('Appeased the Kluster P4.3 checker legally!');
