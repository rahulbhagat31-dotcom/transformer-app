/* ===================================
   PRINT-STYLE SIGN-OFF JAVASCRIPT
   Generates sign-off cells for different row types
=================================== */

/**
 * Main function to generate print-style sign-off cell
 * Automatically detects row type and generates appropriate HTML
 *
 * @param {string} rowId - Unique row identifier
 * @param {object} item - Item data object
 * @param {boolean} isCustomer - Is current user a customer
 * @param {boolean} isQuality - Is current user quality role
 * @param {boolean} isProduction - Is current user production role
 * @param {boolean} isAdmin - Is current user admin
 * @returns {string} HTML for sign-off cell
 */
function generatePrintStyleSignOffCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin) {
    // Detect row type and generate appropriate cell
    if (item.type === 'tmb-measurements' && item.phases) {
        return generateTMBPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin);
    } else if (item.type === 'text-phases' && item.phases) {
        return generatePhaseBasedPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin);
    } else if (item.type === 'ok-notok-limbs' && item.limbs) {
        return generateLimbBasedPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin);
    } else {
        return generateStandardPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin);
    }
}

/**
 * Generate standard sign-off cell (Operator | Shop Supervisor | Quality Supervisor)
 */
function generateStandardPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin) {
    return `
        <div class="print-signoff-container">
            <!-- Operator Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Operator</div>
                ${!isCustomer ? `
                    <input type="text" 
                           id="technician_${rowId}" 
                           class="print-signoff-input"
                           placeholder="Name"
                           ${isCustomer ? 'disabled' : ''}>
                    <small id="techTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Shop Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Shop Supervisor</div>
                ${(isProduction || isAdmin) ? `
                    <select id="shopSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Supervisor 1">Supervisor 1</option>
                        <option value="Supervisor 2">Supervisor 2</option>
                    </select>
                    <small id="shopSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Quality Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Quality Supervisor</div>
                ${(isQuality || isAdmin) ? `
                    <select id="qaSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Inspector 1">Inspector 1</option>
                        <option value="Inspector 2">Inspector 2</option>
                    </select>
                    <small id="qaSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
        </div>
    `;
}

/**
 * Generate TMB measurement cell (T/M/B for each phase)
 */
function generateTMBPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin) {
    const phases = item.phases || ['U Phase', 'V Phase', 'W Phase'];

    return `
        <div class="print-tmb-container">
            ${phases.map((phase, phaseIdx) => `
                <div class="print-tmb-phase">
                    <div class="print-tmb-phase-header">${phase}</div>
                    
                    <!-- Top (T) -->
                    <div class="print-tmb-row">
                        <span class="print-tmb-label">T:</span>
                        ${!isCustomer ? `
                            <input type="text" 
                                   id="technician_${rowId}_${phaseIdx}_T" 
                                   class="print-tmb-input"
                                   placeholder="mm"
                                   ${isCustomer ? 'disabled' : ''}>
                        ` : '<span class="print-signoff-na">-</span>'}
                    </div>
                    
                    <!-- Middle (M) -->
                    <div class="print-tmb-row">
                        <span class="print-tmb-label">M:</span>
                        ${!isCustomer ? `
                            <input type="text" 
                                   id="technician_${rowId}_${phaseIdx}_M" 
                                   class="print-tmb-input"
                                   placeholder="mm"
                                   ${isCustomer ? 'disabled' : ''}>
                        ` : '<span class="print-signoff-na">-</span>'}
                    </div>
                    
                    <!-- Bottom (B) -->
                    <div class="print-tmb-row">
                        <span class="print-tmb-label">B:</span>
                        ${!isCustomer ? `
                            <input type="text" 
                                   id="technician_${rowId}_${phaseIdx}_B" 
                                   class="print-tmb-input"
                                   placeholder="mm"
                                   ${isCustomer ? 'disabled' : ''}>
                        ` : '<span class="print-signoff-na">-</span>'}
                    </div>
                    
                    <!-- Shop Supervisor -->
                    ${(isProduction || isAdmin) ? `
                        <select id="shopSup_${rowId}_${phaseIdx}" 
                                class="print-tmb-input"
                                style="margin-top: 3px;"
                                ${isCustomer ? 'disabled' : ''}>
                            <option value="">Supervisor</option>
                            <option value="Supervisor 1">Sup 1</option>
                            <option value="Supervisor 2">Sup 2</option>
                        </select>
                    ` : ''}
                    
                    <!-- Quality Supervisor -->
                    ${(isQuality || isAdmin) ? `
                        <select id="qaSup_${rowId}_${phaseIdx}" 
                                class="print-tmb-input"
                                style="margin-top: 2px;"
                                ${isCustomer ? 'disabled' : ''}>
                            <option value="">Inspector</option>
                            <option value="Inspector 1">Insp 1</option>
                            <option value="Inspector 2">Insp 2</option>
                        </select>
                    ` : ''}
                    
                    <small id="techTime_${rowId}_${phaseIdx}" class="print-signoff-time"></small>
                </div>
            `).join('')}
        </div>
    `;
}

/**
 * Generate phase-based cell (U/V/W phase inputs)
 */
function generatePhaseBasedPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin) {
    const phases = item.phases || ['U Phase', 'V Phase', 'W Phase'];

    return `
        <div class="print-signoff-container">
            <!-- Operator Column with Phase Inputs -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Operator</div>
                ${!isCustomer ? `
                    <div class="print-phase-container">
                        ${phases.map((phase, idx) => `
                            <div class="print-phase-row">
                                <span class="print-phase-label">${phase}:</span>
                                <input type="text" 
                                       id="technician_${rowId}_${idx}" 
                                       class="print-phase-input"
                                       placeholder="Value"
                                       ${isCustomer ? 'disabled' : ''}>
                            </div>
                        `).join('')}
                    </div>
                    <small id="techTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Shop Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Shop Supervisor</div>
                ${(isProduction || isAdmin) ? `
                    <select id="shopSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Supervisor 1">Supervisor 1</option>
                        <option value="Supervisor 2">Supervisor 2</option>
                    </select>
                    <small id="shopSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Quality Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Quality Supervisor</div>
                ${(isQuality || isAdmin) ? `
                    <select id="qaSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Inspector 1">Inspector 1</option>
                        <option value="Inspector 2">Inspector 2</option>
                    </select>
                    <small id="qaSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
        </div>
    `;
}

/**
 * Generate limb-based cell (OK/Not OK for each limb)
 */
function generateLimbBasedPrintStyleCell(rowId, item, isCustomer, isQuality, isProduction, isAdmin) {
    const limbs = item.limbs || ['Limb-1', 'Limb-2'];

    return `
        <div class="print-signoff-container">
            <!-- Operator Column with Limb Inputs -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Operator</div>
                ${!isCustomer ? `
                    <div class="print-limb-container">
                        ${limbs.map((limb, idx) => `
                            <div class="print-limb-row">
                                <span class="print-limb-label">${limb}:</span>
                                <select id="technician_${rowId}_${idx}" 
                                        class="print-limb-select"
                                        ${isCustomer ? 'disabled' : ''}>
                                    <option value="">-- Select --</option>
                                    <option value="OK">OK</option>
                                    <option value="Not OK">Not OK</option>
                                </select>
                            </div>
                        `).join('')}
                    </div>
                    <small id="techTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Shop Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Shop Supervisor</div>
                ${(isProduction || isAdmin) ? `
                    <select id="shopSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Supervisor 1">Supervisor 1</option>
                        <option value="Supervisor 2">Supervisor 2</option>
                    </select>
                    <small id="shopSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
            
            <!-- Quality Supervisor Column -->
            <div class="print-signoff-cell">
                <div class="print-signoff-header">Quality Supervisor</div>
                ${(isQuality || isAdmin) ? `
                    <select id="qaSup_${rowId}" 
                            class="print-signoff-input"
                            ${isCustomer ? 'disabled' : ''}>
                        <option value="">-- Select --</option>
                        <option value="Inspector 1">Inspector 1</option>
                        <option value="Inspector 2">Inspector 2</option>
                    </select>
                    <small id="qaSupTime_${rowId}" class="print-signoff-time"></small>
                ` : '<div class="print-signoff-na">N/A</div>'}
            </div>
        </div>
    `;
}

// Export functions to window object for use in ui.js
window.generatePrintStyleSignOffCell = generatePrintStyleSignOffCell;
window.generateStandardPrintStyleCell = generateStandardPrintStyleCell;
window.generateTMBPrintStyleCell = generateTMBPrintStyleCell;
window.generatePhaseBasedPrintStyleCell = generatePhaseBasedPrintStyleCell;
window.generateLimbBasedPrintStyleCell = generateLimbBasedPrintStyleCell;
