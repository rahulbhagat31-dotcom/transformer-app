/**
 * seed-questions.js
 * Auto-seeds exam_sections and exam_questions tables if empty.
 * Called once during server startup.
 */
const db = require('../config/database');

const DEFAULT_SECTIONS = [
    {
        key: 'winding',
        label: 'Winding',
        color: '#7c3aed',
        icon: '🔧'
    },
    {
        key: 'core',
        label: 'Core Building',
        color: '#0ea5e9',
        icon: '🏗'
    },
    {
        key: 'tanking',
        label: 'Tanking',
        color: '#f59e0b',
        icon: '🛢'
    }
];

const SEED_QUESTIONS = [
    // ── WINDING ──────────────────────────────────────────────────────────────
    {
        section: 'winding',
        text: 'What is the primary purpose of winding insulation in a transformer?',
        optionA: 'To increase the winding resistance',
        optionB: 'To prevent electrical breakdown between turns',
        optionC: 'To reduce the core losses',
        optionD: 'To improve cooling efficiency',
        correctOption: 'B'
    },
    { section:'winding', text:'Which material is most commonly used as conductor in HV transformer windings?',
        optionA:'Aluminium wire', optionB:'Copper wire', optionC:'Silver wire', optionD:'Steel wire', correctOption:'B' },
    { section:'winding', text:'What does the turns ratio of a transformer determine?',
        optionA:'The frequency transformation', optionB:'The voltage transformation ratio',
        optionC:'The power factor correction', optionD:'The current frequency', correctOption:'B' },
    { section:'winding', text:'What is the function of a tap changer in a transformer winding?',
        optionA:'To control magnetic flux', optionB:'To adjust the output voltage',
        optionC:'To reduce copper losses', optionD:'To increase insulation resistance', correctOption:'B' },
    { section:'winding', text:'Which winding is placed closest to the core in a concentric arrangement?',
        optionA:'High voltage winding', optionB:'Tertiary winding',
        optionC:'Low voltage winding', optionD:'Regulating winding', correctOption:'C' },
    { section:'winding', text:'What is the significance of winding polarity in a transformer?',
        optionA:'It affects the insulation level', optionB:'It determines the phase relationship of voltages',
        optionC:'It controls the transformer efficiency', optionD:'It changes the frequency of output', correctOption:'B' },
    { section:'winding', text:'How are transformer winding losses primarily categorized?',
        optionA:'Hysteresis and eddy current losses', optionB:'I²R (copper) losses and stray losses',
        optionC:'Dielectric and corona losses', optionD:'Friction and windage losses', correctOption:'B' },

    // ── CORE BUILDING ────────────────────────────────────────────────────────
    { section:'core', text:'What type of steel is typically used for transformer core laminations?',
        optionA:'Carbon steel', optionB:'Cold-rolled grain-oriented (CRGO) silicon steel',
        optionC:'Stainless steel', optionD:'High-speed tool steel', correctOption:'B' },
    { section:'core', text:'Why are transformer cores laminated rather than made of solid iron?',
        optionA:'To reduce hysteresis losses', optionB:'To reduce eddy current losses',
        optionC:'To improve mechanical strength', optionD:'To increase the flux density', correctOption:'B' },
    { section:'core', text:'What is the purpose of the core clamping structure in a transformer?',
        optionA:'To provide electrical insulation', optionB:'To maintain the structural integrity of laminations',
        optionC:'To enhance the magnetic flux', optionD:'To reduce the iron losses', correctOption:'B' },
    { section:'core', text:'What does "step-lap" jointing technique refer to in core building?',
        optionA:'A method to join copper conductors', optionB:'A staggered lamination joint to reduce air gaps and noise',
        optionC:'A type of core insulation material', optionD:'A cooling duct arrangement', correctOption:'B' },
    { section:'core', text:'What is the typical stacking factor for CRGO steel laminations?',
        optionA:'0.50–0.60', optionB:'0.70–0.75', optionC:'0.95–0.97', optionD:'1.00', correctOption:'C' },
    { section:'core', text:'Which unit is used to express magnetic flux density in a transformer core?',
        optionA:'Ampere (A)', optionB:'Henry (H)', optionC:'Tesla (T)', optionD:'Ohm (Ω)', correctOption:'C' },
    { section:'core', text:'What happens to core losses when flux density is increased beyond the knee point?',
        optionA:'Losses decrease proportionally', optionB:'Losses remain constant',
        optionC:'Losses increase rapidly due to saturation', optionD:'Losses become zero', correctOption:'C' },

    // ── TANKING ──────────────────────────────────────────────────────────────
    { section:'tanking', text:'What is the main purpose of transformer oil in a tank?',
        optionA:'To lubricate moving parts', optionB:'To provide insulation and cooling',
        optionC:'To prevent corona discharge only', optionD:'To increase the transformer weight', correctOption:'B' },
    { section:'tanking', text:'What is the function of a conservator tank in a transformer?',
        optionA:'To store spare transformer oil', optionB:'To accommodate thermal expansion of oil',
        optionC:'To cool the transformer windings', optionD:'To house the tap changer mechanism', correctOption:'B' },
    { section:'tanking', text:'What does a Buchholz relay detect in a transformer?',
        optionA:'Overtemperature in the windings', optionB:'Internal faults generating gas or oil surge',
        optionC:'Overcurrent in the HV winding', optionD:'Voltage fluctuations on the LV side', correctOption:'B' },
    { section:'tanking', text:'Which standard specifies the dielectric strength test for transformer oil?',
        optionA:'IEC 60076', optionB:'IEC 60156', optionC:'IEEE C57.12', optionD:'IS 335', correctOption:'B' },
    { section:'tanking', text:'What is the purpose of the pressure relief device on a transformer tank?',
        optionA:'To maintain constant oil pressure', optionB:'To release excess pressure and prevent tank rupture',
        optionC:'To regulate oil temperature', optionD:'To filter the transformer oil', correctOption:'B' },
    { section:'tanking', text:'What is typically checked during the final oil filling stage of tanking?',
        optionA:'Winding resistance only', optionB:'Oil level, leakage, and dissolved gas content',
        optionC:'Core weight', optionD:'Insulation paper thickness', correctOption:'B' },
    { section:'tanking', text:'Which test is performed after tanking to verify the insulation integrity?',
        optionA:'Short-circuit test', optionB:'Applied voltage (HV withstand) test',
        optionC:'Load test', optionD:'Resistance temperature test', correctOption:'B' }
];

