// Hedonic Engineering Profile Quiz

const quizData = {
    categories: {
        'nitric-oxide': {
            name: 'Physical Aliveness',
            subtitle: 'Nitric Oxide',
            description: 'Blood flow, charge, embodied energy — how intensely you need to feel your body to feel alive.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'You prefer subtle warmth and gentle movement',
                    detail: 'You restore and energize yourself best when physical intensity is low. Too much activation burns you out. Your body speaks softly — honor that.',
                    practices: [
                        'Daily walking — 20-30 minutes at an easy, rhythmic pace',
                        'Gentle stretching or restorative yoga before bed',
                        'Warm baths with epsom salt (not hot — comfortable)',
                        'Light swimming or water movement for low-impact activation',
                        'Infrared sauna at moderate temperature (20-30 min)'
                    ]
                },
                medium: {
                    summary: 'You enjoy a clear sense of bodily charge',
                    detail: 'You thrive with noticeable physical activation — enough to feel alive without overwhelm. Your body needs to register effort clearly.',
                    practices: [
                        'Strength training 2-3x per week with progressive load',
                        'Running, cycling, or swimming at moderate intensity (Zone 2-3)',
                        'Dynamic yoga or vinyasa flow',
                        'Cold showers (30-60 seconds) to finish workouts',
                        'Weekend hikes or long walks with elevation'
                    ]
                },
                spicy: {
                    summary: 'You thrive on strong full-body activation',
                    detail: 'Your system craves intensity. Without it, you feel flat. You need to feel your body working at capacity to feel truly present.',
                    practices: [
                        'High-intensity interval training (HIIT) 3-4x per week',
                        'Cold plunges or ice baths (2-5 minutes, progressive)',
                        'Competitive sports or combat training (BJJ, boxing)',
                        'Extended endurance challenges (long runs, cycling centuries)',
                        'Contrast therapy: sauna + cold plunge cycles'
                    ]
                }
            }
        },
        'vagal': {
            name: 'Calm & Safety',
            subtitle: 'Vagal Nerve Tone',
            description: 'Nervous system regulation — how deeply you need to settle to feel truly safe.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'You like light ease',
                    detail: 'A little relaxation goes a long way for you. You don\'t need deep downshifts to feel regulated. Light touch works.',
                    practices: [
                        'Short breaks throughout the day (5-10 minutes of nothing)',
                        'Gentle humming or sighing to activate vagus nerve',
                        'Listening to calming music during transitions',
                        'Brief moments of stillness before starting new tasks',
                        'Light reading before sleep (physical book, not screen)'
                    ]
                },
                medium: {
                    summary: 'You seek deep calm',
                    detail: 'Your system needs real settling — not just a break, but genuine nervous system rest. Shallow relaxation doesn\'t cut it.',
                    practices: [
                        'Daily meditation practice (15-20 minutes, non-negotiable)',
                        'Yoga nidra or body scan relaxation (weekly)',
                        'Extended exhale breathing (4-7-8 pattern) before bed',
                        'Regular massage or bodywork (bi-weekly minimum)',
                        'Digital sabbath: one screen-free evening per week'
                    ]
                },
                spicy: {
                    summary: 'You enjoy total nervous system drop',
                    detail: 'You need profound relaxation to feel truly safe. Your system runs hot and requires deep reset. Half-measures leave you unsatisfied.',
                    practices: [
                        'Float tanks or sensory deprivation (monthly)',
                        'Silent retreat days (quarterly at minimum)',
                        'Deep restorative yoga (60-90 minutes, weekly)',
                        'Scheduled "do nothing" blocks with zero stimulation',
                        'Multi-day digital detox with nature immersion'
                    ]
                }
            }
        },
        'dopamine': {
            name: 'Pleasure & Reward',
            subtitle: 'Endorphins & Dopamine',
            description: 'Motivation, enjoyment, drive — how much pleasure signal you need to stay engaged.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'Small joys lift you',
                    detail: 'You don\'t need big rewards to stay motivated. Subtle pleasures accumulate and sustain you. This is a gift — protect it.',
                    practices: [
                        'Morning coffee or tea ritual done with full, undivided attention',
                        'Daily gratitude noting — 3 specific small things',
                        'Short walks in nature without phone or earbuds',
                        'Simple pleasures list — review and do one daily',
                        'Savoring practice: extend enjoyment of good moments'
                    ]
                },
                medium: {
                    summary: 'You want clear enjoyment',
                    detail: 'Pleasure needs to register clearly to feel meaningful. Background satisfaction isn\'t enough — you need the hit.',
                    practices: [
                        'Weekly reward rituals (favorite meal, special experience)',
                        'Progress tracking with visible milestones and celebrations',
                        'Social activities that genuinely energize you',
                        'Learning new skills with clear feedback loops',
                        'Monthly "treat yourself" experience (non-negotiable)'
                    ]
                },
                spicy: {
                    summary: 'You crave big waves of pleasure',
                    detail: 'Your system is wired for intensity. Without strong pleasure signals, you disengage. The challenge is sustainability.',
                    practices: [
                        'Plan peak experiences monthly (adventure, travel, events)',
                        'Dopamine fasting — scheduled low-stimulation periods to reset',
                        'High-stakes challenges with meaningful rewards',
                        'Contrast therapy: intense effort followed by complete rest',
                        'Build in mandatory recovery after peaks (no back-to-back)'
                    ]
                }
            }
        },
        'oxytocin': {
            name: 'Connection',
            subtitle: 'Oxytocin',
            description: 'Bonding, warmth, closeness — how much intimacy you need to feel connected.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'You prefer warm presence',
                    detail: 'Closeness feels best with some breathing room. You connect through presence rather than intensity. This isn\'t distance — it\'s your way.',
                    practices: [
                        'Parallel activities with loved ones (reading in same room)',
                        'Brief daily check-ins rather than long conversations',
                        'Physical proximity without demands (sitting nearby, working together)',
                        'Consistent but boundaried social rhythms',
                        'Quality over quantity in social time'
                    ]
                },
                medium: {
                    summary: 'You enjoy emotional closeness',
                    detail: 'Genuine intimacy nourishes you — close enough to feel connected, with enough boundary to stay yourself. You need both.',
                    practices: [
                        'Regular deep conversations with close friends (weekly)',
                        'Physical affection — long hugs (20+ seconds), touch, closeness',
                        'Shared experiences that create bonding (cooking, hiking, projects)',
                        'Vulnerability practice — sharing what\'s actually real',
                        'One-on-one time with important people (not just group)'
                    ]
                },
                spicy: {
                    summary: 'You seek deep merging',
                    detail: 'You\'re drawn to profound emotional closeness. This is a gift and a need. Find people who can meet you at depth.',
                    practices: [
                        'Eye gazing practices with trusted partners (5-10 minutes)',
                        'Extended uninterrupted time together (half-days, weekends)',
                        'Co-regulation practices (synchronized breathing, heartbeat sync)',
                        'Group experiences that create collective intimacy',
                        'Intentional community or regular gathering with depth'
                    ]
                }
            }
        },
        'testosterone': {
            name: 'Drive & Edge',
            subtitle: 'Testosterone',
            description: 'Assertiveness, power, intensity — how much edge you need to feel fully alive.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'Grounded confidence feels alive',
                    detail: 'You don\'t need aggression to feel powerful. Steady, quiet strength is your natural mode. Don\'t let the loud ones make you think you\'re missing something.',
                    practices: [
                        'Daily practices that build quiet competence',
                        'Leading through presence rather than force',
                        'Setting boundaries calmly and clearly',
                        'Strength training with controlled, deliberate movement',
                        'Saying no without over-explaining'
                    ]
                },
                medium: {
                    summary: 'Bold energy energizes you',
                    detail: 'You enjoy clear assertiveness — meeting challenge directly without overwhelming yourself or others. You like to feel your power.',
                    practices: [
                        'Regular competition or games with stakes',
                        'Taking leadership roles in projects that matter to you',
                        'Negotiation practice — asking for what you want directly',
                        'Physical challenges that test your edge',
                        'Difficult conversations without backing down'
                    ]
                },
                spicy: {
                    summary: 'Raw intensity thrills you',
                    detail: 'You\'re wired for edge. Without it, life feels dull. This is power — but power needs direction or it becomes chaos.',
                    practices: [
                        'Combat sports or martial arts with contact',
                        'High-stakes situations (speaking, performing, competing)',
                        'Intense debate or intellectual sparring',
                        'Leadership in high-pressure environments',
                        'Channeling aggression through structured outlets'
                    ]
                }
            }
        },
        'psychoactives': {
            name: 'Altered States',
            subtitle: 'Psychoactives',
            description: 'Perspective shifts, non-ordinary experience — how far you need to go to see differently.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'Subtle shifts serve you',
                    detail: 'You don\'t need reality to bend dramatically. Small perspective shifts integrate more easily. You can work with what you have.',
                    practices: [
                        'Journaling to shift perspective on situations',
                        'Reading philosophy or fiction that reframes',
                        'Conversations with people who think very differently',
                        'Micro-dose of novelty — new routes, foods, music',
                        'Nature immersion without agenda'
                    ]
                },
                medium: {
                    summary: 'New perspectives draw you',
                    detail: 'You value deliberately stepping outside your normal frame. These experiences expand your range when used wisely and with intention.',
                    practices: [
                        'Extended meditation retreats (weekend to week-long)',
                        'Deliberate exposure to unfamiliar cultures or ideas',
                        'Breathwork journeys (holotropic, rebirthing)',
                        'Dream work and lucid dreaming practice',
                        'Vision fasting or solo wilderness time'
                    ]
                },
                spicy: {
                    summary: 'Reality-bending calls you',
                    detail: 'You\'re drawn to deep altered states. The insight is easy — the integration is the work. Bring back what you find.',
                    practices: [
                        'Structured psychedelic experiences with integration support',
                        'Extended solo retreats in nature (3+ days)',
                        'Intensive breathwork (multiple sessions, facilitated)',
                        'Rigorous integration practice — journaling, therapy, community',
                        'Working with experienced guides and traditions'
                    ]
                }
            }
        },
        'trauma': {
            name: 'Inner Processing',
            subtitle: 'Trauma Work',
            description: 'Healing, emotional integration — how deeply you need to go to process what you carry.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'Gentle reflection works for you',
                    detail: 'You process slowly and steadily. Intense methods may overwhelm. Trust your gradual approach — it\'s not avoidance, it\'s wisdom.',
                    practices: [
                        'Regular journaling about feelings and patterns',
                        'Talk therapy with a gentle, supportive therapist',
                        'Reading about attachment and emotional patterns',
                        'Self-compassion practices (Kristin Neff\'s work)',
                        'Slow walks while processing difficult things'
                    ]
                },
                medium: {
                    summary: 'Emotional release serves you',
                    detail: 'You benefit from working through feelings deliberately. You can handle more than light processing — and you need it.',
                    practices: [
                        'Somatic therapy (body-based processing)',
                        'EMDR or similar targeted trauma work',
                        'Regular therapy with focus on emotional processing',
                        'Movement practices that release stored emotion',
                        'Crying, shaking, or physical release when needed'
                    ]
                },
                spicy: {
                    summary: 'Deep dives into patterns call you',
                    detail: 'You\'re built for intensive inner work. You can go deep — but depth without containment destabilizes. Always have support.',
                    practices: [
                        'Intensive therapy retreats or residential programs',
                        'IFS (Internal Family Systems) deep work with trained guide',
                        'Psychedelic-assisted therapy (where legal, with support)',
                        'Long-term depth psychotherapy with skilled practitioner',
                        'Integration support network (not solo work)'
                    ]
                }
            }
        },
        'respiration': {
            name: 'State Control',
            subtitle: 'Respiration',
            description: 'Breath as a lever — the most accessible tool you have for changing state.',
            answers: [],
            interpretations: {
                mild: {
                    summary: 'Slow calming breath serves you',
                    detail: 'Simple breathing practices work well. You don\'t need extreme techniques to shift state. Your breath responds to subtle cues.',
                    practices: [
                        'Box breathing (4-4-4-4) for calm',
                        'Extended exhale (4 in, 6-8 out) before sleep',
                        'Three conscious breaths before transitions',
                        'Gentle diaphragmatic breathing practice',
                        'Sighing to release tension throughout day'
                    ]
                },
                medium: {
                    summary: 'Dynamic patterns energize you',
                    detail: 'You respond well to deliberate breathwork. Use it as a reliable tool for both activation and settling. It\'s your tuning fork.',
                    practices: [
                        'Wim Hof method (controlled hyperventilation + holds)',
                        'Alternate nostril breathing for balance',
                        'Breath of fire for energy (kapalabhati)',
                        'Regular breathwork classes or sessions',
                        'Morning activation breath before coffee'
                    ]
                },
                spicy: {
                    summary: 'Deep altered breathing calls you',
                    detail: 'Intensive breathwork opens powerful doors for you. This is your direct control panel — respect its power.',
                    practices: [
                        'Holotropic breathwork sessions (facilitated)',
                        'Extended breath holds (advanced Wim Hof protocol)',
                        'Rebirthing or transformational breath (with guide)',
                        'Multi-hour breathwork journeys',
                        'Combining breath with other high-intensity levers'
                    ]
                }
            }
        }
    },
    currentScreen: 'intro',
    screens: ['intro', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'results']
};

