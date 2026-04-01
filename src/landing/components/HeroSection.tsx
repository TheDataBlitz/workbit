import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export function HeroSection() {
  return (
    <section
      id="product"
      className="landing__gradient-bg"
      style={{
        paddingTop: 120,
        paddingBottom: 80,
        position: 'relative',
      }}
    >
      <div className="landing__container" style={{ textAlign: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.span
            style={{
              display: 'inline-block',
              padding: '6px 14px',
              borderRadius: 9999,
              background: 'var(--workbit-accent-soft)',
              color: 'var(--workbit-accent)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              marginBottom: 24,
            }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            The system for focused work
          </motion.span>
        </motion.div>
        <motion.h1
          className="landing__heading-xl"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
          style={{ marginBottom: 24 }}
        >
          Plan. Track. Ship.
          <br />
          <span style={{ color: 'var(--workbit-accent)' }}>
            Without the chaos.
          </span>
        </motion.h1>
        <motion.p
          className="landing__text-muted"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{ margin: '0 auto 40px' }}
        >
          Workbit keeps your team aligned with clear projects, issues, and
          cycles. Built for speed and clarity—so you spend less time in tools
          and more time building.
        </motion.p>
        <motion.div
          style={{
            display: 'flex',
            gap: 16,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link to="/login">
            <motion.span
              className="landing__btn landing__btn--primary landing__glow"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Start free
            </motion.span>
          </Link>
          <a href="#product">
            <motion.span
              className="landing__btn landing__btn--secondary"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              See how it works
            </motion.span>
          </a>
        </motion.div>
      </div>
      {/* Decorative grid / product preview area */}
      <motion.div
        style={{
          marginTop: 64,
          maxWidth: 1000,
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: '0 24px',
        }}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <motion.div
          className="landing__card landing__glow"
          style={{
            padding: 32,
            borderRadius: 16,
            border: '1px solid var(--workbit-border)',
            background: 'var(--workbit-bg-card)',
          }}
          whileHover={{ scale: 1.01 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 140px',
              gap: 16,
              fontSize: '0.875rem',
              color: 'var(--workbit-text-muted)',
            }}
          >
            {['Project', 'Issues', 'Status'].map((col) => (
              <div
                key={col}
                style={{ fontWeight: 600, color: 'var(--workbit-text)' }}
              >
                {col}
              </div>
            ))}
            {[
              { project: 'Core Performance', issue: 'Faster app launch' },
              { project: 'Core Performance', issue: 'Reduce UI flicker' },
              { project: 'Core Performance', issue: 'Optimize load times' },
            ].map((row, rowIdx) => (
              <div key={rowIdx} style={{ display: 'contents' }}>
                <div>{row.project}</div>
                <div>{row.issue}</div>
                <div>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'var(--workbit-accent-soft)',
                      color: 'var(--workbit-accent)',
                      fontSize: '0.75rem',
                    }}
                  >
                    In progress
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
