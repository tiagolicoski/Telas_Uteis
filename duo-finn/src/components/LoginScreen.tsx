import { useState, type FormEvent } from 'react'
import { useAccount } from '../context/AccountContext'
import './LoginScreen.css'

export function LoginScreen() {
  const { signIn } = useAccount()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const message = await signIn(email, password)
    setError(message)
    setPending(false)
  }

  return (
    <main className="login-screen">
      <form className="login-card" onSubmit={onSubmit}>
        <p className="login-brand">Duo Finn</p>
        <h1>Entrar</h1>
        <p className="login-lead">Cada conta abre a própria planilha, neste aparelho ou em outro.</p>
        <label>
          E-mail
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={pending}>
          {pending ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
