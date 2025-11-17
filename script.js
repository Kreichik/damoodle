document.addEventListener('DOMContentLoaded', () => {
    // === НАЧАЛО БЛОКА АВТОРИЗАЦИИ ===
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        // Если пользователя нет в localStorage, перенаправляем на страницу входа
        window.location.href = '/login.html';
        return; // Останавливаем выполнение остального кода
    }

    // Персонализация страницы: обновляем все элементы с именем пользователя
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser);
    const userFooterLink = document.querySelector('.footer-content p a');
    if (userFooterLink) {
        userFooterLink.textContent = currentUser;
    }
    // === КОНЕЦ БЛОКА АВТОРИЗАЦИИ ===


    // Получаем все необходимые элементы со страницы
    const addSubmissionBtn = document.getElementById('add-submission-btn');
    const uploadSection = document.getElementById('upload-section');
    const uploadForm = document.getElementById('upload-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const submitFileBtn = document.getElementById('submit-file-btn');
    const uploadStatus = document.getElementById('upload-status');
    const submissionStatusCell = document.getElementById('submission-status-cell');
    const submissionTableBody = document.getElementById('submission-table-body');

    let selectedFile = null;

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

    addSubmissionBtn.addEventListener('click', () => {
        if (uploadSection.style.display === 'none') {
            uploadSection.style.display = 'block';
            addSubmissionBtn.textContent = 'Cancel';
        } else {
            uploadSection.style.display = 'none';
            addSubmissionBtn.textContent = 'Add submission';
            resetUploadState();
        }
    });

    dropZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) handleFile(fileInput.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        submitFileBtn.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.style.color = 'inherit';

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('username', currentUser); // <<== ДОБАВЛЯЕМ ИМЯ ПОЛЬЗОВАТЕЛЯ В ЗАПРОС

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                submissionStatusCell.textContent = 'Submitted for grading';
                submissionStatusCell.classList.add('status-submitted');

                const gradingStatusRow = document.createElement('tr');
                gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded</td>`;

                const lastModifiedRow = document.createElement('tr');
                const currentDate = formatSubmissionDate(new Date());
                lastModifiedRow.innerHTML = `<th>Last modified</th><td>${currentDate}</td>`;

                submissionTableBody.appendChild(gradingStatusRow);
                submissionTableBody.appendChild(lastModifiedRow);
                
                uploadSection.style.display = 'none';
                addSubmissionBtn.style.display = 'none'; // <<== СКРЫВАЕМ КНОПКУ "ADD SUBMISSION"
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
});