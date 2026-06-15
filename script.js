// The Mariela Project - Main Game Engine

// ========== STATE ==========
let currentMap = "B1";
let progress = JSON.parse(localStorage.getItem("mariela_progress")) || {
    currentMap: "B1",
    completedNodes: [],
    nodeAttempts: {},
    totalXP: 0,
    level: 1,
    cosmetics: []
};

let showHidden = false;
let currentNodeId = null;

// ========== DOM ELEMENTS ==========
const skillTreeGrid = document.getElementById("skillTreeGrid");
const showHiddenToggle = document.getElementById("showHiddenToggle");
const nodeModal = document.getElementById("nodeModal");
const exerciseScreen = document.getElementById("exerciseScreen");
const modalTitle = document.getElementById("modalTitle");
const modalExplanation = document.getElementById("modalExplanation");
const modalPlayBtn = document.getElementById("modalPlayBtn");
const modalPrereq = document.getElementById("modalPrereq");
const backToNodeBtn = document.getElementById("backToNodeBtn");
const exerciseTitle = document.getElementById("exerciseTitle");
const exerciseExplanationDiv = document.getElementById("exerciseExplanation");
const startExerciseBtn = document.getElementById("startExerciseBtn");
const questionsContainer = document.getElementById("questionsContainer");
const submitExerciseBtn = document.getElementById("submitExerciseBtn");
const exerciseFeedback = document.getElementById("exerciseFeedback");


// ========== HELPER FUNCTIONS ==========
function saveProgress() {
    localStorage.setItem("mariela_progress", JSON.stringify(progress));
}

function isNodeUnlocked(nodeId, nodeData) {
    if (progress.completedNodes.includes(nodeId)) return true;
    if (!nodeData.prerequisites || nodeData.prerequisites.length === 0) return true;
    return nodeData.prerequisites.every(reqId => progress.completedNodes.includes(reqId));
}

function renderSkillTree() {
    const mapData = gameData.maps[currentMap];
    if (!mapData) return;
    
    skillTreeGrid.innerHTML = "";
    const nodes = mapData.nodes;
    
    for (const [nodeId, nodeData] of Object.entries(nodes)) {
        const isCompleted = progress.completedNodes.includes(nodeId);
        const isUnlocked = isNodeUnlocked(nodeId, nodeData);
        const isVisible = isUnlocked || showHidden;
        
        if (!isVisible) continue;
        
        const nodeDiv = document.createElement("div");
        nodeDiv.className = "node";
        if (isCompleted) nodeDiv.classList.add("completed");
        if (!isUnlocked && !isCompleted) nodeDiv.classList.add("locked");

        if (nodeData.position) {
            nodeDiv.style.left = nodeData.position.x + "px";
            nodeDiv.style.top = nodeData.position.y + "px";
        }
        
        // Determine which image to use
        let imageFile = "Advancement-plain-raw.webp";  // default raw
        if (nodeData.isBoss){
            imageFile = "Advancement-fancy-raw.webp"
        }
        if (isCompleted) {
            if (nodeData.isBoss){
                imageFile = "Advancement-fancy-worn.png"
            }
            else{
                imageFile = "Advancement-plain-worn.png";   // worn version when completed
            }
        }

        nodeDiv.innerHTML = `
            <img class="node-icon-img" src="assets/images/nodes/${imageFile}" alt="${nodeData.title}">
            <div class="node-emoji">${nodeData.isBoss ? "👑" : "📘"}</div>
        `;
        
        nodeDiv.onclick = () => openNodeModal(nodeId, nodeData, isUnlocked);
        skillTreeGrid.appendChild(nodeDiv);
    }
}

function openNodeModal(nodeId, nodeData, isUnlocked) {
    currentNodeId = nodeId;
    modalTitle.innerText = nodeData.title;
    modalExplanation.innerText = nodeData.explanation;
    
    if (isUnlocked || progress.completedNodes.includes(nodeId)) {
        modalPlayBtn.classList.remove("hidden");
        modalPrereq.classList.add("hidden");
    } else {
        modalPlayBtn.classList.add("hidden");
        modalPrereq.classList.remove("hidden");
        modalPrereq.innerText = `🔒 Requires: ${nodeData.prerequisites.join(", ")}`;
    }
    
    nodeModal.classList.remove("hidden");
}

function startExercise() {
    if (!currentNodeId) return;
    const nodeData = gameData.maps[currentMap].nodes[currentNodeId];
    if (!nodeData) return;
    
    nodeModal.classList.add("hidden");
    exerciseScreen.classList.remove("hidden");
    
    exerciseTitle.innerText = nodeData.title;
    exerciseExplanationDiv.innerText = nodeData.explanation;
    startExerciseBtn.classList.remove("hidden");
    questionsContainer.classList.add("hidden");
    submitExerciseBtn.classList.add("hidden");
    exerciseFeedback.innerHTML = "";
}

