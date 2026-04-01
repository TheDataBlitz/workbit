import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { label: 'Product', href: '#product' },
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
]

export function LandingNav() {
  const navigate = useNavigate()
  return (
    <motion.nav
      className="landing__nav"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        maxWidth: 1400,
        margin: '0 auto',
      }}
    >
      <Link
        to="/landing"
        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <motion.span
          style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
          whileHover={{ scale: 1.02 }}
        >
          Workbit
        </motion.span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {navItems.map((item, i) => (
          <motion.a
            key={item.href}
            href={item.href}
            style={{
              color: 'var(--workbit-text-muted)',
              fontSize: '0.9375rem',
              fontWeight: 500,
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.3 }}
            whileHover={{ color: 'var(--workbit-text)' }}
          >
            {item.label}
          </motion.a>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ display: 'flex', gap: 12 }}
        >
          <motion.button
            type="button"
            className="landing__btn landing__btn--secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
          >
            Log in
          </motion.button>
          <motion.button
            type="button"
            className="landing__btn landing__btn--primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/login')}
          >
            Get started
          </motion.button>
        </motion.div>
      </div>
    </motion.nav>
  )
}