function seedQuestions() {
    try {
        // Seed sections
        const sectionCount = db.prepare('SELECT COUNT(*) as c FROM exam_sections').get().c;
        if (sectionCount === 0) {
            const insertSection = db.prepare('INSERT OR IGNORE INTO exam_sections (key, label, color, icon) VALUES (?, ?, ?, ?)');
            for (const s of DEFAULT_SECTIONS) {
                insertSection.run(s.key, s.label, s.color, s.icon);
            }
            console.log(`✅ Seeded ${DEFAULT_SECTIONS.length} exam sections`);
        }

        // Seed questions
        const qCount = db.prepare('SELECT COUNT(*) as c FROM exam_questions').get().c;
        if (qCount === 0) {
            const insertQ = db.prepare(`
                INSERT OR IGNORE INTO exam_questions (id, section, text, optionA, optionB, optionC, optionD, correctOption, createdBy)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const seedMany = db.transaction((questions) => {
                for (const q of questions) {
                    const id = `seed_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
                    insertQ.run(id, q.section, q.text, q.optionA, q.optionB, q.optionC, q.optionD, q.correctOption, 'system');
                }
            });
            seedMany(SEED_QUESTIONS);
            console.log(`✅ Seeded ${SEED_QUESTIONS.length} exam questions (${SEED_QUESTIONS.filter(q=>q.section==='winding').length} winding, ${SEED_QUESTIONS.filter(q=>q.section==='core').length} core, ${SEED_QUESTIONS.filter(q=>q.section==='tanking').length} tanking)`);
        }
    } catch (err) {
        console.warn('⚠️ Question seed skipped:', err.message);
    }
}

module.exports = seedQuestions;
