import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function CTASection() {
  return (
    <section
      style={{
        padding: '100px 0 120px',
        background:
          'linear-gradient(180deg, var(--workbit-bg) 0%, var(--workbit-bg-elevated) 100%)',
      }}
    >
      <motion.div
        className="landing__container"
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={{ duration: 0.6 }}
        style={{
          textAlign: 'center',
          padding: '64px 32px',
          background: 'var(--workbit-bg-card)',
          border: '1px solid var(--workbit-border)',
          borderRadius: 24,
          maxWidth: 720,
          margin: '0 auto',
        }}
      >
        <h2 className="landing__heading-lg" style={{ marginBottom: 16 }}>
          Ready to ship with clarity?
        </h2>
        <p
          className="landing__text-muted"
          style={{ margin: '0 auto 32px', fontSize: '1rem' }}
        >
          Join teams that use Workbit to plan, track, and ship—without the
          chaos.
        </p>
        <Link to="/login">
          <motion.span
            className="landing__btn landing__btn--primary landing__glow"
            style={{ padding: '14px 28px', fontSize: '1rem' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Get started for free
          </motion.span>
        </Link>
      </motion.div>
    </section>
  )
}
