import assert from 'node:assert/strict'

const base = process.argv[2] || 'http://127.0.0.1:8893'
const origin = 'https://it-toolbox.137101.xyz'
const get = async path => {
  const response = await fetch(new URL(path, base), { signal: AbortSignal.timeout(30_000) })
  return { response, body: await response.text() }
}
const { response: mapResponse, body: sitemap } = await get('/sitemap.xml')
assert.equal(mapResponse.status, 200)
assert.match(mapResponse.headers.get('content-type'), /xml/)
assert.match(sitemap, /<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/)
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]))
assert.ok(urls.length > 100)
assert.equal(new Set(urls.map(url => url.href)).size, urls.length)
const { response: robotsResponse, body: robots } = await get('/robots.txt')
assert.equal(robotsResponse.status, 200)
assert.match(robotsResponse.headers.get('content-type'), /text\/plain/)
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
assert.match(robots, /Disallow: \/api\//)
let cursor = 0, checked = 0
const titles = new Set()
await Promise.all(Array.from({ length: 6 }, async () => {
  while (cursor < urls.length) {
    const url = urls[cursor++]
    assert.equal(url.origin, origin)
    assert.equal(url.hash, '')
    const { response, body } = await get(url.pathname)
    assert.equal(response.status, 200, url.pathname)
    assert.match(response.headers.get('content-type'), /text\/html/)
    assert.ok(body.includes(`<link rel="canonical" href="${url.href}"`), `canonical: ${url.pathname}`)
    assert.equal((body.match(/<h1\b/g) || []).length, 1, `one HTML heading: ${url.pathname}`)
    assert.ok(!/name="robots" content="noindex/.test(body), url.pathname)
    assert.ok(body.includes('application/ld+json'), url.pathname)
    const title = body.match(/<title>(.*?)<\/title>/)?.[1]
    assert.ok(title && !titles.has(title), `unique title: ${url.pathname}`)
    titles.add(title)
    checked++
  }
}))
for (const path of ['/favorites', '/history']) {
  const { response, body } = await get(path)
  assert.equal(response.status, 200)
  assert.match(body, /name="robots" content="noindex, follow"/)
}
const missing = await get('/this-page-does-not-exist')
assert.equal(missing.response.status, 404, 'Unknown URLs must not be soft 404s')
console.log(`PASS: ${checked} public HTML pages; unique metadata, canonical URLs, headings, structured data, sitemap/robots, private-page noindex, and HTTP 404 verified against ${base}.`)
