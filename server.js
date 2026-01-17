const express = require("express");
const cors = require("cors");
const fs = require("fs");
const multer = require("multer");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// =====================
// USER MANAGEMENT
// =====================

const USERS_FILE = "./users.json";
const TRANSFORMERS_FILE = "./transformers.json";
const BOMS_FILE = "./boms.json";
const DOCUMENTS_FILE = "./documents.json";
const CHECKLISTS_FILE = "./checklists.json";

// Initialize users file
function initUsersFile() {
    if (!fs.existsSync(USERS_FILE)) {
        const defaultUsers = [
            {
                userId: "admin",
                password: "admin123",
                name: "Senior Engineer",
                role: "admin",
                email: "admin@company.com",
                department: "Management"
            },
            {
                userId: "quality",
                password: "qc123",
                name: "Priya Sharma",
                role: "quality",
                email: "priya@company.com",
                department: "Quality Control"
            },
            {
                userId: "production",
                password: "prod123",
                name: "Amit Singh",
                role: "production",
                email: "amit@company.com",
                department: "Production"
            },
            {
                userId: "customer1",
                password: "cust123",
                name: "UPPTCL",
                role: "customer",
                email: "upptcl@customer.com",
                customerId: "CUST001"
            }
        ];
        fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
        console.log("✅ Created users.json");
    } else {
        console.log("✅ users.json exists");
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        console.log(`   Found ${users.length} users`);
    }
}

function initDataFiles() {
    [TRANSFORMERS_FILE, BOMS_FILE, DOCUMENTS_FILE, CHECKLISTS_FILE].forEach(file => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify([], null, 2));
            console.log(`✅ Created ${file}`);
        }
    });
}

initUsersFile();
initDataFiles();

// =====================
// FILE UPLOAD SETUP
// =====================

const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + "-" + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

// =====================
// MIDDLEWARE
// =====================

function attachUser(req, res, next) {
    const userId = req.headers['user-id'];
    if (userId) {
        try {
            const users = JSON.parse(fs.readFileSync(USERS_FILE));
            req.user = users.find(u => u.userId === userId);
            if (req.user) {
                console.log(`👤 User: ${req.user.userId} (${req.user.role})`);
            }
        } catch (error) {
            console.error('❌ Error attaching user:', error.message);
        }
    }
    next();
}

app.use(attachUser);

function checkPermission(requiredRole) {
    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (!userRole) {
            return res.status(401).json({ success: false, error: "Please log in" });
        }
        
        const roleHierarchy = {
            'admin': 3,
            'quality': 2,
            'production': 1,
            'customer': 0
        };
        
        if (roleHierarchy[userRole] >= roleHierarchy[requiredRole]) {
            next();
        } else {
            res.status(403).json({ success: false, error: "Access denied" });
        }
    };
}

// =====================
// AUTHENTICATION
// =====================

app.post("/login", (req, res) => {
    const { userId, password } = req.body;
    console.log(`🔐 Login: ${userId}`);
    
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const user = users.find(u => u.userId === userId && u.password === password);
        
        if (user) {
            console.log(`   ✅ Success (${user.role})`);
            res.json({
                success: true,
                userId: user.userId,
                name: user.name,
                role: user.role,
                department: user.department || null,
                customerId: user.customerId || null,
                email: user.email
            });
        } else {
            console.log(`   ❌ Invalid credentials`);
            res.status(401).json({ success: false, error: "Invalid credentials" });
        }
    } catch (error) {
        console.error("   ❌ Login error:", error.message);
        res.status(500).json({ success: false, error: "Server error" });
    }
});

// =====================
// TRANSFORMER MANAGEMENT
// =====================

