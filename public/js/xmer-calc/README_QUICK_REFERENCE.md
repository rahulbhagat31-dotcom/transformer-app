# Core Calculator - Quick Reference Guide

## 🚀 Quick Start

### For Users
1. Navigate to the transformer calculator in the application
2. Enter transformer parameters (MVA, HV, LV, etc.)
3. Click "Calculate" or watch live updates as you type
4. See detailed results with compliance checks

### For Developers

#### Access the Calculator Functions
```javascript
// Run a full calculation
window.calculateCoreElectricalDesign();

// Get pure math calculation
const result = window._coreElectricalMath({ /* params */ });

// Access state
const lastInputs = window.getLastValidInputs();
const lastError = window.getLastError();
```

#### Check Calculation Status
```javascript
// Monitor state
console.log(CoreCalcState.isCalculating);   // true/false
console.log(CoreCalcState.lastError);       // error message or null
console.log(CoreCalcState.lastValidInputs); // last successful inputs
```

---

## 📋 Input Parameters

### Required Fields
| Parameter | Range | Unit | Default |
|-----------|-------|------|---------|
| MVA (S) | 0.1 - 500 | MVA | 0 |
| HV Voltage | 0.4 - 765 | kV | 0 |
| LV Voltage | 0.1 - 500 | kV | 0 |
| Frequency | 40 - 60 | Hz | 50 |
| Stacking Factor | 0.8 - 1.0 | — | 0.96 |
| Flux Density | 1.0 - 1.9 | Tesla | 1.7 |
| Filling Factor | 0.5 - 1.0 | — | 0.75 |
| HV Main Turns | 1 - 2000 | turns | 0 |
| Core Weight | 0.1 - 100000 | kg | 0 |
| Specific Core Loss | 0.1 - 10 | W/kg | 0 |
| Specific Mag VA | 0.1 - 100 | VA/kg | 0 |

---

## 📊 Output Results

### Section A: Flux Calculations
- **Gross Core Area (Ag)** - π×D²/4
- **Net Core Area (An)** - Ag × Sf
- **Peak Flux (Φm)** - Bm × An
- **RMS Flux (Φrms)** - Φm/√2
- **Saturation Margin** - Percentage from 1.9T limit

### Section B: EMF & Turns
- **EMF per Turn (Et)** - 4.44 × f × Φm
- **HV Phase Voltage** - Vline/√3 (Y) or Vline (Δ)
- **LV Phase Voltage** - Vline/√3 (Y) or Vline (Δ)
- **HV Turns (NHV)** - Calculated and used
- **LV Turns (NLV)** - Calculated

### Section C: Currents & AT
- **HV Rated Line Current** - S / √3 × VHV
- **LV Rated Line Current** - S / √3 × VLV
- **Ampere-Turns** - N × I for each winding
- **AT Balance** - Should be ≈ 1.0

### Section D: Losses
- **Core Loss** - Wcore × wsp
- **No-Load Current** - Magnetizing VA / √3 / V
- **Hysteresis Loss** - ~60% of core loss
- **Eddy Current Loss** - ~40% of core loss

### Section E: Compliance Check
✅ **All parameters checked against IEC 60076 / IS 2026 standards**

---

## 🎨 Visual Feedback

### Input Field Indicators
- **🟠 Orange border + "●"** - Auto-filled field (default value)
- **🟢 Green border + "✓"** - Auto-calculated field
- **🔵 Blue pulse** - Field recently updated

### Animation Effects
- Auto-fill fields get **yellow-orange highlight** that fades
- Computed values get **green highlight with checkmark**
- Diameter changes get **blue pulsing glow**

---

## 🐛 Debugging Tips

### Enable Detailed Logging
Open browser DevTools Console and watch for:
- ✅ **Green checkmarks** - Successful operations
- ❌ **Red X marks** - Errors or validation failures
- ℹ️ **Info indicators** - General status messages
- **Timestamps** - When each operation occurred

