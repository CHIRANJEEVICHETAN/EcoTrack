import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { validateWaste, validateVendor, validateRecycleData } from './../middleware/validation.js';
import { auth, db } from './../config/firebase.js';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || '48c33d6003912cd3e7e51d97973193dce24a653245a11cda5ac0f01058ae5450ca732ba3b565e938014eecef7c9fc260b9c453350d654649ea79be9ada505bb0';

app.use(cors());
app.use(express.json());

// Auth middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
};

// E-waste tracking endpoints
app.post('/api/e-waste', authenticateToken, validateWaste, async (req, res) => {
    try {
        const { itemType, weight, location } = req.body;
        const userId = req.user.uid;

        const docRef = await db.collection('e-waste').add({
            itemType,
            weight,
            location,
            userId,
            status: 'Pending',
            createdAt: new Date()
        });

        res.status(201).json({ id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/e-waste/:id', authenticateToken, async (req, res) => {
    try {
        const doc = await db.collection('e-waste').doc(req.params.id).get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json({ id: doc.id, ...doc.data() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vendor management endpoints
app.post('/api/vendors', authenticateToken, validateVendor, async (req, res) => {
    try {
        const vendorData = {
            ...req.body,
            createdAt: new Date()
        };
        const docRef = await db.collection('vendors').add(vendorData);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/vendors', async (req, res) => {
    try {
        const snapshot = await db.collection('vendors').get();
        const vendors = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Recycling data endpoints
app.post('/api/recycle-data', authenticateToken, validateRecycleData, async (req, res) => {
    try {
        const recycleData = {
            ...req.body,
            timestamp: new Date()
        };
        const docRef = await db.collection('recycleData').add(recycleData);
        res.status(201).json({ id: docRef.id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/recycle-data', authenticateToken, async (req, res) => {
    try {
        const snapshot = await db.collection('recycleData').get();
        const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
