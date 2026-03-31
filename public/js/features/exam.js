/* ===============================
   MCQ EXAM SYSTEM — Frontend Logic
   Works with /exam/* API endpoints
================================ */

/* ─── State ──────────────────────────────────────────────── */
let examState = {
    section: 'winding',
    questions: [],
    answers: {},        // { questionId: chosen }
    currentIdx: 0,
    operatorName: '',
    timerInterval: null,
    secondsLeft: 0,
    submitted: false
};

const EXAM_MINUTES = 10;
const SECTION_LABELS = { winding: 'Winding', core: 'Core Building', tanking: 'Tanking' };
const SECTION_COLORS = { winding: '#7c3aed', core: '#0ea5e9', tanking: '#f59e0b' };

/* ─── Entry point: called when Exam tab is shown ────────── */
window.loadExamTab = async function () {
    switchExamView('home');
    await loadExamStats();
};

/* ─── View Switcher ─────────────────────────────────────── */
window.switchExamView = function (view) {
    ['examHomeView', 'examTakeView', 'examResultView', 'examAdminView', 'examResultsListView']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    const target = document.getElementById(`exam${view.charAt(0).toUpperCase() + view.slice(1)}View`);
    if (target) target.style.display = 'block';
};

/* ─── Load stats for home screen ────────────────────────── */
async function loadExamStats() {
    try {
        const res = await apiCall('/exam/stats');
        const { questions, results } = res.data;

        const qMap = Object.fromEntries(questions.map(q => [q.section, q.count]));
        const rMap = Object.fromEntries(results.map(r => [r.section, r]));

        ['winding', 'core', 'tanking'].forEach(section => {
            const qEl = document.getElementById(`examStat_q_${section}`);
            const rEl = document.getElementById(`examStat_r_${section}`);
            if (qEl) qEl.textContent = qMap[section] || 0;
            if (rEl) {
                const r = rMap[section];
                rEl.textContent = r ? `${r.attempts} attempts · ${r.avgScore}% avg` : 'No attempts yet';
            }
        });
    } catch (e) {
        console.warn('Could not load exam stats:', e.message);
    }
}

/* ─── Start Exam Flow ───────────────────────────────────── */
window.startExamSection = async function (section) {
    examState.section = section;
    examState.answers = {};
    examState.currentIdx = 0;
    examState.submitted = false;

    // Update UI
    document.getElementById('examSectionLabel').textContent = SECTION_LABELS[section];
    document.getElementById('examSectionLabel').style.color = SECTION_COLORS[section];
    document.getElementById('examNameInput').value = '';
    document.getElementById('examNameError').textContent = '';
    document.getElementById('examNameCard').style.display = 'block';
    document.getElementById('examQuestionsArea').style.display = 'none';

    switchExamView('take');

    // Pre-fetch questions
    try {
        const res = await apiCall(`/exam/take/${section}?count=10`);
        examState.questions = res.data.sort(() => Math.random() - 0.5);
        document.getElementById('examInfoNote').textContent =
            `⏱ ${examState.questions.length} questions · ${EXAM_MINUTES} minute time limit. Auto-submits when time runs out.`;
    } catch (e) {
        alert('❌ Could not load exam questions: ' + e.message);
        switchExamView('home');
    }
};

window.beginExam = function () {
    const name = document.getElementById('examNameInput').value.trim();
    if (!name) {
        document.getElementById('examNameError').textContent = 'Please enter your name.';
        return;
    }
    if (examState.questions.length === 0) {
        alert('❌ No questions loaded. Please try again.');
        return;
    }
    examState.operatorName = name;
    document.getElementById('examNameCard').style.display = 'none';
    document.getElementById('examQuestionsArea').style.display = 'block';
    startExamTimer();
    renderExamQuestion(0);
};

