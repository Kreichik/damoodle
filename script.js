document.addEventListener('DOMContentLoaded', () => {
    const addSubmissionBtn = document.getElementById('add-submission-btn');
    const uploadSection = document.getElementById('upload-section');
    const uploadForm = document.getElementById('upload-form');
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const submitFileBtn = document.getElementById('submit-file-btn');
    const uploadStatus = document.getElementById('upload-status');
    const submissionStatusCell = document.getElementById('submission-status-cell');

    let selectedFile = null;

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
    uploadStatus.textContent = 'Загрузка файла...';

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (response.ok) {
            uploadStatus.textContent = `✅ Файл "${result.fileName}" успешно отправлен!`;
            uploadStatus.style.color = 'green';
            
            // === НАЧАЛО НОВОГО КОДА ===
            submissionStatusCell.textContent = 'Not graded';
            submissionStatusCell.classList.add('status-submitted');
            // === КОНЕЦ НОВОГО КОДА ===

        } else {
            throw new Error(result.message || 'Произошла ошибка.');
        }
    } catch (error) {
        uploadStatus.textContent = `❌ Ошибка: ${error.message}`;
        uploadStatus.style.color = 'red';
        submitFileBtn.disabled = false;
    }
});

    // Вспомогательная функция для обработки файла
    function handleFile(file) {
        selectedFile = file;
        fileInfo.textContent = `Выбран файл: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        submitFileBtn.disabled = false;
        uploadStatus.textContent = '';
    }

    // Вспомогательная функция для сброса состояния
    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        submitFileBtn.disabled = true;
        uploadStatus.textContent = '';
        fileInput.value = ''; // Сбрасываем значение инпута
    }
});