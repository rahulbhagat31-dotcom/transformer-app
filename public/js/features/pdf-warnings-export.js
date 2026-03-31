/**
 * PDF Export Enhancement for Warnings
 * Adds IEC 60076 validation warnings section to PDF reports
 */

(function () {
    'use strict';

    /**
     * Generate PDF-friendly warnings section
     * @param {Array} warnings - Validation warnings
     * @returns {Object} PDF section data
     */
    function generateWarningsPDFSection(warnings) {
        if (!warnings || warnings.length === 0) {
            return {
                title: '✅ Validation Status',
                content: 'No design warnings - all parameters within IEC 60076 typical ranges',
                status: 'PASS'
            };
        }

        // Group warnings by severity
        const grouped = {
            high: warnings.filter(w => w.severity === 'high'),
            medium: warnings.filter(w => w.severity === 'medium'),
            low: warnings.filter(w => w.severity === 'low')
        };

        // Create summary
        const summary = {
            total: warnings.length,
            high: grouped.high.length,
            medium: grouped.medium.length,
            low: grouped.low.length,
            status: grouped.high.length > 0 ? 'REVIEW REQUIRED' : 'ACCEPTABLE'
        };

        // Format warnings for PDF
        const formattedWarnings = [];

        // High severity first
        if (grouped.high.length > 0) {
            formattedWarnings.push({
                severity: 'HIGH',
                color: '#dc3545',
                icon: '🔴',
                items: grouped.high.map(w => ({
                    category: w.category,
                    message: w.message,
                    recommendation: w.recommendation,
                    standard: w.standard
                }))
            });
        }

        // Medium severity
        if (grouped.medium.length > 0) {
            formattedWarnings.push({
                severity: 'MEDIUM',
                color: '#ffc107',
                icon: '🟡',
                items: grouped.medium.map(w => ({
                    category: w.category,
                    message: w.message,
                    recommendation: w.recommendation,
                    standard: w.standard
                }))
            });
        }

        // Low severity
        if (grouped.low.length > 0) {
            formattedWarnings.push({
                severity: 'LOW',
                color: '#17a2b8',
                icon: '🔵',
                items: grouped.low.map(w => ({
                    category: w.category,
                    message: w.message,
                    recommendation: w.recommendation,
                    standard: w.standard
                }))
            });
        }

        return {
            title: '⚠️ IEC 60076 Validation Warnings',
            summary: summary,
            warnings: formattedWarnings,
            disclaimer: 'These warnings are advisory based on IEC 60076 / IS 2026 standards. Final design must be validated through detailed analysis and type testing.'
        };
    }

    /**
     * Generate HTML for PDF warnings section
     * @param {Object} pdfSection - PDF section data
     * @returns {string} HTML content
     */
    function generateWarningsPDFHTML(pdfSection) {
        let html = `
            <div class="pdf-warnings-section">
                <h2>${pdfSection.title}</h2>
        `;

        if (pdfSection.status === 'PASS') {
            html += `
                <div class="pdf-success-box">
                    <p>${pdfSection.content}</p>
                </div>
            `;
        } else {
            // Summary box
            html += `
                <div class="pdf-summary-box">
                    <h3>Summary</h3>
                    <table>
                        <tr>
                            <td><strong>Total Warnings:</strong></td>
                            <td>${pdfSection.summary.total}</td>
                        </tr>
                        <tr>
                            <td><strong>High Severity:</strong></td>
                            <td style="color: #dc3545;">${pdfSection.summary.high}</td>
                        </tr>
                        <tr>
                            <td><strong>Medium Severity:</strong></td>
                            <td style="color: #ffc107;">${pdfSection.summary.medium}</td>
                        </tr>
                        <tr>
                            <td><strong>Low Severity:</strong></td>
                            <td style="color: #17a2b8;">${pdfSection.summary.low}</td>
                        </tr>
                        <tr>
                            <td><strong>Status:</strong></td>
                            <td><strong>${pdfSection.summary.status}</strong></td>
                        </tr>
                    </table>
                </div>
            `;

            // Warnings by severity
            pdfSection.warnings.forEach(severityGroup => {
                html += `
                    <div class="pdf-severity-group">
                        <h3 style="color: ${severityGroup.color};">
                            ${severityGroup.icon} ${severityGroup.severity} SEVERITY
                        </h3>
                `;

                severityGroup.items.forEach(item => {
                    html += `
                        <div class="pdf-warning-item">
                            <p><strong>${item.category}:</strong> ${item.message}</p>
                            <p><em>Recommendation:</em> ${item.recommendation}</p>
                            <p class="pdf-standard"><small>${item.standard}</small></p>
                        </div>
                    `;
                });

                html += '</div>';
            });

            // Disclaimer
            html += `
                <div class="pdf-disclaimer">
                    <p><small>${pdfSection.disclaimer}</small></p>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    /**
     * Add warnings to existing PDF generation
     * Call this function in your PDF export logic
     */
    function addWarningsToPDF(pdfDoc, warnings, yPosition) {
        const pdfSection = generateWarningsPDFSection(warnings);
        const html = generateWarningsPDFHTML(pdfSection);

        // Return HTML for integration with existing PDF library
        return {
            html: html,
            section: pdfSection,
            nextYPosition: yPosition + 200 // Approximate height
        };
    }

    // Export for use
    if (typeof window !== 'undefined') {
        window.PDFWarningsExport = {
            generateWarningsPDFSection,
            generateWarningsPDFHTML,
            addWarningsToPDF
        };
    }

    console.log('✅ PDF warnings export initialized');
})();
