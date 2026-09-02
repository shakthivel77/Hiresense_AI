import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { isSupabaseConfigured } from './common/index.js';
import { authRouter } from './auth/index.js';
import { usersRouter } from './users/index.js';
import { roadmapRouter } from './roadmap/index.js';
import { skillsRouter } from './skills/index.js';
import { resourcesRouter } from './resources/index.js';
import { assessmentRouter } from './assessment/index.js';
import { portfolioRouter } from './portfolio/index.js';
import { careerRouter } from './career/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/roadmap', roadmapRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/resources', resourcesRouter);
app.use('/api/assessment', assessmentRouter);
app.use('/api/portfolio', portfolioRouter);
app.use('/api/career', careerRouter);


// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    name: 'Hiresense_AI API',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    supabaseConfigured: isSupabaseConfigured(),
  });
});

app.listen(PORT, () => {
  console.log(`[Hiresense_AI] Backend running on port ${PORT}`);
});

export default app;
