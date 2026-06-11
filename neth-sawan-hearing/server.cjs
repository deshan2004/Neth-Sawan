const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST'] }));
app.use(express.json({ limit: '50mb' }));

// Firebase Admin Setup (Safe initialization using environment variables ideally)
let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch (err) {
    console.error("⚠️ serviceAccountKey.json missing! Ensure it exists in root.");
}

if (!admin.apps.length && serviceAccount) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}
const db = admin.firestore();

// Initialize Gemini AI (Strictly from .env for security)
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.warn("⚠️ WARNING: GEMINI_API_KEY is not defined in the environment variables. Using mock fallback mode.");
}
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * 1. User Sync Endpoint
 * POST /api/users
 */
app.post('/api/users', async (req, res) => {
    try {
        const { uid, name, email, role } = req.body;

        if (!uid || !email) {
            return res.status(400).json({ error: "Missing required fields: uid or email" });
        }

        const userData = {
            uid,
            name: name || 'Neth-Sawan User',
            email,
            role: role || 'user',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('users').doc(uid).set(userData, { merge: true });
        res.status(201).json({ message: "User profile synced successfully", user: userData });
    } catch (error) {
        console.error("Error saving user to Firestore:", error);
        res.status(500).json({ error: "Failed to save user: " + error.message });
    }
});

/**
 * 2. AI Image Analysis Endpoint
 * POST /api/analyze-image
 */
app.post('/api/analyze-image', async (req, res) => {
    try {
        const { image, prompt, mode, userId } = req.body;

        if (!image) {
            return res.status(400).json({ error: "No image provided" });
        }

        // Mock mode switch if Gemini API Key isn't provided
        if (!genAI) {
            const mockResponses = {
                describe: "This image shows a scene with various objects. [Sinhala: මෙම පින්තූරයේ විවිධ දේවල් පෙනේ.]",
                text: "No readable text detected in this image.",
                currency: "No currency notes or coins detected in this image.",
                safety: "No immediate safety hazards detected in this image."
            };
            
            const result = mockResponses[mode] || mockResponses.describe;
            
            await db.collection('vision_history').add({
                mode,
                result,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                userId: userId || 'anonymous',
                mockResponse: true
            });
            
            return res.json({ result });
        }

        // Base64 Safe Extraction (Frontend එකෙන් data:image/... ආවොත් ක්‍රැෂ් වෙන්නේ නැති වෙන්න)
        let base64Data = image;
        if (image.includes(",")) {
            base64Data = image.split(",")[1];
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const imageParts = [{
            inlineData: { data: base64Data, mimeType: "image/jpeg" }
        }];

        // System Instruction එකක් එක්ක Prompt එක යැවීම (වැඩි දියුණු කර ඇත)
        const systemPrompt = `Act as an accessibility assistant for deaf and blind users. Mode: ${mode}. ${prompt}`;
        const result = await model.generateContent([systemPrompt, ...imageParts]);
        const text = result.response.text();

        // History Log to Firestore
        await db.collection('vision_history').add({
            mode,
            result: text,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            userId: userId || 'anonymous'
        });

        res.json({ result: text });
    } catch (error) {
        console.error("🎯 Analysis Error:", error);
        res.status(500).json({ error: "Analysis failed: " + error.message });
    }
});

/**
 * 3. User Vision History Endpoint
 * GET /api/vision-history/:userId
 */
app.get('/api/vision-history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        
        // සටහන: Firebase Console එකෙන් Composite Index එකක් හදන්න සිදුවේ (userId Ascending, timestamp Descending)
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
        console.error("History fetch error:", error);
        res.status(500).json({ error: "Could not fetch history. If index error, check Firebase Console: " + error.message });
    }
});

/**
 * 4. 🆕 අලුතින් එක් කල SOS / Road Emergency Alert Logs Endpoint
 * POST /api/emergency-log
 */
app.post('/api/emergency-log', async (req, res) => {
    try {
        const { userId, type, message, location } = req.body;

        const logEntry = {
            userId: userId || 'anonymous',
            type: type || 'GENERAL_SOS', // e.g., 'ROAD_CRITICAL', 'SOS_BUTTON'
            message,
            location: location || null, // { lat: x, lng: y }
            timestamp: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('emergency_logs').add(logEntry);
        res.status(201).json({ success: true, logId: docRef.id });
    } catch (error) {
        console.error("Emergency logging failed:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Neth-Sawan Server running on port ${PORT}`));