import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

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
        
        // Ключи для Redis
        const submissionKey = `submission:${safeUsername}`;
        const gradesKey = `grades:${safeUsername}`;

        // Получаем данные о сдаче работы
        const submissionJson = await redis.get(submissionKey);
        const submissionData = submissionJson ? JSON.parse(submissionJson) : null;
        
        // Получаем все оценки для этого пользователя
        const gradesData = await redis.hgetall(gradesKey);

        return res.status(200).json({
            submission: submissionData,
            grades: gradesData || {},
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'An error occurred on the server.' });
    }
}