const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '50mb' }));

// Firebase Admin Setup
const serviceAccount = require('./serviceAccountKey.json');
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY='AIzaSyDWneTaf5zcMRfoD0Qdkz71RUx_A258M-k');

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// AI Analyze Endpoint with User tracking
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { image, prompt, mode, userId } = req.body;

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        // Check if API key is configured
        if (!process.env.GEMINI_API_KEY && !genAI.apiKey) {
            // Fallback mock response for testing
            const mockResponses = {
                describe: "This image shows a scene with various objects. [Sinhala: මෙම පින්තූරයේ විවිධ දේවල් පෙනේ.]",
                text: "No readable text detected in this image.",
                currency: "No currency notes or coins detected in this image.",
                safety: "No immediate safety hazards detected in this image."
            };
            
            const result = mockResponses[mode] || mockResponses.describe;
            
            // Save to Firestore
            const historyData = {
                mode,
                result,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: userId || 'anonymous',
                mockResponse: true
            };
            await db.collection('vision_history').add(historyData);
            
            return res.json({ result });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageParts = [{
            inlineData: { data: image.split(",")[1], mimeType: "image/jpeg" }
        }];

        const result = await model.generateContent([prompt, ...imageParts]);
        const text = result.response.text();

        // Save to Firestore with User ID
        const historyData = {
            mode,
            result: text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: userId || 'anonymous'
        };

        await db.collection('vision_history').add(historyData);

        res.json({ result: text });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Analysis failed: " + error.message });
    }
});

// Get user's vision history
app.get('/api/vision-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const snapshot = await db.collection('vision_history')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const history = [];
        snapshot.forEach(doc => {
            history.push({ id: doc.id, ...doc.data() });
        });
        res.json({ history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));