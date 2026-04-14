import { Button } from '@thedatablitz/button'
import { Card } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import type { CSSProperties, ComponentType, PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLogin } from './hooks'

const BaseCard = Card as unknown as ComponentType<
  PropsWithChildren<{
    variant: 'base'
    borderTone?: 'none' | 'accent' | 'interactive'
    style?: CSSProperties
    className?: string
    'aria-label'?: string
  }>
>

const inputStyle: CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1px solid rgba(164, 140, 130, 0.2)',
  padding: '0.9rem 0',
  color: 'rgba(229, 226, 225, 1)',
  outline: 'none',
  fontSize: '1rem',
  fontWeight: 500,
  fontFamily: 'inherit',
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 10,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  fontWeight: 700,
  opacity: 0.75,
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, isPending } = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const isValidEmail = useMemo(() => {
    const trimmed = email.trim()
    if (!trimmed) return false
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
  }, [email])

  const canSubmit = isValidEmail && password.length >= 1

  return (
    <main
      style={{
        minHeight: '100svh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        boxSizing: 'border-box',
        background: '#131313',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        <Stack gap="600" fullWidth align="stretch">
          <header style={{ textAlign: 'center' }}>
            <Stack gap="300" fullWidth align="center">
              <Inline align="center" gap="200" wrap={false}>
                <div
                  aria-hidden
                  style={{
                    width: 48,
                    height: 2,
                    background: 'rgba(255, 143, 92, 1)',
                    opacity: 0.35,
                  }}
                />
                <Text
                  as="span"
                  variant="caption2"
                  color="color.text.DEFAULT"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: '0.3em',
                    fontWeight: 800,
                    color: '#ffb89a',
                  }}
                >
                  System 01
                </Text>
                <div
                  aria-hidden
                  style={{
                    width: 48,
                    height: 2,
                    background: 'rgba(255, 143, 92, 1)',
                    opacity: 0.35,
                  }}
                />
              </Inline>

              <div>
                <Text
                  as="h1"
                  variant="heading1"
                  color="color.text.DEFAULT"
                  style={{
                    margin: 0,
                    fontWeight: 850,
                    letterSpacing: '-0.05em',
                    lineHeight: 0.82,
                    fontSize: 'clamp(4.25rem, 9vw, 7rem)',
                  }}
                >
                  Workbit.
                </Text>
                <Text
                  as="p"
                  variant="body2"
                  color="color.text.subtle"
                  style={{
                    margin: '0.75rem 0 0',
                    fontSize: '1.25rem',
                    lineHeight: 1.35,
                    color: 'rgba(220, 193, 182, 1)',
                  }}
                >
                  Your intelligent manager. <br />
                  <span style={{ color: 'rgba(229, 226, 225, 0.4)' }}>
                    Architecting the future of professional autonomy.
                  </span>
                </Text>
              </div>
            </Stack>
          </header>

          <BaseCard
            variant="base"
            borderTone="none"
            aria-label="Access Terminal"
            style={{
              width: '100%',
              background: 'rgba(42, 42, 42, 0.6)',
              border: '1px solid rgba(86, 67, 59, 0.1)',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 40px 80px -15px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ padding: '2.5rem' }}>
              <Stack gap="300" fullWidth>
                <div>
                  <Text
                    as="h2"
                    variant="heading5"
                    color="color.text.DEFAULT"
                    style={{ margin: 0, fontWeight: 800 }}
                  >
                    Access Terminal
                  </Text>
                  <Text
                    as="p"
                    variant="body3"
                    color="color.text.subtle"
                    style={{
                      margin: '0.35rem 0 0',
                      color: 'rgba(220, 193, 182, 1)',
                    }}
                  >
                    Initialize your session.
                  </Text>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                  }}
                >
                  <Stack gap="600" fullWidth>
                    <div>
                      <label htmlFor="login-email">
                        <Text
                          as="span"
                          variant="caption2"
                          color="color.text.subtle"
                          style={labelStyle}
                        >
                          Corporate Identity
                        </Text>
                      </label>
                      <input
                        id="login-email"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        placeholder="name@workbit.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                      />
                    </div>

                    <div>
                      <Inline
                        justify="space-between"
                        align="center"
                        wrap={false}
                      >
                        <label htmlFor="login-password">
                          <Text
                            as="span"
                            variant="caption2"
                            color="color.text.subtle"
                            style={labelStyle}
                          >
                            Encrypted Key
                          </Text>
                        </label>
                        <Button
                          variant="link"
                          size="small"
                          style={{
                            textTransform: 'uppercase',
                            letterSpacing: '0.12em',
                            fontSize: 10,
                          }}
                        >
                          Forgot?
                        </Button>
                      </Inline>
                      <Inline align="center" gap="200" wrap={false} fullWidth>
                        <input
                          id="login-password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          style={inputStyle}
                        />
                        <Button
                          variant="ghost"
                          size="small"
                          onClick={() => setShowPassword((v) => !v)}
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          style={{ flexShrink: 0 }}
                        >
                          {showPassword ? 'Hide' : 'Show'}
                        </Button>
                      </Inline>
                    </div>

                    <Button
                      variant="primary"
                      size="large"
                      disabled={!canSubmit}
                      onClick={() => {
                        if (!canSubmit) return
                        login({ email: email.trim(), password }).then(() => {
                          navigate('/workspaces')
                        })
                      }}
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 900,
                      }}
                    >
                      {isPending ? 'Authorizing…' : 'Authorize Session →'}
                    </Button>
                  </Stack>
                </form>

                <div
                  style={{
                    borderTop: '1px solid rgba(86, 67, 59, 0.12)',
                    paddingTop: '1.5rem',
                    marginTop: '0.5rem',
                    textAlign: 'center',
                  }}
                >
                  <Stack gap="150" fullWidth align="center">
                    <Text
                      as="p"
                      variant="body4"
                      color="color.text.subtle"
                      style={{ margin: 0, color: 'rgba(220, 193, 182, 1)' }}
                    >
                      New to the collective?
                    </Text>
                    <Button
                      variant="link"
                      size="medium"
                      style={{ fontWeight: 900 }}
                    >
                      Request Access Credentials
                    </Button>
                  </Stack>
                </div>
              </Stack>
            </div>
          </BaseCard>

          <div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
              }}
            >
              <BaseCard
                variant="base"
                borderTone="none"
                style={{
                  background: 'rgba(28, 27, 27, 0.5)',
                  border: '1px solid rgba(86, 67, 59, 0.1)',
                }}
              >
                <div style={{ padding: '1.25rem' }}>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{
                      margin: 0,
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      color: 'rgba(255, 184, 154, 0.6)',
                    }}
                  >
                    Status
                  </Text>
                  <Text
                    as="div"
                    variant="heading6"
                    color="color.text.DEFAULT"
                    style={{ marginTop: '0.5rem', fontWeight: 900 }}
                  >
                    Operational
                  </Text>
                </div>
              </BaseCard>

              <BaseCard
                variant="base"
                borderTone="none"
                style={{
                  background: 'rgba(28, 27, 27, 0.5)',
                  border: '1px solid rgba(86, 67, 59, 0.1)',
                }}
              >
                <div style={{ padding: '1.25rem' }}>
                  <Text
                    as="div"
                    variant="caption2"
                    color="color.text.subtle"
                    style={{
                      margin: 0,
                      fontSize: 10,
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      color: 'rgba(255, 184, 154, 0.6)',
                    }}
                  >
                    Version
                  </Text>
                  <Text
                    as="div"
                    variant="heading6"
                    color="color.text.DEFAULT"
                    style={{ marginTop: '0.5rem', fontWeight: 900 }}
                  >
                    4.0.2
                  </Text>
                </div>
              </BaseCard>
            </div>

            <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
              <Text
                as="p"
                variant="caption2"
                color="color.text.subtle"
                style={{
                  margin: 0,
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  opacity: 0.55,
                }}
              >
                © 2024 WORKBIT ARCHITECTURAL SYSTEMS. ALL RIGHTS RESERVED.
              </Text>
            </div>
          </div>
        </Stack>
      </div>
    </main>
  )
}
