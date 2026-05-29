const SUPABASE_URL      = 'https://lvpnitxehagoknqesryf.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2cG5pdHhlaGFnb2tucWVzcnlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTM4NTksImV4cCI6MjA5MDI2OTg1OX0.7owRNtMPRU1_v9E6fgPgN8F4TvQ6XAKKtbKlMRxAAPc'

const STATIC_TITLE = 'Quiz · Memoory App'
const STATIC_DESC  = 'Réponds aux questions et teste tes connaissances !'

export default async function(request, context) {
  const url   = new URL(request.url)
  const token = url.searchParams.get('token')

  // No token — serve static file as-is
  if (!token) return context.next()

  let title = STATIC_TITLE
  let desc  = STATIC_DESC

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_shared_quiz`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_share_token: token })
    })

    if (res.ok) {
      const data = await res.json()
      if (data) {
        const noteTitle = data.title && data.title.trim()
          ? data.title.trim()
          : (data.content || '').trim().slice(0, 60) + ((data.content || '').length > 60 ? '…' : '')

        if (noteTitle) {
          title = `${noteTitle} · Memoory`
          const q = data.questions ? data.questions.length : 0
          desc  = `${q} question${q !== 1 ? 's' : ''} — Teste tes connaissances !`
        }
      }
    }
  } catch (_) {}

  const response = await context.next()
  const html     = await response.text()

  function esc(s) {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  }

  const modified = html
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/(<meta[^>]+property="og:title"[^>]+content=")[^"]*(")/,   `$1${esc(title)}$2`)
    .replace(/(<meta[^>]+name="twitter:title"[^>]+content=")[^"]*("/),  `$1${esc(title)}$2`)
    .replace(/(<meta[^>]+property="og:description"[^>]+content=")[^"]*(")/,  `$1${esc(desc)}$2`)
    .replace(/(<meta[^>]+name="twitter:description"[^>]+content=")[^"]*("/), `$1${esc(desc)}$2`)

  return new Response(modified, {
    status:  response.status,
    headers: response.headers
  })
}
