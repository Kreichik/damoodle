// api/get-grades.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { username } = req.query;
        if (!username) {
            return res.status(400).json({ message: 'Username is required.' });
        }
        
        const safeUsername = username.replace(/\s/g, '_');
        
        // Получаем статус сдачи работы
        const submissionKey = `submission_${safeUsername}`;
        const submissionData = await kv.get(submissionKey);
        
        // Получаем все оценки для этого пользователя
        const gradesKey = `grades_${safeUsername}`;
        const gradesData = await kv.hgetall(gradesKey);

        return res.status(200).json({
            submission: submissionData,
            grades: gradesData || {}, // Возвращаем пустой объект, если оценок нет
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred on the server.' });
    }
}