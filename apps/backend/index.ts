import express from 'express';
import { prisma } from 'db/client';
import authRoutes from './routes/auth.ts';

const app = express();

app.use(express.json());

app.use(express.json());
app.use('/api/auth', authRoutes);

app.listen(3001, () => {
    console.log('Backend running on http://localhost:3001');  
});