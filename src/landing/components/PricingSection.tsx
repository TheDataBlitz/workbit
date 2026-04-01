import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function PricingSection() {
  return (
    <section
      id="pricing"
      style={{
        padding: '100px 0 80px',
        background: 'var(--workbit-bg)',
      }}
    >
      <div className="landing__container">
        <motion.h2
          className="landing__heading-lg"
          style={{ textAlign: 'center', marginBottom: 16 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Simple pricing
        </motion.h2>
        <motion.p
          className="landing__text-muted"
          style={{ margin: '0 auto 48px', textAlign: 'center' }}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Start free. Upgrade when you need more.
        </motion.p>
        <motion.div
          className="landing__card"
          style={{
            maxWidth: 400,
            margin: '0 auto',
            padding: 40,
            textAlign: 'center',
          }}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 8 }}>
            Free
          </div>
          <p className="landing__text-muted" style={{ marginBottom: 24 }}>
            Projects, issues, and teams. Everything you need to get started.
          </p>
          <Link to="/login">
            <motion.span
              className="landing__btn landing__btn--primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get started
            </motion.span>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
