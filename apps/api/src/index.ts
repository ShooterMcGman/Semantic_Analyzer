import "dotenv/config";
import express from "express";
import cors from "cors";
import analyzeRoutes from "./routes/analyze";

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(cors());

app.use("/api", analyzeRoutes);

const PORT = process.env.PORT || 8787;
app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
});
