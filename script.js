document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        window.location.href = '/login.html';
        return;
    }

    document.querySelectorAll('.user-name').forEach(el => el.textContent = currentUser);
    const userFooterLink = document.querySelector('.footer-content p a');
    if (userFooterLink) userFooterLink.textContent = currentUser;

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
    const submissionStorageKey = `submission_${currentUser.replace(/\s/g, '_')}`;
    const finalGradeKey = `finalGrade_${currentUser.replace(/\s/g, '_')}`;

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
    
    function renderSubmittedState(submissionDate) {
        while (submissionTableBody.rows.length > 1) {
            submissionTableBody.deleteRow(1);
        }
        submissionStatusCell.textContent = 'Submitted for grading';
        submissionStatusCell.classList.add('status-submitted');

        // === НАЧАЛО НОВОЙ ЛОГИКИ ОТОБРАЖЕНИЯ ОЦЕНКИ ===
        const finalGrade = localStorage.getItem(finalGradeKey);
        
        const gradingStatusRow = submissionTableBody.insertRow();
        if (finalGrade) {
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Graded</td>`;
            const gradeRow = submissionTableBody.insertRow();
            gradeRow.innerHTML = `<th>Grade</th><td>${finalGrade} / 100.00</td>`;
        } else {
            gradingStatusRow.innerHTML = `<th>Grading status</th><td>Not graded</td>`;
        }
        // === КОНЕЦ НОВОЙ ЛОГИКИ ===

        const lastModifiedRow = submissionTableBody.insertRow();
        lastModifiedRow.innerHTML = `<th>Last modified</th><td>${formatSubmissionDate(submissionDate)}</td>`;

        addSubmissionBtn.style.display = 'none';
        editSubmissionBtn.style.display = 'inline-block';
    }

    function resetUploadState() {
        selectedFile = null;
        fileInfo.textContent = '';
        submitFileBtn.disabled = true;
        uploadStatus.textContent = '';
        fileInput.value = '';
    }

    const savedSubmission = localStorage.getItem(submissionStorageKey);
    if (savedSubmission) {
        const submissionData = JSON.parse(savedSubmission);
        const submissionDate = new Date(submissionData.date);
        renderSubmittedState(submissionDate);
    }

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

    function toggleUploadSection() {
        uploadSection.style.display = (uploadSection.style.display === 'none') ? 'block' : 'none';
    }
    addSubmissionBtn.addEventListener('click', toggleUploadSection);
    editSubmissionBtn.addEventListener('click', toggleUploadSection);

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
            if (!response.ok) throw new Error((await response.json()).message || 'An error occurred.');

            const submissionDate = new Date();
            const submissionData = { status: 'submitted', date: submissionDate.toISOString() };
            localStorage.setItem(submissionStorageKey, JSON.stringify(submissionData));

            renderSubmittedState(submissionDate);
            uploadSection.style.display = 'none';
            resetUploadState();
        } catch (error) {
            uploadStatus.textContent = `❌ Error: ${error.message}`;
            uploadStatus.style.color = 'red';
            submitFileBtn.disabled = false;
        }
    });
});