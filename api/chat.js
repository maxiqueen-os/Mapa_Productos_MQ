export default async function handler(req, res) {
  // Asegurar que solo acepte peticiones POST de tu chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { message } = req.body;
  // Vercel inyecta automáticamente esta variable desde tu panel
  const apiKey = process.env.GEMINI_API_KEY_1;

  if (!apiKey) {
    return res.status(500).json({ error: 'Falta la configuración de infraestructura (API Key 1).' });
  }

  try {
    // Conexión directa con el modelo ultrarrápido Gemini 1.5 Flash
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "El núcleo no devolvió una respuesta válida.";

    return res.status(200).json({ reply });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el enrutador de IA: ' + error.message });
  }
}