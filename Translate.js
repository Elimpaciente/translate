addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  // Solo aceptar GET requests
  if (request.method !== 'GET') {
    return new Response(JSON.stringify({
      status_code: 400,
      message: 'Only GET requests are allowed',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Obtener parámetros
  const language = url.searchParams.get('language')
  const text = url.searchParams.get('text')
  
  // Validar parámetros
  if (!language || !text || language.trim() === '' || text.trim() === '') {
    return new Response(JSON.stringify({
      status_code: 400,
      message: 'The language and text parameters are required',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  // Validar longitud del texto
  if (text.length > 5000) {
    return new Response(JSON.stringify({
      status_code: 400,
      message: 'Text exceeds the 5000 character limit',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    // Crear el prompt para traducir
    const prompt = `Translate the following text to ${language}. Only respond with the translation, nothing else:\n\n${text}`
    
    // Llamar a Pollinations.AI
    const pollinationsUrl = `https://text.pollinations.ai/${encodeURIComponent(prompt)}`
    
    const response = await fetch(pollinationsUrl, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain'
      },
      signal: AbortSignal.timeout(30000)
    })
    
    if (!response.ok) {
      return new Response(JSON.stringify({
        status_code: 400,
        message: 'Error communicating with translation service',
        developer: 'El Impaciente',
        telegram_channel: 'https://t.me/Apisimpacientes'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const translation = await response.text()
    const cleanedTranslation = translation.trim()
    
    if (!cleanedTranslation) {
      return new Response(JSON.stringify({
        status_code: 400,
        message: 'Could not get translation',
        developer: 'El Impaciente',
        telegram_channel: 'https://t.me/Apisimpacientes'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Respuesta exitosa: solo el texto traducido
    return new Response(cleanedTranslation, {
      status: 200,
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout')
    
    return new Response(JSON.stringify({
      status_code: 400,
      message: isTimeout ? 'Request timeout. Please try again.' : 'Error translating text. Please try again.',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
