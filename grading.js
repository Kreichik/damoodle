import { USERS } from './users.js';

document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы DOM
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

    // 1. Заполняем select для выбора оценщика
    allUserNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        graderSelect.appendChild(option);
    });

    // 2. Начинаем оценку
    startGradingBtn.addEventListener('click', () => {
        currentGrader = graderSelect.value;
        if (!currentGrader) {
            alert('Please select your name.');
            return;
        }
        graderSelectionView.style.display = 'none';
        gradingView.style.display = 'block';
        gradingTitle.textContent = `Grading as: ${currentGrader}`;
        renderGradeeList();
    });

    // 3. Рендерим список тех, кого нужно оценить
    function renderGradeeList() {
        gradeeList.innerHTML = '';
        const usersToGrade = allUserNames.filter(name => name !== currentGrader);
        
        usersToGrade.forEach(name => {
            const li = document.createElement('li');
            li.textContent = name;
            li.dataset.username = name;
            li.classList.add('gradee-item');
            
            // Проверяем, была ли уже поставлена оценка
            const gradeKey = `grade_${name}_by_${currentGrader}`.replace(/\s/g, '_');
            if (localStorage.getItem(gradeKey)) {
                li.classList.add('graded');
                li.innerHTML += ' <span>✓ Graded</span>';
            }
            
            li.addEventListener('click', () => showGradeForm(name));
            gradeeList.appendChild(li);
        });
    }

    // 4. Показываем форму для ввода оценки
    function showGradeForm(gradeeName) {
        currentGradee = gradeeName;
        gradingView.style.display = 'none';
        gradeFormView.style.display = 'block';
        gradeFormTitle.textContent = `Enter grade for: ${currentGradee}`;
        gradeInput.value = '';
        gradeError.textContent = '';
    }

    // 5. Сохраняем оценку
    gradeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const gradeValue = parseInt(gradeInput.value, 10);

        if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > 100) {
            gradeError.textContent = 'Please enter a number between 0 and 100.';
            return;
        }
        
        const gradeKey = `grade_${currentGradee}_by_${currentGrader}`.replace(/\s/g, '_');
        localStorage.setItem(gradeKey, gradeValue);
        
        calculateAverageIfComplete(currentGradee);
        
        // Возвращаемся к списку
        gradeFormView.style.display = 'none';
        gradingView.style.display = 'block';
        renderGradeeList();
    });
    
    // 6. Отмена ввода оценки
    cancelGradeBtn.addEventListener('click', () => {
        gradeFormView.style.display = 'none';
        gradingView.style.display = 'block';
    });

    // 7. Проверяем, все ли оценки выставлены, и считаем средний балл
    function calculateAverageIfComplete(gradeeName) {
        const potentialGraders = allUserNames.filter(name => name !== gradeeName);
        let totalScore = 0;
        let gradeCount = 0;

        potentialGraders.forEach(grader => {
            const key = `grade_${gradeeName}_by_${grader}`.replace(/\s/g, '_');
            const grade = localStorage.getItem(key);
            if (grade !== null) {
                totalScore += parseInt(grade, 10);
                gradeCount++;
            }
        });

        // Если все 5 оценок выставлены
        if (gradeCount === potentialGraders.length) {
            const average = totalScore / gradeCount;
            const finalGradeKey = `finalGrade_${gradeeName}`.replace(/\s/g, '_');
            localStorage.setItem(finalGradeKey, average.toFixed(2));
        }
    }
});