/* ===============================
   UI NAVIGATION & DISPLAY LOGIC
   Sidebar, tabs, stage navigation, checklist rendering
================================ */

/* ===============================
   TAB NAVIGATION
================================ */
function showTab(id, btn) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));

    const section = document.getElementById(id);
    if (section) section.classList.add('active');
    if (btn) btn.classList.add('active');

    if (id !== 'manufacturingChecklist') {
        const submenu = document.getElementById('checklistSubmenu');
        if (submenu) submenu.classList.remove('active');
    }

    const titles = {
        'home': 'Home',
        'transformerMaster': 'Transformer Master',
        'bomUpload': 'BOM Upload',
        'designDocuments': 'Design Documents',
        'manufacturingChecklist': 'Manufacturing Checklist',
        'designCalculations': 'Winding Calculation',
        'questions': 'Questions'
    };

    const viewTitle = document.getElementById('viewTitle');
    if (viewTitle) viewTitle.textContent = titles[id] || 'Home';

    // Auto-load questions when tab is opened
    if (id === 'questions' && typeof loadQuestions === 'function') {
        loadQuestions();
    }
}
/* ===============================
   SUBMENU TOGGLE
================================ */
function toggleSubmenu(element) {
    const submenu = document.getElementById('checklistSubmenu');
    if (submenu) {
        submenu.classList.toggle('active');

        if (submenu.classList.contains('active')) {
            showTab('manufacturingChecklist', element);
        }
    }
}
/* ===============================
   CHECKLIST STAGE NAVIGATION
================================ */
function showChecklistStage(stage, element) {
    document.querySelectorAll('.nav-subitem').forEach(item => {
        item.classList.remove('active');
    });
    if (element) element.classList.add('active');

    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    const checklistSection = document.getElementById('manufacturingChecklist');
    if (checklistSection) checklistSection.classList.add('active');

    const stageTitles = {
        'winding': 'Winding Checklist',
        'coreCoil': 'Core Coil Assembly',
        'tanking': 'Repacking and Tanking',
        'spa': 'SPA Checklist',
        'coreBuilding': 'Core Building Checklist'
    };

    const viewTitle = document.getElementById('viewTitle');
    if (viewTitle) viewTitle.textContent = stageTitles[stage] || 'Manufacturing Checklist';

    const mainStageButtons = document.querySelectorAll('#mainStageNav .stage-btn');
    mainStageButtons.forEach(btn => btn.classList.remove('active'));

    const windingSubNav = document.getElementById('windingSubNav');

    if (stage === 'winding') {
        if (mainStageButtons[0]) mainStageButtons[0].classList.add('active');
        if (windingSubNav) windingSubNav.style.display = 'flex';
        window.currentStage = 'winding1';
        loadStageContent('winding1');
    } else if (stage === 'spa') {
        if (mainStageButtons[1]) mainStageButtons[1].classList.add('active');
        if (windingSubNav) windingSubNav.style.display = 'none';
        window.currentStage = 'spa';
        loadStageContent('spa');
    } else if (stage === 'coreCoil') {
        if (mainStageButtons[2]) mainStageButtons[2].classList.add('active');
        if (windingSubNav) windingSubNav.style.display = 'none';
        window.currentStage = 'coreCoil';
        loadStageContent('coreCoil');
    } else if (stage === 'tanking') {
        if (mainStageButtons[3]) mainStageButtons[3].classList.add('active');
        if (windingSubNav) windingSubNav.style.display = 'none';
        window.currentStage = 'tanking';
        loadStageContent('tanking');
    } else if (stage === 'coreBuilding') {
        if (mainStageButtons[4]) mainStageButtons[4].classList.add('active');
        if (windingSubNav) windingSubNav.style.display = 'none';
        window.currentStage = 'coreBuilding';
        loadStageContent('coreBuilding');
    }

    setTimeout(() => {
        if (typeof loadChecklistData === 'function') loadChecklistData(window.currentStage);
        if (typeof updateProgress === 'function') updateProgress();
    }, 100);
}
/* ===============================
   MAIN STAGE NAVIGATION
================================ */
function showMainStage(mainStage, button) {
    document.querySelectorAll('#mainStageNav .stage-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (button) button.classList.add('active');

    const windingSubNav = document.getElementById('windingSubNav');

    if (mainStage === 'winding') {
        if (windingSubNav) windingSubNav.style.display = 'flex';
        window.currentStage = 'winding1';
        loadStageContent('winding1');
    } else {
        if (windingSubNav) windingSubNav.style.display = 'none';
        window.currentStage = mainStage;
        loadStageContent(mainStage);
    }

    setTimeout(() => {
        if (typeof loadChecklistData === 'function') loadChecklistData(window.currentStage);
        if (typeof updateProgress === 'function') updateProgress();
    }, 100);
}
/* ===============================
   SWITCH WINDING SUB-STAGE
================================ */
function switchStage(stage, button) {
    const container = button.parentElement;
    container.querySelectorAll('.stage-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');

    window.currentStage = stage;
    loadStageContent(stage);

    setTimeout(() => {
        if (typeof loadChecklistData === 'function') loadChecklistData(stage);
        if (typeof updateProgress === 'function') updateProgress();
    }, 100);
}
/* ===============================
   GET STAGE DATA STRUCTURE
================================ */
function getStageData() {
    return {
        winding1: {
            title: 'INSPECTION RECORD FOR EHV & UHV - WINDING CHECKLIST',
            subtitle: 'Page 1 of 6 - Continuous Disc - Form No: F/QAS/14',
            sections: [
                {
                    name: 'B - Type of winding (Continuous Disc/Layer/Multi Start Helical/Contrashield)',
                    items: [
                        { point: 'Physical condition of the former, Visual check', specifiedValue: 'No Sharp surface, No damage, Cleanliness' },
                        { point: 'Former diameter (ID of the cylinder) Tol. +2/-0mm (by Measuring Tape)', specifiedValue: 'TOP / Centre / Bottom' },
                        { point: 'Height and Thickness of cylinder (By Measuring Tape & Vernier)', specifiedValue: 'As per drawing' },
                        { point: 'Inspection of cylinder passing (Visual) Overlap =120 x thk+50mm', specifiedValue: 'No air voids in joints, No Wariness' },
                        { point: 'Cylinder O.D. (Tol.-0 to +2 mm) (By Measuring Tape)', specifiedValue: 'TOP / Centre / Bottom' },
                        { point: 'Keyed strip thickness & length (By Vernier caliper & Measuring Tape)', specifiedValue: 'As per drawing' },
                        { point: 'Keyed strip alignment (Visual) by Laser', specifiedValue: 'To be Done' },
                        { point: 'No. of dovetail blocks as per circle & width (Visual & Measuring tape)', specifiedValue: 'As per drawing' },
                        { point: 'Dimension of Dovetail block (LxWxT)', specifiedValue: 'Width / Length / Thickness' }
                    ]
                },
                {
                    name: 'Conductor Verification',
                    items: [
                        { point: 'Bare conductor dimension PTCC/BPICC/CTC (Label Verification)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Covered conductor dimensions (Label Verification)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Shield Conductor dimensions (Label Verification)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Conductor details and drum status', specifiedValue: 'No damage from approved vendor' }
                    ]
                },
                {
                    name: 'B - Winding start details',
                    items: [
                        { point: 'Starting space for winding from cylinder (by Measuring Tape)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Make of Bottom Guard Ring/End Collar', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Lead length(-0,+100mm) (By Measuring Tape)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Type of lead bend at start (Radially/Axially)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Individual and Bunch insulation (By Vernier Caliper)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Lead position take out segment no.', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Direction of winding (Std. /Non std.)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Radial width of winding at 3rd Disc (+/-1mm) (By Vernier Caliper)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Total no. of Disc/Turn', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Line shield at start lead', specifiedValue: 'As per design' },
                        { point: 'Disc/Turn Numbering done at each disc/Turn', specifiedValue: 'To be Done' }
                    ]
                },
                {
                    name: 'C - Details of finish coil',
                    items: [
                        { point: 'Lead bend and insulation at finish end (Radially/Axially)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Disc and lead Anchoring', specifiedValue: 'To be Done as per drg' },
                        { point: 'Block alignment', specifiedValue: 'Visual and Laser verification' },
                        { point: 'Top insulation arrangement', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'OD Rider Provided', specifiedValue: 'To be Provided' },
                        { point: 'Line shield at end lead', specifiedValue: 'As per design' }
                    ]
                },
                {
                    name: 'Final Checks and Brazed Joints',
                    items: [
                        {
                            point: 'Arrangement of DOF washer (OD and ID) between Disc/turn',
                            specifiedValue: 'OD DOF / ID DOF / DOF / Studs',
                            type: 'dof-washer-table'
                        },
                        { point: 'Top Guard Ring/End Collar with protection washer over it', specifiedValue: 'To be verified' },
                        { point: 'Coil OD measure in mm (0,+3mm)', specifiedValue: '', editableSpecifiedValue: true },
                        { point: 'Continuity test after finish between parallel strands (By continuity tester)', specifiedValue: 'To be Done' },
                        { point: 'Identification/Status tag provided', specifiedValue: 'To be Provided' },
                        {
                            point: 'Details of brazed joints',
                            specifiedValue: 'See table below',
                            type: 'brazed-joints-table'
                        }
                    ]
                },
                {
                    name: 'Shield and Drum Details',
                    items: [
                        {
                            point: 'Details of Shield and Preparation, sealing and placement',
                            specifiedValue: 'As per specification',
                            type: 'shield-preparation-table'
                        },
                        {
                            point: 'Drum Details and Vendor name',
                            specifiedValue: 'Record details',
                            type: 'drum-details-table'
                        },
                        {
                            point: 'Details of observation/Nonconformity or balance work',
                            specifiedValue: '',
                            type: 'observation-table'
                        }
                    ]
                }
            ]
        },
        winding2: {
            title: 'WINDING START DETAILS',
            subtitle: 'Page 2 of 6',
            sections: [{
                name: 'B - Winding start details',
                items: [
                    { point: 'Starting space for winding from cylinder (by Measuring Tape)', specifiedValue: 'As per drawing' },
                    { point: 'Make of Bottom Guard Ring/End Collar', specifiedValue: 'Verify material' },
                    { point: 'Lead length(-0,+100mm) (By Measuring Tape)', specifiedValue: 'Within tolerance' },
                    { point: 'Type of lead bend at start (Radially/Axially)', specifiedValue: 'As specified' },
                    { point: 'Individual and Bunch insulation (By Vernier Caliper)', specifiedValue: 'Measure thickness' },
                    { point: 'Lead position take out segment no.', specifiedValue: 'Mark segment' },
                    { point: 'Direction of winding (Std. /Non std.)', specifiedValue: 'Standard direction' }
                ]
            }]
        },
        winding3: {
            title: 'FINISH COIL DETAILS',
            subtitle: 'Page 3 of 6',
            sections: [{
                name: 'C - Details of finish coil',
                items: [
                    { point: 'Lead bend and insulation at finish end (Radially/Axially)', specifiedValue: 'As per drawing' },
                    { point: 'Disc and lead Anchoring', specifiedValue: 'To be Done as per drg' },
                    { point: 'Block alignment', specifiedValue: 'Visual and Laser verification' },
                    { point: 'Top insulation arrangement', specifiedValue: 'Verify placement' },
                    { point: 'OD Rider Provided', specifiedValue: 'To be Provided' },
                    { point: 'Line shield at end lead', specifiedValue: 'As per design' }
                ]
            }]
        },
        coreCoil: {
            title: 'Core Coil Assembly Checklist',
            subtitle: 'Coil Lowering, Top yoke, Connections',
            sections: [{
                name: 'Core Coil Assembly (Coil Lowering, Top yoke, Connections)',
                items: [
                    {
                        point: 'Coil support BCS blocks & insulation.(visual)<br>-Alignment <br>-Grain orientation<br>-Leveling to be checked with spirit level.(-0,+2mm)',
                        specifiedValue: 'Should be in aligned & perpendicular condition.',
                        type: 'ok-notok',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'BCS hole are free from any type of blockage / Oil passege of BCS holes are clear.',
                        specifiedValue: 'Visual',
                        type: 'ok-notok'

                    },
                    {
                        point: 'Cleaning of bottom yoke.',
                        specifiedValue: 'should be clean',
                        type: 'ok-notok'
                    },
                    {
                        point: 'Arrangement of Barrier on main limb Cylinder Thickness (Record Barrier on main limb. Cylinder Thickness)',
                        specifiedValue: 'U Phase: ........... mm<br>V Phase: ........... mm<br>W Phase: ........... mm',
                        type: 'text-phases',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'Positioning & insulation arrangement of core shield at auxiliary limb.(as per Drawing)',
                        specifiedValue: 'Limb-1 Near U Phase<br>Limb-2 Near W Phase',
                        type: 'ok-notok-limbs',
                        limbs: ['Limb-1 Near U Phase', 'Limb-2 Near W Phase']
                    },
                    {
                        point: 'Measurement of diameter of core on cylinder. To be measured at 3 location. Top,Middle,Bottom. (For tolerences refer relevant drawings)',
                        specifiedValue: '......... mm',
                        type: 'tmb-measurements',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'Arrangement & alignment of strips on main limb. (Record Strip Thickness)',
                        specifiedValue: 'U Phase: ........... mm<br>V Phase: ........... mm<br>W Phase: ........... mm',
                        type: 'text-phases',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'Measurement of Inner diameter of winding. To be measured at 3 locations. Top, Middle, Bottom.<br><small style="color:#666;">(For tolerances refer relevant drawings)</small>',
                        specifiedValue: '......... mm',
                        type: 'tmb-measurements',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'Tung piece insertion B/w Bottom leads & fitch plate',
                        specifiedValue: 'To be inserted',
                        type: 'text-per-phase',
                        phases: ['U', 'V', 'W']
                    },
                    {
                        point: 'Isolation to be check Before Coil Lowering.<br>1) IR Check (2.5 KV DC for 1 min)<br>2) 2kV (Ac for 1 min)',
                        specifiedValue: '',
                        type: 'stop-stage'
                    },
                    {
                        point: 'Deflection & Damage in bottom ring if any. (Visual)',
                        specifiedValue: 'Ok / Not Ok',
                        type: 'ok-notok',
                        phases: ['U Phase', 'V Phase', 'W Phase']
                    },
                    {
                        point: 'Coil Clamping by Jacks',
                        specifiedValue: '',
                        type: 'jack-diagram'
                    },
                    {
                        point: 'Air gap between lamination joints at top yoke (Vernier Calliper)',
                        specifiedValue: '(0-2mm)'
                    },
                    {
                        point: 'Electrical Tests at <strong>10%</strong> of yoke filling:-<br>1) Ratio Test<br>2) Cross Current Checking.<br>3) Magnetic balance test.',
                        specifiedValue: '',
                        editableSpecifiedValue: true
                    }
                ]
            }]
        },
        tanking: {
            title: 'INSPECTION RECORD FOR EHV & UHV (Transformer)',
            subtitle: 'Repacking And Tanking Activity — Form No: F/GAS/15',
            sections: [
                {
                    name: '1 — Pre-tanking Activities',
                    items: [
                        { point: 'Punch No. on Tank', specifiedValue: '', type: 'single-merged' },
                        { point: 'Active Part No.', specifiedValue: '', type: 'single-merged' },
                        { point: 'Insulation arrangement in bottom tank', specifiedValue: 'As per drg.', type: 'split-value' },
                        { point: 'Tank barrier fixing on HV side', specifiedValue: 'As per drg.', type: 'split-value' },
                        { point: 'Tank barrier fixing on LV side', specifiedValue: 'As per drg.', type: 'split-value' },
                        { point: 'Type of shunts in Bottom Tank', specifiedValue: '', type: 'tanking-drums-table' },
                        { point: 'Type of shunts in Top Tank', specifiedValue: '', type: 'tanking-drums-table' },
                        { point: 'Bushing draw rod cleaning', specifiedValue: 'Clean', type: 'split-value' },
                        { point: 'Tightness of Intermediate connections of rod', specifiedValue: 'Torque as per drawing', type: 'split-value' }
                    ]
                },
                {
                    name: '2 — Post VPD Timings',
                    items: [
                        { point: 'Condition of climate chamber before VPD opening', specifiedValue: 'RH ...........%  Temp..............°C\nDate & time ............', type: 'split-value' },
                        { point: 'VPD Door open time', specifiedValue: '', type: 'single-merged' },
                        { point: 'Manual cycle of VPD start time / door closing (if applicable)', specifiedValue: '', type: 'single-merged' },
                        { point: 'VPD Door open for tanking (if point no 3 applicable)', specifiedValue: '', type: 'single-merged' },
                        { point: 'Climate chamber door opening time', specifiedValue: '', type: 'single-merged' },
                        { point: 'Vacuum / Dry air application time', specifiedValue: '', type: 'single-merged' }
                    ]
                },
                {
                    name: '3 — Oily Repacking of Active Part (if applicable)',
                    items: [
                        { point: 'Yoke clamp tightening', specifiedValue: 'Torque as per Drawing', type: 'tanking-torque-row' },
                        { point: 'Drop in tank Time & date', specifiedValue: '', type: 'single-merged' },
                        { point: 'Vacuum application time after curb bolt tightening', specifiedValue: '', type: 'single-merged' },
                        { point: 'Vacuum achieving time & date', specifiedValue: '0.30 in bar\nachieved', type: 'split-value' },
                        { point: 'Vacuum hold time (Duration)', specifiedValue: '', type: 'single-merged' },
                        { point: 'Under vacuum oil filling start time & Date', specifiedValue: '', type: 'single-merged' },
                        { point: 'Under vacuum oil filling completion time & Date', specifiedValue: '', type: 'single-merged' },
                        { point: 'Oil draining with continuous dry air filling inside the tank', specifiedValue: '', type: 'single-merged' },
                        { point: 'Time & date for Active part Shifted in Climate chamber for Re-packing', specifiedValue: '', type: 'single-merged' }
                    ]
                },
                {
                    name: '4 — Humidity & Temperature Hourly Monitoring of Climate Chamber',
                    items: [
                        { point: 'Humidity & Temperature Hourly Monitoring Table', specifiedValue: '', type: 'humidity-monitoring-table' }
                    ]
                },
                {
                    name: '5 — Repacking of Active Part',
                    items: [
                        { point: 'Balance points of T.G. Assembly (if any)', specifiedValue: '', type: 'single-merged' },
                        { point: 'Alignment of Common blocks / Top segment', specifiedValue: 'It must be Properly aligned', type: 'split-value' },
                        { point: 'All Permawood support & TG assembly tightening (Clear bar assembly tightening)', specifiedValue: 'Should be tight', type: 'tanking-dual-hv-lv' },
                        { point: 'Yoke clamp tightening', specifiedValue: 'Torque as per Drawing', type: 'tanking-torque-row' },
                        { point: 'Locking, Punching of pressure screw & Tie Rod', specifiedValue: 'Should be locked', type: 'split-value' },
                        { point: 'Tightening, Locking & Punching of other fasteners & clit supports', specifiedValue: '', type: 'single-merged' },
                        { point: 'All Bus Bar Connection tightening', specifiedValue: 'Torque as per Drawing', type: 'split-value' },
                        { point: 'Height measurement before coil pressing', specifiedValue: '', type: 'coil-uvw-diagram' },
                        { point: 'Clamping force for magnetic disc (Ton / Bar) in Shunt Reactors — U0 / V0 / W0', specifiedValue: '......Ton / ......Bar', type: 'split-value' },
                        { point: 'Clamping force for Winding (Ton / Bar) — U0 / V0 / W0', specifiedValue: '......Ton / ......Bar', type: 'split-value' },
                        { point: 'Final winding Height — 4 places / phase. Record in sketch (Tolerance limit +/- 3.0 mm) — U / V / W HV SIDE', specifiedValue: '', type: 'single-merged' },
                        { point: 'Wedge inserting below top yoke', specifiedValue: 'As per Drg.', type: 'tanking-torque-row' },
                        { point: 'Leveling of bottom shunt assembly on both sides / Checking tightness & alignment of top & bottom blocks by malleting / Capture photographic evidence of alignment', specifiedValue: 'Level check / No looseness / Record', type: 'split-value' },
                        { point: 'Locking of coil pressing Blocks', specifiedValue: 'As per Drg.', type: 'split-value' },
                        { point: 'Cleaning of the portion between Top platform and top yoke', specifiedValue: 'Clean', type: 'split-value' },
                        { point: 'Fibre Optic sensor connection — Winding (Sr.No. / Ok / Not Ok)', specifiedValue: 'Ok / Not Ok', type: 'split-value' },
                        { point: 'Fibre Optic sensor connection — Top Yoke (Sr.No. / Ok / Not Ok)', specifiedValue: 'Ok / Not Ok', type: 'split-value' },
                        { point: 'Fibre Optic sensor connection — Return Limb (Sr.No. / Ok / Not Ok)', specifiedValue: 'Ok / Not Ok', type: 'split-value' },
                        { point: 'Fibre Optic sensor connection — Top Oil (Sr.No. / Ok / Not Ok)', specifiedValue: 'Ok / Not Ok', type: 'split-value' },
                        { point: 'Setting of HV / IV main lead as per drawing', specifiedValue: 'As Per Drawing', type: 'tanking-torque-row' },
                        { point: 'Tightening of drain plug of OLTC', specifiedValue: 'Torque as per drawing', type: 'split-value' },
                        { point: 'Closure of all stress caps after completion of hardware tightening', specifiedValue: 'Stress caps shall be in closed condition', type: 'split-value' },
                        { point: 'Tightness of OLTC stress shield & conical nut (In case of OLTC) with special tool', specifiedValue: 'Should be tight', type: 'split-value' },
                        { point: 'Physical verification must be done in around & top of the Active Part by the Production Engineer', specifiedValue: 'Reqd', type: 'split-value' },
                        { point: 'Re-verification and Interlock Barricading with beacon light — done around & top of Active Part by Quality Test Operator', specifiedValue: 'Reqd', type: 'split-value' },
                        { point: 'Clearance between: a) Tie In resistor lead to earth and other tap leads  b) OLTC lead to earth and other tap leads', specifiedValue: '>Neutral to earth clearance', type: 'split-value' },
                        { point: 'Insulation resistance test — Before putting active part in tank (Core Shield, Core & Frame) — 2.5kV DC for 1 Min', specifiedValue: 'C-F: ......  CS-F: ......', type: 'split-value' },
                        { point: '2 Kv AC withstand test — 2.0 kV AC shall withstand for 1 min (Leakage current for reference only)', specifiedValue: 'C-F: ......  C-C: ......  CS-F: ......', type: 'split-value' },
                        { point: 'Electrical Tests: Magnetic balance test / Magnetic Current / Other Electrical Tests (If Any)', specifiedValue: '', type: 'split-value' },
                        { point: 'Cleaning of Active parts', specifiedValue: 'Clean', type: 'split-value' }
                    ]
                }
            ]
        },
        spa: {
            title: 'INSPECTION RECORD FOR EHV & UHV TRANSFORMER',
            subtitle: 'Single Phase Assembly - Form No: F/QAS/13',
            sections: [{
                name: '2 - First coil (LV/TER)',
                items: [
                    { point: 'Bottom platform/ring', specifiedValue: 'Leveling (T/mm), Make, No Damage/Deformation' },
                    { point: 'Segment marking and numbering on bottom platform/ring', specifiedValue: 'Equally spaced Numbering' },
                    { point: 'ID of cylinder in mm', specifiedValue: '', specifiedValueInput: true },
                    { point: 'Check winding cylinder joint and bulging', specifiedValue: 'Visual check to be done' },
                    { point: 'LV/Ter coil lower', specifiedValue: '', specifiedValueInput: true },
                    { point: 'Height adjustment of coil', specifiedValue: 'Do verification' },
                    { point: 'Physical check of coil from outside', specifiedValue: 'Vacuum cleaning' },
                    { point: 'Winding alignment', specifiedValue: 'Visual check and verification' },
                    { point: 'Winding leads position as per RLP', specifiedValue: 'Match with RLP' },
                    { point: 'Oil circulation hole/ducts are not blocked', specifiedValue: 'To be noted' },
                    { point: 'Fitment of oil sealing washer if any', specifiedValue: 'As per Design' }
                ]
            }, {
                name: '3 - 2nd coil (LV/Reg/IV)',
                items: [
                    { point: 'Coil lower', specifiedValue: '', specifiedValueInput: true, pointPrefixInput: true },
                    { point: 'Height adjustment of coil', specifiedValue: 'Do verification' },
                    { point: 'ID of cylinder in mm', specifiedValue: '', specifiedValueInput: true },
                    { point: 'Check winding cylinder joint and bulging', specifiedValue: 'Visual check to be done' },
                    { point: 'Physical check of coil from outside', specifiedValue: 'Vacuum cleaning' },
                    { point: 'Winding alignment', specifiedValue: 'Visual check and verification' },
                    { point: 'Winding leads position as per RLP', specifiedValue: 'Match with RLP' },
                    { point: 'Fitment of oil sealing washer if any', specifiedValue: 'As per Design' }
                ]
            }, {
                name: '4 - 3rd coil (Reg/IV/HV)',
                items: [
                    { point: 'Coil lower', specifiedValue: '', specifiedValueInput: true, pointPrefixInput: true },
                    { point: 'Height adjustment of coil', specifiedValue: 'Do verification' },
                    { point: 'ID of cylinder in mm', specifiedValue: '', specifiedValueInput: true },
                    { point: 'Check winding cylinder joint and bulging', specifiedValue: 'Visual check to be done' },
                    { point: 'Physical check of coil from outside', specifiedValue: 'Vacuum cleaning' },
                    { point: 'Winding alignment', specifiedValue: 'Visual check and verification' },
                    { point: 'Winding leads position as per RLP', specifiedValue: 'Match with RLP' },
                    { point: 'Oil circulation hole/ducts are not blocked', specifiedValue: 'To be noted' },
                    { point: 'Fitment of oil sealing washer if any', specifiedValue: 'As per Design' }
                ]
            }, {
                name: '5 - 4th Coil (HV/TAP)',
                items: [
                    { point: 'Coil lower', specifiedValue: '', specifiedValueInput: true, pointPrefixInput: true },
                    { point: 'Height adjustment of coil', specifiedValue: 'Do verification' },
                    { point: 'ID of cylinder in mm', specifiedValue: '', specifiedValueInput: true },
                    { point: 'Check winding cylinder joint and bulging', specifiedValue: 'Visual check to be done' },
                    { point: 'Physical check of coil from outside', specifiedValue: 'Vacuum cleaning' },
                    { point: 'Winding alignment', specifiedValue: 'Visual check and verification' },
                    { point: 'Winding leads position as per RLP', specifiedValue: 'Match with RLP' },
                    { point: 'Oil circulation hole/ducts are not blocked', specifiedValue: 'To be noted' },
                    { point: 'Fitment of oil sealing washer if any', specifiedValue: 'As per Design' }
                ]
            }, {
                name: '6 - Diameter of Hi Lo gap wraps of coil',
                items: [
                    { point: 'Hi Lo gap wraps table', type: 'hi-lo-gap-table' }
                ]
            }, {
                name: '7 - Other Inspection Points',
                items: [
                    { point: 'Dimensional verification of snouts (By measuring tape and level verification)', specifiedValue: 'As per drawing' },
                    { point: 'Oil sealing at lead take out slots', specifiedValue: 'As per drawing' },
                    { point: 'Top Platform.', specifiedValue: 'Make\nNo Damage\n/Delamination' },
                    { point: 'Position of top platform with reference to bottom platform (Check by plumb method / Laser)', specifiedValue: 'Should be inline' },
                    { point: 'Uniform packing/spacer rings between snouts (Visual)', specifiedValue: 'Should be provided' },
                    { point: 'Fiber optic sensor detail', specifiedValue: 'Use Annexure \'A_FOS\'' },
                    { point: 'Coil stack OD in SPA condition (by measuring tape)', specifiedValue: 'Level check and supplier name' },
                    { point: 'Lead preparation Top and Bottom.', specifiedValue: 'Should be done as per RLP' },
                    { point: 'Lead numbering', specifiedValue: 'Should be done as per RLP' },
                    { point: 'Outer wrap binding.', specifiedValue: 'As per std,' },
                    { point: 'Final Height from top ring top to Bottom ring bottom at four location and window zone (By measuring tape)', specifiedValue: '' },
                    { point: 'Final cleanliness of coil stack assembly', specifiedValue: 'To be cleaned' }
                ]
            }, {
                name: 'FOS (Fiber Optic Sensor) Annexure - FOS_A',
                items: [
                    { point: 'FOS Annexure table', type: 'fos-annexure-table' }
                ]
            }]
        },

        coreBuilding: {
            title: 'INSPECTION RECORD FOR EHV & UHV (Transformer)',
            subtitle: 'Core Building - Form No: F/QAS/ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â | Issue No: 00 | Issue Dt: 17/11/2025 | Rev No: 00 | Rev Dt: 17/11/2025',
            sections: [
                {
                    name: 'Core Building of Transformer (Core Table)',
                    items: [
                        { point: 'Core Building Full Table', type: 'core-building-table' }
                    ]
                }
            ]
        }
    };
}

/* ===============================
   LOAD STAGE CONTENT
================================ */
function loadStageContent(stage) {
    const content = document.getElementById('stageContent');
    if (!content) return;

    const isCustomer = window.currentUserRole === 'customer';
    const isQuality = window.currentUserRole === 'quality';
    const isProduction = window.currentUserRole === 'production';
    const isAdmin = window.currentUserRole === 'admin';
    const disabledAttr = isCustomer ? 'disabled' : '';
    const stageData = getStageData();
    const stageInfo = stageData[stage];

    if (!stageInfo) {
        content.innerHTML = '<p style="padding: 20px; color: #e74c3c;">ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Stage data not found.</p>';
        return;
    }

    let itemCounter = 0;
    let checklistHTML = '';

    // Render all sections
    stageInfo.sections.forEach((section) => {
        // Special header for tanking stage with split Observed Value columns
        const isTankingStage = stage === 'tanking';

        checklistHTML += `
            <h4 style="background: #ecf0f1; padding: 10px; margin-top: 20px; border-left: 4px solid var(--blue);">
                ${section.name}
            </h4>
            <table class="form-table">
                <thead>
                    ${stage === 'coreBuilding' ? '' : isTankingStage ? `
                    <tr>
                        <th style="width:40px;" rowspan="2">Sr.no</th>
                        <th style="width:300px;" rowspan="2">Inspection Points</th>
                        <th style="width:100px;" rowspan="2">Specified value</th>
                        <th style="width:200px;" colspan="2">Observed Value</th>
                        <th style="width:400px;" rowspan="2">Checked by (Sign & date)</th>
                        <th style="width:120px;" rowspan="2">Remarks</th>
                        <th style="width:80px;" rowspan="2">Action</th>
                    </tr>
                    <tr>
                        <th style="width:100px;">Value 1</th>
                        <th style="width:100px;">Value 2</th>
                    </tr>
                    ` : `
                    <tr>
                        <th style="width:40px;">Sr.no</th>
                        <th style="width:300px;">Inspection Points</th>
                        <th style="width:150px;">Specified value</th>
                        <th style="width:120px;">Actual Value</th>
                        <th style="width:400px;">Checked by (Sign & date)</th>
                        <th style="width:120px;">Remarks</th>
                        <th style="width:80px;">Action</th>
                    </tr>
                    `}
                </thead>
                <tbody>
        `;
        section.items.forEach((item) => {
            itemCounter++;
            const rowId = `row_${stage}_${itemCounter}`;

            // Determine what type of input to render based on item.type
            // Initialize sign-off cells
            let technicianCell = null;
            let shopSupCell = null;
            let qaSupCell = null;
            let remarkCell = null;
            let actualValueCell = '';
            let specifiedValueCell = item.specifiedValue;
            let customRowHTML = null;

            // Check if specified value should be editable (for rows 10-12, 14-20 in winding checklist, or specifiedValueInput flag)
            if (item.editableSpecifiedValue || item.specifiedValueInput) {
                specifiedValueCell = `
                    <input type="text" 
                           id="specifiedValue_${rowId}" 
                           ${disabledAttr}
                           value="${item.specifiedValue}"
                           placeholder="${item.specifiedValue || 'Enter value'}"
                           style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px; font-size: 11px;">
                `;
            }


            // Special handling for tanking stage with split Observed Value columns
            if (stage === 'tanking') {
                if (item.type === 'single-merged') {
                    // Rows 1-2: Single input spanning both Value 1 and Value 2 columns
                    actualValueCell = `
                        <td colspan="2" style="padding: 8px;">
                            <input type="text" 
                                   id="actualValue_${rowId}" 
                                   ${disabledAttr}
                                   placeholder="${item.specifiedValue}"
                                   style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px;">
                        </td>
                    `;
                } else if (item.type === 'split-value') {
                    // Rows 3-5, 8-9: Two separate inputs for Value 1 and Value 2
                    actualValueCell = `
                        <td style="padding: 8px;">
                            <input type="text" 
                                   id="observedValue1_${rowId}" 
                                   ${disabledAttr}
                                   placeholder="Value 1"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                        </td>
                        <td style="padding: 8px;">
                            <input type="text" 
                                   id="observedValue2_${rowId}" 
                                   ${disabledAttr}
                                   placeholder="Value 2"
                                   style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                        </td>
                    `;
                } else if (item.type === 'dropdown-merged') {
                    // Rows 6-7: Dropdown spanning both columns
                    actualValueCell = `
                        <td colspan="2" style="padding: 8px;">
                            <select id="actualValue_${rowId}" 
                                    ${disabledAttr}
                                    style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 3px;">
                                <option value="">-- Select --</option>
                                <option value="Type A">Type A</option>
                                <option value="Type B">Type B</option>
                                <option value="Type C">Type C</option>
                            </select>
                        </td>
                    `;
                } else if (item.type === 'tanking-drums-table') {
                    // Type of drums: As per Drg | Clip Type / Welded columns
                    actualValueCell = `
                        <td colspan="2" style="padding: 0;">
                            <table style="width:100%; border-collapse:collapse; font-size:10px; height:100%;">
                                <tr>
                                    <td style="border-left:1px solid #ddd; border-right:1px solid #ddd; padding:3px 5px; font-size:9px; color:#555; text-align:center; white-space:pre-line; width:35%;">${item.specifiedValue}</td>
                                    <td style="border-right:1px solid #ddd; padding:0; width:32.5%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">Clip Type</div>
                                        <input type="text" id="drums_clip_${rowId}" ${disabledAttr} style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                    <td style="padding:0; width:32.5%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">Welded</div>
                                        <input type="text" id="drums_welded_${rowId}" ${disabledAttr} style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    `;
                } else if (item.type === 'tanking-timing-row') {
                    // Post VPD Timings: Date & Time | Temp columns
                    actualValueCell = `
                        <td colspan="2" style="padding: 0;">
                            <table style="width:100%; border-collapse:collapse; font-size:10px; height:100%;">
                                <tr>
                                    <td style="border-right:1px solid #ddd; padding:0; width:60%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">Date &amp; Time</div>
                                        <input type="text" id="timing_dt_${rowId}" ${disabledAttr} placeholder="DD/MM/YYYY HH:MM" style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                    <td style="padding:0; width:40%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">Temp........°C</div>
                                        <input type="text" id="timing_temp_${rowId}" ${disabledAttr} placeholder="°C" style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    `;
                } else if (item.type === 'tanking-torque-row') {
                    // Dry Repadking Torque: HV Side | LV Side columns
                    actualValueCell = `
                        <td colspan="2" style="padding: 0;">
                            <table style="width:100%; border-collapse:collapse; font-size:10px; height:100%;">
                                <tr>
                                    <td style="border-right:1px solid #ddd; padding:0; width:50%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">HV Side</div>
                                        <input type="text" id="torque_hv_${rowId}" ${disabledAttr} placeholder="Torque (Nm)" style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                    <td style="padding:0; width:50%;">
                                        <div style="font-size:9px; text-align:center; padding:2px; border-bottom:1px solid #ddd; color:#555;">LV Side</div>
                                        <input type="text" id="torque_lv_${rowId}" ${disabledAttr} placeholder="Torque (Nm)" style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                </tr>
                            </table>
                        </td>
                    `;
                } else if (item.type === 'tanking-dual-hv-lv') {
                    // Two sub-rows: HV Side & LV Side each with same specifiedValue (e.g. 'Should be tight')
                    actualValueCell = `
                        <td style="border-right:1px solid #ddd; padding:3px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle; white-space:pre-line; width:30%;">${item.specifiedValue}</td>
                        <td style="padding: 0;">
                            <table style="width:100%; border-collapse:collapse; font-size:10px; height:100%;">
                                <tr>
                                    <td style="border-bottom:1px solid #ddd; padding:3px 5px; font-size:9px; color:#555; width:50%;">HV Side</td>
                                    <td style="border-left:1px solid #ddd; border-bottom:1px solid #ddd; padding:0;">
                                        <input type="text" id="dual_hv_${rowId}" ${disabledAttr} placeholder="Value"
                                            style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding:3px 5px; font-size:9px; color:#555;">LV Side</td>
                                    <td style="border-left:1px solid #ddd; padding:0;">
                                        <input type="text" id="dual_lv_${rowId}" ${disabledAttr} placeholder="Value"
                                            style="width:100%;border:none;padding:3px 4px;font-size:10px;background:transparent;box-sizing:border-box;">
                                    </td>
                                </tr>
                            </table>
                        </td>`;
                } else if (item.type === 'coil-uvw-diagram') {
                    // Item 8: U/V/W HV Side coil circle diagram with measurement lines
                    actualValueCell = `
                        <td colspan="2" style="padding:8px 4px;">
                            <div style="font-size:10px;font-weight:600;color:#333;margin-bottom:6px;">Height measurement <strong>before</strong> coil pressing</div>
                            <svg viewBox="0 0 340 130" xmlns="http://www.w3.org/2000/svg"
                                style="width:100%;max-width:380px;border:1px solid #ccc;background:#fff;display:block;">
                                <!-- Top measurement lines for U -->
                                <line x1="30" y1="18" x2="110" y2="18" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="30" y1="28" x2="110" y2="28" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="30" y1="38" x2="110" y2="38" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <!-- Top measurement lines for V -->
                                <line x1="130" y1="18" x2="210" y2="18" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="130" y1="28" x2="210" y2="28" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="130" y1="38" x2="210" y2="38" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <!-- Top measurement lines for W -->
                                <line x1="230" y1="18" x2="310" y2="18" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="230" y1="28" x2="310" y2="28" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <line x1="230" y1="38" x2="310" y2="38" stroke="#999" stroke-width="0.8" stroke-dasharray="4,3"/>
                                <!-- U coil circle -->
                                <circle cx="70" cy="82" r="38" fill="white" stroke="#333" stroke-width="1.5"/>
                                <text x="70" y="87" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">U</text>
                                <!-- V coil circle -->
                                <circle cx="170" cy="82" r="38" fill="white" stroke="#333" stroke-width="1.5"/>
                                <text x="170" y="87" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">V</text>
                                <!-- W coil circle -->
                                <circle cx="270" cy="82" r="38" fill="white" stroke="#333" stroke-width="1.5"/>
                                <text x="270" y="87" text-anchor="middle" font-size="14" font-weight="bold" fill="#333">W</text>
                                <!-- HV SIDE label -->
                                <text x="170" y="124" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">HV SIDE</text>
                                <!-- Sign line -->
                                <text x="310" y="128" text-anchor="end" font-size="9" fill="#555">Sign.</text>
                            </svg>
                        </td>`;
                } else if (item.type === 'humidity-monitoring-table') {
                    // ═══════════════════════════════════════════════════════════
                    // HUMIDITY & TEMPERATURE HOURLY MONITORING TABLE
                    // Paper form: Date | (Time · RH% · Temp°C) × 4  = 13 cols
                    // ═══════════════════════════════════════════════════════════
                    const hRows = 6;

                    // Style constants
                    const TH_GRP = 'border:1px solid #8eadc4;border-left:2px solid #5b8db8;padding:5px 4px;font-size:11.5px;font-weight:700;text-align:center;background:#bbdaf2;color:#0d2d4a;white-space:nowrap;';
                    const TH_SUB = 'border:1px solid #9ab9cf;padding:4px 3px;font-size:10.5px;font-weight:600;text-align:center;background:#daeef9;color:#0d2d4a;white-space:nowrap;';
                    const TH_DATE = 'border:1px solid #8eadc4;padding:5px 4px;font-size:11.5px;font-weight:700;text-align:center;background:#bbdaf2;color:#0d2d4a;vertical-align:middle;';
                    const TD_DATE = 'border:1px solid #b0cee3;padding:4px 3px;text-align:center;min-width:90px;';
                    const TD_TIME = 'border:1px solid #b0cee3;border-left:2.5px solid #5b8db8;padding:4px 3px;text-align:center;min-width:60px;';
                    const TD_VAL = 'border:1px solid #b0cee3;padding:4px 3px;text-align:center;min-width:48px;';
                    const INP = 'width:100%;border:none;font-size:11.5px;background:transparent;box-sizing:border-box;text-align:center;';

                    // Build 6 data rows
                    let hBody = '';
                    for (let r = 0; r < hRows; r++) {
                        const bg = r % 2 === 1 ? 'background:#f4f9fd;' : '';
                        const rdCells = [1, 2, 3, 4].map(g => `
                            <td style="${TD_TIME}${bg}">
                                <input type="text" id="hum_t${g}_${rowId}_${r}" ${disabledAttr}
                                    placeholder="HH:MM" style="${INP}">
                            </td>
                            <td style="${TD_VAL}${bg}">
                                <input type="number" id="hum_rh${g}_${rowId}_${r}" ${disabledAttr}
                                    placeholder="—" min="0" max="100" step="0.1" style="${INP}">
                            </td>
                            <td style="${TD_VAL}${bg}">
                                <input type="number" id="hum_tmp${g}_${rowId}_${r}" ${disabledAttr}
                                    placeholder="—" step="0.1" style="${INP}">
                            </td>`).join('');

                        hBody += `
                            <tr>
                                <td style="${TD_DATE}${bg}">
                                    <input type="text" id="hum_date_${rowId}_${r}" ${disabledAttr}
                                        placeholder="DD/MM/YYYY" style="${INP}">
                                </td>
                                ${rdCells}
                            </tr>`;
                    }

                    // Sub-header row ×4 (Time · RH% · Temp)
                    const subH = [1, 2, 3, 4].map(() => `
                        <th style="${TH_SUB}border-left:2.5px solid #5b8db8;">Time</th>
                        <th style="${TH_SUB}">Humidity<br>RH %</th>
                        <th style="${TH_SUB}">Temp<br>°C</th>`).join('');

                    actualValueCell = `
                        <td colspan="3" style="padding:10px 6px 12px 6px;">
                            <div style="font-weight:700;font-size:12px;color:#0d2d4a;margin-bottom:8px;text-align:center;letter-spacing:0.4px;">
                                🌡️&nbsp;Humidity &amp; Temperature Hourly Monitoring — Climate Chamber
                            </div>
                            <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;">
                            <table style="border-collapse:collapse;font-size:11.5px;min-width:700px;width:100%;">
                                <colgroup>
                                    <col style="width:100px;">
                                    <col style="width:68px;"><col style="width:56px;"><col style="width:56px;">
                                    <col style="width:68px;"><col style="width:56px;"><col style="width:56px;">
                                    <col style="width:68px;"><col style="width:56px;"><col style="width:56px;">
                                    <col style="width:68px;"><col style="width:56px;"><col style="width:56px;">
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th rowspan="2" style="${TH_DATE}">Date</th>
                                        <th colspan="3" style="${TH_GRP}">Reading 1</th>
                                        <th colspan="3" style="${TH_GRP}">Reading 2</th>
                                        <th colspan="3" style="${TH_GRP}">Reading 3</th>
                                        <th colspan="3" style="${TH_GRP}">Reading 4</th>
                                    </tr>
                                    <tr>${subH}</tr>
                                </thead>
                                <tbody>${hBody}</tbody>
                            </table>
                            </div>
                        </td>`;
                }

            } else if (item.type === 'ok-notok' && item.phases) {
                // Row 1 & 2: OK/Not OK dropdowns for U, V, W phases
                actualValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #fff; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; width: 60px; font-weight: 500; color: #000;">${phase}</span>
                                <select id="actualValue_${rowId}_${phase.replace(' ', '_')}" 
                                        ${disabledAttr}
                                        style="flex: 1; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff;">
                                    <option value="">-- Select --</option>
                                    <option value="Ok">Ok</option>
                                    <option value="Not Ok">Not Ok</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'ok-notok' && !item.phases) {
                // Row 3: Single OK/Not OK dropdown
                actualValueCell = `
                    <select id="actualValue_${rowId}" 
                            ${disabledAttr}
                            style="width: 100%; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff;">
                        <option value="">-- Select --</option>
                        <option value="Ok">Ok</option>
                        <option value="Not Ok">Not Ok</option>
                    </select>
                `;
            } else if (item.type === 'text-phases' && item.phases) {
                // Row 4 & 7: Text inputs for U, V, W phases
                // Generate Specified Value Cell to match alignment
                specifiedValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #f9f9f9; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; width: 60px; font-weight: 500; color: #000;">${phase}</span>
                                <input type="text" 
                                       id="specifiedValue_${rowId}_${phase.replace(' ', '_')}"
                                       ${disabledAttr}
                                       placeholder=".......... mm"
                                       style="flex: 1; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background-color: #fff; color: #000;">
                            </div>
                        `).join('')}
                    </div>
                `;

                actualValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #fff; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; width: 60px; font-weight: 500; color: #000;">${phase}</span>
                                <input type="text" 
                                       id="actualValue_${rowId}_${phase.replace(' ', '_')}" 
                                       ${disabledAttr}
                                       placeholder="...... mm"
                                       style="flex: 1; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff;">
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'ok-notok-limbs' && item.limbs) {
                // Row 5: OK/Not OK for Limb-1 and Limb-2
                // Generate Specified Value Cell to match alignment
                specifiedValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.limbs.map((limb, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #f9f9f9; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; width: 120px; font-weight: 500; color: #000;">${limb}</span>
                                <input type="text" 
                                       disabled
                                       value="As per Drawing"
                                       style="flex: 1; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background-color: #fff; color: #000;">
                            </div>
                        `).join('')}
                    </div>
                `;

                actualValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.limbs.map((limb, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #fff;">
                                <select id="actualValue_${rowId}_${limb.replace(/[^a-zA-Z0-9]/g, '_')}" 
                                        ${disabledAttr}
                                        style="width: 100%; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff;">
                                    <option value="">-- Select --</option>
                                    <option value="Ok">Ok</option>
                                    <option value="Not Ok">Not Ok</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'tmb-measurements' && item.phases) {
                // Row 6: T, M, B measurements for U, V, W phases
                // Generate Specified Value Cell to match alignment
                specifiedValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #f9f9f9;">
                                <div style="font-size: 10px; font-weight: 500; margin-bottom: 4px; color: #000;">${phase}</div>
                                <input type="text" 
                                       id="specifiedValue_${rowId}_${phase.replace(' ', '_')}"
                                       ${disabledAttr}
                                       placeholder="......... mm"
                                       style="width: 100%; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background-color: #fff; color: #000;">
                            </div>
                        `).join('')}
                    </div>
                `;

                actualValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #fff;">
                                <div style="font-size: 10px; font-weight: 500; margin-bottom: 4px; color: #000;">${phase}</div>
                                <table style="width: 100%; border-collapse: collapse;">
                                    ${['T', 'M', 'B'].map((pos, posIdx) => `
                                        <tr style="${posIdx > 0 ? 'border-top: 1px solid #ddd;' : ''}">
                                            <td style="width: 20px; padding: 3px 0; font-size: 10px; font-weight: bold; color: #000; text-align: center;">${pos}</td>
                                            <td style="padding: 3px 0 3px 6px;">
                                                <input type="text" 
                                                       id="actualValue_${rowId}_${phase.replace(' ', '_')}_${pos}" 
                                                       ${disabledAttr}
                                                       placeholder="mm"
                                                       style="width: 100%; padding: 4px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff; box-sizing: border-box;">
                                            </td>
                                        </tr>
                                    `).join('')}
                                </table>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Custom Technician Cell for TMB (Split per phase)
                technicianCell = `
                     <div style="display: flex; flex-direction: column; gap: 3px;">
                        ${item.phases.map(phase => `
                            <div style="border-bottom: 1px solid #eee; padding: 3px 0; height: 93px; display: flex; align-items: center;">
                                <input type="text" id="technician_${rowId}_${phase.replace(' ', '_')}" placeholder="Name (${phase})" class="technician-input" style="width: 100%; border: 1px solid #ddd; padding: 4px;">
                            </div>
                        `).join('')}
                    </div>
                `;

                // Custom Shop Supervisor Cell for TMB (Split per phase)
                shopSupCell = `
                     <div style="display: flex; flex-direction: column; gap: 3px;">
                        ${item.phases.map(phase => `
                            <div style="border-bottom: 1px solid #eee; padding: 3px 0; height: 93px; display: flex; align-items: center;">
                                <select id="shopSup_${rowId}_${phase.replace(' ', '_')}" style="width: 100%; border: 1px solid #ddd; padding: 4px;">
                                    <option value="">Select</option>
                                    <option value="Supervisor 1">Supervisor 1</option>
                                    <option value="Supervisor 2">Supervisor 2</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Custom QA Supervisor Cell for TMB (Split per phase)
                qaSupCell = `
                     <div style="display: flex; flex-direction: column; gap: 3px;">
                        ${item.phases.map(phase => `
                            <div style="border-bottom: 1px solid #eee; padding: 3px 0; height: 93px; display: flex; align-items: center;">
                                <select id="qaSup_${rowId}_${phase.replace(' ', '_')}" style="width: 100%; border: 1px solid #ddd; padding: 4px;">
                                    <option value="">Select</option>
                                    <option value="Inspector 1">Inspector 1</option>
                                    <option value="Inspector 2">Inspector 2</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                `;

                // Custom Remark Cell for TMB (Split per phase)
                remarkCell = `
                     <div style="display: flex; flex-direction: column; gap: 3px;">
                        ${item.phases.map(phase => `
                            <div style="border-bottom: 1px solid #eee; padding: 3px 0; height: 93px;">
                                <textarea id="remark_${rowId}_${phase.replace(' ', '_')}" placeholder="Remark (${phase})" style="width: 100%; height: 100%; border: 1px solid #ddd; resize: none; font-size: 10px;"></textarea>
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'text-per-phase') {
                // Text inputs per phase (no dropdown) – used for row 9 Tung piece
                actualValueCell = `
                    <div style="display: flex; flex-direction: column; gap: 0;">
                        ${item.phases.map((phase, idx) => `
                            <div style="border: 1px solid #333; ${idx > 0 ? 'border-top: none;' : ''} padding: 6px 8px; background: #fff; display: flex; align-items: center; gap: 8px;">
                                <span style="font-size: 10px; width: 30px; font-weight: 500; color: #000;">${phase}</span>
                                <input type="text"
                                       id="actualValue_${rowId}_${phase.replace(' ', '_')}"
                                       ${disabledAttr}
                                       placeholder="Enter value"
                                       style="flex: 1; padding: 5px; border: 1px solid #333; border-radius: 0; font-size: 10px; background: #fff;">
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'stop-stage') {
                // STOP STAGE row – red banner + full sign-off columns
                const _techName = isProduction ? (window.currentUserName || '') : '';
                const _ssName = isProduction ? (window.currentUserName || '') : '';
                const _qaName = isQuality ? (window.currentUserName || '') : '';
                customRowHTML = `
                    <tr id="${rowId}">
                        <td style="text-align:center; font-weight:bold; font-size:13px; padding:8px; vertical-align:middle; border:1px solid #333;">${itemCounter}</td>
                        <td style="font-size:11px; padding:8px; vertical-align:middle; border:1px solid #333;">${item.point}</td>
                        <td colspan="2" style="text-align:center; background:#c0392b; color:#fff; font-weight:bold; font-size:15px; letter-spacing:2px; padding:14px; border:1px solid #333;">
                            ⛔ STOP STAGE
                        </td>
                        <td style="padding:0; border:1px solid #333;">
                            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; height:100%; border-collapse:collapse;">
                                <div style="border-right:1px solid #ddd; padding:8px;">
                                    <div style="font-size:10px; font-weight:bold; margin-bottom:5px; text-align:center;">Technician</div>
                                    ${isProduction ? `
                                        <div style="font-size:10px;font-weight:bold;padding:4px 2px;background:#f0fff0;border-radius:3px;text-align:center;">${_techName}</div>
                                        <input type="hidden" id="technician_${rowId}" value="${_techName}">
                                        <small id="techTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : isAdmin ? `
                                        <input type="text" id="technician_${rowId}" readonly placeholder="—" style="width:100%;padding:4px;font-size:10px;border:1px solid #ddd;border-radius:3px;background:#f5f5f5;color:#333;margin-bottom:3px;cursor:default;">
                                        <small id="techTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : '<span style="font-size:10px;text-align:center;display:block;">-</span>'}
                                </div>
                                <div style="border-right:1px solid #ddd; padding:8px;">
                                    <div style="font-size:10px; font-weight:bold; margin-bottom:5px; text-align:center;">Shop Supervisor</div>
                                    ${isProduction ? `
                                        <div style="font-size:10px;font-weight:bold;padding:4px 2px;background:#f0fff0;border-radius:3px;text-align:center;">${_ssName}</div>
                                        <input type="hidden" id="shopSup_${rowId}" value="${_ssName}">
                                        <small id="shopSupTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : isAdmin ? `
                                        <input type="text" id="shopSup_${rowId}" readonly placeholder="—" style="width:100%;padding:4px;font-size:10px;border:1px solid #ddd;border-radius:3px;background:#f5f5f5;color:#333;margin-bottom:3px;cursor:default;">
                                        <small id="shopSupTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : '<span style="font-size:10px;text-align:center;display:block;">-</span>'}
                                </div>
                                <div style="padding:8px;">
                                    <div style="font-size:10px; font-weight:bold; margin-bottom:5px; text-align:center;">Quality Supervisor</div>
                                    ${isQuality ? `
                                        <div style="font-size:10px;font-weight:bold;padding:4px 2px;background:#f0f8ff;border-radius:3px;text-align:center;">${_qaName}</div>
                                        <input type="hidden" id="qaSup_${rowId}" value="${_qaName}">
                                        <small id="qaSupTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : isAdmin ? `
                                        <input type="text" id="qaSup_${rowId}" readonly placeholder="—" style="width:100%;padding:4px;font-size:10px;border:1px solid #ddd;border-radius:3px;background:#f5f5f5;color:#333;margin-bottom:3px;cursor:default;">
                                        <small id="qaSupTime_${rowId}" style="font-size:9px;color:#666;display:block;"></small>
                                    ` : '<span style="font-size:10px;text-align:center;display:block;">-</span>'}
                                </div>
                            </div>
                        </td>
                        <td style="padding:8px; border:1px solid #333;">
                            <textarea id="remark_${rowId}" ${disabledAttr} placeholder="Optional"
                                style="width:100%; height:60px; padding:4px; border:1px solid #ddd; font-size:10px; resize:none;"></textarea>
                        </td>
                        <td style="text-align:center; padding:6px; border:1px solid #333;">
                            ${!isCustomer ? `
                            <button class="btn-login" id="save_${rowId}"
                                style="width:auto; padding:6px 10px; font-size:11px; background:var(--green); margin-bottom:5px;"
                                onclick="saveNewChecklistItem('coreCoil', ${itemCounter}, '${rowId}')">
                                🔄 Update
                            </button>` : ''}
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'jack-diagram') {
                // Row 12: Jack clamping diagram with inputs + accurate SVG technical drawing
                customRowHTML = `
                    <tr id="${rowId}">
                        <td style="text-align:center; font-weight:bold; font-size:13px; padding:8px; vertical-align:top; border:1px solid #333;">${itemCounter}</td>
                        <td colspan="6" style="padding:12px; border:1px solid #333;">
                            <div style="display:flex; gap:24px; flex-wrap:wrap; align-items:flex-start;">

                                <!-- Left: numeric inputs -->
                                <div style="flex:0 0 300px; display:flex; flex-direction:column; gap:10px;">
                                    <div style="font-weight:700; font-size:12px; color:#222;">Coil Clamping by Jacks</div>
                                    <div style="display:flex; align-items:center; gap:8px; font-size:11px;">
                                        <label style="width:230px; font-weight:500;">Total Nos of jacks used for coil clamping:</label>
                                        <input type="text" id="jack_total_${rowId}" ${disabledAttr} placeholder="e.g. 8"
                                            style="flex:1; padding:5px; border:1px solid #333; font-size:11px; border-radius:3px;">
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px; font-size:11px;">
                                        <label style="width:230px; font-weight:500;">Capacity of jacks used (Record in diagram):</label>
                                        <input type="text" id="jack_capacity_${rowId}" ${disabledAttr} placeholder="e.g. 5 Ton"
                                            style="flex:1; padding:5px; border:1px solid #333; font-size:11px; border-radius:3px;">
                                    </div>
                                    <div style="font-size:10px; color:#555; font-weight:600; margin-top:4px;">Force applied:</div>
                                    <div style="display:flex; gap:16px; flex-wrap:wrap;">
                                        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
                                            <span style="color:#555;">............... Ton</span>
                                            <input type="text" id="jack_ton_${rowId}" ${disabledAttr} placeholder="Ton"
                                                style="width:70px; padding:5px; border:1px solid #333; font-size:11px; border-radius:3px;">
                                        </div>
                                        <div style="display:flex; align-items:center; gap:6px; font-size:11px;">
                                            <span style="color:#555;">............... PSI/Bar</span>
                                            <input type="text" id="jack_psi_${rowId}" ${disabledAttr} placeholder="PSI/Bar"
                                                style="width:70px; padding:5px; border:1px solid #333; font-size:11px; border-radius:3px;">
                                        </div>
                                    </div>
                                    <div style="display:flex; align-items:center; gap:8px; font-size:11px; margin-top:6px;">
                                        <label style="font-weight:500;">Sign:</label>
                                        <input type="text" id="jack_sign_${rowId}" ${disabledAttr} placeholder="Signature"
                                            style="flex:1; padding:5px; border:1px solid #333; font-size:11px; border-radius:3px;">
                                    </div>
                                </div>

                                <!-- Right: Accurate SVG technical drawing -->
                                <div style="flex:1; min-width:320px;">
                                    <div style="font-size:10px; color:#555; font-weight:600; margin-bottom:6px;">Jack Position Diagram</div>
                                    <svg viewBox="0 0 460 210" xmlns="http://www.w3.org/2000/svg"
                                        style="width:100%; max-width:500px; border:1.5px solid #333; background:#fff; display:block;">

                                        <!-- Outer frame -->
                                        <rect x="2" y="2" width="456" height="206" fill="none" stroke="#333" stroke-width="1.5"/>

                                        <!-- Top rail -->
                                        <rect x="10" y="15" width="440" height="28" fill="#d8d8d8" stroke="#333" stroke-width="1.5"/>

                                        <!-- Bottom rail -->
                                        <rect x="10" y="167" width="440" height="28" fill="#d8d8d8" stroke="#333" stroke-width="1.5"/>

                                        <!-- Bolt circles on TOP rail: L-end, U-top, V-top, W-top, R-end -->
                                        <circle cx="20" cy="29" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="130" cy="29" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="230" cy="29" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="330" cy="29" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="440" cy="29" r="7" fill="white" stroke="#333" stroke-width="1.5"/>

                                        <!-- Bolt circles on BOTTOM rail -->
                                        <circle cx="20" cy="181" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="130" cy="181" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="230" cy="181" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="330" cy="181" r="7" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <circle cx="440" cy="181" r="7" fill="white" stroke="#333" stroke-width="1.5"/>

                                        <!-- Diagonal jack-frame crossing lines -->
                                        <!-- Group 1: left span (L-end ↔ U/V mid) -->
                                        <line x1="20" y1="29" x2="330" y2="181" stroke="#333" stroke-width="1" marker-end="url(#arr)"/>
                                        <line x1="20" y1="181" x2="330" y2="29" stroke="#333" stroke-width="1" marker-end="url(#arr)"/>
                                        <!-- Group 2: right span (W-top ↔ R-end) -->
                                        <line x1="130" y1="29" x2="440" y2="181" stroke="#333" stroke-width="1" marker-end="url(#arr)"/>
                                        <line x1="130" y1="181" x2="440" y2="29" stroke="#333" stroke-width="1" marker-end="url(#arr)"/>
                                        <!-- Group 3: centre cross -->
                                        <line x1="230" y1="29" x2="20" y2="181" stroke="#333" stroke-width="1"/>
                                        <line x1="230" y1="29" x2="440" y2="181" stroke="#333" stroke-width="1"/>
                                        <line x1="230" y1="181" x2="20" y2="29" stroke="#333" stroke-width="1"/>
                                        <line x1="230" y1="181" x2="440" y2="29" stroke="#333" stroke-width="1"/>

                                        <!-- Three coil ellipses (U, V, W) drawn ON TOP of lines -->
                                        <ellipse cx="115" cy="105" rx="72" ry="48" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <ellipse cx="230" cy="105" rx="72" ry="48" fill="white" stroke="#333" stroke-width="1.5"/>
                                        <ellipse cx="345" cy="105" rx="72" ry="48" fill="white" stroke="#333" stroke-width="1.5"/>

                                        <!-- Labels -->
                                        <text x="115" y="111" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial">U</text>
                                        <text x="230" y="111" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial">V</text>
                                        <text x="345" y="111" text-anchor="middle" font-size="20" font-weight="bold" font-family="Arial">W</text>

                                        <!-- Arrowhead marker -->
                                        <defs>
                                            <marker id="arr" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                                                <path d="M0,0 L0,6 L6,3 z" fill="#333"/>
                                            </marker>
                                        </defs>
                                    </svg>
                                </div>
                            </div>

                            ${!isCustomer ? `
                            <div style="margin-top:10px; text-align:right;">
                                <button class="btn-login" id="save_${rowId}"
                                    style="width:auto; padding:6px 10px; font-size:11px; background:var(--green);"
                                    onclick="saveNewChecklistItem('coreCoil', ${itemCounter}, '${rowId}')">
                                    🔄 Update
                                </button>
                            </div>` : ''}
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'dof-washer-table') {
                // Row 31: DOF washer arrangement with multi-column table
                specifiedValueCell = `
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); border: 1px solid #333;">
                        <div style="border-right: 1px solid #333; padding: 4px; text-align: center; font-size: 10px; font-weight: bold; background: #f9f9f9;">OD DOF</div>
                        <div style="padding: 4px; text-align: center; font-size: 10px; font-weight: bold; background: #f9f9f9;">ID DOF</div>
                        ${[...Array(10)].map((_, idx) => `
                            <div style="border-right: 1px solid #333; border-top: 1px solid #333; padding: 2px;">
                                <input type="text" id="specifiedValue_${rowId}_od_dof_${idx}" ${disabledAttr} style="width: 100%; border: none; padding: 2px; font-size: 10px;">
                            </div>
                            <div style="border-top: 1px solid #333; padding: 2px;">
                                <input type="text" id="specifiedValue_${rowId}_id_dof_${idx}" ${disabledAttr} style="width: 100%; border: none; padding: 2px; font-size: 10px;">
                            </div>
                        `).join('')}
                    </div>
                `;

                actualValueCell = `
                    <div style="display: grid; grid-template-columns: 1fr; border: 1px solid #333;">
                        <div style="padding: 4px; text-align: center; font-size: 10px; font-weight: bold; background: #f9f9f9;">DOF</div>
                        ${[...Array(10)].map((_, idx) => `
                            <div style="border-top: 1px solid #333; padding: 2px;">
                                <input type="text" id="actualValue_${rowId}_dof_${idx}" ${disabledAttr} style="width: 100%; border: none; padding: 2px; font-size: 10px;">
                            </div>
                        `).join('')}
                    </div>
                `;

                // Custom Technician Cell with Sign column
                technicianCell = `
                    <div style="display: grid; grid-template-columns: 1fr; border: 1px solid #333;">
                        <div style="padding: 4px; text-align: center; font-size: 10px; font-weight: bold; background: #f9f9f9;">Sign</div>
                        ${[...Array(10)].map((_, idx) => `
                            <div style="border-top: 1px solid #333; padding: 2px;">
                                <input type="text" id="technician_${rowId}_sign_${idx}" ${disabledAttr} style="width: 100%; border: none; padding: 2px; font-size: 10px;">
                            </div>
                        `).join('')}
                    </div>
                `;
            } else if (item.type === 'spa-footer-table') {
                // Revision History + SPA Release for Next Stage footer
                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding: 0;">
                            <table style="width:100%; border-collapse:collapse; font-size:11px; border:1px solid #333; margin-bottom:0;">
                                <thead>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333; padding:6px 8px; text-align:center; width:15%;">Revision No</th>
                                        <th style="border:1px solid #333; padding:6px 8px; text-align:center; width:55%;">Revision History</th>
                                        <th style="border:1px solid #333; padding:6px 8px; text-align:center; width:30%;">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border:1px solid #333; padding:6px 8px; text-align:center;">0</td>
                                        <td style="border:1px solid #333; padding:6px 8px; text-align:center;">Original Issue</td>
                                        <td style="border:1px solid #333; padding:6px 8px; text-align:center;">11/17/2025</td>
                                    </tr>
                                    <tr><td style="border:1px solid #333; padding:20px 8px;" colspan="3">&nbsp;</td></tr>
                                    <tr><td style="border:1px solid #333; padding:20px 8px;" colspan="3">&nbsp;</td></tr>
                                </tbody>
                            </table>
                            <table style="width:100%; border-collapse:collapse; font-size:11px; border:1px solid #333; border-top:none; margin-top:0;">
                                <tbody>
                                    <tr style="background:#f0f0f0;">
                                        <td colspan="4" style="border:1px solid #333; padding:6px 10px; font-weight:bold; font-size:12px;">SPA release for Next Stage</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px; width:20%;">Format Prepared By</td>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px; width:30%;">Indrapal sahu</td>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px; width:20%;" rowspan="2">Sign of QA<br>Name/Date</td>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px; width:30%;" rowspan="2">
                                            <input type="text" id="spaRelease_qa_${rowId}" ${disabledAttr} placeholder="QA Sign / Date" style="width:100%;border:none;padding:4px;font-size:10px;">
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px;">Format Review By</td>
                                        <td style="border:1px solid #333; padding:6px 8px; font-size:10px;">Sunil Kumar Rai</td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'fos-annexure-table') {
                // FOS (Fiber Optic Sensor) Annexure - FOS_A - exact physical document layout
                // Columns: Sr.No | FOS Number | Location of FOS (HV/LV/OIL/CORE) | Stage x5 (Power+Signal each)
                const stages = ['SPA', 'After SPA Lowering', 'CCA', 'After repacking', 'Outside tank'];

                const fosDataRows = [...Array(16)].map((_, idx) => `
                    <tr>
                        <td style="border:1px solid #333; padding:2px 4px; font-size:10px; text-align:center; width:30px;">${idx + 1}</td>
                        <td style="border:1px solid #333; padding:0; height:24px; width:120px;"><input type="text" id="fos_num_${rowId}_${idx}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333; padding:0; height:24px; width:120px;"><input type="text" id="fos_loc_${rowId}_${idx}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        ${stages.map((_, sIdx) => `
                            <td style="border:1px solid #333; padding:0; height:24px;"><input type="text" id="fos_${rowId}_${idx}_${sIdx}_pwr" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333; padding:0; height:24px;"><input type="text" id="fos_${rowId}_${idx}_${sIdx}_sig" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        `).join('')}
                    </tr>
                `).join('');

                const signRow = `
                    <tr>
                        <td colspan="3" style="border:1px solid #333; padding:6px; background:#f9f9f9; font-size:10px; font-weight:bold; text-align:center; color:#555;">Sign of Quality<br>Supervisor</td>
                        ${stages.map((_, sIdx) => `
                            <td colspan="2" style="border:1px solid #333; padding:4px; text-align:center; font-size:10px;">
                                ${(isQuality || isAdmin) ? `
                                <select id="fos_sign_${rowId}_${sIdx}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;text-align:center;background:transparent;">
                                    <option value="">-- Select --</option>
                                    <option value="Inspector 1">Inspector 1</option>
                                    <option value="Inspector 2">Inspector 2</option>
                                </select>
                                ` : '<span style="font-size:10px;">-</span>'}
                            </td>
                        `).join('')}
                    </tr>
                `;

                const fosSaveRow = !isCustomer ? `
                    <tr>
                        <td colspan="${3 + stages.length * 2}" style="border:1px solid #333; padding:6px; text-align:right; background:#f9f9f9;">
                            <button class="btn-login"
                                    id="save_${rowId}"
                                    style="width:auto; padding:6px 14px; font-size:11px; background: var(--green); margin-right: 6px;"
                                    onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                                💾 Save FOS Data
                            </button>
                            <button class="btn-login"
                                    id="save_${rowId}_2"
                                    style="width:auto; padding:6px 14px; font-size:11px; background: var(--green);"
                                    onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_v2')">
                                💾 Save
                            </button>
                        </td>
                    </tr>
                ` : '';

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            <table style="width:100%; border-collapse:collapse; font-size:10px; border:1px solid #333;">
                                <thead>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;" rowspan="3">Sr.<br>No.</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;" rowspan="3">FOS Number</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;" rowspan="3">Location of FOS<br><span style="font-size:9px;">(HV/LV/OIL/CORE)</span></th>
                                        <th colspan="${stages.length * 2}" style="border:1px solid #333; padding:5px 4px; text-align:center; font-weight:bold;">Stage</th>
                                    </tr>
                                    <tr style="background:#e8e8e8;">
                                        ${stages.map(s => `<th colspan="2" style="border:1px solid #333; padding:4px; text-align:center; font-size:10px;">${s}</th>`).join('')}
                                    </tr>
                                    <tr style="background:#f0f0f0;">
                                        ${stages.map(() => `
                                            <th style="border:1px solid #333; padding:3px; text-align:center; font-size:9px; color:#0066cc;">Power</th>
                                            <th style="border:1px solid #333; padding:3px; text-align:center; font-size:9px; color:#0066cc;">Signal</th>
                                        `).join('')}
                                    </tr>
                                </thead>
                                <tbody>
                                    ${fosDataRows}
                                    ${signRow}
                                    ${fosSaveRow}
                                </tbody>
                            </table>
                            <div style="border:1px solid #333; border-top:none; padding:8px 10px; font-size:10px;">
                                <div style="font-weight:bold; margin-bottom:4px;">Acceptance Criteria :</div>
                                <div>* Winding (SPA), CCA &amp; Repacking Stage Signal/Power &gt; 90 % required</div>
                                <div>* Out Side Tank minimum Signal/Power required &gt; 65%</div>
                            </div>
                            <div style="border:1px solid #333; border-top:none; padding:6px 10px; font-size:10px;">
                                <div style="font-weight:bold; margin-bottom:4px;">Remarks</div>
                                <textarea id="fos_remarks_${rowId}" ${disabledAttr} style="width:100%; height:60px; border:1px solid #ddd; padding:4px; font-size:10px; resize:vertical;" placeholder="Remarks..."></textarea>
                            </div>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'core-building-table') {
                // Core Building – exact mirror of reference photo
                const saveBtnCB = !isCustomer ? `
                    <button class="btn-login"
                            id="save_${rowId}"
                            style="width:auto; padding:6px 14px; font-size:11px; background: var(--green); float:right; margin-bottom:6px;"
                            onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                        💾 Save Core Building
                    </button>
                ` : '';

                const cbUserName = window.currentUserName || '';
                const cbRole = window.currentUserRole || '';
                // Shop Supervisor: production auto-fills their own name; admin sees read-only display of saved name
                const cbSsCell = cbRole === 'production'
                    ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0fff0;"><strong>${cbUserName}</strong><input type="hidden" id="cb_{{ID}}_ss_${rowId}" value="${cbUserName}"></td>`
                    : cbRole === 'admin'
                        ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_{{ID}}_ss_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
                        : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_{{ID}}_ss_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`;
                // Quality Inspector: quality auto-fills their own name; admin sees read-only display of saved name
                const cbQiCell = cbRole === 'quality'
                    ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0f8ff;"><strong>${cbUserName}</strong><input type="hidden" id="cb_{{ID}}_qi_${rowId}" value="${cbUserName}"></td>`
                    : cbRole === 'admin'
                        ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_{{ID}}_qi_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
                        : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_{{ID}}_qi_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`;

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            ${saveBtnCB}
                            <!-- Main checklist table matching exact reference photo layout -->
                            <table style="width:100%; border-collapse:collapse; font-size:10px; border:1px solid #333;">
                                <thead>
                                    <tr style="background:#f0f0f0;">
                                        <th style="border:1px solid #333; padding:5px 4px; width:36px; text-align:center; vertical-align:middle;">Sr.<br>No.</th>
                                        <th style="border:1px solid #333; padding:5px 8px; text-align:center; vertical-align:middle;">Description</th>
                                        <th style="border:1px solid #333; padding:5px 4px; width:110px; text-align:center; vertical-align:middle;">Specified<br>Value</th>
                                        <th style="border:1px solid #333; padding:5px 4px; width:90px; text-align:center; vertical-align:middle;">Actual<br>Value</th>
                                        <!-- Checked By group -->
                                        <th colspan="3" style="border:1px solid #333; padding:5px 4px; text-align:center; vertical-align:middle;">Checked By (Signature)</th>
                                        <th style="border:1px solid #333; padding:5px 4px; width:60px; text-align:center; vertical-align:middle;">Save</th>
                                    </tr>
                                    <tr style="background:#f5f5f5;">
                                        <th style="border:1px solid #333;"></th>
                                        <th style="border:1px solid #333;"></th>
                                        <th style="border:1px solid #333;"></th>
                                        <th style="border:1px solid #333;"></th>
                                        <th style="border:1px solid #333; padding:4px; width:80px; text-align:center; font-size:9px;">Operator</th>
                                        <th style="border:1px solid #333; padding:4px; width:80px; text-align:center; font-size:9px;">Shop<br>Supervisor</th>
                                        <th style="border:1px solid #333; padding:4px; width:80px; text-align:center; font-size:9px;">Quality<br>Inspector</th>
                                        <th style="border:1px solid #333;"></th>
                                    </tr>
                                </thead>
                                <tbody>

                                    <!-- ── FRAME ASSEMBLY SECTION HEADING ── -->
                                    <tr>
                                        <td colspan="7" style="border:1px solid #333; padding:5px 8px; text-align:center; font-weight:bold; background:#eaeaea;">Frame Assembly</td>
                                    </tr>

                                    <!-- Row 1: Make of CRGO / Grade of CRGO -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">1</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Make of CRGO/Grade of CRGO</td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <!-- Three stacked inputs: Make / Grade / Thickness -->
                                            <table style="width:100%; border-collapse:collapse;">
                                                <tr><td style="border-bottom:1px solid #ccc; padding:3px 5px; font-size:9px; color:#555;">Make</td></tr>
                                                <tr><td style="border-bottom:1px solid #ccc; padding:3px 5px; font-size:9px; color:#555;">Grade</td></tr>
                                                <tr><td style="padding:3px 5px; font-size:9px; color:#555;">Thickness</td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                <tr><td style="border-bottom:1px solid #ccc; padding:0; height:22px;"><input type="text" id="cb_make_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr><td style="border-bottom:1px solid #ccc; padding:0; height:22px;"><input type="text" id="cb_grade_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr><td style="padding:0; height:22px;"><input type="text" id="cb_thickness_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; height:66px;"><input type="text" id="cb_r1_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r1')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r1')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r1" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_r1')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 2: Cleanliness check -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">2</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Check for cleanliness, paint, damages of Frame</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Clean &amp; damage free<br>(Visual)</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r2_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r2_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r2')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r2')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r2" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_r2')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 3: Perpendicularity -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">3</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Perpendicularity, Positioning &amp; Leveling of frames</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">With Spirit Level</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r3_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r3_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r3')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r3')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r3" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_r3')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── TCP YOKE DIAGRAM (spans full width) ── -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:10px 8px;">
                                            <svg viewBox="0 0 780 330" width="100%" style="display:block; font-family:Arial,sans-serif; max-width:860px; margin:0 auto;">

                                                <!-- TOP YOKE label above -->
                                                <text x="390" y="12" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">TOP Yoke</text>

                                                <!-- Top Yoke bar -->
                                                <rect x="30" y="16" width="720" height="34" fill="#d8d8d8" stroke="#333" stroke-width="1.5"/>

                                                <!-- D1 top-left, D2 top-right inside top bar -->
                                                <text x="38" y="38" font-size="10" font-weight="bold" fill="#333">D1</text>
                                                <polygon points="60,40 67,32 74,40" fill="#333"/>
                                                <text x="706" y="38" font-size="10" font-weight="bold" fill="#333">D2</text>
                                                <polygon points="696,40 703,32 710,40" fill="#333"/>

                                                <!-- H1 H2 H3 H4 labels inside top bar -->
                                                <text x="190" y="37" text-anchor="middle" font-size="10" fill="#333">H1</text>
                                                <text x="355" y="37" text-anchor="middle" font-size="10" fill="#333">H2</text>
                                                <text x="500" y="37" text-anchor="middle" font-size="10" fill="#333">H3</text>
                                                <text x="645" y="37" text-anchor="middle" font-size="10" fill="#333">H4</text>

                                                <!-- H arrows in top bar -->
                                                <line x1="125" y1="36" x2="250" y2="36" stroke="#555" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <line x1="290" y1="36" x2="415" y2="36" stroke="#555" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <line x1="450" y1="36" x2="555" y2="36" stroke="#555" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <line x1="592" y1="36" x2="700" y2="36" stroke="#555" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>

                                                <!-- Bottom Yoke bar -->
                                                <rect x="30" y="278" width="720" height="34" fill="#d8d8d8" stroke="#333" stroke-width="1.5"/>

                                                <!-- D2 bottom-left, D1 bottom-right -->
                                                <text x="38" y="302" font-size="10" font-weight="bold" fill="#333">&#9650; D2</text>
                                                <text x="690" y="302" font-size="10" font-weight="bold" fill="#333">D1 &#9650;</text>

                                                <!-- BOTTOM YOKE label below -->
                                                <text x="390" y="325" text-anchor="middle" font-size="11" font-weight="bold" fill="#333">BOTTOM YOKE</text>

                                                <!-- Aux Limb LEFT bar -->
                                                <rect x="30" y="50" width="38" height="228" fill="#c8c8c8" stroke="#333" stroke-width="1"/>
                                                <text x="49" y="175" text-anchor="middle" font-size="9" font-weight="bold" fill="#333" transform="rotate(-90,49,175)">Aux Limb</text>

                                                <!-- Aux Limb RIGHT bar -->
                                                <rect x="682" y="50" width="38" height="228" fill="#c8c8c8" stroke="#333" stroke-width="1"/>
                                                <text x="701" y="175" text-anchor="middle" font-size="9" font-weight="bold" fill="#333" transform="rotate(90,701,175)">Aux Limb</text>

                                                <!-- Limb boundary dashed verticals -->
                                                <line x1="125" y1="50" x2="125" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>
                                                <line x1="250" y1="50" x2="250" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>
                                                <line x1="290" y1="50" x2="290" y2="278" stroke="#555" stroke-width="1.5"/>
                                                <line x1="415" y1="50" x2="415" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>
                                                <line x1="450" y1="50" x2="450" y2="278" stroke="#555" stroke-width="1.5"/>
                                                <line x1="555" y1="50" x2="555" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>
                                                <line x1="592" y1="50" x2="592" y2="278" stroke="#555" stroke-width="1.5"/>
                                                <line x1="646" y1="50" x2="646" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>
                                                <line x1="682" y1="50" x2="682" y2="278" stroke="#555" stroke-width="1.2" stroke-dasharray="5,3"/>

                                                <!-- W1 W2 W3 W4 gap labels with arrows -->
                                                <text x="187" y="168" text-anchor="middle" font-size="10" fill="#555">W1</text>
                                                <line x1="125" y1="172" x2="250" y2="172" stroke="#aaa" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <text x="332" y="168" text-anchor="middle" font-size="10" fill="#555">W2</text>
                                                <line x1="290" y1="172" x2="375" y2="172" stroke="#aaa" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <text x="482" y="168" text-anchor="middle" font-size="10" fill="#555">W3</text>
                                                <line x1="450" y1="172" x2="515" y2="172" stroke="#aaa" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>
                                                <text x="619" y="168" text-anchor="middle" font-size="10" fill="#555">W4</text>
                                                <line x1="592" y1="172" x2="646" y2="172" stroke="#aaa" stroke-width="1" marker-end="url(#a)" marker-start="url(#a)"/>

                                                <!-- U V W phase labels -->
                                                <text x="270" y="178" text-anchor="middle" font-size="22" font-weight="bold" fill="#222">U</text>
                                                <text x="432" y="178" text-anchor="middle" font-size="22" font-weight="bold" fill="#222">V</text>
                                                <text x="572" y="178" text-anchor="middle" font-size="22" font-weight="bold" fill="#222">W</text>

                                                <!-- Diagonal cross lines (dashed) -->
                                                <line x1="68" y1="50" x2="125" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="125" y1="50" x2="68" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="125" y1="50" x2="290" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="290" y1="50" x2="125" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="290" y1="50" x2="450" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="450" y1="50" x2="290" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="450" y1="50" x2="592" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="592" y1="50" x2="450" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="592" y1="50" x2="682" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>
                                                <line x1="682" y1="50" x2="592" y2="278" stroke="#bbb" stroke-width="0.8" stroke-dasharray="4,3"/>

                                                <!-- Downward arrows on top yoke edge -->
                                                <polygon points="125,52 121,44 129,44" fill="#333"/>
                                                <polygon points="250,52 246,44 254,44" fill="#333"/>
                                                <polygon points="290,52 286,44 294,44" fill="#333"/>
                                                <polygon points="415,52 411,44 419,44" fill="#333"/>
                                                <polygon points="450,52 446,44 454,44" fill="#333"/>
                                                <polygon points="555,52 551,44 559,44" fill="#333"/>
                                                <polygon points="592,52 588,44 596,44" fill="#333"/>
                                                <polygon points="646,52 642,44 650,44" fill="#333"/>
                                                <polygon points="682,52 678,44 686,44" fill="#333"/>

                                                <!-- Bottom D labels with upward arrows -->
                                                <text x="125" y="274" text-anchor="middle" font-size="9" fill="#333">D3</text>
                                                <polygon points="125,276 121,284 129,284" fill="#333"/>
                                                <text x="250" y="274" text-anchor="middle" font-size="9" fill="#333">D4</text>
                                                <polygon points="250,276 246,284 254,284" fill="#333"/>
                                                <text x="290" y="274" text-anchor="middle" font-size="9" fill="#333">D5</text>
                                                <polygon points="290,276 286,284 294,284" fill="#333"/>
                                                <text x="415" y="274" text-anchor="middle" font-size="9" fill="#333">D6</text>
                                                <polygon points="415,276 411,284 419,284" fill="#333"/>
                                                <text x="450" y="274" text-anchor="middle" font-size="9" fill="#333">D7</text>
                                                <polygon points="450,276 446,284 454,284" fill="#333"/>
                                                <text x="555" y="274" text-anchor="middle" font-size="9" fill="#333">D8</text>
                                                <polygon points="555,276 551,284 559,284" fill="#333"/>
                                                <text x="592" y="274" text-anchor="middle" font-size="9" fill="#333">D9</text>
                                                <polygon points="592,276 588,284 596,284" fill="#333"/>
                                                <text x="646" y="274" text-anchor="middle" font-size="9" fill="#333">D10</text>
                                                <polygon points="646,276 642,284 650,284" fill="#333"/>

                                                <!-- Arrow marker def -->
                                                <defs>
                                                    <marker id="a" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
                                                        <path d="M0,0 L4,2 L0,4 Z" fill="#555"/>
                                                    </marker>
                                                </defs>
                                            </svg>
                                        </td>
                                    </tr>

                                    <!-- ── MEASUREMENTS SECTION HEADING ── -->
                                    <tr>
                                        <td colspan="7" style="border:1px solid #333; padding:5px 8px; text-align:center; font-weight:bold; background:#eaeaea;">Measurements After Frame Fixing (All dimensions are in mm)</td>
                                    </tr>

                                    <!-- Diagonals row with 5 sub-pairs -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">15</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">
                                            Diagonals Measurement (±2 mm)<br>
                                            <span style="font-size:9px; color:#666;">(For 3 limb D7 to D10 Not Applicable)</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                ${['D1, D2', 'D3, D4', 'D5, D6', 'D7, D8', 'D9, D10'].map((label, i) => `
                                                <tr style="${i < 4 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:2px 5px; font-size:9px; color:#555; white-space:nowrap;">${label}</td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                ${[0, 1, 2, 3, 4].map(i => `
                                                <tr style="${i < 4 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:0; height:22px;"><input type="text" id="cb_diag_${rowId}_${i}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbRole === 'production'
        ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0fff0;"><strong>${cbUserName}</strong><input type="hidden" id="cb_diag_ss_${rowId}" value="${cbUserName}"></td>`
        : cbRole === 'admin'
            ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_diag_ss_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
            : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag_ss_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`
}
                                        ${cbRole === 'quality'
        ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0f8ff;"><strong>${cbUserName}</strong><input type="hidden" id="cb_diag_qi_${rowId}" value="${cbUserName}"></td>`
        : cbRole === 'admin'
            ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_diag_qi_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
            : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag_qi_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`
}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_diag" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_diag')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 4: Bottom HV/LV frame to Top frame Height Measurement -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:top;">4</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:top;">
                                            Bottom HV/LV frame to Top frame<br>Height Measurement (± 2/0 mm)<br>
                                            <span style="font-size:9px;color:#777;">(For 3 limb H3 &amp; H4 Not Applicable)</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                ${['H1', 'H2', 'H3', 'H4', 'W1', 'W2', 'W3', 'W4'].map((lbl, i) => `
                                                <tr style="${i < 7 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:2px 5px;font-size:9px;color:#555;white-space:nowrap;">${lbl}</td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `
                                                <tr style="${i < 7 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:0;height:22px;"><input type="text" id="cb_r4_av_${rowId}_${i}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r4_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r4')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r4')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r4" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r4')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 5: Locking of flitch plate -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">5</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">
                                            Locking of flitch plate with bottom frame &amp; tightening of flitch plate hardware.<br>
                                            <span style="font-size:9px;color:#777;">(For 3 limb W3 &amp; W4 Not Applicable)</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Ok / Not Ok</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r5_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r5_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r5')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r5')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r5" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r5')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── INSULATION ASSEMBLY SECTION HEADING ── -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:5px 8px; font-weight:bold; text-align:center; background:#eaeaea;">Insulation Assembly frames &amp; Flitch plates</td>
                                    </tr>

                                    <!-- Row 6: Insulation arrangement at bottom (HV/LV) frame -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:top;">6</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:top;">
                                            Insulation arrangement at bottom (HV/LV) frame<br>
                                            <span style="font-size:9px;color:#777;">(Bottom frame top edge to core insulation top edge) As per Drg.</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:2px 5px;font-size:9px;color:#555;">Thickness<br><input type="text" id="cb_r6_th1_${rowId}" ${disabledAttr} placeholder="mm" style="width:70px;height:18px;border:1px solid #ccc;padding:2px 3px;font-size:9px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr><td style="padding:2px 5px;font-size:9px;color:#555;"><input type="text" id="cb_r6_th2_${rowId}" ${disabledAttr} placeholder="mm" style="width:70px;height:18px;border:1px solid #ccc;padding:2px 3px;font-size:9px;background:transparent;box-sizing:border-box;"></td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:0;height:22px;"><input type="text" id="cb_r6_av1_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr><td style="padding:0;height:22px;"><input type="text" id="cb_r6_av2_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r6_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r6')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r6')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r6" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r6')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 7: Insulation arrangement at flitch plates -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:top;">7</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:top;">Insulation arrangement at flitch plates.</td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:2px 5px;font-size:9px;color:#555;">Thickness<br><input type="text" id="cb_r7_th_${rowId}" ${disabledAttr} placeholder="mm" style="width:70px;height:18px;border:1px solid #ccc;padding:2px 3px;font-size:9px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:2px 5px;font-size:9px;color:#555;">10 mm inspection at both ends.</td></tr>
                                                <tr><td style="padding:2px 5px;font-size:9px;color:#555;">As per Drg.</td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%;border-collapse:collapse;">
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:0;height:22px;"><input type="text" id="cb_r7_av1_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr style="border-bottom:1px solid #ccc;"><td style="padding:0;height:22px;"><input type="text" id="cb_r7_av2_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                                <tr><td style="padding:0;height:22px;"><input type="text" id="cb_r7_av3_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td></tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r7_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r7')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r7')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r7" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r7')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 8: Use of nomex at insulation joint -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">8</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Use of nomex at insulation joint</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Ok / Not Ok</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r8_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r8_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r8')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r8')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r8" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r8')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 9: Position of Step blocks -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">9</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Position of Step blocks.</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Ok / Not Ok</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r9_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r9_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r9')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r9')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r9" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r9')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── LAMINATIONS ASSEMBLY SECTION HEADING ── -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:5px 8px; font-weight:bold; text-align:center; background:#eaeaea;">Laminations Assembly</td>
                                    </tr>

                                    <!-- Row 10: Surface Condition of Laminations -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">10</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Surface Condition of Laminations should be Rust free, Damage Free, Waviness Free.</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Visual<br>Ok / Not Ok</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r10_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r10_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r10')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r10')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r10" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r10')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 11: No. of laminations per packet -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">11</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">No. of laminations per packet</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">As per Drg.</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r11_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r11_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r11')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r11')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r11" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r11')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 12: No. of packets per layer -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">12</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">No. of packets per layer</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">As per Drg.</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r12_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r12_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r12')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r12')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r12" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r12')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 13: Position of First Lamination -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">13</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Position of First Lamination with respect to Yoke Clamp &amp; Insulation</td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">Visual<br>Ok / Not Ok</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r13_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r13_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r13')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r13')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r13" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r13')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 14: Air Gap at Lamination joint -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">14</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">
                                            Air Gap at Lamination joint<br>
                                            <span style="font-size:9px;color:#777;">Note: No overlapping.<br>(To be measured with Vernier caliper)</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:4px 5px; font-size:9px; color:#555; text-align:center; vertical-align:middle;">0 to 2 mm</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r14_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r14_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r14')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r14')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r14" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r14')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── MEASUREMENTS AFTER 1ST LAYER ASSEMBLY HEADING ── -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:5px 8px; text-align:center; font-weight:bold; background:#eaeaea;">Measurements After 1st Layer Assembly (All dimensions are in mm)</td>
                                    </tr>

                                    <!-- Row 16: Diagonals Measurement (2nd set) -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">16</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">
                                            Diagonals Measurement (±2 mm)<br>
                                            <span style="font-size:9px; color:#666;">(For 3 limb D7 to D10 Not Applicable)</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                ${['D1, D2', 'D3, D4', 'D5, D6', 'D7, D8', 'D9, D10'].map((label, i) => `
                                                <tr style="${i < 4 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:2px 5px; font-size:9px; color:#555; white-space:nowrap;">${label}</td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;">
                                            <table style="width:100%; border-collapse:collapse;">
                                                ${[0, 1, 2, 3, 4].map(i => `
                                                <tr style="${i < 4 ? 'border-bottom:1px solid #ccc;' : ''}">
                                                    <td style="padding:0; height:22px;"><input type="text" id="cb_diag2_${rowId}_${i}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>`).join('')}
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag2_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbRole === 'production'
        ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0fff0;"><strong>${cbUserName}</strong><input type="hidden" id="cb_diag2_ss_${rowId}" value="${cbUserName}"></td>`
        : cbRole === 'admin'
            ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_diag2_ss_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
            : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag2_ss_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`
}
                                        ${cbRole === 'quality'
        ? `<td style="border:1px solid #333; padding:3px 5px; font-size:10px; vertical-align:middle; background:#f0f8ff;"><strong>${cbUserName}</strong><input type="hidden" id="cb_diag2_qi_${rowId}" value="${cbUserName}"></td>`
        : cbRole === 'admin'
            ? `<td style="border:1px solid #333; padding:2px;"><input type="text" id="cb_diag2_qi_${rowId}" readonly placeholder="—" style="width:100%;border:none;padding:3px;font-size:10px;background:#f5f5f5;box-sizing:border-box;cursor:default;"></td>`
            : `<td style="border:1px solid #333; padding:0;"><input type="text" id="cb_diag2_qi_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>`
}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_diag2" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}_diag2')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── LAMINATION LAYER ASSEMBLY SECTION ── -->

                                    <!-- Row 16: Record each stack height (sub-rows a-n) -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:top;" rowspan="15">16</td>
                                        <td colspan="6" style="border:1px solid #333; padding:4px 8px; font-weight:bold; background:#f9f9f9;">
                                            Record each stack height.<br>
                                            <span style="font-size:9px; color:#777; font-weight:normal;">Note: When testing 4-frame cores test core to core at the same time as ducts/nomex layers</span>
                                        </td>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r16hdr" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r16hdr')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    ${[
        { lbl: 'a', desc: '1st Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16a' },
        { lbl: 'b', desc: '1st Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16b' },
        { lbl: 'c', desc: '2nd Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16c' },
        { lbl: 'd', desc: '2nd Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16d' },
        { lbl: 'e', desc: '3rd Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16e' },
        { lbl: 'f', desc: '3rd Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16f' },
        { lbl: 'g', desc: '4th Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16g' },
        { lbl: 'h', desc: '4th Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16h' },
        { lbl: 'i', desc: '5th Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16i' },
        { lbl: 'j', desc: '5th Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16j' },
        { lbl: 'k', desc: '6th Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16k' },
        { lbl: 'l', desc: '6th Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16l' },
        { lbl: 'm', desc: '7th Duct or nomex layer laid out correctly', spec: 'As per Drg.', id: 'r16m' },
        { lbl: 'n', desc: '7th Duct or nomex layer tested by using 1kV DC ohmmeter', spec: 'Acceptance criteria >5MΩ', id: 'r16n' }
    ].map(row => `
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px 6px; font-size:10px; vertical-align:middle;"><strong>${row.lbl}</strong> — ${row.desc}</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">${row.spec}</td>
                                        <td style="border:1px solid #333; padding:2px; vertical-align:middle;">
                                            <select id="cb_${row.id}_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">— Select —</option>
                                                <option value="Ok">Ok</option>
                                                <option value="Not Ok">Not Ok</option>
                                                <option value="N/A">N/A</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_${row.id}_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, row.id)}
                                        ${cbQiCell.replace(/{{ID}}/g, row.id)}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_${row.id}" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_${row.id}')">💾 Save</button>` : ''}</td>
                                    </tr>`).join('')}


                                    <!-- Row 17: Final Unpressed stack height measurement -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">17</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Final Unpressed stack height measurement</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">
                                            Framed core: 03 to 05 mm<br>
                                            Non framed core: 2 to 3 mm
                                        </td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <div style="display:flex;flex-direction:column;">
                                                <input type="text" id="cb_r17_av1_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;border-bottom:1px solid #ccc;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <input type="text" id="cb_r17_av2_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                            </div>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r17_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r17')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r17')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r17" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r17')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- ── FRAME ASSEMBLY SECTION (2nd pass) ── -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:5px 8px; font-weight:bold; text-align:center; background:#eaeaea;">Frame Assembly</td>
                                    </tr>

                                    <!-- Row 18: Insulation arrangement at bottom frame -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">18</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Insulation arrangement at bottom frame.</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Thickness <input type="text" id="cb_r18_th_${rowId}" ${disabledAttr} placeholder="mm" style="width:55px;height:18px;border:1px solid #ccc;padding:2px 3px;font-size:9px;background:transparent;box-sizing:border-box;"> mm</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r18_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r18_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r18')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r18')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r18" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r18')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 19: Insulation arrangement at flitch plates -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">19</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Insulation arrangement at flitch plates.</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Thickness <input type="text" id="cb_r19_th_${rowId}" ${disabledAttr} placeholder="mm" style="width:55px;height:18px;border:1px solid #ccc;padding:2px 3px;font-size:9px;background:transparent;box-sizing:border-box;"> mm</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;"><input type="text" id="cb_r19_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r19_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r19')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r19')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r19" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r19')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 20: Use of nomex at insulation joint -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">20</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Use of nomex at insulation joint</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Finish Date</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r20_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option>
                                                <option value="Ok">Ok</option>
                                                <option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r20_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r20')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r20')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r20" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r20')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 21: Position of Step blocks -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">21</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Position of Step blocks.</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">10 mm projection at bolt ends</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r21_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option>
                                                <option value="Ok">Ok</option>
                                                <option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r21_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r21')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r21')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r21" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r21')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 22: Flitch plate to flitch plate width Measurement -->
                                    <tr>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">22</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Flitch plate to flitch plate width Measurement (± 2/0 mm)<br><span style="font-size:9px;color:#555;">(For 3 limb W3 & W4 Not Applicable)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">As per Drg.</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="5" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r22').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r22').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r22" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r22')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">W1</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r22_w1_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r22_w1op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">W2</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r22_w2_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r22_w2op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">W3</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r22_w3_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r22_w3op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">W4</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r22_w4_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r22_w4op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 23: Bottom HV/LV frame to Top Height Measurement -->
                                    <tr>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">23</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Bottom HV/LV frame to Top Height Measurement (± 2/0 mm)<br><span style="font-size:9px;color:#555;">(For 3 limb H3 & H4 Not Applicable)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">As per Drg.</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="5" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r23').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r23').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="5" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r23" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r23')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">H1</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r23_h1_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r23_h1op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">H2</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r23_h2_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r23_h2op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">H3</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r23_h3_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r23_h3op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">H4</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r23_h4_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r23_h4op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 24: Insulation arrangement at basefeet & Isolation tube filled at Hardware -->
                                    <tr>
                                        <td rowspan="7" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">24</td>
                                        <td rowspan="7" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Insulation arrangement at basefeet &amp; Isolation tube filled at Hardware.</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Visual Check for:</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="7" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r24').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="7" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r24').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="7" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r24" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r24')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Insulation at base feet</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_basefeet_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_basefeet_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Uphase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_uphase_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_uphase_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Vphase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_vphase_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_vphase_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Wphase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_wphase_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_wphase_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Aux. limb1</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_aux1_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_aux1_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">Aux. limb2</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r24_aux2_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r24_aux2_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 25: Base feet hardware tightning -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">25</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Base feet hardware tightning.<br><span style="font-size:9px;color:#555;">(Torque application as per Drg.)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">As per Drg.<br>F1</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r25_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r25_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r25')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r25')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r25" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r25')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 26: Steel band assembly -->
                                    <tr>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">26</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Steel band assembly (AS Per Drg.):-<br>- Tightening.<br>- Isolation arrangement &amp;<br>- Hardware tightening.<br><span style="font-size:9px;color:#555;">(Torque application as per Drg.)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="4" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r26').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r26').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r26" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r26')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">F2</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r26_f2_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r26_f2_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">F3</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r26_f3_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r26_f3_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">F4</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r26_f4_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r26_f4_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 27: End Bracket Assembly -->
                                    <tr>
                                        <td rowspan="3" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">27</td>
                                        <td rowspan="3" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">End Bracket Assembly (As Per Drg.):-<br>-Hardware tightening<br>-Isolation Arrangement<br><span style="font-size:9px;color:#555;">-Torque Application as per Drg.</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="3" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r27').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="3" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r27').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="3" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r27" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r27')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">F1</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r27_f1_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r27_f1_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">F4</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r27_f4_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r27_f4_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 28: Application of Blue Lacquer/white varnish -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">28</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Application of Blue Lacquer/white varnish</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Visual</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r28_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r28_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r28')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r28')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r28" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r28')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 29: Core leg packing (Haldi wood) -->
                                    <tr>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">29</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Core leg packing(Haldi wood).<br>As per Drawing.</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Visual</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;" colspan="2"></td>
                                        <td rowspan="4" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r29').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r29').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="4" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r29" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r29')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">U Phase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r29_u_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r29_u_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">V Phase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r29_v_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r29_v_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;">W Phase</td>
                                        <td style="border:1px solid #333; padding:0;">
                                            <select id="cb_r29_w_ok_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r29_w_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>

                                    </tr>

                                    <!-- Row 30: Core Diameter Measurement at Green belt -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">30</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Core Diameter Measurement at Green belt</td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:top;" colspan="2">
                                            <table style="width:100%;border-collapse:collapse;margin:0;padding:0;">
                                                <tr>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; font-weight:bold; text-align:center;">Specified Value</td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; font-weight:bold; text-align:center;">Location</td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; font-weight:bold; text-align:center;">U Phase</td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; font-weight:bold; text-align:center;">V Phase</td>
                                                    <td style="border-bottom:1px solid #999; padding:2px 3px; font-size:9px; font-weight:bold; text-align:center;">W Phase</td>
                                                </tr>
                                                <tr>
                                                    <td rowspan="3" style="border-right:1px solid #999; padding:2px 3px; font-size:9px; text-align:center; vertical-align:middle;">
                                                        <div style="display:flex;align-items:center;gap:2px;justify-content:center;">
                                                            <input type="text" id="cb_r30_sv_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">
                                                            <span style="font-size:9px;color:#555;">mm</span>
                                                        </div>
                                                    </td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; text-align:center;">Top</td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_top_u_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_top_v_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_top_w_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>
                                                <tr>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:2px 3px; font-size:9px; text-align:center;">Middle</td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_mid_u_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="border-right:1px solid #999; border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_mid_v_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="border-bottom:1px solid #999; padding:0;"><input type="text" id="cb_r30_mid_w_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>
                                                <tr>
                                                    <td style="border-right:1px solid #999; padding:2px 3px; font-size:9px; text-align:center;">Bottom</td>
                                                    <td style="border-right:1px solid #999; padding:0;"><input type="text" id="cb_r30_bot_u_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="border-right:1px solid #999; padding:0;"><input type="text" id="cb_r30_bot_v_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                    <td style="padding:0;"><input type="text" id="cb_r30_bot_w_${rowId}" ${disabledAttr} style="width:100%;height:22px;border:none;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;"></td>
                                                </tr>
                                            </table>
                                        </td>
                                        <td style="border:1px solid #333; padding:0; vertical-align:middle;"><input type="text" id="cb_r30_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r30')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r30')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r30" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r30')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 31: Spreader beam to be placed at every location -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">31</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Spreader beam to be placed at every location<br><span style="font-size:9px;color:#555;">(The spreader beam between 2 adjacent limbs, Top HV to LV yoke clamp 1 no for every 2limb)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Specified Value</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r31_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r31_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r31')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r31')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r31" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r31')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Section Header: Isolation Test of Core Assembly -->
                                    <tr>
                                        <td colspan="8" style="border:1px solid #333; padding:6px 10px; font-weight:bold; background:#e8e8e8; text-align:center; font-size:11px;">Isolation Test of Core Assembly</td>
                                    </tr>

                                    <!-- Row 32: Between Btm. HV & Btm LV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">32</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Btm. HV & Btm LV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r32_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r32_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r32_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r32').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r32').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r32" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r32')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r32_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r32_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r32_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 33: Between core & Btm.HV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">33</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between core & Btm.HV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r33_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r33_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r33_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r33').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r33').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r33" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r33')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r33_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r33_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r33_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 34: Between core & Btm. LV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">34</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between core & Btm. LV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r34_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r34_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r34_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r34').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r34').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r34" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r34')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r34_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r34_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r34_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 35: Between Top HV & Top LV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">35</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Top HV & Top LV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r35_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r35_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r35_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r35').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r35').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r35" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r35')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r35_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r35_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r35_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 36: Between core & Top HV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">36</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between core & Top HV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r36_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r36_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r36_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r36').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r36').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r36" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r36')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r36_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r36_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r36_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 37: Between core & Top. LV frame -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">37</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between core & Top. LV frame</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r37_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r37_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r37_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r37').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r37').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r37" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r37')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r37_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r37_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r37_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 38: Between F1 & F2 -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">38</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between F1 & F2</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r38_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r38_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r38_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r38').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r38').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r38" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r38')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r38_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r38_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r38_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 39: Between F2 & F3 -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">39</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between F2 & F3</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r39_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r39_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r39_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r39').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r39').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r39" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r39')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r39_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r39_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r39_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 40: Between F3 & F4 -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">40</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between F3 &amp; F4</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r40_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r40_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r40_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r40').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r40').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r40" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r40')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r40_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r40_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r40_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 41: Between Basefeet 1 to core -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">41</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Basefeet 1 to core</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r41_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r41_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r41_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r41').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r41').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r41" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r41')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r41_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r41_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r41_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 42: Between Basefeet 2 to core -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">42</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Basefeet 2 to core</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r42_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r42_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r42_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r42').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r42').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r42" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r42')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r42_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r42_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r42_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 43: Between Basefeet 3 to core -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">43</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Basefeet 3 to core</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r43_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r43_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r43_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r43').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r43').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r43" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r43')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r43_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r43_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r43_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 44: Between Basefeet 4 to core -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">44</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Basefeet 4 to core</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r44_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r44_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r44_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r44').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r44').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r44" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r44')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r44_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r44_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r44_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 45: Between Basefeet 5 to core -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">45</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Between Basefeet 5 to core</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2kV AC<input type="text" id="cb_r45_sv_ac_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">mA</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r45_ac_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r45_ac_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r45').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r45').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r45" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r45')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; vertical-align:middle;"><div style="display:flex;align-items:center;gap:2px;white-space:nowrap;">2.5kV DC<input type="text" id="cb_r45_sv_dc_${rowId}" ${disabledAttr} style="width:45px;height:20px;border:1px solid #ccc;padding:2px;font-size:9px;background:transparent;box-sizing:border-box;">Ω</div></td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r45_dc_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r45_dc_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                    <!-- Row 46: Final Isolation Test Core & Frame -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">46</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Final Isolation Test Core &amp; Frame<br><span style="font-size:9px;color:#555;">(All ducts &amp; all phases shorted)</span></td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Test</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r46_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Ok">Ok</option><option value="Not Ok">Not Ok</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r46_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r46')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r46')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r46" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r46')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 47: Core Clean & free from damage -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">47</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Core Clean &amp; free from damage</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Visual</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r47_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r47_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r47')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r47')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r47" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r47')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 48: Final inspection of core assembly & release for next process -->
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">48</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Final inspection of core assembly &amp; release for next process</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">Visual</td>
                                        <td style="border:1px solid #333; padding:0; height:36px;">
                                            <select id="cb_r48_av_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;">
                                                <option value="">Select</option><option value="Yes">Yes</option><option value="No">No</option>
                                            </select>
                                        </td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r48_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        ${cbSsCell.replace(/{{ID}}/g, 'r48')}
                                        ${cbQiCell.replace(/{{ID}}/g, 'r48')}
                                        <td style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r48" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r48')">💾 Save</button>` : ''}</td>
                                    </tr>

                                    <!-- Row 49: Received weight & Unused weight of CRGO lamination -->
                                    <tr>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">49</td>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Received weight of CRGO lamination (kg)</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">kg</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r49_recv_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r49_recv_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbSsCell.replace(/{{ID}}/g, 'r49').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:0; vertical-align:middle;">${cbQiCell.replace(/{{ID}}/g, 'r49').replace(/<td[^>]*>/, '').replace(/<\/td>/, '')}</td>
                                        <td rowspan="2" style="border:1px solid #333; padding:4px; text-align:center; vertical-align:middle;">${!isCustomer ? `<button class="btn-login" id="save_${rowId}_r49" style="width:auto;padding:4px 8px;font-size:10px;background:var(--green);" onclick="saveNewChecklistItem('${stage}',${itemCounter},'${rowId}_r49')">💾 Save</button>` : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style="border:1px solid #333; padding:4px 8px; vertical-align:middle;">Unused weight of CRGO lamination (kg)</td>
                                        <td style="border:1px solid #333; padding:3px 5px; font-size:9px; color:#555; vertical-align:middle;">kg</td>
                                        <td style="border:1px solid #333; padding:0; height:28px;"><input type="text" id="cb_r49_unused_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                        <td style="border:1px solid #333; padding:0;"><input type="text" id="cb_r49_unused_op_${rowId}" ${disabledAttr} style="width:100%;height:100%;border:none;padding:3px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                                    </tr>

                                </tbody>
                            </table>
                            <!-- Notes footer -->
                            <div style="border:1px solid #333; border-top:none; padding:6px 10px; font-size:9px; color:#555;">
                                <strong>Note:</strong><br>
                                1)* Insulation thickness, stack thickness to be measured with vernier caliper rest all dimensions are to be measured with measuring tape.<br>
                                2) ** indicates check points of Q.C.
                            </div>
                            <div style="border:1px solid #333; border-top:none; padding:4px 10px; font-size:9px; color:#555; text-align:right;">
                                Page1
                            </div>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;

            } else if (item.type === 'hi-lo-gap-table') {

                // Section 6: Diameter of Hi Lo gap wraps of coil - exact physical document layout
                const coilGroups = [
                    { name: 'Coil 1', rows: 5 },
                    { name: 'Coil 2', rows: 9 },
                    { name: 'Coil 3', rows: 9 },
                    { name: 'Coil 4', rows: 6 }
                ];
                const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

                const tableRows = coilGroups.map((coil, coilIdx) => {
                    const dataRows = [...Array(coil.rows)].map((_, rowIdx) => `
                        <tr>
                            <td style="border: 1px solid #333; padding: 2px 4px; font-size: 10px; text-align: center;">${romanNumerals[rowIdx]}</td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_partno" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_strip_drg" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_strip_used" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_cyl_drg" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_cyl_used" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_asperdrg" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_dia" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;"><input type="text" id="hilo_${rowId}_${coilIdx}_${rowIdx}_actual" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px 4px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border: 1px solid #333; padding: 0; height: 26px;">
                                ${(isQuality || isAdmin) ? `<select id="hilo_${rowId}_${coilIdx}_${rowIdx}_qa" ${disabledAttr} style="width:100%;height:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"><option value="">-- Select --</option><option value="Inspector 1">Inspector 1</option><option value="Inspector 2">Inspector 2</option></select>` : '<span style="font-size:10px;text-align:center;display:block;padding:4px;">-</span>'}
                            </td>
                        </tr>
                    `).join('');

                    const saveBtnCoil = !isCustomer ? `
                        <button class="btn-login"
                                id="save_${rowId}_coil_${coilIdx}"
                                style="width:auto; padding:4px 10px; font-size:11px; background: var(--green); float:right; margin-bottom:4px;"
                                onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                            💾 Save ${coil.name}
                        </button>
                    ` : '';

                    return `
                        <tr style="background:#f5f5f5;">
                            <td colspan="10" style="border:1px solid #333; padding:4px 8px; font-weight:bold; font-size:11px;">
                                ${coil.name}
                                ${saveBtnCoil}
                            </td>
                        </tr>
                        ${dataRows}
                    `;
                }).join('');

                customRowHTML = `
                    <tr id="${rowId}" style="border-bottom: none;">
                        <td style="font-weight: bold; vertical-align: top; padding: 6px;">${itemCounter}</td>
                        <td style="font-weight: bold; vertical-align: top; padding: 6px;">${item.point}</td>
                        <td colspan="6" style="border-bottom: none; padding: 4px 6px;">&nbsp;</td>
                        <td></td>
                    </tr>
                    <tr style="border-top: none;">
                        <td colspan="9" style="padding: 0; border-top: none;">
                            <table style="width: 100%; border-collapse: collapse; border: 1px solid #333; font-size: 10px; margin: 0;">
                                <thead>
                                    <tr style="background: #f9f9f9;">
                                        <th style="border:1px solid #333; padding:5px 4px; width:30px; text-align:center;">S.No</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Part No.</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Strip Drg No.</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Strip Used</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Cyl Drg No.</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Cyl Used</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">As Per Drg</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Dia</th>
                                        <th style="border:1px solid #333; padding:5px 4px; text-align:center;">Actual</th>
                                        <th style="border:1px solid #333; padding:5px 4px; width:100px; text-align:center;">Sign of Quality</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${tableRows}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'remarks-lines') {
                // Remarks (If Any) — 7 full-width dotted lines matching paper form
                const lines = Array.from({ length: 7 }, () =>
                    '<div style="border-bottom:1.5px dotted #888;height:22px;width:100%;"></div>'
                ).join('');
                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="7" style="padding:12px 16px 14px 16px; border:1px solid #333; background:#fff;">
                            <div style="position:relative;">
                                <span style="font-size:12px;font-weight:600;color:#333;position:absolute;top:0;left:0;line-height:22px;">Remarks (If Any)</span>
                                <div style="margin-left:0;">${lines}</div>
                            </div>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;
            } else if (item.type === 'brazed-joints-table') {
                // Row 36: Details of brazed joints - per-row save + QA supervisor dropdown
                const qualitySupervisors = ['-- Select --', 'Inspector 1', 'Inspector 2', 'Inspector 3'];
                const brazedRows = [...Array(10)].map((_, i) => {
                    const brazedRowId = `${rowId}_bj_${i}`;
                    const savePerRow = !isCustomer ? `
                        <button class="btn-login" id="save_${brazedRowId}"
                                style="width:auto;padding:2px 8px;font-size:9px;background:var(--green);"
                                onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${brazedRowId}')">
                            💾
                        </button>
                    ` : '';
                    const qaDropdown = (isQuality || isAdmin) ? `
                        <select id="braze_qa_${rowId}_${i}" ${disabledAttr}
                                style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;">
                            ${qualitySupervisors.map(s => `<option value="${s === '-- Select --' ? '' : s}">${s}</option>`).join('')}
                        </select>
                    ` : '<span style="font-size:10px;">-</span>';

                    return `
                        <tr>
                            <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;">${i + 1}</td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="braze_disc_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="braze_check_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="braze_date_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="braze_brazor_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;">${qaDropdown}</td>
                            <td style="border:1px solid #333;padding:3px;text-align:center;width:36px;">${savePerRow}</td>
                        </tr>
                    `;
                }).join('');

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #333;">
                                <thead>
                                    <tr style="background:#f0f0f0;">
                                        <td colspan="7" style="border:1px solid #333;padding:5px 8px;font-weight:bold;font-size:11px;">
                                            ${itemCounter}&nbsp;&nbsp;Details of brazed joints
                                        </td>
                                    </tr>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333;padding:5px 4px;width:36px;text-align:center;">S.no.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Brazed joint at Disc/Turn No.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">check Brazing joint finishing, No Sharp surface</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Date/<br>Shift</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Sign of<br>Brazor</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Sign of Quality</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;width:36px;">Save</th>
                                    </tr>
                                </thead>
                                <tbody>${brazedRows}</tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;

            } else if (item.type === 'shield-preparation-table') {
                // Row 37: Details of Shield end Preparation and placement — per-row save + QA supervisor
                const qualitySupervisors37 = ['-- Select --', 'Inspector 1', 'Inspector 2', 'Inspector 3'];
                const shieldRows = [...Array(10)].map((_, i) => {
                    const shieldRowId = `${rowId}_sh_${i}`;
                    const savePerRow = !isCustomer ? `
                        <button class="btn-login" id="save_${shieldRowId}"
                                style="width:auto;padding:2px 8px;font-size:9px;background:var(--green);"
                                onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${shieldRowId}')">
                            💾
                        </button>
                    ` : '';
                    const qaDropdown37 = (isQuality || isAdmin) ? `
                        <select id="shield_qasign_${rowId}_${i}" ${disabledAttr}
                                style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;">
                            ${qualitySupervisors37.map(s => `<option value="${s === '-- Select --' ? '' : s}">${s}</option>`).join('')}
                        </select>
                    ` : '<span style="font-size:10px;">-</span>';

                    return `
                        <tr>
                            <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;">${i + 1}</td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="shield_disc_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="shield_seg_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="shield_date_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="shield_opsign_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                            <td style="border:1px solid #333;padding:4px 6px;">${qaDropdown37}</td>
                            <td style="border:1px solid #333;padding:3px;text-align:center;width:36px;">${savePerRow}</td>
                        </tr>
                    `;
                }).join('');

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #333;">
                                <thead>
                                    <tr style="background:#f0f0f0;">
                                        <td colspan="7" style="border:1px solid #333;padding:5px 8px;font-weight:bold;font-size:11px;">
                                            ${itemCounter}&nbsp;&nbsp;Details of Shield end Preparation and placement.
                                        </td>
                                    </tr>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333;padding:5px 4px;width:36px;text-align:center;" rowspan="2">S.no.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;" rowspan="2">Disc Number.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;" rowspan="2">Segment number and marking on conductor</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;" rowspan="2">Date/<br>Shift</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Sign of</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Sign of</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;width:36px;" rowspan="2">Save</th>
                                    </tr>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">operators</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Quality</th>
                                    </tr>
                                </thead>
                                <tbody>${shieldRows}</tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;


            } else if (item.type === 'drum-details-table') {
                // Row 38: Drum Details and Vender name
                const drumRows = [...Array(10)].map((_, i) => `
                    <tr>
                        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;">${i + 1}</td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="drum_bobbin_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="drum_vendor_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="drum_length_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="drum_dir_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="drum_opsign_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                    </tr>
                `).join('');

                const drumSaveBtn = !isCustomer ? `
                    <button class="btn-login" id="save_${rowId}"
                            style="width:auto;padding:6px 14px;font-size:11px;background:var(--green);float:right;margin-bottom:6px;"
                            onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                        💾 Save Drum Data
                    </button>
                ` : '';

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            ${drumSaveBtn}
                            <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #333;">
                                <thead>
                                    <tr style="background:#f0f0f0;">
                                        <td colspan="6" style="border:1px solid #333;padding:5px 8px;font-weight:bold;font-size:11px;">
                                            ${itemCounter}&nbsp;&nbsp;Drum Details and Vender name
                                        </td>
                                    </tr>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333;padding:5px 4px;width:36px;text-align:center;">S.no.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Bobbin no.</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Vender</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Drum length</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Direction</th>
                                        <th style="border:1px solid #333;padding:5px 4px;text-align:center;">Operator Sign &amp; date</th>
                                    </tr>
                                </thead>
                                <tbody>${drumRows}</tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;

            } else if (item.type === 'observation-table') {
                // Observations + Winding cleared footer
                const obsRows = [...Array(5)].map((_, i) => `
                    <tr>
                        <td style="border:1px solid #333;padding:4px 6px;text-align:center;font-size:10px;width:36px;">${i + 1}</td>
                        <td style="border:1px solid #333;padding:4px 6px;"><input type="text" id="obs_detail_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                        <td style="border:1px solid #333;padding:4px 6px;width:160px;"><input type="text" id="obs_sign_${rowId}_${i}" ${disabledAttr} style="width:100%;border:none;padding:2px;font-size:10px;background:transparent;box-sizing:border-box;"></td>
                    </tr>
                `).join('');

                const obsSaveBtn = !isCustomer ? `
                    <button class="btn-login" id="save_${rowId}"
                            style="width:auto;padding:6px 14px;font-size:11px;background:var(--green);float:right;margin-bottom:6px;"
                            onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                        💾 Save
                    </button>
                ` : '';

                customRowHTML = `
                    <tr id="${rowId}">
                        <td colspan="8" style="padding:0;">
                            ${obsSaveBtn}
                            <table style="width:100%;border-collapse:collapse;font-size:10px;border:1px solid #333;margin-bottom:0;">
                                <thead>
                                    <tr style="background:#e8e8e8;">
                                        <th style="border:1px solid #333;padding:5px 4px;width:36px;text-align:center;">S.no.</th>
                                        <th style="border:1px solid #333;padding:5px 8px;text-align:center;">Details of observation/Nonconfirmity or balance work</th>
                                        <th style="border:1px solid #333;padding:5px 8px;text-align:center;width:160px;">Sign &amp; date</th>
                                    </tr>
                                </thead>
                                <tbody>${obsRows}</tbody>
                            </table>
                            <table style="width:100%;border-collapse:collapse;font-size:11px;border:1px solid #333;border-top:none;margin-top:0;">
                                <tbody>
                                    <tr>
                                        <td style="border:1px solid #333;padding:8px 12px;font-weight:bold;font-size:12px;width:60%;text-align:center;">Winding cleared for Next Stage</td>
                                        <td style="border:1px solid #333;padding:8px 12px;font-size:10px;text-align:center;">
                                            <strong>Sign of QA</strong><br>
                                            <input type="text" id="obs_qa_sign_${rowId}" ${disabledAttr} placeholder="Name / Date" style="width:100%;border:none;border-bottom:1px dotted #333;padding:2px;font-size:10px;margin-top:4px;background:transparent;">
                                        </td>
                                    </tr>
                                    <tr style="background:#f5f5f5;">
                                        <td style="border:1px solid #333;padding:5px 8px;font-size:10px;">
                                            <strong>Format Prepared By</strong>&nbsp;&nbsp;Indrapal sahu
                                        </td>
                                        <td style="border:1px solid #333;padding:5px 8px;font-size:10px;text-align:right;">
                                            <strong>Format Review By</strong>&nbsp;&nbsp;Sunil Kumar Rai
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
                checklistHTML += customRowHTML;
                return;

            } else if (item.type === 'final-signoff') {

                // Final sign-off section
                specifiedValueCell = `
                    <div style="font-size: 10px; padding: 8px; border: 1px solid #333;">
                        <div style="margin-bottom: 4px;"><strong>Format Prepared By:</strong> Indrapai sahu</div>
                        <div><strong>Format Review By:</strong> Sunil Kumar Rai</div>
                    </div>
                    `;

                actualValueCell = `
                    <div style="font-size: 11px; padding: 8px; text-align: center; border: 1px solid #333;">
                        <strong>Winding cleared for Next Stage</strong>
                    </div>
                    `;

                // Custom QA Cell (Sign of QA Name/Date)
                qaSupCell = `
                    <div style="border: 1px solid #333; padding: 8px;">
                        <div style="font-weight: bold; font-size: 10px; margin-bottom: 4px;">Sign of QA</div>
                        <div style="margin-bottom: 4px;">
                            <label style="font-size: 9px;">Name:</label>
                            <input type="text" id="final_qa_name_${rowId}" ${disabledAttr} style="width: 100%; border: 1px solid #ccc; padding: 2px; font-size: 10px; margin-top: 2px;">
                        </div>
                        <div>
                            <label style="font-size: 9px;">Date:</label>
                            <input type="text" id="final_qa_date_${rowId}" ${disabledAttr} style="width: 100%; border: 1px solid #ccc; padding: 2px; font-size: 10px; margin-top: 2px;">
                        </div>
                    </div>
                    `;

                technicianCell = '<span style="font-size: 10px; text-align: center; display: block;">-</span>';
                shopSupCell = '<span style="font-size: 10px; text-align: center; display: block;">-</span>';
                remarkCell = '<span style="font-size: 10px; text-align: center; display: block;">-</span>';
            } else {
                // Default: regular text input
                actualValueCell = `
                    <input type="text"
                           id="actualValue_${rowId}"
                           ${disabledAttr}
                           placeholder="Enter value"
                           style="width: 100%; padding: 5px; border: 1px solid #ddd; border-radius: 3px;">
                    `;
            }

            // Set default sign-off cells if not already set by custom logic
            if (!technicianCell) {
                technicianCell = !isCustomer ? `
                    <input type="text"
                           id="technician_${rowId}"
                           ${disabledAttr}
                           placeholder="Name"
                           style="width: 100%; padding: 4px; font-size: 10px; border: 1px solid #ddd; margin-bottom: 3px;">
                    <small id="techTime_${rowId}" style="font-size: 9px; color: #666; display: block;"></small>
                ` : '<span style="font-size: 10px; text-align: center; display: block;">-</span>';
            }

            if (!shopSupCell) {
                if (isProduction) {
                    const _ssName = window.currentUserName || '';
                    shopSupCell = `
                        <div style="font-size:10px; font-weight:bold; padding:4px 2px; background:#f0fff0; border-radius:3px; text-align:center;">${_ssName}</div>
                        <input type="hidden" id="shopSup_${rowId}" value="${_ssName}">
                        <small id="shopSupTime_${rowId}" style="font-size:9px; color:#666; display:block;"></small>
                    `;
                } else if (isAdmin) {
                    shopSupCell = `
                        <input type="text" id="shopSup_${rowId}" readonly
                               placeholder="—"
                               style="width:100%; padding:4px; font-size:10px; border:1px solid #ddd; border-radius:3px; background:#f5f5f5; color:#333; margin-bottom:3px; cursor:default;">
                        <small id="shopSupTime_${rowId}" style="font-size:9px; color:#666; display:block;"></small>
                    `;
                } else {
                    shopSupCell = '<span style="font-size:10px; text-align:center; display:block;">-</span>';
                }
            }

            if (!qaSupCell) {
                if (isQuality) {
                    const _qaName = window.currentUserName || '';
                    qaSupCell = `
                        <div style="font-size:10px; font-weight:bold; padding:4px 2px; background:#f0f8ff; border-radius:3px; text-align:center;">${_qaName}</div>
                        <input type="hidden" id="qaSup_${rowId}" value="${_qaName}">
                        <small id="qaSupTime_${rowId}" style="font-size:9px; color:#666; display:block;"></small>
                    `;
                } else if (isAdmin) {
                    qaSupCell = `
                        <input type="text" id="qaSup_${rowId}" readonly
                               placeholder="—"
                               style="width:100%; padding:4px; font-size:10px; border:1px solid #ddd; border-radius:3px; background:#f5f5f5; color:#333; margin-bottom:3px; cursor:default;">
                        <small id="qaSupTime_${rowId}" style="font-size:9px; color:#666; display:block;"></small>
                    `;
                } else {
                    qaSupCell = '<span style="font-size:10px; text-align:center; display:block;">-</span>';
                }
            }

            if (!remarkCell) {
                // Tanking stage uses simple text input for remarks
                if (stage === 'tanking') {
                    remarkCell = `
                    <input type="text"
                           id="remark_${rowId}"
                           ${disabledAttr}
                           placeholder="Optional"
                           style="width: 100%; padding: 5px; font-size: 11px; border: 1px solid #ddd; border-radius: 3px;">
                    `;
                } else {
                    remarkCell = `
                    <textarea id="remark_${rowId}"
                              ${disabledAttr}
                              placeholder="Optional"
                              style="width: 100%; height: 50px; padding: 4px; border: 1px solid #ddd; font-size: 10px; resize: none;"></textarea>
                    `;
                }
            }


            checklistHTML += `
                    <tr id="${rowId}">
                    <td>${itemCounter}</td>
                    <td>${item.pointPrefixInput ? `<input type="text" id="pointPrefix_${rowId}" ${disabledAttr} placeholder="" style="width: 80px; padding: 3px 5px; border: 1px solid #aaa; border-radius: 3px; font-size: 11px; margin-right: 4px;">` : ''}${item.point}</td>
                    <td style="font-size: 11px; color: #555;">${specifiedValueCell}</td>
                    ${stage === 'tanking' ? actualValueCell : `<td>${actualValueCell}</td>`}
                    <td style="padding: 0;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; height: 100%; border-collapse: collapse;">
                            <div style="border-right: 1px solid #ddd; padding: 8px;">
                                <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px; text-align: center;">Technician</div>
                                ${technicianCell}
                            </div>
                            <div style="border-right: 1px solid #ddd; padding: 8px;">
                                <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px; text-align: center;">Shop Supervisor</div>
                                ${shopSupCell}
                            </div>
                            <div style="padding: 8px;">
                                <div style="font-size: 10px; font-weight: bold; margin-bottom: 5px; text-align: center;">Quality Supervisor</div>
                                ${qaSupCell}
                            </div>
                        </div>
                    </td>
                    <td style="padding: 8px;">
                        ${remarkCell}
                    </td>
                    <td style="text-align: center; padding: 6px;">
                        ${!isCustomer ? `
                            <button class="btn-login"
                                    id="save_${rowId}"
                                    style="width:auto; padding:6px 10px; font-size:11px; background: var(--green); margin-bottom: 5px;"
                                    onclick="saveNewChecklistItem('${stage}', ${itemCounter}, '${rowId}')">
                                🔄 Update
                            </button>
                            ${isAdmin ? `<br>
                                <button class="btn-login"
                                        id="lock_${rowId}"
                                        style="width:auto; padding:6px 10px; font-size:11px; background: #e74c3c; margin-top: 5px; display: none;"
                                        onclick="showRowLockDialog('${rowId}')">
                                    🔒 Lock Row
                                </button>
                                <br>
                                <button class="btn-login"
                                        id="rowUnlock_${rowId}"
                                        style="width:auto; padding:6px 10px; font-size:11px; background: #3498db; margin-top: 5px; display: none;"
                                        onclick="showRowUnlockDialog('${rowId}')">
                                    🔓 Unlock Row
                                </button>
                            ` : ''}
                        ` : ''}
                    </td>
                </tr>
                    `;
        });

        checklistHTML += `
                </tbody>
            </table>
                    `;
    });
    // Render final content
    content.innerHTML = `
                    <h3>${stageInfo.title}</h3>
                        ${stageInfo.subtitle ? `<p style="color: #666; font-size: 14px; margin-bottom: 20px;">${stageInfo.subtitle}</p>` : ''}
        
        <button class="btn-login" 
                style="width:auto; padding:10px 20px; font-size:14px; background:var(--red); margin:15px 0;" 
                onclick="exportStageChecklistPDF('${stage}')">
            Download ${stageInfo.title} PDF
        </button>
        
        <div class="checklist-paper" id="stageChecklist_${stage}">
            <h2 style="text-align:center; margin-bottom: 20px;">${stageInfo.title.toUpperCase()}</h2>
            
            <table class="form-table" style="margin-bottom: 15px;">
                <tr>
                    <td><strong>W.O. No:</strong> <input type="text" id="stageWONo_${stage}" readonly value="${window.currentWO || ''}" style="border:none; border-bottom:1px dotted #000; width:200px; background:transparent;"></td>
                    <td><strong>Date:</strong> <input type="date" id="stageDate_${stage}" ${disabledAttr} value="${new Date().toISOString().split('T')[0]}" style="border:none; border-bottom:1px dotted #000;"></td>
                </tr>
            </table>
            
            ${checklistHTML}
        </div>
                `;
}
/* ===============================
   PDF EXPORT
================================ */
function exportStageChecklistPDF(stage) {
    if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
        alert('ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â PDF libraries not loaded. Please refresh the page.');
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');

    const element = document.getElementById(`stageChecklist_${stage} `);
    if (!element) {
        alert('ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Checklist content not found!');
        return;
    }

    html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        doc.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
        doc.save(`${stage}_Checklist_${window.currentWO || 'draft'}.pdf`);
    });
}
// ========================================
// AUDIT LOG UI FUNCTIONS
// ========================================
function loadAuditLogs() {
    const entity = document.getElementById('auditEntity').value;
    const entityId = document.getElementById('auditEntityId').value;
    const startDate = document.getElementById('auditStartDate').value;
    const endDate = document.getElementById('auditEndDate').value;

    const resultsDiv = document.getElementById('auditResults');
    resultsDiv.innerHTML = '<p style="text-align:center; color:#666;">Loading audit logs...</p>';

    getAuditLogs(entity, entityId, startDate, endDate)
        .then(response => {
            if (response.success) {
                renderAuditTable(response.data);
            } else {
                resultsDiv.innerHTML = `< p style = "color:red;" > Error: ${response.error}</p > `;
            }
        })
        .catch(error => {
            resultsDiv.innerHTML = `< p style = "color:red;" > Error loading logs: ${error.message}</p > `;
        });
}

function renderAuditTable(logs) {
    const resultsDiv = document.getElementById('auditResults');

    if (!logs || logs.length === 0) {
        resultsDiv.innerHTML = `
                    < div style = "text-align:center; padding:40px; color:#666;" >
                <h3>Ãƒ&deg;Ã…Â¸Ã¢â‚¬Å“Ã‚Â­ No Audit Logs Found</h3>
                <p>Try adjusting your filters or check back later.</p>
            </div >
                    `;
        return;
    }
    const tableHTML = `
                    < div style = "margin-bottom: 15px; color: #666;" >
                        <strong>Total Logs:</strong> ${logs.length}
        </div >
                    <div style="overflow-x: auto;">
                        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <thead>
                                <tr style="background: #34495e; color: white;">
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Timestamp</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">User</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Role</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Action</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Entity</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Entity ID</th>
                                    <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Changes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => `
                        <tr style="border-bottom: 1px solid #ddd;">
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                ${new Date(log.timestamp).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                <strong>${log.username}</strong>
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                <span class="role-badge role-${log.role}">${log.role}</span>
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                <span style="
                                    padding: 4px 8px; 
                                    border-radius: 4px; 
                                    font-size: 12px; 
                                    font-weight: bold;
                                    background: ${getActionColor(log.action)};
                                    color: white;
                                ">${log.action}</span>
                            </td>
                            <td style="padding: 12px; border: 1px solid #ddd;">${log.entity}</td>
                            <td style="padding: 12px; border: 1px solid #ddd;"><code>${log.entityId}</code></td>
                            <td style="padding: 12px; border: 1px solid #ddd;">
                                <details>
                                    <summary style="cursor: pointer; color: #3498db;">View Details</summary>
                                    <pre style="
                                        background: #f8f9fa; 
                                        padding: 10px; 
                                        border-radius: 4px; 
                                        margin-top: 10px;
                                        max-height: 200px;
                                        overflow: auto;
                                        font-size: 11px;
                                    ">${JSON.stringify(log.changes, null, 2)}</pre>
                                </details>
                            </td>
                        </tr>
                    `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;

    resultsDiv.innerHTML = tableHTML;
}

function getActionColor(action) {
    const colors = {
        'CREATE': '#27ae60',
        'UPDATE': '#3498db',
        'DELETE': '#e74c3c',
        'APPROVE': '#16a085',
        'REJECT': '#c0392b'
    };
    return colors[action] || '#95a5a6';
}

function clearAuditFilters() {
    document.getElementById('auditEntity').value = '';
    document.getElementById('auditEntityId').value = '';
    document.getElementById('auditStartDate').value = '';
    document.getElementById('auditEndDate').value = '';
    document.getElementById('auditResults').innerHTML = '';
}

// Show audit log menu item only for admin/quality roles
function initializeAuditAccess() {
    const userRole = window.currentUserRole; // ÃƒÂ¢Ã¢â‚¬Â Ã‚Â CHANGED from localStorage
    const auditNav = document.getElementById('auditLogNav');
    const questionsNav = document.getElementById('questionsNav');

    if (auditNav && (userRole === 'admin' || userRole === 'quality')) {
        auditNav.style.display = 'block';
    }
    // Show Questions nav for admin only
    if (questionsNav && userRole === 'admin') {
        questionsNav.style.display = 'block';
    }
}

// Removed duplicate minimal loadStageContent - using the full implementation above (lines 318-699)

// Call this when user logs in (add to existing login success handler)
// Add this line in your existing authentication success code:
// initializeAuditAccess();

// Export to window
window.showTab = showTab;
window.toggleSubmenu = toggleSubmenu;
window.showChecklistStage = showChecklistStage;
window.showMainStage = showMainStage;
window.switchStage = switchStage;
window.loadStageContent = loadStageContent;
window.exportStageChecklistPDF = exportStageChecklistPDF;
// Add to window exports (at the end of ui.js):
window.initializeAuditAccess = initializeAuditAccess;
window.loadAuditLogs = loadAuditLogs;
window.renderAuditTable = renderAuditTable;
window.clearAuditFilters = clearAuditFilters;

/* ===============================
   QUESTIONS MANAGEMENT – MCQ System
================================ */

let _allQuestions = [];
let _currentQFilter = 'all';

// ── Tab switcher ──────────────────────────────────────────────────────────────
function switchQTab(tab) {
    ['bank', 'add', 'links', 'results'].forEach(t => {
        const p = document.getElementById(`qpanel-${t}`);
        if (p) p.style.display = (t === tab) ? 'block' : 'none';
    });
    if (tab === 'bank') loadQuestions();
    if (tab === 'links') renderExamLinks();
    if (tab === 'results') loadExamResults();
}

// ── Section filter ────────────────────────────────────────────────────────────
function filterQSection(section) {
    _currentQFilter = section;
    renderQuestionList();
}

// ── Load all questions from server ────────────────────────────────────────────
async function loadQuestions() {
    const container = document.getElementById('questionsList');
    if (!container) return;
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

    const SECTION_COLOR = { winding: '#7c3aed', core: '#0ea5e9', tanking: '#f59e0b' };
    const SECTION_LABEL = { winding: 'Winding', core: 'Core Building', tanking: 'Tanking' };

    let html = `<table style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead><tr>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left; width:40px;">#</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Question</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:110px;">Section</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:left;">Options (A/B/C/D)</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Answer</th>
            <th style="border:1px solid #ddd; padding:10px; background:#f5f5f5; text-align:center; width:80px;">Delete</th>
        </tr></thead><tbody>`;

    filtered.forEach((q, i) => {
        const color = SECTION_COLOR[q.section] || '#333';
        const label = SECTION_LABEL[q.section] || q.section;
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

// ── Render exam links panel ───────────────────────────────────────────────────
async function renderExamLinks() {
    const container = document.getElementById('examLinksContainer');
    if (!container) return;

    container.innerHTML = '<p style="color:#999; text-align:center; padding:20px;">Loading network info...</p>';

    // Fetch LAN IP from server
    let lanBase = null;
    try {
        const r = await fetch('/api/server-ip');
        const d = await r.json();
        lanBase = d.base; // e.g. http://10.1.19.69:3000
    } catch {} /* fall back to location.origin */

    // Fetch public tunnel URL (from start-public.ps1 / cloudflared)
    let publicBase = null;
    try {
        const pr = await fetch('/api/public-url');
        const pd = await pr.json();
        if (pd.active && pd.url) publicBase = pd.url;
    } catch {} /* no tunnel active */

    const localhostBase = window.location.origin;
    const phoneBase = lanBase || localhostBase; // prefer LAN IP for phone links

    const SECTIONS = [
        { key: 'winding', label: 'Winding', color: '#7c3aed', icon: '🔧' },
        { key: 'core', label: 'Core Building', color: '#0ea5e9', icon: '🏗' },
        { key: 'tanking', label: 'Tanking', color: '#f59e0b', icon: '🛢' }
    ];

    const QR_API = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

    container.innerHTML = `
        ${publicBase ? `
        <div style="background:#f0fdf4; border:2px solid #86efac; border-radius:10px; padding:14px 18px; margin-bottom:14px; font-size:13px;">
            🌐 <strong>Public Internet Mode is ACTIVE!</strong> These links work on <strong>any phone, any WiFi, anywhere.</strong>
            <br><br>📡 Public URL: <code style="background:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">${publicBase}</code>
            &nbsp;&nbsp;<button class="btn-login" style="width:auto;padding:4px 12px;font-size:12px;background:#27ae60;" onclick="navigator.clipboard.writeText('${publicBase}').then(()=>alert('Copied!'))">📋 Copy</button>
        </div>` : ''}
        <div style="background:#e8f4fd; border:1px solid #b3d9f7; border-radius:10px; padding:14px 18px; margin-bottom:18px; font-size:13px;">
            📱 <strong>Same-WiFi links (always available):</strong> These work when the phone is on the <strong>same WiFi</strong> as this computer.
            ${lanBase
        ? `<br><br>✅ LAN link: <code style="background:#fff; padding:2px 8px; border-radius:4px; font-size:12px;">${lanBase}</code>`
        : '<br><br>⚠️ Could not detect LAN IP — showing localhost links (only work on this computer).'
}
        </div>
    ` + SECTIONS.map(s => {
        const qCount = _allQuestions.filter(q => q.section === s.key).length;
        const defaultCount = Math.min(3, qCount); // start with 3 or max available

        // All URLs include ?count= from the start
        const phoneUrl = `${phoneBase}/exam/${s.key}?count=${defaultCount}`;
        const publicUrl = publicBase ? `${publicBase}/exam/${s.key}?count=${defaultCount}` : null;
        const qrUrl = QR_API(publicUrl || phoneUrl);

        return `
        <div style="border:2px solid ${s.color}33; border-radius:12px; padding:20px; background:${s.color}08;" id="section-card-${s.key}">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:16px; flex-wrap:wrap;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:24px;">${s.icon}</span>
                    <div>
                        <div style="font-weight:700; font-size:16px; color:${s.color};">${s.label} Section Exam</div>
                        <div style="font-size:12px; color:#666;">${qCount} question${qCount === 1 ? '' : 's'} in bank</div>
                    </div>
                </div>
                <!-- Count setter -->
                <div style="display:flex; align-items:center; gap:8px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:8px 14px;">
                    <label style="font-size:12px; font-weight:600; color:#555; white-space:nowrap;">❓ Questions in exam:</label>
                    <input type="number" id="count-${s.key}" value="${defaultCount}" min="1" max="${qCount || 99}"
                        style="width:60px; padding:6px 8px; border:2px solid ${s.color}55; border-radius:8px; font-size:15px; font-weight:700; text-align:center; color:${s.color}; outline:none;"
                        oninput="updateExamCount('${s.key}', this.value, '${phoneBase}', ${publicBase ? `'${publicBase}'` : 'null'})"
                    >
                    <span style="font-size:11px; color:#999;">/ ${qCount} max</span>
                </div>
            </div>

            <div style="display:flex; gap:20px; align-items:flex-start; flex-wrap:wrap;">
                <!-- QR Code -->
                <div style="flex-shrink:0; text-align:center;" id="qr-wrap-${s.key}">
                    <img src="${qrUrl}" alt="QR Code" id="qr-img-${s.key}" style="width:160px;height:160px;border:3px solid ${publicUrl ? '#86efac' : s.color + '33'};border-radius:8px;display:block;">
                    <div style="font-size:11px; margin-top:6px; font-weight:600; color:${publicUrl ? '#16a34a' : '#666'};">${publicUrl ? '🌐 Public — scan from anywhere!' : '📷 Same WiFi only'}</div>
                    <button class="btn-login" style="width:auto;padding:5px 14px;font-size:12px;background:#475569;margin-top:8px;"
                        onclick="(function(k){ const el=document.getElementById('publink-'+k)||document.getElementById('link-'+k); if(!el)return; const url=el.value; const img=document.getElementById('qr-img-'+k); if(img){img.style.opacity='0.4'; img.src='https://api.qrserver.com/v1/create-qr-code/?size=160x160&data='+encodeURIComponent(url); img.onload=function(){img.style.opacity='1';};} })('${s.key}')">
                        🔄 Refresh QR
                    </button>
                </div>

                <!-- Link + buttons -->
                <div style="flex:1; min-width:200px; display:flex; flex-direction:column; gap:10px; justify-content:center;">
                    <div>
                        <div style="font-size:11px; font-weight:600; color:#444; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px;">📱 Phone / Network Link</div>
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <input type="text" value="${phoneUrl}" readonly id="link-${s.key}"
                                style="flex:1; min-width:160px; padding:9px 12px; border:1px solid #ddd; border-radius:8px; font-size:12px; background:#f8f8f8; font-family:monospace;">
                            <button class="btn-login" style="width:auto;padding:9px 16px;font-size:13px;background:${s.color};"
                                onclick="navigator.clipboard.writeText(document.getElementById('link-${s.key}').value).then(()=>alert('✅ Link copied! Paste it in the phone browser.'))">
                                📋 Copy
                            </button>
                            <button class="btn-login" style="width:auto;padding:9px 14px;font-size:13px;background:#27ae60;"
                                onclick="window.open(document.getElementById('link-${s.key}').value, '_blank')">
                                🚀 Open
                            </button>
                        </div>
                    </div>

                    ${publicBase ? `
                    <div style="margin-top:4px;">
                        <div style="font-size:11px; font-weight:600; color:#16a34a; margin-bottom:4px; text-transform:uppercase; letter-spacing:.5px;">🌐 Public Internet Link (any phone, any WiFi)</div>
                        <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                            <input type="text" value="${publicBase}/exam/${s.key}?count=${defaultCount}" readonly id="publink-${s.key}"
                                style="flex:1; min-width:160px; padding:8px 12px; border:2px solid #86efac; border-radius:8px; font-size:12px; background:#f0fdf4; font-family:monospace;">
                            <button class="btn-login" style="width:auto;padding:8px 14px;font-size:13px;background:#16a34a;"
                                onclick="navigator.clipboard.writeText(document.getElementById('publink-${s.key}').value).then(()=>alert('✅ Public link copied!'))">📋 Copy</button>
                            <button class="btn-login" style="width:auto;padding:8px 12px;font-size:13px;background:#0ea5e9;"
                                onclick="window.open(document.getElementById('publink-${s.key}').value, '_blank')">🚀 Open</button>
                        </div>
                    </div>` : `
                    <div style="font-size:12px; color:#666; background:#fffbeb; border:1px solid #fde68a; border-radius:6px; padding:8px 12px;">
                        💡 The phone must be on the <strong>same WiFi</strong> as this computer to use the link above.
                        <br>To share with <strong>any phone on any WiFi</strong>, run <code>start-public.ps1</code> from the project folder.
                    </div>`}
                </div>
            </div>
        </div>`;
    }).join('');
}

// ── Live-update link + QR when count changes ──────────────────────────────────
function updateExamCount(sectionKey, rawVal, phoneBase, publicBase) {
    const count = Math.max(1, parseInt(rawVal, 10) || 1);
    const QR_API = (url) => `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}`;

    const phoneUrl = `${phoneBase}/exam/${sectionKey}?count=${count}`;
    const publicUrl = publicBase ? `${publicBase}/exam/${sectionKey}?count=${count}` : null;
    const qrTarget = publicUrl || phoneUrl;

    // Update LAN link input
    const linkEl = document.getElementById(`link-${sectionKey}`);
    if (linkEl) linkEl.value = phoneUrl;

    // Update public link input + copy button
    const pubLinkEl = document.getElementById(`publink-${sectionKey}`);
    if (pubLinkEl && publicUrl) pubLinkEl.value = publicUrl;

    // Update QR code image
    const qrImg = document.getElementById(`qr-img-${sectionKey}`);
    if (qrImg) qrImg.src = QR_API(qrTarget);
}


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

        const SECTION_LABEL = { winding: 'Winding', core: 'Core Building', tanking: 'Tanking' };

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
window.renderExamLinks = renderExamLinks;
window.loadExamResults = loadExamResults;
window.viewAnswerKey = viewAnswerKey;
window.closeAnswerKey = closeAnswerKey;
window.updateExamCount = updateExamCount;