app.get("/transformers", (req, res) => {
    try {
        const transformers = JSON.parse(fs.readFileSync(TRANSFORMERS_FILE));
        
        if (req.user?.role === 'customer') {
            const filtered = transformers.filter(t => t.customerId === req.user.customerId);
            res.json(filtered);
        } else {
            res.json(transformers);
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Error loading transformers" });
    }
});

app.post("/transformers", checkPermission('quality'), (req, res) => {
    try {
        const transformers = JSON.parse(fs.readFileSync(TRANSFORMERS_FILE));
        const newTransformer = {
            id: Date.now().toString(),
            ...req.body,
            createdBy: req.user.userId,
            createdAt: new Date().toISOString()
        };
        transformers.push(newTransformer);
        fs.writeFileSync(TRANSFORMERS_FILE, JSON.stringify(transformers, null, 2));
        console.log(`✅ Transformer added: ${newTransformer.wo}`);
        res.json({ success: true, transformer: newTransformer });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error adding transformer" });
    }
});

app.put("/transformers/:id", checkPermission('quality'), (req, res) => {
    try {
        const transformers = JSON.parse(fs.readFileSync(TRANSFORMERS_FILE));
        const index = transformers.findIndex(t => t.id === req.params.id);
        
        if (index !== -1) {
            transformers[index] = {
                ...transformers[index],
                ...req.body,
                updatedBy: req.user.userId,
                updatedAt: new Date().toISOString()
            };
            fs.writeFileSync(TRANSFORMERS_FILE, JSON.stringify(transformers, null, 2));
            res.json({ success: true, transformer: transformers[index] });
        } else {
            res.status(404).json({ success: false, error: "Transformer not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Error updating transformer" });
    }
});

app.delete("/transformers/:id", checkPermission('admin'), (req, res) => {
    try {
        let transformers = JSON.parse(fs.readFileSync(TRANSFORMERS_FILE));
        transformers = transformers.filter(t => t.id !== req.params.id);
        fs.writeFileSync(TRANSFORMERS_FILE, JSON.stringify(transformers, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error deleting transformer" });
    }
});

// =====================
// BOM & DOCUMENT MANAGEMENT
// =====================

app.post("/bom/upload", checkPermission('quality'), upload.single('file'), (req, res) => {
    try {
        const { wo, customerId } = req.body;
        const boms = JSON.parse(fs.readFileSync(BOMS_FILE));
        const newBOM = {
            id: Date.now().toString(),
            wo, customerId,
            filename: req.file.originalname,
            filepath: req.file.path,
            uploadedBy: req.user.userId,
            uploadedAt: new Date().toISOString()
        };
        boms.push(newBOM);
        fs.writeFileSync(BOMS_FILE, JSON.stringify(boms, null, 2));
        res.json({ success: true, bom: newBOM });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error uploading BOM" });
    }
});

app.get("/bom/:wo", (req, res) => {
    try {
        const boms = JSON.parse(fs.readFileSync(BOMS_FILE));
        let filtered = boms.filter(b => b.wo === req.params.wo);
        if (req.user?.role === 'customer') {
            filtered = filtered.filter(b => b.customerId === req.user.customerId);
        }
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ success: false, error: "Error loading BOMs" });
    }
});

app.delete("/bom/:id", checkPermission('admin'), (req, res) => {
    try {
        let boms = JSON.parse(fs.readFileSync(BOMS_FILE));
        const bom = boms.find(b => b.id === req.params.id);
        if (bom && fs.existsSync(bom.filepath)) fs.unlinkSync(bom.filepath);
        boms = boms.filter(b => b.id !== req.params.id);
        fs.writeFileSync(BOMS_FILE, JSON.stringify(boms, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error deleting BOM" });
    }
});

app.post("/document/upload", checkPermission('quality'), upload.single('file'), (req, res) => {
    try {
        const { wo, type, customerId } = req.body;
        const documents = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
        const newDoc = {
            id: Date.now().toString(),
            wo, type, customerId,
            filename: req.file.originalname,
            filepath: req.file.path,
            uploadedBy: req.user.userId,
            uploadedAt: new Date().toISOString()
        };
        documents.push(newDoc);
        fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
        res.json({ success: true, document: newDoc });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error uploading document" });
    }
});

app.get("/document/:wo", (req, res) => {
    try {
        const documents = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
        let filtered = documents.filter(d => d.wo === req.params.wo);
        if (req.user?.role === 'customer') {
            filtered = filtered.filter(d => d.customerId === req.user.customerId);
        }
        res.json(filtered);
    } catch (error) {
        res.status(500).json({ success: false, error: "Error loading documents" });
    }
});

app.get("/download/:filename", (req, res) => {
    try {
        const filepath = path.join(uploadDir, req.params.filename);
        if (fs.existsSync(filepath)) {
            res.download(filepath);
        } else {
            res.status(404).json({ success: false, error: "File not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Error downloading file" });
    }
});

app.delete("/document/:id", checkPermission('admin'), (req, res) => {
    try {
        let documents = JSON.parse(fs.readFileSync(DOCUMENTS_FILE));
        const doc = documents.find(d => d.id === req.params.id);
        if (doc && fs.existsSync(doc.filepath)) fs.unlinkSync(doc.filepath);
        documents = documents.filter(d => d.id !== req.params.id);
        fs.writeFileSync(DOCUMENTS_FILE, JSON.stringify(documents, null, 2));
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: "Error deleting document" });
    }
});

app.get("/customers", checkPermission('production'), (req, res) => {
    try {
        const users = JSON.parse(fs.readFileSync(USERS_FILE));
        const customers = users.filter(u => u.role === 'customer').map(u => ({
            customerId: u.customerId,
            name: u.name,
            email: u.email
        }));
        res.json(customers);
    } catch (error) {
        res.status(500).json({ success: false, error: "Error loading customers" });
    }
});

// =====================
// CHECKLIST MANAGEMENT
// =====================

app.post("/checklist/production/save", checkPermission('production'), (req, res) => {
    try {
        const checklists = JSON.parse(fs.readFileSync(CHECKLISTS_FILE));
        const { wo, customerId, customer, stage, itemNumber, rowId, productionNotes, shift, timestamp } = req.body;
        
        if (!wo || !stage || !itemNumber || !rowId) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        
        const existingIndex = checklists.findIndex(c => c.stage === stage && c.rowId === rowId && c.wo === wo);
        
        const productionData = {
            productionStatus: "completed",
            productionEngineer: req.user?.name || 'Unknown',
            productionNotes: productionNotes || '',
            productionShift: shift || 'Morning',
            productionTimestamp: timestamp || new Date().toISOString(),
            productionUserId: req.user?.userId || 'unknown'
        };
        
        if (existingIndex >= 0) {
            checklists[existingIndex] = { ...checklists[existingIndex], ...productionData, updatedAt: new Date().toISOString() };
        } else {
            const newItem = {
                id: Date.now().toString(),
                wo, customerId, customer, stage, itemNumber, rowId,
                ...productionData,
                createdAt: new Date().toISOString()
            };
            checklists.push(newItem);
        }
        
        fs.writeFileSync(CHECKLISTS_FILE, JSON.stringify(checklists, null, 2));
        res.json({ success: true, message: `Production work completed for Item ${itemNumber}` });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to save production data" });
    }
});

app.post("/checklist/save", checkPermission('production'), (req, res) => {
    try {
        const checklists = JSON.parse(fs.readFileSync(CHECKLISTS_FILE));
        const { 
            wo, 
            customerId, 
            customer, 
            stage, 
            itemNumber, 
            rowId, 
            actualValue,
            technician,
            shopSupervisor,
            qaSupervisor,
            remark,
            timestamp, 
            userId, 
            userName,
            userRole 
        } = req.body;
        
        // Validation
        if (!wo || !stage || !itemNumber || !rowId) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }
        
        if (!actualValue || !actualValue.trim()) {
            return res.status(400).json({ success: false, error: "Actual Value is required" });
        }
        
        if (!technician) {
            return res.status(400).json({ success: false, error: "Technician is required" });
        }
        
        const existingIndex = checklists.findIndex(c => 
            c.stage === stage && c.rowId === rowId && c.wo === wo
        );
        
        const checklistData = {
            actualValue: actualValue || '',
            technician: technician || '',
            shopSupervisor: shopSupervisor || '',
            qaSupervisor: qaSupervisor || '',
            remark: remark || '',
            timestamp: timestamp || new Date().toISOString(),
            userId: userId || req.user?.userId || 'unknown',
            userName: userName || req.user?.name || 'Unknown',
            userRole: userRole || req.user?.role || 'unknown',
            locked: true,
            lockedBy: req.user?.userId || 'unknown',
            lockedAt: new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            // Store previous unlock info if it exists
            if (checklists[existingIndex].unlockedBy) {
                checklistData.previousUnlock = {
                    unlockedBy: checklists[existingIndex].unlockedBy,
                    unlockedAt: checklists[existingIndex].unlockedAt,
                    unlockReason: checklists[existingIndex].unlockReason
                };
            }
            
            checklists[existingIndex] = {
                ...checklists[existingIndex],
                ...checklistData,
                updatedAt: new Date().toISOString()
            };
            
            console.log(`📝 Updated checklist item: ${stage} - Item ${itemNumber} - WO: ${wo}`);
        } else {
            const newItem = {
                id: Date.now().toString(),
                wo, 
                customerId, 
                customer, 
                stage, 
                itemNumber, 
                rowId,
                ...checklistData,
                createdAt: new Date().toISOString()
            };
            checklists.push(newItem);
            
            console.log(`✅ Saved checklist item: ${stage} - Item ${itemNumber} - WO: ${wo}`);
        }
        
        fs.writeFileSync(CHECKLISTS_FILE, JSON.stringify(checklists, null, 2));
        
        res.json({ 
            success: true, 
            message: `Item ${itemNumber} saved successfully`,
            item: checklists[existingIndex >= 0 ? existingIndex : checklists.length - 1]
        });
    } catch (error) {
        console.error("❌ Error saving checklist:", error);
        res.status(500).json({ success: false, error: "Failed to save checklist: " + error.message });
    }
});
// =====================
// CLEAR CHECKLIST DATA (For updating checklist structure)
// =====================

app.delete("/checklist/clear/:stage/:wo", checkPermission('admin'), (req, res) => {
    try {
        const { stage, wo } = req.params;
        let checklists = JSON.parse(fs.readFileSync(CHECKLISTS_FILE));
        
        const beforeCount = checklists.length;
        checklists = checklists.filter(c => !(c.stage === stage && c.wo === wo));
        const afterCount = checklists.length;
        const deletedCount = beforeCount - afterCount;
        
        fs.writeFileSync(CHECKLISTS_FILE, JSON.stringify(checklists, null, 2));
        
        console.log(`🗑️  Cleared ${deletedCount} items from ${stage} for W.O. ${wo}`);
        
        res.json({ 
            success: true, 
            message: `Cleared ${deletedCount} items from ${stage} checklist`,
            deletedCount 
        });
    } catch (error) {
        console.error("❌ Error clearing checklist:", error);
        res.status(500).json({ success: false, error: "Error clearing checklist data" });
    }
});
// =====================
// GET CHECKLIST DATA
// =====================

app.get("/checklist/:stage/:wo", (req, res) => {
    try {
        const { stage, wo } = req.params;
        const checklists = JSON.parse(fs.readFileSync(CHECKLISTS_FILE));
        
        let filtered = checklists.filter(c => c.stage === stage && c.wo === wo);
        
        if (req.user?.role === 'customer') {
            filtered = filtered.filter(c => c.customerId === req.user.customerId);
        }
        
        console.log(`📋 Loaded ${filtered.length} checklist items for ${stage} - WO: ${wo}`);
        
        res.json(filtered);
    } catch (error) {
        console.error("❌ Error loading checklist:", error);
        res.status(500).json({ success: false, error: "Error loading checklist data" });
    }
});

// =====================
// UNLOCK CHECKLIST ITEM (Admin only)
// =====================

app.post("/checklist/unlock", checkPermission('admin'), (req, res) => {
    try {
        const { wo, stage, rowId, reason } = req.body;
        const checklists = JSON.parse(fs.readFileSync(CHECKLISTS_FILE));
        
        const index = checklists.findIndex(c => 
            c.stage === stage && c.rowId === rowId && c.wo === wo
        );
        
        if (index === -1) {
            return res.status(404).json({ success: false, error: "Checklist item not found" });
        }
        
        checklists[index].locked = false;
        checklists[index].unlockedBy = req.user?.userId || 'admin';
        checklists[index].unlockedAt = new Date().toISOString();
        checklists[index].unlockReason = reason || 'No reason provided';
        
        delete checklists[index].lockedBy;
        delete checklists[index].lockedAt;
        
        fs.writeFileSync(CHECKLISTS_FILE, JSON.stringify(checklists, null, 2));
        
        console.log(`🔓 Unlocked item: ${stage} - ${rowId} - WO: ${wo} - Reason: ${reason}`);
        
        res.json({ success: true, message: "Item unlocked successfully", item: checklists[index] });
    } catch (error) {
        console.error("❌ Error unlocking item:", error);
        res.status(500).json({ success: false, error: "Failed to unlock item: " + error.message });
    }
});

// =====================
// CLEAR CHECKLIST DATA (For updating checklist structure)
// =====================
// =====================
// START SERVER
// =====================

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Server: http://localhost:${PORT}`);
    console.log(`\n👤 Accounts:`);
    console.log(`   Admin: admin / admin123`);
    console.log(`   Quality: quality / qc123`);
    console.log(`   Production: production / prod123`);
    console.log(`   Customer: customer1 / cust123`);
    console.log(`${'='.repeat(60)}\n`);
});