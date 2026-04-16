/**
 * MASTER CHECKLIST DATA
 * Single source of truth for all inspection checklists and stage data
 * Used by all UI modules: ui.js, checklist-ui.js
 */

function getMasterStageData() {
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
        winding4: {
            title: 'WINDING - Additional Inspections',
            subtitle: 'Page 4 of 6',
            sections: [{
                name: 'D - General Inspections',
                items: [
                    { point: 'Brazed joints quality (Visual)', specifiedValue: 'No sharp edges, full penetration' },
                    { point: 'Insulation of brazed joints', specifiedValue: 'As per approved drawing' },
                    { point: 'Winding resistance at room temperature', specifiedValue: 'Record values per phase', editableSpecifiedValue: true },
                    { point: 'Verification of dimensional tolerances', specifiedValue: 'Within +/- 2mm' }
                ]
            }]
        },
        winding5: {
            title: 'WINDING - Final Clearance & Sign-off',
            subtitle: 'Page 5 of 6',
            sections: [{
                name: 'E - Final Checks Checklist',
                items: [
                    { point: 'Foreign material check / Cleanliness (Visual)', specifiedValue: 'No debris, dust and metal chips' },
                    { point: 'Spacers and block tightness', specifiedValue: 'Manually verified tight' },
                    { point: 'Final photographic evidence captured', specifiedValue: 'Photos saved to system' },
                    { point: 'Approval for next stage (Core Coil) readiness', specifiedValue: 'Cleared' }
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
                        { point: 'Clamping force for magnetic disc (Ton / Bar) in Shunt Reactors', specifiedValue: '', type: 'clamping-force-phases' },
                        { point: 'Clamping force for Winding (Ton / Bar)', specifiedValue: '', type: 'clamping-force-phases' },
                        { point: 'Final winding Height — 4 places / phase\nRecord in below sketch (Tolerance limit +/- 3.0 mm)', specifiedValue: '', type: 'coil-uvw-diagram' },
                        { point: 'Wedge inserting below top yoke', specifiedValue: 'As per Drg.', type: 'tanking-torque-row' },
                        { point: 'Locking of coil pressing Blocks', specifiedValue: 'As per Drg.', type: 'split-value' },
                        { point: 'Cleaning of the portion between Top platform and top yoke', specifiedValue: 'Clean', type: 'split-value' },
                        { point: 'Fibre Optic sensor connection', specifiedValue: 'Sr.No.', type: 'fos-connection-group', connections: ['Winding', 'Top Yoke', 'Return Limb', 'Top Oil'] },
                        { point: 'Setting of HV/IV main lead as per drawing', specifiedValue: 'As Per Drawing', type: 'tanking-torque-row' },
                        { point: 'Tightening of drain plug of OLTC', specifiedValue: 'Torque as per drawing', type: 'split-value' },
                        { point: 'Closure of all stress caps after completion of hardware tightening', specifiedValue: 'Stress caps shall be in closed condition', type: 'split-value' },
                        { point: 'Tightness of OLTC stress shield & conical nut with special tool', specifiedValue: 'Should be tight', type: 'split-value' },
                        { point: 'Physical verification in around & top of Active Part by Production Engineer', specifiedValue: 'Reqd', type: 'split-value' },
                        { point: 'Re-verification and Interlock Barricading with beacon light by Quality Test Operator', specifiedValue: 'Reqd', type: 'split-value' },
                        { point: 'Clearance between:\na) Tie In resistor lead to earth and other tap leads\nb) OLTC lead to earth and other tap leads', specifiedValue: '>Neutral to earth clearance', type: 'split-value' },
                        { point: 'Insulation resistance test\n(Before putting active part in tank)\nCore Shield, Core & Frame', specifiedValue: '2.5 kV DC application for 1 Min', type: 'resistance-test-row' },
                        { point: '2 Kv AC withstand test\n(Note: Leakage current values for reference purpose only)', specifiedValue: '2.0 kV AC shall withstand for 1 min', type: 'resistance-test-row' },
                        { point: 'Electrical Tests:\n- Magnetic balance test\n- Magnetic Current\n- Other Electrical Tests (If Any)', specifiedValue: 'Torque as per drawing', type: 'split-value' },
                        { point: 'Cleaning of Active parts', specifiedValue: 'Clean', type: 'visual-observed' }
                    ]
                },
                {
                    name: '6 — Tanking of Active Part',
                    items: [
                        {
                            point: 'Trial tanking dimensions',
                            specifiedValue: 'HV side: As per drg.\nLV Side: As per drg.',
                            type: 'tanking-torque-row'
                        },
                        {
                            point: 'Physical verification must be done around & top of the Tanking Part by the Production Engineer',
                            specifiedValue: 'Reqd',
                            type: 'split-value'
                        },
                        {
                            point: 'Re-verification and Interlock Barricading with beacon light must be done around & top of the Tanking by the Quality test Operator',
                            specifiedValue: 'Reqd',
                            type: 'split-value'
                        },
                        {
                            point: 'IR (Megger) test After putting active part in bottom tank. (2.5 kV DC application for 1 Min)',
                            specifiedValue: 'C-F: ......\nC-T: ......\nF-T: ......',
                            type: 'split-value'
                        },
                        {
                            point: 'Isolation test After putting top tank.\n(i) 2.5 kV DC for 1 Min — C-F / C-T / F-T\n(ii) 2 kV AC for 1 Min — C-F / C-T / F-T',
                            specifiedValue: 'C-F: ......\nC-T: ......\nF-T: ......',
                            type: 'split-value'
                        },
                        {
                            point: 'Insulation arrangement in bottom tank for Job placement',
                            specifiedValue: '',
                            type: 'single-merged'
                        },
                        {
                            point: 'Top tank fixing time / Dry air application time. Dew Point of dry air < (-40)',
                            specifiedValue: '',
                            type: 'single-merged'
                        },
                        {
                            point: 'Humidity inside tank',
                            specifiedValue: '< 60 %',
                            type: 'single-merged'
                        },
                        {
                            point: 'Check for sharp edges on crimped joints, if any',
                            specifiedValue: 'No sharp edges',
                            type: 'split-value'
                        },
                        {
                            point: 'Core, Frame, Tank & Core Shield earthing connection',
                            specifiedValue: 'Torque as per drawing',
                            type: 'split-value'
                        },
                        {
                            point: 'Fibre Optic sensor connection (Sr.No. / Ok / Not Ok)\n— Winding\n— Top Yoke\n— Return Limb\n— Top Oil',
                            specifiedValue: 'Sr.No. / Ok / Not Ok',
                            type: 'split-value'
                        },
                        {
                            point: 'OCTC Arrangement:\n- Synchronization\n- Shaft alignment\n- Shaft Insertion\n- Contact verification',
                            specifiedValue: 'Visual',
                            type: 'split-value'
                        },
                        {
                            point: 'Removal of ratchet belt & loose packing from OLTC',
                            specifiedValue: 'Visual',
                            type: 'split-value'
                        },
                        {
                            point: 'OLTC / OCTC Details',
                            specifiedValue: 'Type: ......\nSr. No: ......',
                            type: 'split-value'
                        },
                        {
                            point: 'Before assembly of OLTC diverter switch ensure it should be on normal tap no.',
                            specifiedValue: 'Tap Position No: ......',
                            type: 'split-value'
                        }
                    ]
                },
                {
                    name: 'Remarks (If Any)',
                    items: [
                        { point: '', specifiedValue: '', type: 'remarks-lines' }
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
        vpd: {
            title: 'VPD (Vapour Phase Drying) Checklist',
            subtitle: 'VPD Process Monitoring',
            sections: [{
                name: '1 - Pre-Drying Phase',
                items: [
                    { point: 'Chamber cleanliness and vacuum leak test', specifiedValue: 'Leak rate < acceptable limit' },
                    { point: 'Loading of active part & thermocouple placement', specifiedValue: 'Checked and recorded' }
                ]
            }, {
                name: '2 - Heating & Drying Phase',
                items: [
                    { point: 'Maximum temperature achieved', specifiedValue: 'As per process chart', editableSpecifiedValue: true },
                    { point: 'Heating duration', specifiedValue: 'Completed as per process', editableSpecifiedValue: true },
                    { point: 'Final vacuum pressure achieved', specifiedValue: 'Specify in mbar', editableSpecifiedValue: true }
                ]
            }]
        },
        tankFilling: {
            title: 'OIL FILLING CHECKLIST',
            subtitle: 'Tank Filling Operations',
            sections: [{
                name: '1 - Oil Filling Readiness',
                items: [
                    { point: 'Vacuum level before oil filling starts', specifiedValue: '< 1 Torr', editableSpecifiedValue: true },
                    { point: 'Oil BDV (Breakdown Voltage) test before filling', specifiedValue: '> 60 kV', editableSpecifiedValue: true },
                    { point: 'Oil Moisture content (PPM) before filling', specifiedValue: '< 10 ppm', editableSpecifiedValue: true }
                ]
            }, {
                name: '2 - Filling Operations',
                items: [
                    { point: 'Oil filling completed under vacuum', specifiedValue: 'Verified' },
                    { point: 'Oil level indicator (MOG) check', specifiedValue: 'At normal mark' },
                    { point: 'Air release from all venting points (Bushings, radiators, etc.)', specifiedValue: 'Bleeded properly' }
                ]
            }]
        },
        coreBuilding: {
            title: 'INSPECTION RECORD FOR EHV & UHV (Transformer)',
            subtitle: 'Core Building - Form No: F/QAS/— | Issue No: 00 | Issue Dt: 17/11/2025 | Rev No: 00 | Rev Dt: 17/11/2025',
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

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getMasterStageData };
}