/* ─── Timer ─────────────────────────────────────────────── */
function startExamTimer() {
    examState.secondsLeft = EXAM_MINUTES * 60;
    updateExamTimerDisplay();
    examState.timerInterval = setInterval(() => {
        examState.secondsLeft--;
        updateExamTimerDisplay();
        if (examState.secondsLeft <= 0) {
            clearInterval(examState.timerInterval);
            autoSubmitExam();
        }
    }, 1000);
}

function updateExamTimerDisplay() {
    const m = Math.floor(examState.secondsLeft / 60);
    const s = examState.secondsLeft % 60;
    const box = document.getElementById('examTimerBox');
    if (!box) return;
    box.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    box.className = 'exam-timer-box';
    if (examState.secondsLeft <= 30) box.classList.add('exam-timer-danger');
    else if (examState.secondsLeft <= 60) box.classList.add('exam-timer-warn');
}

/* ─── Render Question ───────────────────────────────────── */
function renderExamQuestion(idx) {
    examState.currentIdx = idx;
    const q = examState.questions[idx];
    const total = examState.questions.length;
    const pct = Math.round((idx / total) * 100);

    document.getElementById('examQLabel').textContent = `Question ${idx + 1} of ${total}`;
    document.getElementById('examPctLabel').textContent = `${pct}%`;
    document.getElementById('examProgressFill').style.width = `${pct}%`;
    document.getElementById('examQNumber').textContent = `Q${idx + 1} of ${total}`;
    document.getElementById('examQText').textContent = q.text;
    document.getElementById('examOptError').style.display = 'none';

    const chosen = examState.answers[q.id];
    let html = '';
    for (const [key, val] of Object.entries(q.options)) {
        const sel = chosen === key ? 'exam-opt-selected' : '';
        html += `
        <label class="exam-opt-label ${sel}" onclick="selectExamOption('${q.id}','${key}',this)">
            <input type="radio" name="examOpt" value="${key}" ${chosen === key ? 'checked' : ''}>
            <span class="exam-opt-badge">${key}</span>
            <span>${escapeHtml(val)}</span>
        </label>`;
    }
    document.getElementById('examOptionsDiv').innerHTML = html;

    let nav = '';
    if (idx > 0)
        nav += `<button class="exam-btn exam-btn-outline" onclick="renderExamQuestion(${idx - 1})">◀ Previous</button>`;
    if (idx < total - 1)
        nav += '<button class="exam-btn exam-btn-primary" onclick="examGoNext()">Next ▶</button>';
    else
        nav += '<button class="exam-btn exam-btn-success" onclick="submitExam()">✅ Submit Exam</button>';
    document.getElementById('examQNav').innerHTML = nav;
}

window.selectExamOption = function (qId, key, labelEl) {
    examState.answers[qId] = key;
    document.querySelectorAll('.exam-opt-label').forEach(l => l.classList.remove('exam-opt-selected'));
    labelEl.classList.add('exam-opt-selected');
    document.getElementById('examOptError').style.display = 'none';
};

window.examGoNext = function () {
    const q = examState.questions[examState.currentIdx];
    if (!examState.answers[q.id]) {
        const el = document.getElementById('examOptError');
        el.textContent = '⚠ Please select an answer before proceeding.';
        el.style.display = 'block';
        return;
    }
    renderExamQuestion(examState.currentIdx + 1);
};

/* ─── Submit ─────────────────────────────────────────────── */
window.submitExam = async function () {
    if (examState.submitted) return;
    const q = examState.questions[examState.currentIdx];
    if (!examState.answers[q.id]) {
        const el = document.getElementById('examOptError');
        el.textContent = '⚠ Please select an answer before submitting.';
        el.style.display = 'block';
        return;
    }
    const unanswered = examState.questions.filter(q => !examState.answers[q.id]);
    if (unanswered.length > 0) {
        if (!confirm(`You have ${unanswered.length} unanswered question(s). Submit anyway?`)) return;
    }
    clearInterval(examState.timerInterval);
    await doSubmit(false);
};