// Question to category mapping
const questionCategories = {
    q1: 'nitric-oxide', q2: 'nitric-oxide',
    q3: 'vagal', q4: 'vagal',
    q5: 'dopamine', q6: 'dopamine',
    q7: 'oxytocin', q8: 'oxytocin',
    q9: 'testosterone', q10: 'testosterone',
    q11: 'psychoactives', q12: 'psychoactives',
    q13: 'trauma', q14: 'trauma',
    q15: 'respiration', q16: 'respiration'
};

function startQuiz() {
    // Reset answers
    Object.keys(quizData.categories).forEach(key => {
        quizData.categories[key].answers = [];
    });
    goToScreen('q1');
}

function restartQuiz() {
    Object.keys(quizData.categories).forEach(key => {
        quizData.categories[key].answers = [];
    });
    goToScreen('intro');
}

function goToScreen(screenId) {
    const screens = document.querySelectorAll('.quiz-screen');
    screens.forEach(screen => screen.classList.remove('active'));

    const targetScreen = document.querySelector(`[data-screen="${screenId}"]`);
    if (targetScreen) {
        targetScreen.classList.add('active');
        quizData.currentScreen = screenId;

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function getNextScreen(currentScreen) {
    const currentIndex = quizData.screens.indexOf(currentScreen);
    if (currentIndex < quizData.screens.length - 1) {
        return quizData.screens[currentIndex + 1];
    }
    return 'results';
}

function selectOption(button) {
    const screen = button.closest('.quiz-screen');
    const screenId = screen.dataset.screen;
    const category = questionCategories[screenId];
    const value = button.dataset.value;

    // Store answer
    if (category && quizData.categories[category]) {
        quizData.categories[category].answers.push(value);
    }

    // Visual feedback
    const options = screen.querySelectorAll('.quiz-option');
    options.forEach(opt => opt.classList.remove('selected'));
    button.classList.add('selected');

    // Move to next screen after brief delay
    setTimeout(() => {
        const nextScreen = getNextScreen(screenId);
        if (nextScreen === 'results') {
            calculateResults();
        }
        goToScreen(nextScreen);
    }, 300);
}

function calculateCategoryResult(answers) {
    if (answers.length === 0) return 'medium';

    const counts = { mild: 0, medium: 0, spicy: 0 };
    answers.forEach(answer => {
        counts[answer]++;
    });

    // Return the most common answer
    let maxCount = 0;
    let result = 'medium';
    Object.keys(counts).forEach(level => {
        if (counts[level] > maxCount) {
            maxCount = counts[level];
            result = level;
        }
    });

    return result;
}

function calculateResults() {
    const results = {};
    const patternCounts = { mild: 0, medium: 0, spicy: 0 };

    Object.keys(quizData.categories).forEach(key => {
        const category = quizData.categories[key];
        const level = calculateCategoryResult(category.answers);
        results[key] = level;
        patternCounts[level]++;
    });

    renderResults(results, patternCounts);
}

function renderResults(results, patternCounts) {
    // Render Matrix
    const matrixContainer = document.getElementById('results-matrix');
    let matrixHTML = '<div class="matrix-grid">';

    Object.keys(quizData.categories).forEach(key => {
        const category = quizData.categories[key];
        const level = results[key];
        const interpretation = category.interpretations[level];

        matrixHTML += `
            <div class="matrix-item" data-level="${level}">
                <div class="matrix-lever">
                    <span class="matrix-name">${category.name}</span>
                    <span class="matrix-subtitle">${category.subtitle}</span>
                </div>
                <div class="matrix-level ${level}">${level}</div>
            </div>
        `;
    });

    matrixHTML += '</div>';
    matrixContainer.innerHTML = matrixHTML;

    // Render Pattern Summary
    const patternContainer = document.getElementById('results-pattern');
    let dominantPattern = 'medium';
    let maxCount = 0;

    Object.keys(patternCounts).forEach(level => {
        if (patternCounts[level] > maxCount) {
            maxCount = patternCounts[level];
            dominantPattern = level;
        }
    });

    const patternDescriptions = {
        mild: {
            title: 'The Gentle Stacker',
            description: 'Your system thrives on consistency, safety, and gentle stacking. Small, repeatable practices serve you better than intense experiences. You\'re not avoiding growth—you\'re building it sustainably. Many people burn out chasing intensity they don\'t need. You know better.',
            growth: 'Your growth edge is staying engaged instead of withdrawing. Keep showing up gently.',
            work: 'Build chains of small practices. A morning walk, an evening stretch, a weekly sauna. Your power is in the stack, not the spike.'
        },
        medium: {
            title: 'The Rhythmic Regulator',
            description: 'You need rhythm, contrast, and deliberate activation. You do well with variety within a stable structure. You\'re naturally calibrated for sustainable intensity—enough to feel alive, not so much that you crash.',
            growth: 'Your growth edge is stabilizing between peaks. Find your sustainable rhythm.',
            work: 'Create weekly rhythms with clear peaks and valleys. Tuesday cold plunge. Thursday breathwork. Saturday social. Sunday rest. Your power is in the pattern.'
        },
        spicy: {
            title: 'The Intensity Seeker',
            description: 'You\'re drawn toward intensity, depth, and transformational states. Your system runs hot—and that\'s not a problem, it\'s a feature. The world needs people willing to go deep. But the difference between an alchemist and an addict is the scoreboard.',
            growth: 'Your growth edge is integrating rather than escalating. Let experiences land before seeking the next one.',
            work: 'Track your state changes. Journal after peak experiences. Build in mandatory integration time. Your power is in bringing back what you find.'
        }
    };

    const pattern = patternDescriptions[dominantPattern];

    patternContainer.innerHTML = `
        <h2>Your Pattern: ${pattern.title}</h2>
        <p>${pattern.description}</p>
        <p class="pattern-growth"><strong>Growth edge:</strong> ${pattern.growth}</p>
        <p class="pattern-work"><strong>Your work:</strong> ${pattern.work}</p>
        <div class="pattern-breakdown">
            <span class="breakdown-item"><span class="dot mild"></span> Mild: ${patternCounts.mild}</span>
            <span class="breakdown-item"><span class="dot medium"></span> Medium: ${patternCounts.medium}</span>
            <span class="breakdown-item"><span class="dot spicy"></span> Spicy: ${patternCounts.spicy}</span>
        </div>
    `;

    // Render Detailed Results
    const detailsContainer = document.getElementById('results-details');
    let detailsHTML = '<h2>In-depth Analysis</h2>';

    Object.keys(quizData.categories).forEach(key => {
        const category = quizData.categories[key];
        const level = results[key];
        const interpretation = category.interpretations[level];

        // Build practices list (show all 5)
        let practicesHTML = '';
        if (interpretation.practices && interpretation.practices.length > 0) {
            practicesHTML = '<div class="lever-practices"><h4>Practices to Try</h4><ul>';
            interpretation.practices.forEach(practice => {
                practicesHTML += `<li>${practice}</li>`;
            });
            practicesHTML += '</ul></div>';
        }

        detailsHTML += `
            <div class="lever-detail" data-level="${level}">
                <div class="lever-header">
                    <div class="lever-info">
                        <h3>${category.name}</h3>
                        <span class="lever-subtitle">${category.subtitle}</span>
                    </div>
                    <span class="lever-level ${level}">${level}</span>
                </div>
                <p class="lever-description">${category.description}</p>
                <p class="lever-summary"><strong>${interpretation.summary}</strong></p>
                <p class="lever-meaning">${interpretation.detail}</p>
                ${practicesHTML}
            </div>
        `;
    });

    detailsContainer.innerHTML = detailsHTML;

    // Render Stacking Suggestions
    const stacksContainer = document.getElementById('results-stacks');
    if (stacksContainer) {
        const stacks = getStackingSuggestions(results, dominantPattern);
        let stacksHTML = '<h2>Stacking Suggestions</h2>';
        stacksHTML += '<p class="stacks-intro">Levers work better together. Here are some combinations tailored to your profile:</p>';
        stacksHTML += '<div class="stacks-grid">';

        stacks.forEach(stack => {
            stacksHTML += `
                <div class="stack-card">
                    <div class="stack-header">
                        <h3>${stack.name}</h3>
                        <p class="stack-description">${stack.description}</p>
                    </div>
                    <ul class="stack-steps">
                        ${stack.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        stacksHTML += '</div>';
        stacksContainer.innerHTML = stacksHTML;
    }
}

function getStackingSuggestions(results, dominantPattern) {
    const stacks = [];

    // Morning Stack - based on Nitric Oxide and Respiration levels
    const morningStack = {
        name: 'Morning Stack',
        description: 'Start your day with aligned activation.',
        steps: []
    };

    if (results['nitric-oxide'] === 'mild' && results['respiration'] === 'mild') {
        morningStack.steps = [
            'Wake naturally (no alarm if possible)',
            'Gentle stretching in bed (5 min)',
            '3 slow, deep breaths before standing',
            'Warm water with lemon',
            '10-minute easy walk'
        ];
    } else if (results['nitric-oxide'] === 'spicy' || results['respiration'] === 'spicy') {
        morningStack.steps = [
            'Wake and immediately stand',
            '3 rounds Wim Hof breathing',
            'Cold shower (2-3 minutes)',
            'Movement (pushups, squats, burpees)',
            'Coffee or strong tea'
        ];
    } else {
        morningStack.steps = [
            'Wake with intention',
            'Box breathing (4-4-4-4) for 2 minutes',
            'Cool-to-cold shower finish (30-60 sec)',
            'Dynamic stretching or yoga flow',
            'Mindful breakfast'
        ];
    }
    stacks.push(morningStack);

    // Connection Stack - based on Oxytocin and Vagal levels
    const connectionStack = {
        name: 'Connection Stack',
        description: 'Deepen your bonds with others.',
        steps: []
    };

    if (results['oxytocin'] === 'mild') {
        connectionStack.steps = [
            'Start with parallel presence (reading in same room)',
            'Brief eye contact and smile',
            'Share one genuine observation',
            'Comfortable silence together',
            'Simple physical proximity'
        ];
    } else if (results['oxytocin'] === 'spicy') {
        connectionStack.steps = [
            'Set aside extended uninterrupted time',
            'Begin with synchronized breathing',
            'Eye gazing practice (5-10 minutes)',
            'Share something vulnerable',
            'Extended physical contact (holding, massage)'
        ];
    } else {
        connectionStack.steps = [
            'Create dedicated connection time',
            'Put away all devices',
            'Ask a meaningful question and listen fully',
            'Share appreciation or gratitude',
            'Close with a long hug (20+ seconds)'
        ];
    }
    stacks.push(connectionStack);

    // Deep Dive Stack - based on Psychoactives, Trauma Work, and Respiration
    const deepDiveStack = {
        name: 'Deep Dive Stack',
        description: 'Go deeper into inner exploration.',
        steps: []
    };

    if (results['psychoactives'] === 'mild' && results['trauma'] === 'mild') {
        deepDiveStack.steps = [
            'Create quiet, undisturbed space',
            'Gentle journaling prompt',
            'Slow reading of meaningful text',
            'Sit with whatever arises',
            'Close with self-compassion phrase'
        ];
    } else if (results['psychoactives'] === 'spicy' || results['trauma'] === 'spicy') {
        deepDiveStack.steps = [
            'Clear your schedule (half day minimum)',
            'Set clear intention',
            'Extended breathwork session (45-90 min)',
            'Unstructured integration time',
            'Journal before returning to normal activity'
        ];
    } else {
        deepDiveStack.steps = [
            'Block 2-3 hours',
            'Light breathwork to settle (15 min)',
            'Guided meditation or body scan',
            'Free-write whatever emerges',
            'Gentle movement to close'
        ];
    }
    stacks.push(deepDiveStack);

    // Full Send Stack - for Intensity Seekers
    if (dominantPattern === 'spicy') {
        const fullSendStack = {
            name: 'Full Send Stack',
            description: 'When you need to go all the way.',
            steps: [
                'Clear 24-48 hours completely',
                'Fast or eat very lightly',
                'Combine your highest-rated levers intentionally',
                'Build in transition rituals between intensities',
                'Schedule integration day after (non-negotiable)',
                'Have a trusted person available for support'
            ]
        };
        stacks.push(fullSendStack);
    }

    return stacks;
}

// Initialize quiz
document.addEventListener('DOMContentLoaded', function() {
    // Attach click handlers to all option buttons
    document.querySelectorAll('.quiz-option').forEach(button => {
        button.addEventListener('click', function() {
            selectOption(this);
        });
    });
});
