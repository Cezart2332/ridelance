import { Component, type ErrorInfo, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'

import { ErrorPage } from './ErrorPage'

interface BoundaryProps {
  children: ReactNode
  /** Schimbarea ei golește eroarea: navigarea pe altă pagină pornește curat. */
  resetKey: string
}

interface BoundaryState {
  failedKey: string | null
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failedKey: null }

  static getDerivedStateFromError(): Partial<BoundaryState> {
    return { failedKey: '' }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Eroare în pagină:', error, info.componentStack)
    this.setState({ failedKey: this.props.resetKey })
  }

  render() {
    const { failedKey } = this.state
    const failed = failedKey !== null && (failedKey === '' || failedKey === this.props.resetKey)
    return failed ? <ErrorPage code={500} /> : this.props.children
  }
}

/**
 * O eroare aruncată la randare ducea la un ecran alb. Acum duce la pagina 500, iar navigarea pe
 * altă adresă o golește.
 */
export function ErrorBoundary({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  return <Boundary resetKey={pathname}>{children}</Boundary>
}
