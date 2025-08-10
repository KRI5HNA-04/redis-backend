"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("redis");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// In-memory fallback queue if Redis unavailable
const fallbackSubmissions = [];
const REDIS_URL = process.env.REDIS_URL; // optional
const client = (0, redis_1.createClient)(REDIS_URL ? { url: REDIS_URL } : {});
let redisReady = false;
let redisErrorCount = 0;
client.on("error", (err) => {
    redisErrorCount++;
    if (redisErrorCount <= 3) {
        const summary = (err === null || err === void 0 ? void 0 : err.code) || (err === null || err === void 0 ? void 0 : err.message) || (err === null || err === void 0 ? void 0 : err.name) || 'Unknown Redis error';
        console.error(`[Redis] Error ${redisErrorCount}:`, summary);
        if (redisErrorCount === 3) {
            console.error('[Redis] Further errors will be suppressed.');
        }
    }
});
function connectRedis() {
    return __awaiter(this, arguments, void 0, function* (retries = 5, delayMs = 1000) {
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                yield client.connect();
                redisReady = true;
                console.log("Connected to Redis");
                return;
            }
            catch (e) {
                console.warn(`Redis connect attempt ${attempt}/${retries} failed: ${e.code || e.message}`);
                if (attempt === retries) {
                    console.error("Proceeding without Redis. Using in-memory fallback queue.");
                    return;
                }
                yield new Promise(r => setTimeout(r, delayMs));
            }
        }
    });
}
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', redis: redisReady ? 'up' : 'down', fallbackQueueLength: fallbackSubmissions.length });
});
app.post('/submit', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { problemID, userId, code, language } = req.body || {};
    if (!problemID || !userId || !code || !language) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const payload = JSON.stringify({ problemID, userId, code, language, ts: Date.now() });
    try {
        if (redisReady) {
            yield client.lPush('submissions', payload);
        }
        else {
            fallbackSubmissions.push(payload);
        }
        res.json({ message: 'Submission received', stored: redisReady ? 'redis' : 'memory' });
    }
    catch (e) {
        console.error('Store submission failed, falling back to memory:', e);
        fallbackSubmissions.push(payload);
        res.json({ message: 'Submission received', stored: 'memory' });
    }
}));
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
connectRedis();
