// Подключаем общий файл с пользователями
import { USERS } from './users.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const userIdInput = document.getElementById('user-id-input');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredId = userIdInput.value;

        if (USERS[enteredId]) {
            localStorage.setItem('currentUser', USERS[enteredId]);
            window.location.href = '/';
        } else {
            errorMessage.textContent = 'Invalid User ID. Please try again.';
            userIdInput.value = '';
        }
    });
});