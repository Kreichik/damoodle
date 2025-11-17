document.addEventListener('DOMContentLoaded', () => {
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

    // Функция для форматирования даты в требуемом виде
    // Пример: Sunday, 28 September 2025, 7:56 PM
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
        hours = hours ? hours : 12; // 0 часов должно быть 12
        
        const paddedMinutes = minutes < 10 ? '0' + minutes : minutes;

        return `${dayName}, ${dayOfMonth} ${monthName} ${year}, ${hours}:${paddedMinutes} ${ampm}`;
    }

    // 1. Показать/скрыть блок загрузки
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

    // 2. Открыть диалог выбора файла по клику на зону
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });

    // 3. Обработка выбора файла через диалог
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    // 4. Логика Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    // 5. Обработка отправки формы
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        submitFileBtn.disabled = true;
        uploadStatus.textContent = 'Uploading...';
        uploadStatus.style.color = 'inherit';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                // === НАЧАЛО ОБНОВЛЕННОЙ ЛОГИКИ УСПЕХА ===

                // 1. Обновляем статус в таблице
                submissionStatusCell.textContent = 'Submitted for grading';
                submissionStatusCell.classList.add('status-submitted');

                // 2. Создаем и добавляем новые строки
                const gradingStatusRow = document.createElement('tr');
                gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded</td>`;

                const lastModifiedRow = document.createElement('tr');
                const currentDate = formatSubmissionDate(new Date());
                lastModifiedRow.innerHTML = `<th>Last modified</th><td>${currentDate}</td>`;

                submissionTableBody.appendChild(gradingStatusRow);
                submissionTableBody.appendChild(lastModifiedRow);
                
                // 3. Скрываем блок загрузки и сбрасываем его состояние
                uploadSection.style.display = 'none';
                addSubmissionBtn.textContent = 'Add submission'; // Возвращаем текст кнопки
                resetUploadState();

                // === КОНЕЦ ОБНОВЛЕННОЙ ЛОГИКИ УСПЕХА ===

            } else {
                throw new Error(result.message || 'An error occurred.');
            }
        } catch (error) {
            uploadStatus.textContent = `❌ Error: ${error.message}`;
            uploadStatus.style.color = 'red';
            submitFileBtn.disabled = false;
        }
    });

    // Вспомогательная функция для обработки файла
    function handleFile(file) {
        selectedFile = file;
        fileInfo.textContent = `Selected file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        submitFileBtn.disabled = false;
        uploadStatus.textContent = '';
    }

    // Вспомогательная функция для сброса состояния
    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        submitFileBtn.disabled = true;
        uploadStatus.textContent = '';
        fileInput.value = '';
    }
});