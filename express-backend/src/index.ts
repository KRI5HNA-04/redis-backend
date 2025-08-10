import express from "express";
import { createClient } from "redis";

const app = express();
app.use(express.json());

const client = createClient();

async function startServer() {
    try {
        await client.connect(); // Wait for Redis to connect
        console.log("Connected to Redis");

        app.post("/submit", async (req, res) => {
            const { problemID, userId, code, language } = req.body;
            await client.lPush(
                "submissions",
                JSON.stringify({ problemID, userId, code, language })
            );
            res.json({ message: "Submission received!" });
        });

        app.listen(3000, () => console.log("Server running on port 3000"));
    } catch (err) {
        console.error("Error connecting to Redis:", err);
    }
}

startServer();