### Check Calculation State
```javascript
// See detailed calculation state
console.log(window.CoreCalcState);

// Check if calculation is in progress
if (CoreCalcState.isCalculating) {
    console.log('Calculation in progress...');
}

// See last error
if (CoreCalcState.lastError) {
    console.error('Last error:', CoreCalcState.lastError);
}
```

### Validate Inputs Programmatically
```javascript
// Test with specific values
const testResult = window._coreElectricalMath({
    S: 160, VHV: 132, VLV: 33, f: 50,
    Sf: 0.96, Bm: 1.7, Kf: 0.75,
    hvMain: 500, hvNormTap: 64,
    Wcore: 950, wsp: 1.2, magVA: 1.5,
    vecGroup: 'YNyn0'
});

console.log('Results:', testResult);
console.log('Compliance:', testResult.compliance);
```

---

## ⚠️ Common Issues & Solutions

### Issue: "Invalid input" alert
**Solution:** Check that all fields are filled with positive numbers within valid ranges

### Issue: Diameter not updating
**Solution:** 
- Ensure MVA and HV Voltage are both > 0
- Check browser console for errors
- Wait 300ms - updates are debounced

### Issue: Results not showing
**Solution:**
- Verify calculation was successful (check console logs)
- Ensure `coreDesignResults` element exists in HTML
- Check for JavaScript errors in DevTools

### Issue: Auto-calculations missing
**Solution:**
- Fields must be empty (contain no value) to auto-fill
- Clear field and trigger input event: `element.dispatchEvent(new Event('input'))`

---

## 🧪 Running Tests

### In Browser Console
```javascript
// Load test suite (paste test-core-calc.js into console)

// Run all tests
runAllTests();

// Or run individual tests
test_calculateFlux();
test_validateInputs();
test_stateManagement();
test_vectorGroups();
test_compliance();
test_liveDiameterUpdate();
```

### Expected Output
- ✅ Green checkmarks for passing tests
- ❌ Red X for failures
- ⚠️ Yellow warnings for skipped tests

---

## 📝 Configuration

### Input Debounce Delay
```javascript
// In updateCoreDiaLive() - currently 300ms
debounceTimer = setTimeout(() => updateCoreDiaLive(), 300);
```

### Validation Ranges
Edit in `calculateCoreElectricalDesign()`:
```javascript
const validationRules = {
    'Field Name': { value: X, min: Y, max: Z }
};
```

### Auto-Fill Logic
Edit in `updateCoreDiaLive()`:
```javascript
if (mainField && isNaN(parseFloat(mainField.value))) {
    mainField.value = hvMainCalculated;
}
```

---

## 🔧 Maintenance

### Adding New Validations
1. Add rule to `validationRules` in `calculateCoreElectricalDesign()`
2. Rule format: `{ value: fieldValue, min: minValue, max: maxValue }`
3. Error message auto-generated with current value and range

### Changing Calculation Formulas
1. Modify pure math function (e.g., `_calcFluxDomain()`)
2. Test thoroughly with `test_calculateFlux()`
3. Update documentation in this file

### Styling Feedback Effects
Edit in `calculator-modern.css`:
- `.auto-filled` - Auto-fill styling
- `.auto-calculated` - Auto-calc styling
- `@keyframes highlightFill` - Auto-fill animation
- `@keyframes highlightCalc` - Auto-calc animation

---

## 📚 Related Files

- **Core Logic:** `core-calc.js`
- **Styles:** `calculator-modern.css`
- **Testing:** `test-core-calc.js`
- **Documentation:** `IMPROVEMENTS_v2.0.md` (detailed changes)
- **HTML Form:** `index.html` (lines 1680-1750)

---

## 📞 Support

### Getting Help
1. Check browser console for error messages
2. Run `runAllTests()` to diagnose issues
3. Review calculation state: `console.log(CoreCalcState)`
4. Check this guide for common issues

### Reporting Issues
Include:
- Input values used
- Expected vs actual output
- Console errors/logs
- Browser version

---

**Version:** 2.0 | **Last Updated:** 2025-04-19 | **Status:** ✅ Production Ready
