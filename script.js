document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }
    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser);

    // === ПОЛУЧЕНИЕ ЭЛЕМЕНТОВ DOM ===
    const userProfile = document.getElementById('user-profile');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    const addSubmissionBtn = document.getElementById('add-submission-btn');
    const editSubmissionBtn = document.getElementById('edit-submission-btn');
    const uploadSection = document.getElementById('upload-section');
    const uploadForm = document.getElementById('upload-form');
    // Вкладки
    const fileTabBtn = document.getElementById('file-tab-btn');
    const linkTabBtn = document.getElementById('link-tab-btn');
    const fileSubmissionDiv = document.getElementById('file-submission-div');
    const linkSubmissionDiv = document.getElementById('link-submission-div');
    // Элементы формы
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const linkInput = document.getElementById('link-input');
    const fileInfo = document.getElementById('file-info');
    const submitBtn = document.getElementById('submit-btn');
    const uploadStatus = document.getElementById('upload-status');
    // Таблица статуса
    const submissionTableBody = document.getElementById('submission-table-body');
    const submissionStatusCell = document.getElementById('submission-status-cell');

    let selectedFile = null;
    let activeTab = 'file'; // 'file' или 'link'

    async function updateSubmissionStatus() {
        try {
            const res = await fetch(`/api/get-grades?username=${encodeURIComponent(currentUser)}`);
            if (!res.ok) throw new Error('Failed to fetch user data');
            const data = await res.json();
            
            if (data.submission && data.submission.status === 'submitted') {
                renderSubmittedState(data.submission, data.grades || {});
            }
        } catch (error) { console.error("Update Status Error:", error); }
    }

    function renderSubmittedState(submission, grades) {
        while (submissionTableBody.rows.length > 0) {
            submissionTableBody.deleteRow(0);
        }

        const statusRow = submissionTableBody.insertRow();
        statusRow.innerHTML = `<th>Submission status</th><td class="status-submitted">Submitted for grading</td>`;
        
        // НОВАЯ СТРОКА ДЛЯ ОТОБРАЖЕНИЯ КОНТЕНТА
        const contentRow = submissionTableBody.insertRow();
        if (submission.type === 'link') {
            contentRow.innerHTML = `<th>Online text</th><td><a href="${submission.content}" target="_blank" rel="noopener noreferrer" class="submission-content-link">${submission.content}</a></td>`;
        } else {
            contentRow.innerHTML = `<th>File submission</th><td>${submission.content}</td>`; // content здесь - имя файла
        }

        const gradeValues = Object.values(grades);
        const allGradersCount = 5;
        const gradingStatusRow = submissionTableBody.insertRow();
        if (gradeValues.length === allGradersCount) {
            const sum = gradeValues.reduce((acc, grade) => acc + parseInt(grade, 10), 0);
            const average = (sum / gradeValues.length).toFixed(2);
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Graded</td>`;
            const gradeRow = submissionTableBody.insertRow();
            gradeRow.innerHTML = `<th>Grade</th><td>${average} / 100.00</td>`;
        } else {
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded (${gradeValues.length}/${allGradersCount} reviews)</td>`;
        }

        const lastModifiedRow = submissionTableBody.insertRow();
        lastModifiedRow.innerHTML = `<th>Last modified</th><td>${formatSubmissionDate(new Date(submission.date))}</td>`;

        addSubmissionBtn.style.display = 'none';
        editSubmissionBtn.style.display = 'inline-block';
    }
    
    // === ОБРАБОТЧИКИ СОБЫТИЙ ===
    // Логика вкладок
    fileTabBtn.addEventListener('click', () => {
        activeTab = 'file';
        fileTabBtn.classList.add('active');
        linkTabBtn.classList.remove('active');
        fileSubmissionDiv.style.display = 'block';
        linkSubmissionDiv.style.display = 'none';
        resetUploadState();
    });

    linkTabBtn.addEventListener('click', () => {
        activeTab = 'link';
        linkTabBtn.classList.add('active');
        fileTabBtn.classList.remove('active');
        linkSubmissionDiv.style.display = 'block';
        fileSubmissionDiv.style.display = 'none';
        resetUploadState();
    });

    // Отправка формы
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        uploadStatus.textContent = 'Submitting...';
        
        let requestBody;
        let requestHeaders = {};
        
        if (activeTab === 'file') {
            if (!selectedFile) {
                alert('Please select a file to upload.');
                submitBtn.disabled = false;
                return;
            }
            requestBody = new FormData();
            requestBody.append('file', selectedFile);
            requestBody.append('username', currentUser);
        } else { // activeTab === 'link'
            const link = linkInput.value.trim();
            if (!link) {
                alert('Please enter a link.');
                submitBtn.disabled = false;
                return;
            }
            requestHeaders['Content-Type'] = 'application/json';
            requestBody = JSON.stringify({
                type: 'link',
                content: link,
                username: currentUser
            });
        }

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                headers: requestHeaders,
                body: requestBody
            });
            if (!response.ok) throw new Error((await response.json()).message);

            await updateSubmissionStatus();
            uploadSection.style.display = 'none';
            resetUploadState();
        } catch (error) {
            uploadStatus.textContent = `❌ Error: ${error.message}`;
            submitBtn.disabled = false;
        }
    });

    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        linkInput.value = '';
        submitBtn.disabled = false; // Кнопка должна быть активна, если нет выбора
        uploadStatus.textContent = '';
        if (fileInput) fileInput.value = '';
    }

    // Остальной код (логин/логаут, D&D, вспомогательные функции)
    userProfile.addEventListener('click', (e) => { e.stopPropagation(); dropdownMenu.classList.toggle('show'); });
    logoutBtn.addEventListener('click', () => { localStorage.removeItem('currentUser'); window.location.href = '/login.html'; });
    window.addEventListener('click', () => { if (dropdownMenu.classList.contains('show')) dropdownMenu.classList.remove('show'); });
    function toggleUploadSection() { uploadSection.style.display = (uploadSection.style.display === 'none') ? 'block' : 'none'; }
    addSubmissionBtn.addEventListener('click', toggleUploadSection);
    editSubmissionBtn.addEventListener('click', toggleUploadSection);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleFile(fileInput.files[0]); });
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]); });
    function handleFile(file) { selectedFile = file; fileInfo.textContent = `Selected: ${file.name}`; submitBtn.disabled = false; }
    function formatSubmissionDate(date) { const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }; return date.toLocaleDateString('en-US', options); }
    await updateSubmissionStatus();
});