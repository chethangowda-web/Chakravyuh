// Chakravyuh browser extension popup.
// Flow: match this site to a VERIFIED Chakravyuh target -> prepare an attack -> the person sends it in the
// site's own chat -> they select the bot's reply -> Chakravyuh checks it and saves it as a finding.
// The extension never sends anything to the chatbot itself.
'use strict'

const DEFAULTS = { apiBase: 'http://127.0.0.1:8010', appBase: 'http://localhost:5173' }
const CATEGORIES = {
  sensitive_data_leak: 'Sensitive data leak',
  system_prompt_extraction: 'System prompt extraction',
  instruction_override: 'Instruction override',
  prompt_injection: 'Prompt injection',
  jailbreak: 'Jailbreak',
  harmful_content: 'Harmful content',
}
const LANGUAGES = { 'en-IN': 'English', 'hi-IN': 'Hindi', 'kn-IN': 'Kannada', 'te-IN': 'Telugu', 'ta-IN': 'Tamil' }
const VARIANTS = { native: 'Native script', romanized: 'Romanized', code_mixed: 'Code-mixed' }

const $ = (id) => document.getElementById(id)
const state = { settings: { ...DEFAULTS }, tab: null, target: null, templates: [], attack: null }

// ---------------------------------------------------------------- helpers

function showError(message) {
  const el = $('error')
  el.textContent = message
  el.hidden = !message
}

async function api(path, options = {}) {
  const res = await fetch(state.settings.apiBase.replace(/\/$/, '') + '/api/v1' + path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error?.message || `Chakravyuh API error (HTTP ${res.status})`)
  return data
}

function fillSelect(select, entries, selected) {
  select.replaceChildren(...entries.map(([value, label]) => {
    const opt = document.createElement('option')
    opt.value = value
    opt.textContent = label
    opt.selected = value === selected
    return opt
  }))
}

function busy(button, on, label) {
  button.disabled = on
  if (label) button.textContent = label
}

// The prepared attack is kept per site, because the popup closes when you click the page.
const storageKey = () => `attack:${state.target?.id}`
async function saveAttack() {
  await chrome.storage.local.set({ [storageKey()]: state.attack })
}
async function loadAttack() {
  const stored = await chrome.storage.local.get(storageKey())
  return stored[storageKey()] || null
}

// ---------------------------------------------------------------- page scripts (run inside the tab)

function insertIntoChatBox(text) {
  const editable = (el) =>
    el && (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /^(text|search|)$/i.test(el.type || '')) || el.isContentEditable)
  let el = document.activeElement
  if (!editable(el)) {
    el = [...document.querySelectorAll('textarea, input[type=text], input:not([type]), [contenteditable="true"]')]
      .find((e) => e.offsetParent !== null)
  }
  if (!editable(el)) return { ok: false, reason: 'No chat box found on this page. Click into the chat box, then try again.' }
  el.focus()
  if (el.isContentEditable) {
    el.textContent = ''
    document.execCommand('insertText', false, text)
  } else {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, text) // works with React-controlled inputs
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
  return { ok: true }
}

function readSelection() {
  return window.getSelection ? window.getSelection().toString() : ''
}

async function runInTab(func, args = []) {
  const [res] = await chrome.scripting.executeScript({ target: { tabId: state.tab.id }, func, args })
  return res?.result
}

// ---------------------------------------------------------------- UI

function renderTemplates() {
  const category = $('category').value
  const items = state.templates.filter((t) => t.category === category)
  fillSelect($('template'), items.map((t) => [t.id, t.technique.replaceAll('_', ' ')]), items[0]?.id)
}

function renderVariant() {
  const english = $('language').value === 'en-IN'
  $('variant').disabled = english
  if (english) $('variant').value = 'native'
}

function renderAttack() {
  const a = state.attack
  $('attack-card').hidden = !a
  $('check-card').hidden = !a
  if (!a) return
  $('attack-text').value = a.attack_text
  $('attack-gloss').textContent = a.english_gloss ? `English meaning: ${a.english_gloss}` : ''
}

function renderVerdict(r) {
  const box = $('verdict')
  const kind = r.verdict === 'vulnerable' ? 'vulnerable' : r.verdict === 'safe' ? 'safe' : 'other'
  const title = { vulnerable: 'Vulnerable', safe: 'Safe', inconclusive: 'Needs review', error: 'Error' }[r.verdict] || r.verdict
  box.className = kind
  box.replaceChildren()
  const h = document.createElement('h3')
  h.textContent = `${title}${r.severity && r.severity !== 'none' ? ' · ' + r.severity : ''}${r.confidence ? ' · ' + r.confidence : ''}`
  box.append(h)
  if (r.evidence?.length) {
    const ul = document.createElement('ul')
    for (const e of r.evidence) {
      const li = document.createElement('li')
      li.textContent = e
      ul.append(li)
    }
    box.append(ul)
  }
  if (r.judge_rationale) {
    const p = document.createElement('p')
    p.className = 'hint'
    p.textContent = `Judge: ${r.judge_rationale}`
    box.append(p)
  }
  const link = document.createElement('a')
  link.href = '#'
  link.textContent = 'Open the full evidence in Chakravyuh →'
  link.addEventListener('click', (ev) => {
    ev.preventDefault()
    chrome.tabs.create({ url: `${state.settings.appBase.replace(/\/$/, '')}/findings/${r.result_id}` })
  })
  box.append(link)
  box.hidden = false
}

