const express = require("express");
const serverless = require("serverless-http");
const cors = require("cors");

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/hello", (req, res) => {
  res.json({ message: "Hola desde Vercel 🚀" });
});

// Exportar como handler para Vercel
module.exports = app;
module.exports.handler = serverless(app);
