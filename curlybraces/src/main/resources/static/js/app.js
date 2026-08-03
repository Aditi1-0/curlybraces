// ==========================================
// 1. CONFIG & LOADING STATE LOGIC
// ==========================================
const loadingMessages = [
    "Parsing AST tree...",
    "Brewing Java bytecode...",
    "Counting lost semicolons...",
    "Negotiating with Gemini LLM...",
    "Polishing curly braces { }...",
    "Consulting Garbage Collector...",
    "Resolving NullPointers...",
    "Almost there, don't panic!"
];

let messageInterval = null;

function setButtonLoading(isLoading) {
    const btn = document.getElementById("analyzeBtn");
    const btnText = document.getElementById("btnText");
    const btnLoader = document.getElementById("btnLoader");
    const loaderText = document.getElementById("loaderText");

    if (!btn || !btnText || !btnLoader || !loaderText) return;

    if (isLoading) {
        btn.disabled = true;
        btnText.classList.add("hidden");
        btnLoader.classList.remove("hidden");

        let msgIndex = 0;
        loaderText.textContent = loadingMessages[0];

        messageInterval = setInterval(() => {
            msgIndex = (msgIndex + 1) % loadingMessages.length;
            loaderText.classList.add("opacity-0");
            setTimeout(() => {
                loaderText.textContent = loadingMessages[msgIndex];
                loaderText.classList.remove("opacity-0");
            }, 150);
        }, 1500);

    } else {
        btn.disabled = false;
        btnText.classList.remove("hidden");
        btnLoader.classList.add("hidden");

        if (messageInterval) {
            clearInterval(messageInterval);
            messageInterval = null;
        }
    }
}

// ==========================================
// 2. MAIN ANALYSIS LOGIC
// ==========================================
async function handleAnalysis() {
    const codeInput = document.getElementById("codeEditor")?.value;
    const titleInput = document.getElementById("snippetTitle")?.value;

    if (!codeInput || !codeInput.trim()) {
        alert("Please paste or type valid Java code first.");
        return;
    }

    setButtonLoading(true);

    try {
        const response = await fetch("/api/submissions/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                title: titleInput || "Java Code Snippet",
                code: codeInput
            })
        });

        if (response.status === 401) {
            openAuthModal(false);
            throw new Error("Please log in to submit code.");
        }

        if (!response.ok) {
            throw new Error(`Server returned HTTP ${response.status}`);
        }

        const data = await response.json();

        // Safely invoke display & history functions
        displayResults(data);
        loadHistory();

    } catch (err) {
        console.error("Analysis Error:", err);
        if (err.message !== "Please log in to submit code.") {
            alert(`Analysis failed: ${err.message}`);
        }
    } finally {
        setButtonLoading(false);
    }
}

// ==========================================
// 3. DISPLAY RESULTS & DASHBOARD UPDATES
// ==========================================
function displayResults(data) {
    if (!data) return;

    // Elements matching your index.html IDs
    const scoreVal = document.getElementById("scoreVal");
    const tcVal = document.getElementById("tcVal");
    const ccVal = document.getElementById("ccVal");
    const scoreBadge = document.getElementById("scoreBadge");
    const suggestionsList = document.getElementById("suggestionsList");
    const refactoredOutput = document.getElementById("refactoredOutput");

    // Metrics
    if (scoreVal) scoreVal.innerText = data.overallScore !== undefined ? `${data.overallScore}` : "--";
    if (tcVal) tcVal.innerText = data.timeComplexity || "--";
    if (ccVal) ccVal.innerText = data.cyclomaticComplexity || "--";

    // Badge styling
    if (scoreBadge && data.overallScore !== undefined) {
        const score = data.overallScore;
        scoreBadge.innerText = score >= 80 ? "Optimal Solution" : score >= 50 ? "Needs Work" : "Critical Refactor Required";
        scoreBadge.className = `px-3 py-1 rounded-full text-xs font-medium border ${
            score >= 80 ? "bg-emerald-950 text-emerald-400 border-emerald-800" :
                score >= 50 ? "bg-amber-950 text-amber-400 border-amber-800" :
                    "bg-rose-950 text-rose-400 border-rose-800"
        }`;
    }

    // Feedback & Warnings
    if (suggestionsList) {
        let suggestions = [];
        if (typeof data.suggestionsJson === "string") {
            try { suggestions = JSON.parse(data.suggestionsJson); } catch (e) {}
        } else {
            suggestions = data.suggestions || data.feedback || [];
        }

        if (Array.isArray(suggestions) && suggestions.length > 0) {
            suggestionsList.innerHTML = suggestions
                .map(item => `<li class="p-2 bg-gray-900 rounded border border-gray-800 text-gray-300">• ${item}</li>`)
                .join("");
        } else {
            suggestionsList.innerHTML = `<li class="p-2 bg-gray-900 rounded border border-gray-800 text-emerald-400">No issues found! Clean code.</li>`;
        }
    }

    // Refactored Code
    if (refactoredOutput) {
        refactoredOutput.innerText = data.refactoredCode || data.suggestedCode || "// No refactored code provided.";
    }
}

