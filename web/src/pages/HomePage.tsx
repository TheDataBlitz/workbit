import { useQuery } from '@tanstack/react-query'
import { AppTitle } from '../components'

export function HomePage() {
  const { data: status } = useQuery({
    queryKey: ['bootstrap'],
    queryFn: () => Promise.resolve('React Query ready'),
  })

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: '40rem',
        margin: '0 auto',
        textAlign: 'center',
      }}
    >
      <AppTitle />
      <p style={{ marginTop: '0.75rem', color: 'var(--text)' }}>{status}</p>
      <p style={{ marginTop: '1rem', fontSize: '0.95rem' }}>
        Edit <code>src/pages/HomePage.tsx</code> to build this app.
      </p>
    </main>
  )
}
