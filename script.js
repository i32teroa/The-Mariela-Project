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

// ========== DRAG TO PAN ==========
const mapContainer = document.querySelector('.map-container');
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let scrollLeft = 0;
let scrollTop = 0;

if (mapContainer) {
    // Mouse down: start dragging
    mapContainer.addEventListener('mousedown', (e) => {
        // Don't start drag if clicking on a node (nodes have their own click handlers)
        if (e.target.closest('.node')) return;
        
        isDragging = true;
        mapContainer.classList.add('dragging');
        dragStartX = e.pageX - mapContainer.offsetLeft;
        dragStartY = e.pageY - mapContainer.offsetTop;
        scrollLeft = mapContainer.scrollLeft;
        scrollTop = mapContainer.scrollTop;
    });
    
    // Mouse up: stop dragging
    window.addEventListener('mouseup', () => {
        isDragging = false;
        mapContainer.classList.remove('dragging');
    });
    
    // Mouse move: pan while dragging
    mapContainer.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const x = e.pageX - mapContainer.offsetLeft;
        const y = e.pageY - mapContainer.offsetTop;
        const walkX = (x - dragStartX) * 1;  // Sensitivity (1 = normal)
        const walkY = (y - dragStartY) * 1;
        
        mapContainer.scrollLeft = scrollLeft - walkX;
        mapContainer.scrollTop = scrollTop - walkY;
    });
    
    // Prevent default drag behavior on images (optional)
    mapContainer.addEventListener('dragstart', (e) => {
        e.preventDefault();
    });
}

// ========== HELPER FUNCTIONS ==========
function saveProgress() {
    localStorage.setItem("mariela_progress", JSON.stringify(progress));
}

function isNodeUnlocked(nodeId, nodeData) {
    if (progress.completedNodes.includes(nodeId)) return true;
    if (!nodeData.prerequisites || nodeData.prerequisites.length === 0) return true;
    return nodeData.prerequisites.every(reqId => progress.completedNodes.includes(reqId));
}

// Center the map view on a specific coordinate
function centerMapOn(x, y) {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    
    // Get viewport dimensions
    const containerWidth = mapContainer.clientWidth;
    const containerHeight = mapContainer.clientHeight;
    
    // Calculate scroll position to center the point
    mapContainer.scrollLeft = x - (containerWidth / 2);
    mapContainer.scrollTop = y - (containerHeight / 2);
}

// ========== LINE DRAWING ==========
function drawAllLines() {
    const svg = document.getElementById('lineCanvas');
    if (!svg) return;
    // Get current node size from CSS variable
    const nodeSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--node-size'));
    const offset = isNaN(nodeSize) ? 7 : nodeSize / 7;  // Fallback to 32px if not found
    svg.innerHTML = '';  // Clear existing lines
    
    const mapData = gameData.maps[currentMap];
    if (!mapData) return;
    
    // Get all nodes and their positions
    const nodes = mapData.nodes;
    
    // Loop through each node to find its prerequisites
    for (const [nodeId, nodeData] of Object.entries(nodes)) {
        if (!nodeData.prerequisites || nodeData.prerequisites.length === 0) continue;
        
        // Get this node's position
        const targetPos = nodeData.position;
        if (!targetPos) continue;
        
        // For each prerequisite, draw a line from prerequisite to this node
        for (const prereqId of nodeData.prerequisites) {
            const prereqData = nodes[prereqId];
            if (!prereqData || !prereqData.position) continue;
            
            const startPos = prereqData.position;
            
            // Determine line style based on completion and visibility
            const isPrereqCompleted = progress.completedNodes.includes(prereqId);
            const isTargetCompleted = progress.completedNodes.includes(nodeId);
            const isHiddenMode = showHidden;
            
            let lineColor = '#4a4a6e';  // Default gray
            let lineOpacity = 0.4;
            let lineWidth = 2;
            
            if (isPrereqCompleted) {
                // Completed path: bright and visible
                lineColor = '#70ed76ff';
                lineOpacity = 0.9;
                lineWidth = 6;
            } else if (isHiddenMode) {
                // Hidden mode but not completed: gray and faint
                lineColor = '#4a4a6e';
                lineOpacity = 0.3;
                lineWidth = 3.5;
            } else {
                // Not completed and not showing hidden: don't draw at all
                continue;
            }
            
            // Create the SVG line
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", startPos.x + offset);
            line.setAttribute("y1", startPos.y + offset);
            line.setAttribute("x2", targetPos.x + offset);
            line.setAttribute("y2", targetPos.y + offset);
            line.setAttribute("stroke", lineColor);
            line.setAttribute("stroke-width", lineWidth);
            line.setAttribute("opacity", lineOpacity);
            line.setAttribute("stroke-linecap", "round");
            
            svg.appendChild(line);
        }
    }
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
            <div class="node-tooltip">${nodeData.title}</div>
        `;
        
        nodeDiv.onclick = () => openNodeModal(nodeId, nodeData, isUnlocked);
        skillTreeGrid.appendChild(nodeDiv);
    }
    drawAllLines();
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
        const mapData = gameData.maps[currentMap];
        const prereqTitles = nodeData.prerequisites.map(prereqId => {
            const prereqNode = mapData.nodes[prereqId];
            return prereqNode ? prereqNode.title : prereqId;
        });
        modalPrereq.innerText = `🔒 Requires: ${prereqTitles.join(", ")}`;
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
        drawAllLines();
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
// On page load, sync showHidden with the checkbox's actual state
showHidden = showHiddenToggle.checked;

showHiddenToggle.addEventListener("change", (e) => {
    showHidden = e.target.checked;
    renderSkillTree();
    drawAllLines();
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
            drawAllLines();
            centerMapOn(1000, 1000);
        }
    });
});

// ========== INITIAL RENDER ==========
renderSkillTree();
drawAllLines();
centerMapOn(1000, 1000);