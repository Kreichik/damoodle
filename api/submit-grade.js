// api/submit-grade.js
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { grader, gradee, grade } = req.body;

        if (!grader || !gradee || grade === undefined) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        // Ключ для хранения оценок конкретного пользователя
        // Например: "grades_Walter_White"
        const key = `grades_${gradee.replace(/\s/g, '_')}`;

        // Сохраняем оценку. hset - это команда для "словаря" (hash)
        // Мы добавляем поле с именем оценщика и его оценкой
        await kv.hset(key, { [grader.replace(/\s/g, '_')]: grade });

        return res.status(200).json({ message: 'Grade submitted successfully.' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred on the server.' });
    }
}