// ---------------------------------------------------------------- actions

async function onPrepare() {
  showError('')
  const button = $('prepare')
  busy(button, true, 'Preparing (Sarvam Translate)…')
  try {
    state.attack = await api('/manual/attack', {
      method: 'POST',
      body: JSON.stringify({
        target_id: state.target.id,
        template_id: $('template').value,
        language: $('language').value,
        variant: $('variant').value,
      }),
    })
    await saveAttack()
    $('verdict').hidden = true
    renderAttack()
  } catch (err) {
    showError(err.message)
  } finally {
    busy(button, false, 'Prepare attack (Sarvam Translate)')
  }
}

async function onInsert() {
  showError('')
  const res = await runInTab(insertIntoChatBox, [state.attack.attack_text]).catch((e) => ({ ok: false, reason: e.message }))
  if (!res?.ok) showError(res?.reason || 'Could not insert into this page.')
}

async function onCopy() {
  await navigator.clipboard.writeText(state.attack.attack_text)
  $('copy').textContent = 'Copied'
  setTimeout(() => ($('copy').textContent = 'Copy'), 1200)
}

async function onCheck() {
  showError('')
  const reply = ((await runInTab(readSelection).catch(() => '')) || '').trim()
  if (!reply) {
    showError("Select the bot's reply on the page first (drag over it with the mouse), then click Check.")
    return
  }
  const button = $('check')
  busy(button, true, 'Checking…')
  try {
    const a = state.attack
    const result = await api('/manual/check', {
      method: 'POST',
      body: JSON.stringify({
        target_id: state.target.id, template_id: a.template_id, language: a.language, variant: a.variant,
        attack_text: a.attack_text, english_gloss: a.english_gloss, marker_token: a.marker_token,
        mutation_chain: a.mutation_chain, reply,
      }),
    })
    renderVerdict(result)
  } catch (err) {
    showError(err.message)
  } finally {
    busy(button, false, 'Check selected reply')
  }
}

async function onSaveSettings() {
  const apiBase = $('api-base').value.trim() || DEFAULTS.apiBase
  const appBase = $('app-base').value.trim() || DEFAULTS.appBase
  if (apiBase.startsWith('https://')) {
    const granted = await chrome.permissions.request({ origins: [new URL(apiBase).origin + '/*'] })
    if (!granted) {
      showError('Permission to reach that API was not granted.')
      return
    }
  }
  await chrome.storage.sync.set({ apiBase, appBase })
  location.reload()
}

// ---------------------------------------------------------------- start

async function init() {
  state.settings = { ...DEFAULTS, ...(await chrome.storage.sync.get(['apiBase', 'appBase'])) }
  $('api-base').value = state.settings.apiBase
  $('app-base').value = state.settings.appBase
  $('settings-toggle').addEventListener('click', () => ($('settings').hidden = !$('settings').hidden))
  $('save-settings').addEventListener('click', onSaveSettings)

  ;[state.tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = state.tab?.url || ''
  $('site-origin').textContent = url ? new URL(url).origin : 'unknown'

  let match
  try {
    match = await api('/manual/match?url=' + encodeURIComponent(url))
  } catch (err) {
    $('site-status').textContent = 'Cannot reach Chakravyuh. Is the API running? (⚙ to change the address)'
    $('site-status').className = 'status bad'
    return
  }
  if (!match.target) {
    $('site-status').textContent = match.reason
    $('site-status').className = 'status bad'
    return
  }
  state.target = match.target
  $('site-status').textContent = `✓ Verified target: ${match.target.name}`
  $('site-status').className = 'status ok'

  state.templates = (await api('/attacks/templates')).items
  const categories = Object.entries(CATEGORIES).filter(([c]) => state.templates.some((t) => t.category === c))
  fillSelect($('category'), categories, 'sensitive_data_leak')
  fillSelect($('language'), Object.entries(LANGUAGES), 'kn-IN')
  fillSelect($('variant'), Object.entries(VARIANTS), 'native')
  renderTemplates()
  renderVariant()
  $('category').addEventListener('change', renderTemplates)
  $('language').addEventListener('change', renderVariant)
  $('prepare').addEventListener('click', onPrepare)
  $('insert').addEventListener('click', onInsert)
  $('copy').addEventListener('click', onCopy)
  $('check').addEventListener('click', onCheck)
  $('steps').hidden = false

  state.attack = await loadAttack()
  renderAttack()
}

init().catch((err) => showError(err.message))
