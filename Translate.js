addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
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
  
  const language = url.searchParams.get('language')
  const text = url.searchParams.get('text')
  
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
  
  try {
    const prompt = `Translate to ${language}. IMPORTANT: Return ONLY the direct translation with NO explanations, NO introductions, NO phrases like "Here is" or "The translation is". Just the translated text itself:\n\n${text}`
    
    const gpt4Url = `https://gpt4.apisimpacientes.workers.dev/?message=${encodeURIComponent(prompt)}`
    
    const response = await fetch(gpt4Url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      },
      signal: AbortSignal.timeout(30000)
    })
    
    if (!response.ok) {
      return new Response(JSON.stringify({
        status_code: 400,
        message: 'Error al comunicarse con el servicio de traducción',
        developer: 'El Impaciente',
        telegram_channel: 'https://t.me/Apisimpacientes'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const data = await response.json()
    
    if (!data.response || data.response.trim() === '') {
      return new Response(JSON.stringify({
        status_code: 400,
        message: 'No se pudo obtener la traducción',
        developer: 'El Impaciente',
        telegram_channel: 'https://t.me/Apisimpacientes'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    let cleanedResponse = data.response.trim()
    cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '')
    cleanedResponse = cleanedResponse.replace(/^(Here is the translation|The translation is|Translation|Translated text)[\s:]+/i, '')
    cleanedResponse = cleanedResponse.replace(/^(Aquí está la traducción|La traducción es)[\s:]+/i, '')
    
    return new Response(JSON.stringify({
      status_code: 200,
      response: cleanedResponse,
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    })
    
  } catch (error) {
    const isTimeout = error.name === 'AbortError' || error.message.includes('timeout')
    
    return new Response(JSON.stringify({
      status_code: 400,
      message: isTimeout ? 'Tiempo de espera agotado. Intente nuevamente.' : 'Error al traducir el texto. Intente nuevamente.',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
