import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { router as wasteRoutes } from './routes/waste.js';
import { router as vendorRoutes } from './routes/vendors.js';
import { router as userRoutes } from './routes/users.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/waste', wasteRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/users', userRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});