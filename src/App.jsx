import { useEffect, useState } from "react"
import { RouterProvider } from "react-router-dom"
import "./App.css"
import { router } from "./router"
import { ToastProvider } from "./components/Toast"
import { supabase, supabaseConfigurado } from "./provider/supabase"

// Páginas abertas sem login. Todo o resto exige estar logado.
const PAGINAS_PUBLICAS = ["/", "/login"]

function limparSessaoLocal() {
  localStorage.removeItem("token")
  localStorage.removeItem("usuario")
}

export function App() {
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        limparSessaoLocal()
        if (!PAGINAS_PUBLICAS.includes(window.location.pathname)) {
          window.location.replace("/login")
          return
        }
      }
      setPronto(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((evento, sessao) => {
      if (evento === "SIGNED_OUT") limparSessaoLocal()
      else if (sessao?.access_token) localStorage.setItem("token", sessao.access_token)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!supabaseConfigurado) {
    return (
      <div style={{ maxWidth: 560, margin: "60px auto", padding: "0 16px", fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
        <h1>Anjos Bolos</h1>
        <p>O site ainda não está ligado ao banco de dados. Configure as variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> (veja o README).</p>
      </div>
    )
  }
  if (!pronto) return null

  return(
    <ToastProvider>
      <RouterProvider router={router}/>
    </ToastProvider>
  )
}
