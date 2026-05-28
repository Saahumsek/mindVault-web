async function fetchQuizData(token, supabaseUrl, supabaseAnonKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/get_shared_quiz`, {
      method: 'POST',
      headers: { 'apikey': supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_share_token: token }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return (data && data.questions) ? data : null
  }

  function buildTitle(data) {
    if (data.title && data.title.trim()) return data.title.trim()
    const content = (data.content || '').trim()
    return content.slice(0, 50) + (content.length > 50 ? '…' : '')
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }

  class HeadRewriter {
    constructor(title, description) { this.title = title; this.description = description }
    element(el) {
      el.append(
        `<meta property="og:title" content="${esc(this.title)}" />` +
        `<meta property="og:description" content="${esc(this.description)}" />` +
        `<meta property="og:type" content="website" />` +
        `<meta property="og:site_name" content="Memoory" />` +
        `<meta name="twitter:card" content="summary" />` +
        `<meta name="twitter:title" content="${esc(this.title)}" />` +
        `<meta name="twitter:description" content="${esc(this.description)}" />`,
        { html: true }
      )
    }
  }

  class TitleRewriter {
    constructor(title) { this.title = title }
    element(el) { el.setInnerContent(`${this.title} · Memoory`) }
  }
  
  export async function onRequest(context) {
    const response = await context.env.ASSETS.fetch(context.request)
    const token = new URL(context.request.url).searchParams.get('token')
    if (!token) return response
    let data
    try { data = await fetchQuizData(token, context.env.SUPABASE_URL, context.env.SUPABASE_ANON_KEY) }
    catch { return response }   
    if (!data) return response
    const title = buildTitle(data)
    const count = (data.questions || []).length
    const description = `${count} question${count !== 1 ? 's' : ''} · Teste tes connaissances sur Memoory`
    return new HTMLRewriter()
      .on('title', new TitleRewriter(title))
      .on('head', new HeadRewriter(title, description))
      .transform(response)
  }
