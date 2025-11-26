addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

const METADATA = {
  developer: 'El Impaciente',
  telegram_channel: 'https://t.me/Apisimpacientes'
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

async function handleRequest(request) {
  const url = new URL(request.url)
  
  if (!url.pathname.startsWith('/translate')) {
    return errorResponse('Endpoint not found. Use /translate', 404)
  }

  if (request.method !== 'GET') {
    return errorResponse('Only GET requests are allowed', 400)
  }

  const language = url.searchParams.get('language')?.trim()
  const text = url.searchParams.get('text')?.trim()

  if (!language || !text) {
    return errorResponse('The language and text parameters are required', 400)
  }

  try {
    const translation = await getTranslation(language, text)
    return jsonResponse({ status_code: 200, ...METADATA, response: translation }, 200, { 'Cache-Control': 'public, max-age=3600' })
  } catch (error) {
    const message = error.name === 'AbortError' || error.message.includes('timeout') 
      ? 'Tiempo de espera agotado. Intente nuevamente.' 
      : 'Error al traducir el texto. Intente nuevamente.'
    return errorResponse(message, 400)
  }
}

async function getTranslation(language, text) {
  const prompt = `Translate to ${language}. IMPORTANT: Return ONLY the direct translation with NO explanations, NO introductions, NO phrases like "Here is" or "The translation is". Just the translated text itself:\n\n${text}`

  const response = await fetch(`https://gpt4.apisimpacientes.workers.dev/?message=${encodeURIComponent(prompt)}`, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(30000)
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const data = await response.json()
  
  if (!data.response?.trim()) {
    throw new Error('No translation available')
  }

  return data.response.trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^(Here is the translation|The translation is|Translation|Translated text)[\s:]+/i, '')
    .replace(/^(Aquí está la traducción|La traducción es)[\s:]+/i, '')
}

function errorResponse(message, status) {
  return jsonResponse({ status_code: status, ...METADATA, message }, status)
}

function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS, ...extraHeaders }
  })
}
