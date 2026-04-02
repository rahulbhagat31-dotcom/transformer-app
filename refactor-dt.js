const fs = require('fs');
const path = require('path');
const dtPath = path.join(__dirname, 'public/js/features/digital-twin.js');
let content = fs.readFileSync(dtPath, 'utf8');

// 1. Target exact function declarations
content = content.replace(/^async function loadTransformerData/gm, 'window.DigitalTwinDataService.loadTransformerData = async function ');
content = content.replace(/^function generateMockActuals/gm, 'window.DigitalTwinDataService.generateMockActuals = function ');
content = content.replace(/^async function loadChecklistData/gm, 'window.DigitalTwinDataService.loadChecklistData = async function ');
content = content.replace(/^async function loadAuditLogs/gm, 'window.DigitalTwinDataService.loadAuditLogs = async function ');

content = content.replace(/^function showDTContent/gm, 'window.DigitalTwinUI.showDTContent = function ');
content = content.replace(/^function showDTEmptyState/gm, 'window.DigitalTwinUI.showDTEmptyState = function ');
content = content.replace(/^function showDTError/gm, 'window.DigitalTwinUI.showDTError = function ');
content = content.replace(/^function renderDTNavigation/gm, 'window.DigitalTwinUI.renderDTNavigation = function ');
content = content.replace(/^function renderDTHeader/gm, 'window.DigitalTwinUI.renderDTHeader = function ');
content = content.replace(/^function renderLifecycleTimeline/gm, 'window.DigitalTwinUI.renderLifecycleTimeline = function ');
content = content.replace(/^function renderCurrentStageSnapshot/gm, 'window.DigitalTwinUI.renderCurrentStageSnapshot = function ');
content = content.replace(/^function renderManufacturingHistory/gm, 'window.DigitalTwinUI.renderManufacturingHistory = function ');
content = content.replace(/^function toggleStageSection/gm, 'window.DigitalTwinUI.toggleStageSection = function ');
content = content.replace(/^async function renderDocuments/gm, 'window.DigitalTwinUI.renderDocuments = async function ');
content = content.replace(/^async function renderAuditTimeline/gm, 'window.DigitalTwinUI.renderAuditTimeline = async function ');

// 2. Target calls (avoiding things already prefixed)
content = content.replace(/(?<!\.)\bloadTransformerData\(/g, 'window.DigitalTwinDataService.loadTransformerData(');
content = content.replace(/(?<!\.)\bgenerateMockActuals\(/g, 'window.DigitalTwinDataService.generateMockActuals(');
content = content.replace(/(?<!\.)\bloadChecklistData\(/g, 'window.DigitalTwinDataService.loadChecklistData(');
content = content.replace(/(?<!\.)\bloadAuditLogs\(/g, 'window.DigitalTwinDataService.loadAuditLogs(');

content = content.replace(/(?<!\.)\bshowDTContent\(/g, 'window.DigitalTwinUI.showDTContent(');
content = content.replace(/(?<!\.)\bshowDTEmptyState\(/g, 'window.DigitalTwinUI.showDTEmptyState(');
content = content.replace(/(?<!\.)\bshowDTError\(/g, 'window.DigitalTwinUI.showDTError(');
content = content.replace(/(?<!\.)\brenderDTNavigation\(/g, 'window.DigitalTwinUI.renderDTNavigation(');
content = content.replace(/(?<!\.)\brenderDTHeader\(/g, 'window.DigitalTwinUI.renderDTHeader(');
content = content.replace(/(?<!\.)\brenderLifecycleTimeline\(/g, 'window.DigitalTwinUI.renderLifecycleTimeline(');
content = content.replace(/(?<!\.)\brenderCurrentStageSnapshot\(/g, 'window.DigitalTwinUI.renderCurrentStageSnapshot(');
content = content.replace(/(?<!\.)\brenderManufacturingHistory\(/g, 'window.DigitalTwinUI.renderManufacturingHistory(');
content = content.replace(/(?<!\.)\brenderDocuments\(/g, 'window.DigitalTwinUI.renderDocuments(');
content = content.replace(/(?<!\.)\brenderAuditTimeline\(/g, 'window.DigitalTwinUI.renderAuditTimeline(');

// Add initDigitalTwin export inside file to avoid ESLint warnings
if (!content.includes('window.initDigitalTwin = initDigitalTwin;')) {
    content = content.replace(/async function initDigitalTwin\(wo\) {/, 'window.initDigitalTwin = initDigitalTwin;\nasync function initDigitalTwin(wo) {');
}

// Prefix file with namespace initialization
content = 'window.DigitalTwinDataService = {};\nwindow.DigitalTwinUI = {};\n\n' + content;

// Put exports at the end
content += '\n// Export inline aliases\n';
content += 'window.toggleStageSection = window.DigitalTwinUI.toggleStageSection;\n';
content += 'window.showDTContent = window.DigitalTwinUI.showDTContent;\n';
content += 'window.showDTEmptyState = window.DigitalTwinUI.showDTEmptyState;\n';
content += 'window.showDTError = window.DigitalTwinUI.showDTError;\n';

fs.writeFileSync(dtPath, content, 'utf8');
console.log('Success!');
