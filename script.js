document.addEventListener('DOMContentLoaded', async () => {
    // === АВТОРИЗАЦИЯ И ИНИЦИАЛИЗАЦИЯ ===
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    // Персонализация страницы
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser);
    const userFooterLink = document.querySelector('.footer-content p a');
    if (userFooterLink) userFooterLink.textContent = currentUser;

    // === ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ DOM ===
    const userProfile = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const addSubmissionBtn = document.getElementById('add-submission-btn');
    const editSubmissionBtn = document.getElementById('edit-submission-btn');
    const uploadSection = document.getElementById('upload-section');
    const uploadForm = document.getElementById('upload-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const submitFileBtn = document.getElementById('submit-file-btn');
    const uploadStatus = document.getElementById('upload-status');
    const submissionTableBody = document.getElementById('submission-table-body');
    const submissionStatusCell = document.getElementById('submission-status-cell');

    let selectedFile = null;

    // === ГЛАВНЫЕ ФУНКЦИИ ===

    // 1. Получает данные о пользователе с сервера и запускает обновление UI
    async function updateSubmissionStatus() {
        try {
            const res = await fetch(`/api/get-grades?username=${encodeURIComponent(currentUser)}`);
            if (!res.ok) throw new Error('Failed to fetch user data');
            const data = await res.json();
            
            if (data.submission && data.submission.status === 'submitted') {
                const submissionDate = new Date(data.submission.date);
                renderSubmittedState(submissionDate, data.grades || {});
            }
        } catch (error) {
            console.error("Update Status Error:", error);
            // Можно добавить сообщение об ошибке для пользователя, если нужно
        }
    }

    // 2. Обновляет таблицу статуса на основе данных с сервера
    function renderSubmittedState(submissionDate, grades) {
        // Очищаем старые строки, кроме первой (Submission status)
        while (submissionTableBody.rows.length > 1) {
            submissionTableBody.deleteRow(1);
        }
        submissionStatusCell.textContent = 'Submitted for grading';
        submissionStatusCell.classList.add('status-submitted');

        const gradeValues = Object.values(grades);
        const allGradersCount = 5; // 6 пользователей - 1 (сам себя) = 5
        
        const gradingStatusRow = submissionTableBody.insertRow();
        if (gradeValues.length === allGradersCount) {
            // Если все оценки выставлены, считаем средний балл
            const sum = gradeValues.reduce((acc, grade) => acc + parseInt(grade, 10), 0);
            const average = (sum / gradeValues.length).toFixed(2);
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Graded</td>`;
            const gradeRow = submissionTableBody.insertRow();
            gradeRow.innerHTML = `<th>Grade</th><td>${average} / 100.00</td>`;
        } else {
            // Если оценок не хватает, показываем прогресс
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded (${gradeValues.length}/${allGradersCount} reviews)</td>`;
        }

        // Добавляем строку с датой
        const lastModifiedRow = submissionTableBody.insertRow();
        lastModifiedRow.innerHTML = `<th>Last modified</th><td>${formatSubmissionDate(submissionDate)}</td>`;

        // Управляем видимостью кнопок
        addSubmissionBtn.style.display = 'none';
        editSubmissionBtn.style.display = 'inline-block';
    }

    // === ОБРАБОТЧИКИ СОБЫТИЙ ===

    // Логика выпадающего меню и выхода
    userProfile.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });

    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    });

    window.addEventListener('click', () => {
        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        }
    });

    // Открытие/скрытие секции загрузки файла
    function toggleUploadSection() {
        uploadSection.style.display = (uploadSection.style.display === 'none') ? 'block' : 'none';
    }
    addSubmissionBtn.addEventListener('click', toggleUploadSection);
    editSubmissionBtn.addEventListener('click', toggleUploadSection);

    // Логика Drag & Drop
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    // Отправка формы
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        submitFileBtn.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.style.color = 'inherit';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('username', currentUser);

        try {
            const response = await fetch('/api/upload', { method: 'POST', body: formData });
            if (!response.ok) {
                const errorResult = await response.json();
                throw new Error(errorResult.message || 'An error occurred during upload.');
            }

            // После успешной загрузки файла, запрашиваем обновленные данные с сервера
            await updateSubmissionStatus();
            
            uploadSection.style.display = 'none';
            resetUploadState();
        } catch (error) {
            uploadStatus.textContent = `❌ Error: ${error.message}`;
            uploadStatus.style.color = 'red';
            submitFileBtn.disabled = false;
        }
    });

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

    function handleFile(file) {
        selectedFile = file;
        fileInfo.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        submitFileBtn.disabled = false;
        uploadStatus.textContent = '';
    }
    
    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        submitFileBtn.disabled = true;
        uploadStatus.textContent = '';
        fileInput.value = '';
    }

    function formatSubmissionDate(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        const dayName = days[date.getDay()];
        const dayOfMonth = date.getDate();
        const monthName = months[date.getMonth()];
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;
        return `${dayName}, ${dayOfMonth} ${monthName} ${year}, ${hours}:${paddedMinutes} ${ampm}`;
    }

    // === ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА ДАННЫХ ===
    await updateSubmissionStatus();
});