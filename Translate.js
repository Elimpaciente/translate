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
    const prompt = `Translate to ${language}. Output only the translated text, no explanations:\n\n${text}`
    
    const chatGPTUrl = `https://chat-gpt-six-tan.vercel.app/chat?text=${encodeURIComponent(prompt)}`
    
    const response = await fetch(chatGPTUrl, {
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
    
    if (!data.message || data.message.trim() === '') {
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
    
    let cleanedResponse = data.message.trim()
    cleanedResponse = cleanedResponse.replace(/^["']|["']$/g, '')
    
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
