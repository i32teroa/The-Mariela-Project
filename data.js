// The Mariela Project - Game Data
// Replace this with your real B1 and B2 content

const gameData = {
    // Map definitions
    maps: {
        B1: {
            name: "B1 - Intermediate",
            unlocked: true,
            nodes: {
                // Node ID: { title, explanation, exercises, prerequisites, xpReward, isBoss, position }
                "start": {
                    title: "Welcome to B1!",
                    explanation: "This is the first node. You'll learn how the game works.",
                    exercises: [
                        {
                            question: "What is the past tense of 'go'?",
                            type: "multiple-choice",
                            options: ["Goed", "Went", "Gone", "Going"],
                            correct: "Went"
                        },
                        {
                            question: "Which sentence is correct?",
                            type: "multiple-choice",
                            options: [
                                "She go to school yesterday",
                                "She went to school yesterday",
                                "She goes to school yesterday",
                                "She going to school yesterday"
                            ],
                            correct: "She went to school yesterday"
                        },
                        {
                            question: "Fill in the blank: I ___ (see) that movie last week.",
                            type: "fill-blank",
                            correct: "saw"
                        }
                    ],
                    prerequisites: [],
                    xpReward: 10,
                    isBoss: false,
                    position: { x: 900, y: 900 }  // Grid coordinates (0,0 = center)
                },
                "past_simple": {
                    title: "Past Simple Tense",
                    explanation: "The past simple is used for completed actions in the past. Regular verbs add -ed.",
                    exercises: [
                        {
                            question: "What is the past simple of 'walk'?",
                            type: "multiple-choice",
                            options: ["Walked", "Walk", "Walking", "Walks"],
                            correct: "Walked"
                        }
                    ],
                    prerequisites: ["start"],
                    xpReward: 10,
                    isBoss: true,
                    position: { x: 900, y: 1000 }
                },
                "past_continuous": {
                    title: "Past Continuous Tense",
                    explanation: "The past continuous is used for actions that happened during a period in the past",
                    exercises: [
                        {
                            question: "What is the past simple of 'walk'?",
                            type: "multiple-choice",
                            options: ["Walked", "Walk", "Walking", "Walks"],
                            correct: "Walked"
                        }
                    ],
                    prerequisites: ["past_simple"],
                    xpReward: 10,
                    isBoss: true,
                    position: { x: 1000, y: 1000 }
                }
                // Add all your real B1 nodes here
            }
        },
        B2: {
            name: "B2 - Upper Intermediate",
            unlocked: false,  // Locked until B1 is completed
            nodes: {}
            // Populate with your B2 content
        }
    },
    
    // Student progress (saved to localStorage)
    defaultProgress: {
        currentMap: "B1",
        completedNodes: [],
        nodeAttempts: {},  // { nodeId: number of attempts }
        totalXP: 0,
        level: 1,
        cosmetics: []
    }
};
