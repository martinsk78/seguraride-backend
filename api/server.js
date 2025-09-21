// =======================
// 1. Dependencias
// =======================
const express = require("express");
const cors = require("cors");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyBfSpj55wGfrhcFI8LvOluOyr6-XUyvCI0";

// Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

// =======================
// 2. Endpoint: Feedback de trips
// =======================
app.post("/api/trips-feedback", async (req, res) => {
  try {
    const { trips } = req.body;
    if (!trips || Object.keys(trips).length === 0) {
      return res.status(400).json({ error: "No hay trips enviados" });
    }

    const resumen = Object.values(trips)
      .map((t, i) => `Trip ${i + 1}: ${t.distancia} km, velocidad promedio ${t.promedio} km/h`)
      .join("\n");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Eres un entrenador experto en ciclismo. Analiza estos trips y da feedback claro y conciso:\n${resumen}`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    const feedback = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No hay feedback";

    res.json({ feedbackTrips: feedback });

  } catch (err) {
    console.error("Error /api/trips-feedback:", err);
    res.status(500).json({ error: "Error generando feedback" });
  }
});

// =======================
// 3. Endpoint: Climate advice
// =======================
app.post("/api/climate-advice", async (req, res) => {
  try {
    const { provinciaNombre, date } = req.body;
    if (!provinciaNombre || !date) {
      return res.status(400).json({ error: "provinciaNombre y date son requeridos" });
    }

    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GOOGLE_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Soy un entrenador de ciclismo. El ciclista saldrá a ${provinciaNombre} el día ${date}. Da consejos de vestimenta, hidratación, seguridad y horario para salir en bici considerando la temperatura estimada.`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await geminiRes.json();
    const advice = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!advice) {
      return res.status(500).json({ error: "No se pudo generar el consejo climático" });
    }

    res.json({ texto: advice });

  } catch (err) {
    console.error("Error /api/climate-advice:", err);
    res.status(500).json({ error: "Error procesando la solicitud" });
  }
});

// =======================
// 4. Exportar handler para Vercel
// =======================
module.exports.handler = serverless(app);
