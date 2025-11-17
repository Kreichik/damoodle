// grading.js
import { USERS } from './users.js';

document.addEventListener('DOMContentLoaded', async () => {
    // ... (все getElementById без изменений)
    const graderSelect = document.getElementById('grader-select');
    const startGradingBtn = document.getElementById('start-grading-btn');
    const graderSelectionView = document.getElementById('grader-selection-view');
    const gradingView = document.getElementById('grading-view');
    const gradingTitle = document.getElementById('grading-title');
    const gradeeList = document.getElementById('gradee-list');
    const gradeFormView = document.getElementById('grade-form-view');
    const gradeForm = document.getElementById('grade-form');
    const gradeFormTitle = document.getElementById('grade-form-title');
    const gradeInput = document.getElementById('grade-input');
    const cancelGradeBtn = document.getElementById('cancel-grade-btn');
    const gradeError = document.getElementById('grade-error');

    let currentGrader = null;
    let currentGradee = null;
    const allUserNames = Object.values(USERS);
    let allGrades = {}; // Кэш для оценок

    allUserNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        graderSelect.appendChild(option);
    });

    startGradingBtn.addEventListener('click', async () => {
        currentGrader = graderSelect.value;
        if (!currentGrader) {
            alert('Please select your name.');
            return;
        }
        graderSelectionView.style.display = 'none';
        gradingView.style.display = 'block';
        gradingTitle.textContent = `Grading as: ${currentGrader}`;
        await renderGradeeList();
    });

    async function renderGradeeList() {
        gradeeList.innerHTML = '<li>Loading...</li>';
        const usersToGrade = allUserNames.filter(name => name !== currentGrader);
        
        // Получаем все оценки для всех пользователей
        const promises = usersToGrade.map(name =>
            fetch(`/api/get-grades?username=${encodeURIComponent(name)}`).then(res => res.json())
        );
        const results = await Promise.all(promises);
        
        gradeeList.innerHTML = '';
        usersToGrade.forEach((name, index) => {
            const gradesForUser = results[index].grades;
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.username = name;
            li.classList.add('gradee-item');
            
            const graderKey = currentGrader.replace(/\s/g, '_');
            if (gradesForUser && gradesForUser[graderKey]) {
                li.classList.add('graded');
                li.innerHTML += ' <span>✓ Graded</span>';
            }
            
            li.addEventListener('click', () => showGradeForm(name));
            gradeeList.appendChild(li);
        });
    }

    function showGradeForm(gradeeName) {
        currentGradee = gradeeName;
        gradingView.style.display = 'none';
        gradeFormView.style.display = 'block';
        gradeFormTitle.textContent = `Enter grade for: ${currentGradee}`;
        gradeInput.value = '';
        gradeError.textContent = '';
    }
    
    cancelGradeBtn.addEventListener('click', () => {
        gradeFormView.style.display = 'none';
        gradingView.style.display = 'block';
    });

    gradeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const gradeValue = parseInt(gradeInput.value, 10);
        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
            gradeError.textContent = 'Please enter a number between 0 and 100.';
            return;
        }
        
        try {
            await fetch('/api/submit-grade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grader: currentGrader,
                    gradee: currentGradee,
                    grade: gradeValue
                }),
            });

            gradeFormView.style.display = 'none';
            gradingView.style.display = 'block';
            await renderGradeeList();
        } catch (error) {
            gradeError.textContent = 'Failed to submit grade. Please try again.';
        }
    });
});