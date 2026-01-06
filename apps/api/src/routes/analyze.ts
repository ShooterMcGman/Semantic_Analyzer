import { Router } from "express";
import client from "../services/openrouterClient";

const router = Router();

router.post("/analyze", async (req, res) => {
    try {
        const { model, systemInstruction, chunkText } = req.body as {
            model?: string;
            systemInstruction: string;
            chunkText: string;
        };

        const completion = await client.chat.completions.create({
            model: model ?? "xiaomi/mimo-v2-flash:free",
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: chunkText },
            ],
            // Stop forcing JSON. We want the LLM's raw XML output.
            // response_format: { type: "json_object" }, 
        });

        const content = completion.choices?.[0]?.message?.content ?? "";

        // Dumb Pipe: Just wrap the raw text in a JSON object to transport it safely.
        // We do NOT parse the internal XML.
        res.json({ rawOutput: content });

    } catch (err: any) {
        console.error("API Error:", err);
        res.status(500).json({ error: err?.message ?? "Unknown error" });
    }
});

export default router;
