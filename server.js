// =======================
// 1. Dependencias
// =======================
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const GOOGLE_API_KEY = "AIzaSyBfSpj55wGfrhcFI8LvOluOyr6-XUyvCI0"
// Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// =======================
// 2. Configuración Gemini
// =======================
const GEMINI_KEY = "AIzaSyBfSpj55wGfrhcFI8LvOluOyr6-XUyvCI0";

// =======================
// 3. Endpoint: Feedback de trips
// =======================
app.post("/api/trips-feedback", async (req, res) => {
  try {
    const { trips } = req.body;
    if (!trips || Object.keys(trips).length === 0) {
      return res.status(400).json({ error: "No hay trips enviados" });
    }

    // Crear resumen de trips
    const resumen = Object.values(trips)
      .map((t, i) => `Trip ${i + 1}: ${t.distancia} km, velocidad promedio ${t.promedio} km/h`)
      .join("\n");

    // Llamada a Gemini 2.0
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GOOGLE_API_KEY, // tu API key
        },
        body: JSON.stringify({
          contents: [
          {
              parts: [
                {
                  text: `Eres un entrenador experto en ciclismo. Analiza estos trips y da feedback claro, motivador y conciso:\n${resumen}. Haz una fuerte relacion entre los viajes hablando con estadisticas entre ellos, de mejora y demas. Da consejos concretos y consisos, no te explayes mucho, y acuerdate que le estas hablando a un ciclista, no lo trates como a un usuario de IA sino como a un ciclista`
                }
              ]
            }
          ]
        }),
      }
    );

    const data = await response.json();
    console.log("Respuesta Gemini trips:", JSON.stringify(data, null, 2));

    // Extraer texto
const feedback = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") || "No hay feedback";

    res.json({ feedbackTrips: feedback });

  } catch (err) {
    console.error("Error /api/trips-feedback:", err);
    res.status(500).json({ error: "Error generando feedback" });
  }
});


// =======================
// Endpoint: Climate advice
// =======================
app.post("/api/climate-advice", async (req, res) => {
  try {
    const { provinciaNombre, date } = req.body;

    if (!provinciaNombre || !date) {
      return res.status(400).json({ error: "provinciaNombre y date son requeridos" });
    }

    // Buscar la provincia en el JSON



    // Llamada a Gemini
    const geminiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": GOOGLE_API_KEY, // usar variable de entorno
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Soy un entrenador de ciclismo. El ciclista saldrá a ${provinciaNombre}  el día ${date}.Debes dar un aproximado de temperatura, independientemente de que la sepas con certeza o no, aproxima conociendo la posicion geografica y las condiciones del lugar, pero presentala como si estuvieses totalmente seguro y la hubieses sacado de algun lado. Dame consejos de vestimenta, hidratación, seguridad y horario para salir en bici considerando la temperatura estimada. Es un prompt que sera mostrado a gente como datos fiables, no como una pregunta a una ia. Presentalos de esa manera`,
                },
              ],
            },
          ],
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
// 5. Levantar servidor
// =======================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});
