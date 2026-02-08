const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "*", // Allow all origins for now (dev + prod)
        methods: ["GET", "POST"]
    }
});

// Store recent state
let state = {
    shortHunter: { status: 'WAITING', trades: [] },
    bountySeeker: { status: 'WAITING', trades: [], top_gainers: [] },
    lastUpdated: new Date().toISOString()
};

// ========== WEBHOOK ENDPOINT (Bots send here) ==========
app.post('/webhook', (req, res) => {
    const { source, data } = req.body;

    console.log(`📡 Webhook received from: ${source}`);
    console.log('📦 Data structure:', JSON.stringify(data, null, 2).substring(0, 500));

    if (source === 'short_hunter') {
        // Short hunter sends { type: "active_trades_update", active_trades: {...} }
        // Extract the actual trades data
        if (data.active_trades) {
            state.shortHunter = {
                status: 'ACTIVE',
                active_trades: data.active_trades,
                lastUpdated: new Date().toISOString()
            };
        } else if (data.signals) {
            state.shortHunter = {
                status: 'SCANNING',
                signals: data.signals,
                lastUpdated: new Date().toISOString()
            };
        } else {
            state.shortHunter = {
                status: 'ACTIVE',
                ...data,
                lastUpdated: new Date().toISOString()
            };
        }
    } else if (source === 'bounty_seeker') {
        // Bounty seeker sends { type: "bounty_seeker_update", payload: {...} }
        // Extract the actual data from payload
        if (data.payload) {
            state.bountySeeker = {
                status: 'ACTIVE',
                ...data.payload,
                lastUpdated: new Date().toISOString()
            };
        } else {
            state.bountySeeker = {
                status: 'ACTIVE',
                ...data,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    state.lastUpdated = new Date().toISOString();

    // Broadcast full state update to all clients
    io.emit('state-update', state);

    res.status(200).json({ status: 'ok' });
});

// ========== WEBSOCKET CONNECTION (Frontend connects here) ==========
io.on('connection', (socket) => {
    console.log('📱 Client connected:', socket.id);

    // Send immediate state on connection
    socket.emit('state-update', state);

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

const PORT = 3001; // Using 3001 to avoid conflict with Next.js (3000)
httpServer.listen(PORT, () => {
    console.log(`🚀 Signal Server running on port ${PORT}`);
    console.log(`🔗 Webhook URL: http://localhost:${PORT}/webhook`);
});
