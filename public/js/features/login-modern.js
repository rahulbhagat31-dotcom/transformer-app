/**
 * Login Page — demo accounts toggle + credential auto-fill
 */

window.toggleDemoAccounts = function () {
    const demoList = document.getElementById('demoAccountsList');
    const toggleBtn = document.getElementById('demoToggleBtn');
    const chevron = document.getElementById('demoChevron');

    if (!demoList) return;

    const isOpen = demoList.style.display !== 'none';
    demoList.style.display = isOpen ? 'none' : 'block';
    if (toggleBtn) toggleBtn.classList.toggle('active', !isOpen);
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
};

window.fillCredentials = function (username, password) {
    const userInput = document.getElementById('userInput');
    const passInput = document.getElementById('passInput');

    if (userInput && passInput) {
        userInput.value = username;
        passInput.value = password;

        // Glow flash on both fields
        [userInput, passInput].forEach(el => {
            el.closest('.lp-field')?.classList.add('lp-field-autofill');
            setTimeout(() => el.closest('.lp-field')?.classList.remove('lp-field-autofill'), 900);
        });

        // Focus submit button
        document.getElementById('loginBtn')?.focus();
    }
};

console.log('✅ Login page scripts loaded');
