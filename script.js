document.addEventListener('DOMContentLoaded', () => {
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
    const submissionStorageKey = `submission_${currentUser}`;

    // === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

    // Форматирует дату
    function formatSubmissionDate(date) {
        // ... (код форматирования остался без изменений)
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
    
    // Обновляет UI до состояния "Отправлено"
    function renderSubmittedState(submissionDate) {
        // Очищаем старые строки, кроме первой
        while (submissionTableBody.rows.length > 1) {
            submissionTableBody.deleteRow(1);
        }

        submissionStatusCell.textContent = 'Submitted for grading';
        submissionStatusCell.classList.add('status-submitted');

        const gradingStatusRow = submissionTableBody.insertRow();
        gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded</td>`;

        const lastModifiedRow = submissionTableBody.insertRow();
        lastModifiedRow.innerHTML = `<th>Last modified</th><td>${formatSubmissionDate(submissionDate)}</td>`;

        addSubmissionBtn.style.display = 'none';
        editSubmissionBtn.style.display = 'inline-block';
    }

    // Сбрасывает состояние формы загрузки
    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        submitFileBtn.disabled = true;
        uploadStatus.textContent = '';
        fileInput.value = '';
    }

    // === ЛОГИКА ПРИ ЗАГРУЗКЕ СТРАНИЦЫ ===

    // Проверяем, есть ли сохраненные данные об отправке
    const savedSubmission = localStorage.getItem(submissionStorageKey);
    if (savedSubmission) {
        const submissionData = JSON.parse(savedSubmission);
        const submissionDate = new Date(submissionData.date);
        renderSubmittedState(submissionDate);
    }


    // === ОБРАБОТЧИКИ СОБЫТИЙ ===

    // Клик на "Add Submission" или "Edit Submission"
    function toggleUploadSection() {
        if (uploadSection.style.display === 'none') {
            uploadSection.style.display = 'block';
        } else {
            uploadSection.style.display = 'none';
        }
    }
    addSubmissionBtn.addEventListener('click', toggleUploadSection);
    editSubmissionBtn.addEventListener('click', toggleUploadSection);

    // Логика Drag & Drop и выбора файла
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        selectedFile = file;
        fileInfo.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        submitFileBtn.disabled = false;
        uploadStatus.textContent = '';
    }

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
            const result = await response.json();

            if (response.ok) {
                const submissionDate = new Date();
                const submissionData = { status: 'submitted', date: submissionDate.toISOString() };
                localStorage.setItem(submissionStorageKey, JSON.stringify(submissionData));

                renderSubmittedState(submissionDate);
                
                uploadSection.style.display = 'none';
                resetUploadState();
            } else {
                throw new Error(result.message || 'An error occurred.');
            }
        } catch (error) {
            uploadStatus.textContent = `❌ Error: ${error.message}`;
            uploadStatus.style.color = 'red';
            submitFileBtn.disabled = false;
        }
    });
});