import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import Anthropic from "@anthropic-ai/sdk"
import { HfInference } from "@huggingface/inference"

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
})

const hf = new HfInference(process.env.HF_ACCESS_TOKEN)

const SYSTEM_PROMPT = `You are an assistant that receives a list of ingredients and suggests a recipe.`

// Anthropic endpoint
app.post("/api/recipe/claude", async (req, res) => {
    try {
        const ingredients = req.body.ingredients.join(", ")

        const msg = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            messages: [
                { role: "user", content: `I have ${ingredients}. Give me a recipe.` }
            ],
        })

        res.json({ recipe: msg.content[0].text })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

// HuggingFace endpoint
app.post("/api/recipe/mistral", async (req, res) => {
    try {
        const ingredients = req.body.ingredients.join(", ")

        const response = await hf.chatCompletion({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                { role: "user", content: `I have ${ingredients}. Give me a recipe.` }
            ],
        })

        res.json({ recipe: response.choices[0].message.content })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

app.listen(3001, () => {
    console.log("Server running on http://localhost:3001")
})