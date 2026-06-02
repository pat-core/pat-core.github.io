// --- State Variables ---
let allQuestions = [];
let sessionQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let currentLang = 'en';

// --- UI Translations (i18n) ---
const dict = {
    en: {
        appTitle: "Quiz",
        catRoblox: "Roblox",                  // <-- New
        catAbitur: "High School",    // <-- New
        catMathe: "Math",                     // <-- New
        startTitle: "Ready to Play?",
        startDesc: "Test your knowledge. 10 random questions will be selected.",
        startBtn: "Start Quiz",
        resultTitle: "Evaluation",
        resultScore: "You got {score} out of {total} right!",
        playAgain: "Play Again",
        questionCounter: "Question {current} / {total}",
        scoreCounter: "Score: {score}"
    },
    de: {
        appTitle: "Quiz",
        catRoblox: "Roblox",                  // <-- New
        catAbitur: "Abitur",                  // <-- New
        catMathe: "Mathematik",                // <-- New
        startTitle: "Bereit zu spielen?",
        startDesc: "Teste dein Wissen. 10 zufällige Fragen werden ausgewählt.",
        startBtn: "Quiz Starten",
        resultTitle: "Auswertung",
        resultScore: "Du hast {score} von {total} richtig!",
        playAgain: "Nochmal Spielen",
        questionCounter: "Frage {current} / {total}",
        scoreCounter: "Punkte: {score}"
    }
};

// --- DOM Elements ---
const screens = {
    start: document.getElementById('screen-start'),
    quiz: document.getElementById('screen-quiz'),
    result: document.getElementById('screen-result')
};

// --- Utility Functions ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function showScreen(screenName) {
    Object.values(screens).forEach(screen => screen.classList.remove('active'));
    screens[screenName].classList.add('active');
}

// --- File Fetching & Parsing ---
async function loadQuizData() {
    try {
        // 1. Get the current category from the dropdown menu
        const category = document.getElementById('category-select').value;
        
        // 2. Combine category and language (e.g., "abitur_de.csv" or "roblox_en.csv")
        const fileName = `${category}_${currentLang}.csv`;
        
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        parseCSV(text);
        return true;
    } catch (error) {
        console.error("Could not load the CSV file:", error);
        alert(currentLang === 'en' ? 
            "Error loading quiz data. Ensure you are running a local web server and the file exists." : 
            "Fehler beim Laden der Quizdaten. Stelle sicher, dass du einen lokalen Webserver verwendest und die Datei existiert.");
        return false;
    }
}

function parseCSV(text) {
    allQuestions = [];
    const lines = text.split(/\r?\n/); 
    
    lines.forEach(line => {
        const parts = line.split(';').map(p => p.trim()).filter(p => p !== '');
        if (parts.length >= 3) { 
            allQuestions.push({
                question: parts[0],
                correctAnswer: parts[1],
                wrongAnswers: parts.slice(2)
            });
        }
    });
}

// --- Quiz Logic ---
document.getElementById('start-btn').addEventListener('click', async () => {
    const btn = document.getElementById('start-btn');
    btn.disabled = true;
    
    // Wait for the CSV to load from the server
    const success = await loadQuizData();
    
    if (success && allQuestions.length >= 10) {
        startQuiz();
    } else if (success && allQuestions.length < 10) {
        alert(currentLang === 'en' ? "File must contain at least 10 questions." : "Datei muss mindestens 10 Fragen enthalten.");
    }
    
    btn.disabled = false;
});

document.getElementById('restart-btn').addEventListener('click', () => {
    showScreen('start');
});

// Reset to start screen if the user changes the category
document.getElementById('category-select').addEventListener('change', () => {
    document.getElementById('start-btn').disabled = false;
    showScreen('start');
});

function startQuiz() {
    score = 0;
    currentQuestionIndex = 0;
    // Shuffles all questions and picks exactly 10
    sessionQuestions = shuffleArray([...allQuestions]).slice(0, 10);
    showScreen('quiz');
    renderQuestion();
}

function renderQuestion() {
    const q = sessionQuestions[currentQuestionIndex];
    
    document.getElementById('question-counter').innerText = dict[currentLang].questionCounter.replace('{current}', currentQuestionIndex + 1).replace('{total}', 10);
    document.getElementById('current-score').innerText = dict[currentLang].scoreCounter.replace('{score}', score);
    document.getElementById('question-text').innerText = q.question;
    
    let answers = [q.correctAnswer, ...q.wrongAnswers];
    answers = shuffleArray(answers);
    
    const grid = document.getElementById('answers-grid');
    grid.innerHTML = ''; 
    
    answers.forEach(ans => {
        const btn = document.createElement('button');
        btn.innerText = ans;
        btn.classList.add('answer-btn');
        btn.addEventListener('click', () => handleAnswer(btn, ans, q.correctAnswer));
        grid.appendChild(btn);
    });
}

function handleAnswer(clickedBtn, selectedAnswer, correctAnswer) {
    const buttons = document.querySelectorAll('.answer-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    if (selectedAnswer === correctAnswer) {
        clickedBtn.classList.add('correct');
        score++;
        document.getElementById('current-score').innerText = dict[currentLang].scoreCounter.replace('{score}', score);
    } else {
        clickedBtn.classList.add('wrong');
        buttons.forEach(btn => {
            if (btn.innerText === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }
    
    // Wait 1 second (1000ms) then load the next question
    setTimeout(() => {
        loadNextQuestion();
    }, 750);
}

function loadNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < 10) {
        renderQuestion();
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById('result-score').innerText = dict[currentLang].resultScore.replace('{score}', score).replace('{total}', 10);
    showScreen('result');
}

// --- Theme & Language Toggles ---
document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('theme-dark');
});

document.getElementById('lang-toggle').addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'de' : 'en';
    updateLanguageUI();
});

function updateLanguageUI() {
    const texts = dict[currentLang];
    document.getElementById('app-title').innerText = texts.appTitle;
    document.getElementById('start-title').innerText = texts.startTitle;
    document.getElementById('start-desc').innerText = texts.startDesc;
    document.getElementById('start-btn').innerText = texts.startBtn;
    document.getElementById('result-title').innerText = texts.resultTitle;
    document.getElementById('restart-btn').innerText = texts.playAgain;
    document.querySelector('#category-select option[value="roblox"]').innerText = texts.catRoblox;
    document.querySelector('#category-select option[value="abitur"]').innerText = texts.catAbitur;
    document.querySelector('#category-select option[value="mathe"]').innerText = texts.catMathe;
    
    if (screens.quiz.classList.contains('active')) {
        document.getElementById('question-counter').innerText = texts.questionCounter.replace('{current}', currentQuestionIndex + 1).replace('{total}', 10);
        document.getElementById('current-score').innerText = texts.scoreCounter.replace('{score}', score);
    } else if (screens.result.classList.contains('active')) {
        document.getElementById('result-score').innerText = texts.resultScore.replace('{score}', score).replace('{total}', 10);
    }
}

// Initialize default language
updateLanguageUI();