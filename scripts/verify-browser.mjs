import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] || 'http://127.0.0.1:8893'
const profile = mkdtempSync(join(tmpdir(), 'toolbox-browser-'))
const port = 9400 + Math.floor(Math.random() * 500)
const browser = spawn(process.env.CHROME_BIN || '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome', ['--headless=new','--no-sandbox','--disable-dev-shm-usage','--hide-scrollbars',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'], { stdio: 'ignore' })
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const errors = [], analytics = []
let ws, passed = 0
try {
  let endpoint
  for (let attempt=0; attempt<60; attempt++) {
    try { endpoint = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl; break } catch { await sleep(200) }
  }
  assert.ok(endpoint, 'Chromium started')
  ws = new WebSocket(endpoint)
  await new Promise(resolve => { ws.onopen = resolve })
  let sequence=0
  const pending=new Map()
  ws.onmessage = event => {
    const message=JSON.parse(event.data)
    if (message.id && pending.has(message.id)) {
      const {resolve,reject,timer}=pending.get(message.id);clearTimeout(timer);pending.delete(message.id)
      message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)
    }
    if (message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text)
    if (message.method==='Log.entryAdded' && message.params.entry.level==='error') errors.push(message.params.entry.text)
    if (message.method==='Network.requestWillBeSent' && /google-analytics\.com\/g\/collect/.test(message.params.request.url)) analytics.push(message.params.request.url)
  }
  const send=(method,params={},sessionId) => new Promise((resolve,reject) => {
    const id=++sequence;const timer=setTimeout(() => { pending.delete(id);reject(new Error(`CDP timeout: ${method}`)) },20000)
    pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,sessionId}))
  })
  const {targetId}=await send('Target.createTarget',{url:'about:blank'})
  const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true})
  const page=(method,params={})=>send(method,params,sessionId)
  await page('Page.enable');await page('Runtime.enable');await page('Log.enable');await page('Network.enable')
  await page('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false})
  const evaluate=async expression => {
    const result=await page('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true})
    if(result.exceptionDetails)throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const until=async (expression,label) => {
    for(let attempt=0;attempt<80;attempt++){if(await evaluate(`Boolean(${expression})`))return;await sleep(150)}
    throw new Error(`Timed out: ${label}`)
  }
  const navigate=async path=> { await page('Page.navigate',{url:new URL(path,base).href});await until('document.querySelector(".workspace-header") !== null','React app rendered');await sleep(350) }
  const check=(label,result)=> { assert.ok(result,label);passed++;console.log(`PASS ${label}`) }
  const input=async (selector,value)=>evaluate(`(() => { const el=document.querySelector(${JSON.stringify(selector)}); if(!el)throw Error('Missing input'); Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true})); })()`)

  await navigate('/')
  await until('document.querySelector("#home-title")','homepage loaded')
  check('One visible main heading',await evaluate('document.querySelectorAll("h1").length===1'))
  check('Eight everyday tools',await evaluate('document.querySelectorAll(".tool-card").length===8'))
  check('Chinese default',await evaluate('document.documentElement.lang==="zh-CN" && document.querySelector("h1").textContent.includes("一站搞定")'))
  await input('#tool-search','Base64')
  await until('Array.from(document.querySelectorAll(".tool-card h3")).some(el=>el.textContent.includes("Base64"))','tool search')
  check('Search finds Base64',true)
  await input('#tool-search','zzzz-no-such-tool-9847')
  await until('document.querySelector(".empty-search")','empty results')
  check('Useful empty search state',true)
  await input('#tool-search','')
  await evaluate('Array.from(document.querySelectorAll(".category-filters button")).find(el=>el.textContent==="编码解码").click()')
  await until('document.querySelectorAll(".tool-card").length===11','category filter')
  check('Category filters the tool inventory',true)
  await evaluate('document.querySelector(".category-filters button").click()')
  await until('document.querySelectorAll(".tool-card").length===8','reset category')
  await evaluate('document.querySelector(".favorite-button").click()')
  check('Favorite button does not navigate',await evaluate('location.pathname==="/"'))
  await evaluate('document.querySelector(".sidebar-nav a[href=\'/favorites\']").click()')
  await until('location.pathname==="/favorites" && document.querySelectorAll(".tool-card").length===1','favorite page')
  await page('Page.reload')
  await until('document.querySelectorAll(".tool-card").length===1','favorite persistence')
  check('Favorites persist on reload',true)

  await page('Input.dispatchKeyEvent',{type:'keyDown',key:'k',code:'KeyK',modifiers:2})
  await page('Input.dispatchKeyEvent',{type:'keyUp',key:'k',code:'KeyK',modifiers:2})
  await until('document.querySelector("[role=dialog] input")','command search opens')
  await input('[role=dialog] input','时间戳')
  await until('Array.from(document.querySelectorAll("[cmdk-item]")).some(el=>el.textContent.includes("时间戳"))','bilingual command search')
  check('Ctrl+K and Chinese fuzzy search work',true)
  await page('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'})
  await until('!document.querySelector("[role=dialog]")','command search closes')

  await navigate('/tool/json-formatter')
  await until('document.querySelectorAll("textarea").length>=2','JSON formatter loads')
  await input('textarea','{"hello":"world","count":42}')
  await evaluate('Array.from(document.querySelectorAll("button")).find(el=>el.textContent.trim()==="格式化").click()')
  await until('Array.from(document.querySelectorAll("textarea")).some(el=>el.value.includes("\\n") && el.value.includes("world"))','JSON formatted output')
  check('JSON formatting produces valid output',await evaluate('JSON.parse(document.querySelectorAll("textarea")[1].value).count===42'))
  await input('textarea','{bad json')
  await evaluate('Array.from(document.querySelectorAll("button")).find(el=>el.textContent.trim()==="格式化").click()')
  await until('Array.from(document.querySelectorAll("p")).some(el=>el.textContent==="JSON 解析错误")','JSON error displayed')
  check('Invalid JSON reports an error',true)

  await navigate('/tool/base64')
  await until('document.querySelectorAll("textarea").length>=2','Base64 loads')
  await input('textarea','hello toolbox')
  await evaluate('Array.from(document.querySelectorAll("button")).find(el=>el.textContent.trim()==="编码").click()')
  await until('Array.from(document.querySelectorAll("textarea")).some(el=>el.value==="aGVsbG8gdG9vbGJveA==")','Base64 output')
  check('Base64 encoding is correct',true)

  await navigate('/tool/uuid-generator')
  await until('document.querySelector("h1")?.textContent.includes("UUID")','UUID loads')
  await evaluate('Array.from(document.querySelectorAll("button")).find(el=>el.textContent.includes("生成")).click()')
  await until('/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(document.querySelector("main").textContent + Array.from(document.querySelectorAll("textarea")).map(el=>el.value).join())','UUID generated')
  check('UUID generator produces UUIDs',true)

  await navigate('/')
  await evaluate('document.querySelector("button[aria-controls=theme-menu]").click()')
  await evaluate('Array.from(document.querySelectorAll("#theme-menu button")).find(el=>el.textContent.includes("深色")).click()')
  check('Dark theme applies',await evaluate('document.documentElement.classList.contains("dark")'))
  await page('Page.reload');await until('document.querySelector(".workspace-header")','reload dark theme')
  check('Dark theme persists',await evaluate('document.documentElement.classList.contains("dark")'))
  await page('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(result=>writeFileSync('/tmp/it-toolbox-dark.png',Buffer.from(result.data,'base64')))
  await evaluate('document.querySelector("button[aria-controls=theme-menu]").click()')
  await evaluate('Array.from(document.querySelectorAll("#theme-menu button")).find(el=>el.textContent.includes("浅色")).click()')
  for(const width of [375,768,1024,1440]) {
    await page('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false})
    await sleep(200)
    check(`${width}px viewport has no horizontal overflow`,await evaluate('document.documentElement.scrollWidth<=innerWidth && document.querySelector("main").scrollWidth<=document.querySelector("main").clientWidth+1'))
    if(width===375) {
      await page('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(result=>writeFileSync('/tmp/it-toolbox-final-mobile.png',Buffer.from(result.data,'base64')))
      await evaluate('document.querySelector(".workspace-header > button").click()')
      await until('document.querySelector(".mobile-sidebar [role=dialog]")','mobile menu')
      check('Mobile navigation opens',true)
      await evaluate('document.querySelector(".mobile-sidebar a[href=\'/category/encoding\']").click()')
      await until('location.pathname==="/category/encoding" && !document.querySelector(".mobile-sidebar")','mobile category navigation')
      check('Mobile navigation closes after selecting a category',true)
      await navigate('/')
    }
  }
  await page('Page.captureScreenshot',{format:'png',captureBeyondViewport:false}).then(result=>writeFileSync('/tmp/it-toolbox-final-desktop.png',Buffer.from(result.data,'base64')))
  await evaluate('const language=document.querySelector(".language-select select");language.value="en-US";language.dispatchEvent(new Event("change",{bubbles:true}))')
  await until('document.querySelector("h1").textContent.includes("Your next great idea")','English language selection')
  check('Language selector works with click/change',true)
  await sleep(1000)
  check('No browser runtime, network-resource, or CSP errors',errors.length===0)
  console.log(JSON.stringify({passed,errors,analyticsRequests:analytics.length},null,2))
} catch (error) {
  console.error(JSON.stringify({passed,errors,analyticsRequests:analytics.length},null,2));throw error
} finally {
  ws?.close();browser.kill('SIGTERM');await sleep(200);rmSync(profile,{recursive:true,force:true})
}
