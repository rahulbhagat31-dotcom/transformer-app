/* ================================================
   SESSION MANAGER — Auto-logout on inactivity
   30 min for customer, 120 min for internal users
   Shows 1-minute countdown warning before logout
================================================ */

(function () {
    const TIMEOUT_MS = {
        customer:   30  * 60 * 1000,  // 30 minutes
        production: 120 * 60 * 1000,  // 2 hours
        quality:    120 * 60 * 1000,
        admin:      120 * 60 * 1000
    };
    const WARNING_BEFORE_MS = 60 * 1000; // warn 1 min before logout

    let logoutTimer   = null;
    let warningTimer  = null;
    let countdownInterval = null;
    let sessionActive = false;

    /* ── Start / reset session timer ── */
    function resetTimer() {
        if (!sessionActive) return;

        clearTimeout(logoutTimer);
        clearTimeout(warningTimer);
        clearInterval(countdownInterval);
        hideWarning();

        const role    = window.currentUserRole || 'customer';
        const timeout = TIMEOUT_MS[role] || TIMEOUT_MS.customer;

        warningTimer = setTimeout(showWarning, timeout - WARNING_BEFORE_MS);
        logoutTimer  = setTimeout(doLogout,    timeout);
    }

    /* ── Show warning modal ── */
    function showWarning() {
        const modal = document.getElementById('sessionWarningModal');
        if (modal) modal.style.display = 'flex';

        let secs = 60;
        const counter = document.getElementById('sessionCountdown');
        countdownInterval = setInterval(() => {
            secs--;
            if (counter) counter.textContent = secs;
            if (secs <= 0) clearInterval(countdownInterval);
        }, 1000);
    }

    /* ── Hide warning modal ── */
    function hideWarning() {
        const modal = document.getElementById('sessionWarningModal');
        if (modal) modal.style.display = 'none';
        const counter = document.getElementById('sessionCountdown');
        if (counter) counter.textContent = '60';
    }

    /* ── Force logout ── */
    function doLogout() {
        sessionActive = false;
        clearTimeout(logoutTimer);
        clearTimeout(warningTimer);
        clearInterval(countdownInterval);
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Show login page
        const mainApp   = document.getElementById('mainApp');
        const loginPage = document.getElementById('loginPage');
        if (mainApp)   mainApp.style.display   = 'none';
        if (loginPage) loginPage.style.display  = 'flex';
        hideWarning();
        // Show session-expired notice
        const err = document.getElementById('loginError');
        if (err) {
            err.textContent = '⏰ Your session expired due to inactivity. Please sign in again.';
            err.style.display = 'block';
        }
    }

    /* ── Activity events that reset the timer ── */
    function bindActivityEvents() {
        ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(evt => {
            document.addEventListener(evt, resetTimer, { passive: true });
        });
    }

    /* ── Public: start session (called after login) ── */
    window.startSessionTimer = function () {
        sessionActive = true;
        bindActivityEvents();
        resetTimer();
    };

    /* ── Public: "Keep me logged in" button in warning modal ── */
    window.extendSession = function () {
        resetTimer();
    };

    /* ── Public: manual logout ── */
    window.sessionLogout = function () {
        doLogout();
    };
})();
