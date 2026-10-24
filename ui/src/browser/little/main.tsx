/**
 * Little Exo's strip (main.cpp OpenLittle: the small window a link from another app opens in): where the page is, Copy
 * link, and Open in Exo Browser, which moves it into a tab. The host sends { t: 'little', url, title, loading, theme }
 * and { t: 'copied' }; this page answers "ready", "copy" and "open".
 */
import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../../tokens.css'
import '../../exo-shell.css'
import './little.css'
import { Button } from '../../components/ui/Button'
import * as I from '../icons'

type WebView = { postMessage: (m: string) => void; addEventListener: (t: 'message', f: (e: MessageEvent) => void) => void }
const webview = (window as unknown as { chrome?: { webview?: WebView } }).chrome?.webview
const send = (m: string) => webview?.postMessage(m)

type Page = { url: string; title: string; loading: boolean; theme: string }

function Strip() {
  const [page, setPage] = useState<Page>({ url: '', title: '', loading: true, theme: 'void' })
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    let timer = 0
    webview?.addEventListener('message', ({ data }) => {
      const m = data as { t: string } & Page
      if (m.t === 'little') {
        setPage(m)
        document.documentElement.dataset.exoTheme = m.theme
      } else if (m.t === 'copied') {
        setCopied(true)
        clearTimeout(timer)
        timer = window.setTimeout(() => setCopied(false), 1600)
      }
    })
    send('ready')
  }, [])
  let host = page.url, path = '', secure = false
  try {
    const u = new URL(page.url)
    host = u.hostname.replace(/^www\./, '')
    path = u.pathname === '/' ? '' : u.pathname
    secure = u.protocol === 'https:'
  } catch { /* not an address yet */ }
  const Lead = secure ? I.Lock : I.Globe
  return (
    <div className="exb-little">
      <span className={`exb-little-where${page.loading ? ' is-loading' : ''}`}>
        <Lead className="exb-little-icon" />
        <span className="exb-little-host">{host}</span>
        <span className="exb-little-path">{path}</span>
      </span>
      <Button variant="ghost" size="sm" isIconOnly className="exo-titlebar-button" aria-label={copied ? 'Link copied' : 'Copy link'}
        aria-keyshortcuts="Control+Shift+C" onPress={() => send('copy')}>
        {copied ? <I.Check /> : <I.Link />}
      </Button>
      <Button size="sm" className="exo-set-btn is-primary is-compact" aria-keyshortcuts="Control+O" onPress={() => send('open')}>Open in Exo Browser</Button>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(<StrictMode><Strip /></StrictMode>)
