import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LoginScreen } from './components/LoginScreen'
import { AccountProvider, useAccount } from './context/AccountContext'
import { FinanceProvider } from './context/FinanceContext'
import App from './App'
import './index.css'

function Root() {
  const account = useAccount()
  if (!account.cloud) {
    return (
      <FinanceProvider>
        <App />
      </FinanceProvider>
    )
  }
  if (!account.ready) {
    return (
      <main className="login-screen">
        <p>Abrindo…</p>
      </main>
    )
  }
  if (!account.userId) return <LoginScreen />
  return (
    <FinanceProvider key={account.userId}>
      <App />
    </FinanceProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccountProvider>
      <Root />
    </AccountProvider>
  </StrictMode>,
)