function loadQuestions() {
    if (!currentNodeId) return;
    const nodeData = gameData.maps[currentMap].nodes[currentNodeId];
    if (!nodeData) return;
    
    startExerciseBtn.classList.add("hidden");
    questionsContainer.classList.remove("hidden");
    questionsContainer.innerHTML = "";
    
    nodeData.exercises.forEach((ex, idx) => {
        const questionDiv = document.createElement("div");
        questionDiv.className = "question";
        questionDiv.innerHTML = `
            <p><strong>${idx + 1}. ${ex.question}</strong></p>
            ${ex.type === "multiple-choice" ? `
                <div class="options">
                    ${ex.options.map(opt => `
                        <label>
                            <input type="radio" name="q${idx}" value="${opt}"> ${opt}
                        </label><br>
                    `).join("")}
                </div>
            ` : `
                <input type="text" name="q${idx}" placeholder="Your answer..." class="fill-input">
            `}
        `;
        questionsContainer.appendChild(questionDiv);
    });
    
    submitExerciseBtn.classList.remove("hidden");
}

function submitExercise() {
    if (!currentNodeId) return;
    const nodeData = gameData.maps[currentMap].nodes[currentNodeId];
    if (!nodeData) return;
    
    // Track attempt
    progress.nodeAttempts[currentNodeId] = (progress.nodeAttempts[currentNodeId] || 0) + 1;
    
    let score = 0;
    const results = [];
    
    nodeData.exercises.forEach((ex, idx) => {
        let userAnswer;
        if (ex.type === "multiple-choice") {
            const selected = document.querySelector(`input[name="q${idx}"]:checked`);
            userAnswer = selected ? selected.value : "";
        } else {
            const input = document.querySelector(`input[name="q${idx}"]`);
            userAnswer = input ? input.value.trim().toLowerCase() : "";
        }
        
        const isCorrect = userAnswer.toLowerCase() === ex.correct.toLowerCase();
        if (isCorrect) score++;
        results.push({ correct: isCorrect, correctAnswer: ex.correct, userAnswer });
    });
    
    const percentage = (score / nodeData.exercises.length) * 100;
    const passed = percentage >= 75; // 75% threshold
    
    if (passed && !progress.completedNodes.includes(currentNodeId)) {
        // Award XP and mark complete
        progress.completedNodes.push(currentNodeId);
        progress.totalXP += nodeData.xpReward;
        
        // Simple level up logic (100 XP per level)
        const newLevel = Math.floor(progress.totalXP / 100) + 1;
        if (newLevel > progress.level) {
            progress.level = newLevel;
            exerciseFeedback.innerHTML += `<p>🎉 LEVEL UP! You are now level ${progress.level}! 🎉</p>`;
        }
        
        saveProgress();
        renderSkillTree();
        exerciseFeedback.innerHTML = `<p style="color: #88ffaa;">✅ PASSED! +${nodeData.xpReward} XP</p>`;
        
        // Auto-close exercise screen after 2 seconds
        setTimeout(() => {
            exerciseScreen.classList.add("hidden");
            exerciseFeedback.innerHTML = "";
            questionsContainer.innerHTML = "";
        }, 2000);
    } else if (passed && progress.completedNodes.includes(currentNodeId)) {
        exerciseFeedback.innerHTML = `<p style="color: #aaaaff;">ℹ️ You already passed this node. No additional XP.</p>`;
    } else {
        exerciseFeedback.innerHTML = `
            <p style="color: #ffaaaa;">❌ FAILED! You got ${score}/${nodeData.exercises.length} (${Math.round(percentage)}%). Need 75% to pass.</p>
            <p>💡 Review the topics you missed and try again. Hints are shown below:</p>
            <ul>
                ${results.map((r, i) => r.correct ? "" : `<li>Question ${i+1}: Correct answer was "${r.correctAnswer}"</li>`).join("")}
            </ul>
            <button id="retryBtn" class="submit-btn">Try Again</button>
        `;
        
        const retryBtn = document.getElementById("retryBtn");
        if (retryBtn) {
            retryBtn.onclick = () => {
                exerciseFeedback.innerHTML = "";
                loadQuestions();
            };
        }
    }
    
    saveProgress();
}

// ========== EVENT LISTENERS ==========
showHiddenToggle.addEventListener("change", (e) => {
    showHidden = e.target.checked;
    renderSkillTree();
});

modalPlayBtn.addEventListener("click", startExercise);
backToNodeBtn.addEventListener("click", () => {
    exerciseScreen.classList.add("hidden");
    questionsContainer.innerHTML = "";
    exerciseFeedback.innerHTML = "";
    startExerciseBtn.classList.remove("hidden");
});
startExerciseBtn.addEventListener("click", loadQuestions);
submitExerciseBtn.addEventListener("click", submitExercise);

// Close modal when clicking X
document.querySelector(".close-btn")?.addEventListener("click", () => {
    nodeModal.classList.add("hidden");
});

// Click outside modal to close
nodeModal.addEventListener("click", (e) => {
    if (e.target === nodeModal) nodeModal.classList.add("hidden");
});

// Map switching (simplified for now)
document.querySelectorAll(".map-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const mapId = btn.getAttribute("data-map");
        if (gameData.maps[mapId] && gameData.maps[mapId].unlocked) {
            currentMap = mapId;
            progress.currentMap = mapId;
            saveProgress();
            renderSkillTree();
        }
    });
});

// ========== INITIAL RENDER ==========
renderSkillTree();