async function autoSubmitExam() {
    if (examState.submitted) return;
    await doSubmit(true);
}

async function doSubmit(auto) {
    examState.submitted = true;
    const payload = {
        section: examState.section,
        operatorName: examState.operatorName,
        answers: examState.questions.map(q => ({ questionId: q.id, chosen: examState.answers[q.id] || null }))
    };
    try {
        const res = await apiCall('/exam/submit', 'POST', payload);
        showExamResult(res.data, auto);
    } catch (e) {
        alert('❌ Submission failed: ' + e.message);
        examState.submitted = false;
    }
}

/* ─── Show Result ─────────────────────────────────────────── */
function showExamResult(result, autoSubmitted = false) {
    switchExamView('result');
    const { score, total, percentage, operatorName: name, answerKey, passed } = result;

    const circle = document.getElementById('examScoreCircle');
    circle.textContent = `${percentage}%`;
    circle.className = `exam-score-circle ${passed ? 'exam-score-pass' : 'exam-score-fail'}`;

    const autoMsg = autoSubmitted ? ' ⏰ Time ran out — auto-submitted.' : '';
    document.getElementById('examScoreText').textContent = passed
        ? `🎉 Passed! Well done, ${name}!${autoMsg}`
        : `Keep trying, ${name}!${autoMsg}`;
    document.getElementById('examScoreSub').textContent = `You scored ${score} out of ${total} (${percentage}%) – ${passed ? 'PASS ✅' : 'FAIL ❌'}`;

    let tbody = '';
    if (answerKey) {
        answerKey.forEach((a, i) => {
            const opts = a.options;
            tbody += `
            <tr class="${a.correct ? 'exam-correct-row' : 'exam-incorrect-row'}">
                <td>${i + 1}</td>
                <td>${escapeHtml(a.questionText)}</td>
                <td>${a.chosen ? `${a.chosen}: ${escapeHtml(opts[a.chosen] || '—')}` : '<em>Not answered</em>'}</td>
                <td>${a.correctOption}: ${escapeHtml(opts[a.correctOption])}</td>
                <td><span class="exam-pill ${a.correct ? 'exam-pill-correct' : 'exam-pill-incorrect'}">${a.correct ? '✓ Correct' : '✗ Wrong'}</span></td>
            </tr>`;
        });
    }
    document.getElementById('examAnswerBody').innerHTML = tbody;
}

/* ─── Admin: Question Bank ──────────────────────────────── */
window.showExamAdmin = async function () {
    if (window.currentUserRole !== 'admin' && window.currentUserRole !== 'quality') {
        alert('❌ Admin/Quality access required');
        return;
    }
    switchExamView('admin');
    await loadAdminQuestions();
};

async function loadAdminQuestions() {
    try {
        const res = await apiCall('/exam/questions');
        renderAdminQuestions(res.data);
    } catch (e) {
        document.getElementById('adminQList').innerHTML = `<p style="color:red">Error: ${e.message}</p>`;
    }
}

function renderAdminQuestions(questions) {
    const container = document.getElementById('adminQList');
    if (!questions.length) {
        container.innerHTML = '<p style="color:#888; text-align:center; padding:20px;">No questions yet. Add some below!</p>';
        return;
    }
    const grouped = { winding: [], core: [], tanking: [] };
    questions.forEach(q => (grouped[q.section] || []).push(q));

    let html = '';
    Object.entries(grouped).forEach(([section, qs]) => {
        if (!qs.length) return;
        html += `<div class="exam-admin-section-header">${SECTION_LABELS[section]} (${qs.length})</div>`;
        qs.forEach(q => {
            html += `
            <div class="exam-admin-q-card">
                <div class="exam-admin-q-text">${escapeHtml(q.text)}</div>
                <div class="exam-admin-q-opts">
                    ${['A', 'B', 'C', 'D'].map(k => `
                        <span class="${k === q.correctOption ? 'exam-admin-correct' : ''}">
                            ${k}: ${escapeHtml(q['option' + k])}
                        </span>`).join('')}
                </div>
                <button class="exam-admin-del-btn" onclick="deleteExamQuestion('${q.id}')">🗑 Delete</button>
            </div>`;
        });
    });
    container.innerHTML = html;
}

