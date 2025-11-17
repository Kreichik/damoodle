document.addEventListener('DOMContentLoaded', () => {
    // ВАЖНО: База данных пользователей. Добавьте сюда всех 6 пользователей.
    const users = {
        "240930": "Yan Kudashov",
        "242521": "Dana Tutkyshbayeva",
        "241084": "Bakdaulet Abdikul",
        "240851": "Daniyal Abrayev",
        "241718": "Damir Sheneussizov",
        "241028": "Moldir Yergesh"
    };

    const loginForm = document.getElementById('login-form');
    const userIdInput = document.getElementById('user-id-input');
    const errorMessage = document.getElementById('error-message');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredId = userIdInput.value;

        if (users[enteredId]) {
            // Если ID верный, сохраняем имя пользователя в localStorage
            localStorage.setItem('currentUser', users[enteredId]);
            // и перенаправляем на главную страницу
            window.location.href = '/'; // Vercel поймет, что это index.html
        } else {
            // Если ID неверный, показываем ошибку
            errorMessage.textContent = 'Invalid User ID. Please try again.';
            userIdInput.value = '';
        }
    });
});