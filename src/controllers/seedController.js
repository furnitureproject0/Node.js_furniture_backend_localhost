import { seed } from '../../seeders/initial-data.js';

export const runSeed = async (req, res, next) => {
    try {
        const password = req.query.password;
        if (!password || password !== process.env.SEED_PASSWORD) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await seed();
        return res.json({ message: 'Seed completed successfully' });
    } catch (err) {
        next(err);
    }
};