window.deleteExamQuestion = async function (id) {
    if (!confirm('Delete this question?')) return;
    try {
        await apiCall(`/exam/questions/${id}`, 'DELETE');
        await loadAdminQuestions();
    } catch (e) { alert('❌ ' + e.message); }
};

window.submitNewQuestion = async function () {
    const get = id => document.getElementById(id)?.value?.trim() || '';
    const body = {
        text: get('newQ_text'),
        section: get('newQ_section'),
        optionA: get('newQ_A'),
        optionB: get('newQ_B'),
        optionC: get('newQ_C'),
        optionD: get('newQ_D'),
        correctOption: get('newQ_correct')
    };
    if (!body.text || !body.section || !body.optionA || !body.optionB || !body.optionC || !body.optionD || !body.correctOption) {
        document.getElementById('newQError').textContent = '❌ All fields are required.';
        return;
    }
    try {
        await apiCall('/exam/questions', 'POST', body);
        document.getElementById('newQError').textContent = '✅ Question added!';
        document.getElementById('newQError').style.color = 'green';
        ['text', 'A', 'B', 'C', 'D'].forEach(f => { const el = document.getElementById(`newQ_${f}`); if (el) el.value = ''; });
        await loadAdminQuestions();
    } catch (e) {
        document.getElementById('newQError').textContent = '❌ ' + e.message;
        document.getElementById('newQError').style.color = 'red';
    }
};

/* ─── Admin: Results List ───────────────────────────────── */
window.showExamResults = async function () {
    if (window.currentUserRole !== 'admin' && window.currentUserRole !== 'quality') {
        alert('❌ Admin/Quality access required');
        return;
    }
    switchExamView('resultsList');
    try {
        const res = await apiCall('/exam/results');
        const rows = res.data;
        if (!rows.length) {
            document.getElementById('examResultsList').innerHTML = '<p style="color:#888;text-align:center;padding:20px;">No exam results yet.</p>';
            return;
        }
        let html = `<table class="exam-results-table">
            <thead><tr><th>#</th><th>Operator</th><th>Section</th><th>Score</th><th>%</th><th>Result</th><th>Date</th></tr></thead><tbody>`;
        rows.forEach((r, i) => {
            html += `<tr>
                <td>${i + 1}</td>
                <td>${escapeHtml(r.operatorName)}</td>
                <td>${SECTION_LABELS[r.section] || r.section}</td>
                <td>${r.score}/${r.total}</td>
                <td>${r.percentage}%</td>
                <td><span class="exam-pill ${r.passed ? 'exam-pill-correct' : 'exam-pill-incorrect'}">${r.passed ? 'PASS' : 'FAIL'}</span></td>
                <td style="font-size:11px;">${new Date(r.submittedAt).toLocaleString('en-IN')}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        document.getElementById('examResultsList').innerHTML = html;
    } catch (e) {
        document.getElementById('examResultsList').innerHTML = `<p style="color:red">${e.message}</p>`;
    }
};

/* ─── Utility ────────────────────────────────────────────── */
function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Export
window.loadExamTab = window.loadExamTab;
window.switchExamView = window.switchExamView;
window.startExamSection = window.startExamSection;
window.beginExam = window.beginExam;
window.submitExam = window.submitExam;
window.selectExamOption = window.selectExamOption;
window.examGoNext = window.examGoNext;
window.showExamAdmin = window.showExamAdmin;
window.showExamResults = window.showExamResults;
window.submitNewQuestion = window.submitNewQuestion;
window.deleteExamQuestion = window.deleteExamQuestion;