// ==========================================
// 4. HISTORY, PROGRESS CHART & SAMPLE UTILITIES
// ==========================================
let growthChartInstance = null;

async function loadHistory() {
    const tableBody = document.getElementById("historyTableBody");
    if (!tableBody) return;

    try {
        const response = await fetch("/api/submissions/history");

        if (response.status === 401) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Log in to view your saved code history.</td></tr>`;
            updateGrowthChart([]);
            return;
        }

        if (!response.ok) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">Unable to retrieve submission history.</td></tr>`;
            updateGrowthChart([]);
            return;
        }

        const history = await response.json();

        if (!Array.isArray(history) || history.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="p-4 text-center text-gray-500">No past submissions yet.</td></tr>`;
            updateGrowthChart([]);
            return;
        }

        window.userSubmissionHistory = history;

        tableBody.innerHTML = history.map((item, index) => {
            const score = item.overallScore !== undefined ? item.overallScore : '--';
            const tc = item.timeComplexity || '--';
            const cc = item.cyclomaticComplexity || '--';
            const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recent';

            return `
                <tr class="border-b border-gray-800 hover:bg-slate-800/50">
                    <td class="p-3 font-medium text-gray-200">${item.title || 'Java Snippet'}</td>
                    <td class="p-3 font-semibold text-pastel-purple">${score}</td>
                    <td class="p-3 text-emerald-400">${tc}</td>
                    <td class="p-3 text-amber-400">${cc}</td>
                    <td class="p-3 text-xs text-gray-500">${dateStr}</td>
                    <td class="p-3">
                        <button onclick="viewHistoryItem(${index})" class="text-xs text-indigo-400 hover:underline">View</button>
                    </td>
                </tr>
            `;
        }).join("");

        updateGrowthChart(history);

    } catch (err) {
        console.warn("Could not load history:", err);
    }
}

function viewHistoryItem(index) {
    if (window.userSubmissionHistory && window.userSubmissionHistory[index]) {
        const item = window.userSubmissionHistory[index];

        // 1. Populate the code editor and title input
        const codeEditor = document.getElementById("codeEditor");
        const snippetTitle = document.getElementById("snippetTitle");
        if (codeEditor) codeEditor.value = item.rawCode || item.code || "";
        if (snippetTitle) snippetTitle.value = item.title || "";

        // 2. Refresh the display metrics
        displayResults(item);

        // 3. Smooth scroll back up to the editor
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}
function updateGrowthChart(history) {
    const ctx = document.getElementById('growthChart')?.getContext('2d');
    if (!ctx) return;

    const sortedData = [...history].reverse();
    const labels = sortedData.map((s, i) => s.title ? s.title.substring(0, 10) + '...' : `#${i + 1}`);
    const scores = sortedData.map(s => s.overallScore !== undefined ? s.overallScore : 0);

    if (growthChartInstance) {
        growthChartInstance.destroy();
    }

    growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels.length > 0 ? labels : ['Run 1', 'Run 2'],
            datasets: [{
                label: 'Code Quality Score',
                data: scores.length > 0 ? scores : [0, 0],
                borderColor: '#C084FC',
                backgroundColor: 'rgba(192, 132, 252, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { min: 0, max: 100, grid: { color: '#334155' } },
                x: { grid: { color: '#334155' } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function loadSampleCode() {
    const sample = `public class TwoSum {\n    public int[] twoSum(int[] nums, int target) {\n        for (int i = 0; i < nums.length; i++) {\n            for (int j = i + 1; j < nums.length; j++) {\n                if (nums[i] + nums[j] == target) {\n                    return new int[] { i, j };\n                }\n            }\n        }\n        return new int[] {};\n    }\n}`;
    const codeEditor = document.getElementById("codeEditor");
    const snippetTitle = document.getElementById("snippetTitle");
    if (codeEditor) codeEditor.value = sample;
    if (snippetTitle) snippetTitle.value = "O(N²) Two Sum Sample";
}

// ==========================================
// 5. AUTHENTICATION & MODAL HELPERS
// ==========================================
function openAuthModal(isRegister = false) {
    const modal = document.getElementById("authModal");
    const emailInput = document.getElementById("authEmail");
    const modalTitle = document.getElementById("modalTitle");
    const toggleBtn = document.getElementById("toggleAuthBtn");

    if (!modal) return;
    modal.classList.remove("hidden");

    if (isRegister) {
        if (modalTitle) modalTitle.innerText = "Create Account";
        if (emailInput) {
            emailInput.classList.remove("hidden");
            emailInput.required = true;
        }
        if (toggleBtn) toggleBtn.innerText = "Already have an account? Log in";
    } else {
        if (modalTitle) modalTitle.innerText = "Welcome Back";
        if (emailInput) {
            emailInput.classList.add("hidden");
            emailInput.required = false;
        }
        if (toggleBtn) toggleBtn.innerText = "Need an account? Register";
    }
}

function closeAuthModal() {
    const modal = document.getElementById("authModal");
    if (modal) modal.classList.add("hidden");
}

function toggleAuthMode() {
    const emailInput = document.getElementById("authEmail");
    const isCurrentlyLogin = emailInput ? emailInput.classList.contains("hidden") : true;
    openAuthModal(isCurrentlyLogin);
}

async function handleAuth(event) {
    event.preventDefault();

    const usernameInput = document.getElementById("authUsername")?.value;
    const emailInput = document.getElementById("authEmail");
    const passwordInput = document.getElementById("authPassword")?.value;

    const isRegister = emailInput && !emailInput.classList.contains("hidden");
    const endpoint = isRegister ? "/api/auth/register" : "/api/auth/login";

    const payload = isRegister
        ? { username: usernameInput, email: emailInput.value, password: passwordInput }
        : { username: usernameInput, password: passwordInput };

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorMsg = await response.text();
            throw new Error(errorMsg || "Authentication failed");
        }

        const user = await response.json();
        closeAuthModal();
        updateNavbar(user);
        loadHistory();

        document.getElementById("authUsername").value = "";
        if (emailInput) emailInput.value = "";
        document.getElementById("authPassword").value = "";

    } catch (err) {
        alert(err.message);
    }
}

async function checkAuthStatus() {
    try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
            const user = await response.json();
            updateNavbar(user);
        } else {
            updateNavbar(null);
        }
    } catch (err) {
        updateNavbar(null);
    }
}

async function handleLogout() {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        updateNavbar(null);
        loadHistory();
    } catch (err) {
        console.error("Logout failed", err);
    }
}

function updateNavbar(user) {
    const authContainer = document.getElementById("authContainer");
    if (!authContainer) return;

    if (user && user.username) {
        authContainer.innerHTML = `
            <span class="text-sm font-medium text-purple-300">👋 ${user.username}</span>
            <button onclick="handleLogout()" class="text-xs px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 transition">
                Logout
            </button>
        `;
    } else {
        authContainer.innerHTML = `
            <button onclick="openAuthModal(false)" class="text-xs px-3 py-1.5 rounded-lg text-gray-300 hover:text-white transition">
                Log In
            </button>
            <button onclick="openAuthModal(true)" class="text-xs px-3.5 py-1.5 rounded-lg bg-pastel-purple hover:bg-purple-400 text-slate-950 font-bold transition">
                Sign Up
            </button>
        `;
    }
}

// Page load initialization
document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
    loadHistory();
});