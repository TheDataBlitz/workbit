import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const links: { label: string; href?: string; to?: '/login' }[] = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Log in', to: '/login' },
]

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '48px 24px',
        borderTop: '1px solid var(--workbit-border)',
        background: 'var(--workbit-bg)',
      }}
    >
      <div
        className="landing__container"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: '1.125rem' }}>Workbit</span>
        <div style={{ display: 'flex', gap: 32 }}>
          {links.map((l) =>
            l.to ? (
              <Link
                key={l.label}
                to={l.to}
                style={{
                  color: 'var(--workbit-text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href}
                style={{
                  color: 'var(--workbit-text-muted)',
                  fontSize: '0.875rem',
                }}
              >
                {l.label}
              </a>
            )
          )}
        </div>
      </div>
    </motion.footer>
  )
}
