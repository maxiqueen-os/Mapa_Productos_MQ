export default async function handler(req, res) {
  // Asegurar que solo acepte peticiones POST de tu chat
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { message } = req.body;

  // Recolectar todas las llaves de infraestructura disponibles en Vercel
  const apiKeys = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
    process.env.GEMINI_API_KEY_5
  ].filter(Boolean); // Filtra automáticamente las que estén vacías o no configuradas

  if (apiKeys.length === 0) {
    return res.status(500).json({ error: 'Falta la configuración de infraestructura (No hay API Keys de Gemini detectadas).' });
  }

  let textAI = null;
  let lastError = null;

  // Sistema de rotación y respaldo (Fallback): Prueba las llaves en orden hasta que una funcione
  for (let i = 0; i < apiKeys.length; i++) {
    const apiKey = apiKeys[i];
    
    try {
      const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        })
      });

      const data = await googleResponse.json();

      // Si la API de Google da error (ej. límite de cuota excedido), guardamos el error y probamos la siguiente llave
      if (!googleResponse.ok) {
        lastError = data.error?.message || `Error HTTP ${googleResponse.status}`;
        continue; 
      }

      // Extraemos el texto de Gemini
      textAI = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (textAI) {
        break; // ¡Éxito! Rompemos el ciclo porque ya conseguimos respuesta
      }

    } catch (error) {
      lastError = error.message;
      continue; // Si hay un fallo de red, pasa a la siguiente llave del pool
    }
  }

  // Si ninguna de las llaves pudo responder
  if (!textAI) {
    return res.status(500).json({ 
      error: 'Error en el enrutador de IA: Todas las llaves del clúster fallaron o alcanzaron su límite. Detalle: ' + (lastError || 'Desconocido') 
    });
  }

  // Retornamos la respuesta como 'response' para que tu interfaz la lea de inmediato
  return res.status(200).json({ response: textAI });
}
