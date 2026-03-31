/**
 * Engineering Report Generator
 * Generates an IEC 60076 compliant PDF report for transformer designs.
 * Dependencies: jsPDF, jsPDF-AutoTable
 */

window.generateEngineeringReport = function (transformer) {
    if (!transformer || !transformer.designData) {
        Toast.error('Invalid transformer data for report generation.', { title: 'Invalid Data' });
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const design = transformer.designData;
    const calc = design.calculations;
    const inputs = design.inputs;

    // Helper: Add Logo/Header
    const addHeader = () => {
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text('TRANSFORMER MFG SYSTEM', 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Engineering Design Approval', 14, 27);

        // Status Badge
        doc.setFillColor(46, 204, 113); // Green
        doc.rect(150, 12, 45, 10, 'F');
        doc.setTextColor(255);
        doc.setFontSize(9);
        doc.text('AUDIT READY', 162, 18);
    };

    // Helper: Add Footer
    const addFooter = (pageNo) => {
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 285);
        doc.text(`Page ${pageNo}`, 190, 285);
        doc.text(`W.O. ${transformer.wo} | Rev ${transformer.revision}`, 100, 285, { align: 'center' });
    };

    // 1. Title Page / Header
    addHeader();

    // 2. Project Details
    doc.autoTable({
        startY: 35,
        head: [['Project Details', '']],
        body: [
            ['Work Order', transformer.wo],
            ['Customer', transformer.customer || 'Pending'],
            ['Rating', `${inputs.mva} MVA`],
            ['Voltage Ratio', `${inputs.hv} / ${inputs.lv} kV`],
            ['Vector Group', inputs.vectorGroup],
            ['Cooling', inputs.cooling],
            ['Frequency', `${inputs.frequency} Hz`],
            ['Standards', 'IEC 60076 / IS 2026']
        ],
        theme: 'striped',
        headStyles: { fillColor: [52, 152, 219] }
    });

    // 3. Technical Specifications (Losses & Impedance)
    doc.text('Performance Guarantees', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Parameter', 'Value', 'Unit']],
        body: [
            ['No-Load Loss (Core)', calc.losses.coreLoss.toFixed(2), 'kW'],
            ['Load Loss (Copper)', calc.losses.copperLoss.total.toFixed(2), 'kW'],
            ['Total Loss', calc.losses.totalLoss.toFixed(2), 'kW'],
            ['Efficiency', calc.losses.efficiency.toFixed(4), '%'],
            ['Impedance', calc.impedance.percentImpedance.toFixed(2), '%'],
            ['Regulation', calc.impedance.regulation.toFixed(2), '%']
        ],
        theme: 'grid'
    });

    // 4. Critical Design Parameters
    doc.text('Design Parameters (Internal)', 14, doc.lastAutoTable.finalY + 10);
    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Component', 'Parameter', 'Value', 'Unit']],
        body: [
            ['Core', 'Diameter', calc.coreDesign.diameter.toFixed(1), 'mm'],
            ['Core', 'Flux Density', calc.coreDesign.flux.toFixed(3), 'Tesla'],
            ['Winding', 'HV Current Density', inputs.currentDensity.toFixed(2), 'A/mm²'],
            ['Winding', 'Total Weight', calc.dimensions.weights.total.toFixed(0), 'kg'],
            ['Short Circuit', 'Radial Force', calc.shortCircuit.forces.radial.toFixed(1), 'kN'],
            ['Short Circuit', 'Hoop Stress', calc.shortCircuit.stresses.hoop.toFixed(1), 'MPa']
        ]
    });

    // 5. IEC Compliance Audit
    doc.text('IEC 60076 Compliance Audit', 14, doc.lastAutoTable.finalY + 10);

    // Convert validation feedback to table format
    const margins = design.validation?.margins || [];
    const complianceRows = margins.map(m => [
        m.parameter,
        `${m.value} ${m.unit}`,
        `${m.limit} ${m.unit}`,
        m.margin,
        m.status
    ]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 15,
        head: [['Check', 'Value', 'Limit', 'Margin', 'Status']],
        body: complianceRows,
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 4) {
                if (data.cell.raw === 'CRITICAL') data.cell.styles.textColor = [231, 76, 60];
                if (data.cell.raw === 'WARNING') data.cell.styles.textColor = [243, 156, 18];
                if (data.cell.raw === 'SAFE') data.cell.styles.textColor = [46, 204, 113];
            }
        }
    });

    // Sign-off Area
    const finalY = doc.lastAutoTable.finalY + 30;
    doc.setDrawColor(150);
    doc.line(14, finalY, 80, finalY);
    doc.line(120, finalY, 190, finalY);
    doc.setFontSize(8);
    doc.text('Designed By', 14, finalY + 5);
    doc.text('Approved By', 120, finalY + 5);

    addHeader(); // Re-render header on top if needed (usually handled by page hook)
    addFooter(1);

    // Save
    doc.save(`Engineering_Report_${transformer.wo}.pdf`);
};
