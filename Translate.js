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
    const langMap = {
      'spanish': 'es', 'español': 'es', 'english': 'en', 'inglés': 'en',
      'french': 'fr', 'francés': 'fr', 'german': 'de', 'alemán': 'de',
      'italian': 'it', 'italiano': 'it', 'portuguese': 'pt', 'portugués': 'pt',
      'russian': 'ru', 'ruso': 'ru', 'japanese': 'ja', 'japonés': 'ja',
      'chinese': 'zh-CN', 'chino': 'zh-CN', 'arabic': 'ar', 'árabe': 'ar',
      'korean': 'ko', 'coreano': 'ko', 'hindi': 'hi', 'dutch': 'nl',
      'holandés': 'nl', 'polish': 'pl', 'polaco': 'pl', 'turkish': 'tr', 'turco': 'tr'
    }
    
    const targetLang = langMap[language.toLowerCase()] || language.toLowerCase().slice(0, 2)
    const googleUrl = `https://translate.google.com/m?sl=auto&tl=${targetLang}&hl=${targetLang}&q=${encodeURIComponent(text)}`
    
    const response = await fetch(googleUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36' },
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
    
    const html = await response.text()
    const resultMatch = html.match(/<div class="result-container">([^<]+)<\/div>/i)
    
    if (!resultMatch || !resultMatch[1]) {
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
    
    return new Response(JSON.stringify({
      status_code: 200,
      response: resultMatch[1].trim(),
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' }
    })
    
  } catch (error) {
    return new Response(JSON.stringify({
      status_code: 400,
      message: error.name === 'AbortError' ? 'Tiempo de espera agotado. Intente nuevamente.' : 'Error al traducir el texto. Intente nuevamente.',
      developer: 'El Impaciente',
      telegram_channel: 'https://t.me/Apisimpacientes'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
