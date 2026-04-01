import { useState } from 'react'
import { Navigate, useNavigate, useLocation } from 'react-router-dom'
import styled from 'styled-components'
import { Box } from '@thedatablitz/box'
import { Stack } from '@thedatablitz/stack'
import { Inline } from '@thedatablitz/inline'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { getStoredWorkspaceInboxPath } from '../../contexts/workspaceLanding'
import { getSupabase, isAuthConfigured } from './supabaseClient'
import { useAuth } from './AuthContext'
import { Alert } from '@thedatablitz/alert'
import { Button } from '@thedatablitz/button'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

const BRAND_BLUE = '#2563eb'
const SLATE_200 = '#e2e8f0'
const SLATE_400 = '#94a3b8'
const SLATE_600 = '#475569'
const SLATE_900 = '#0f172a'
const PROMO_CANVAS = '#fafbfc'
const PROMO_BORDER = '#eef2f6'

const PageRoot = styled(Box).attrs({
  fullWidth: true,
  align: 'stretch',
  justify: 'stretch',
})`
  min-height: 100vh;
  width: 100%;
  flex-direction: column;
  background: #ffffff;
  @media (min-width: 1024px) {
    flex-direction: row;
  }
`

const FormColumn = styled(Box).attrs({
  fullWidth: true,
  align: 'center',
  justify: 'center',
  padding: '400',
})`
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  box-sizing: border-box;
  @media (min-width: 1024px) {
    flex: 0 1 45%;
    max-width: 560px;
    min-height: 0;
    align-self: stretch;
  }
`

const FormStack = styled(Stack).attrs({
  gap: '300',
  fullWidth: true,
})`
  max-width: 28rem;
  width: 100%;
`

const PromoColumn = styled(Box).attrs({
  padding: '400',
})`
  display: none !important;
  position: relative;
  overflow: hidden;
  flex: 1;
  min-width: 0;
  background-color: ${PROMO_CANVAS};
  box-sizing: border-box;
  @media (min-width: 1024px) {
    display: flex !important;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    align-self: stretch;
    border-top-left-radius: 1.5rem;
    border-bottom-left-radius: 1.5rem;
    border-left: 1px solid ${PROMO_BORDER};
    box-shadow: inset 1px 0 0 rgb(255 255 255 / 0.9);
  }
`

/** Fills promo column so middle content is vertically centered. */
const PromoFill = styled(Box).attrs({
  fullWidth: true,
  align: 'center',
  justify: 'stretch',
})`
  flex: 1 1 0;
  width: 100%;
  min-height: 0;
  align-self: stretch;
  display: flex;
  flex-direction: column;
`

const PromoSpacer = styled(Box)`
  flex: 1 1 0;
  min-height: 1.5rem;
`

const PromoContent = styled(Stack).attrs({
  gap: '300',
  align: 'center',
  fullWidth: true,
})`
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  max-width: 46rem;
  width: 100%;
`

const PromoAccentRule = styled(Box)`
  width: 3rem;
  height: 3px;
  border-radius: 9999px;
  background: ${BRAND_BLUE};
  flex-shrink: 0;
`

const PromoHeadline = styled(Text).attrs({ as: 'h2' })`
  margin: 0;
  font-size: clamp(1.75rem, 3.2vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: ${SLATE_900};
`

const PromoLead = styled(Text).attrs({ as: 'p' })`
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 500;
  line-height: 1.5;
  color: ${SLATE_600};
`

/** Grid row: fixed bullet column + fluid text so wrapped lines align (hanging indent). */
const ValueRow = styled(Box)`
  display: grid;
  grid-template-columns: 0.4375rem minmax(0, 1fr);
  column-gap: 0.75rem;
  row-gap: 0;
  align-items: start;
  width: 100%;
  /* Bullet offset uses same em basis as body copy for first-line alignment */
  font-size: 0.9375rem;
`

const ValueText = styled(Text).attrs({ as: 'p' })`
  margin: 0;
  min-width: 0;
  font-size: inherit;
  line-height: 1.55;
  color: ${SLATE_600};
  overflow-wrap: anywhere;
  word-break: normal;
`

const LogoMark = styled(Box).attrs({
  align: 'center',
  justify: 'center',
})`
  width: 2.5rem;
  height: 2.5rem;
  min-width: 2.5rem;
  border-radius: 0.5rem;
  background: ${SLATE_900};
  color: #fff;
  font-size: 1.125rem;
  font-weight: 700;
`

const IconWrap = styled(Box).attrs({
  inline: true,
  align: 'center',
  justify: 'center',
})`
  color: ${SLATE_400};
  line-height: 0;
`

const DividerLine = styled(Box)`
  flex: 1;
  min-width: 1rem;
  border-top: 1px solid ${SLATE_200};
  align-self: center;
`

const OrLabelWrap = styled(Box)`
  flex-shrink: 0;
  padding: 0 0.75rem;
  background: #ffffff;
`

const FullWidthButton = styled(Button)`
  width: 100%;
  border-radius: 0.75rem;
`

const OAuthButton = styled(Button)`
  width: 100%;
  border-radius: 0.75rem;
  border: 1px solid ${SLATE_200};
  background: #ffffff;
  box-shadow: none;
`

const FormShell = styled.form`
  position: relative;
  width: 100%;
`

const VisuallyHiddenSubmit = styled.button`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAllowed } = useAuth()

  const state = location.state as {
    returnTo?: string
    from?: { pathname: string; search: string }
  } | null
  const returnTo =
    state?.returnTo ??
    (state?.from
      ? state.from.pathname + state.from.search
      : getStoredWorkspaceInboxPath())
  const cameFromProtectedRoute = Boolean(state?.from || state?.returnTo)

  if (!isAuthConfigured) {
    return <Navigate to="/" replace />
  }

  if (isAllowed && cameFromProtectedRoute) {
    return <Navigate to={returnTo} replace />
  }

  async function handleSignIn(e?: React.FormEvent) {
    e?.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = getSupabase()
    if (!supabase) {
      setError('Auth not configured')
      setLoading(false)
      return
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate(returnTo, { replace: true })
  }

  async function handleGoogleOAuth() {
    setError(null)
    const supabase = getSupabase()
    if (!supabase) {
      setError('Auth not configured')
      return
    }
    setOauthLoading(true)
    const redirectTo = `${window.location.origin}${returnTo.startsWith('/') ? returnTo : `/${returnTo}`}`
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    })
    setOauthLoading(false)
    if (oauthError) {
      setError(oauthError.message)
    }
  }

  return (
    <PageRoot>
      <FormColumn>
        <FormStack>
          <Inline align="center" gap="150" wrap={false}>
            <LogoMark aria-hidden>W</LogoMark>
            <Text as="span" variant="heading4">
              Workbit
            </Text>
          </Inline>

          <Stack gap="100" fullWidth>
            <Text as="h1" variant="heading2">
              Log in to your account.
            </Text>
            <Text as="p" variant="body2" color="color.text.subtle">
              Enter your email address and password to log in.
            </Text>
          </Stack>

          <FormShell onSubmit={handleSignIn}>
            <Stack gap="200" fullWidth>
              <TextInput
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                required
                fullWidth
                size="large"
                startIcon={
                  <IconWrap>
                    <Mail size={18} strokeWidth={1.75} />
                  </IconWrap>
                }
              />
              <TextInput
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                fullWidth
                size="large"
                startIcon={
                  <IconWrap>
                    <Lock size={18} strokeWidth={1.75} />
                  </IconWrap>
                }
                endIcon={
                  <Button
                    variant="glass"
                    buttonType="icon"
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    onClick={() => setShowPassword((v) => !v)}
                    icon={
                      showPassword ? (
                        <EyeOff size={18} strokeWidth={1.75} />
                      ) : (
                        <Eye size={18} strokeWidth={1.75} />
                      )
                    }
                  />
                }
              />

              <Box fullWidth align="center" justify="flex-end">
                <Button
                  buttonType="link"
                  variant="primary"
                  onClick={() =>
                    setError(
                      'Password reset is not set up yet. Contact your workspace admin.'
                    )
                  }
                >
                  Forgot password?
                </Button>
              </Box>

              {error ? (
                <Box fullWidth>
                  <Alert
                    variant="error"
                    placement="inline"
                    description={error}
                  />
                </Box>
              ) : null}

              <FullWidthButton
                variant="primary"
                size="large"
                disabled={loading}
                loading={loading}
                onClick={() => void handleSignIn()}
              >
                {loading ? 'Signing in…' : 'Login'}
              </FullWidthButton>
              <VisuallyHiddenSubmit type="submit" tabIndex={-1} aria-hidden>
                Submit
              </VisuallyHiddenSubmit>
            </Stack>
          </FormShell>

          <Stack gap="200" fullWidth>
            <Inline
              fullWidth
              align="center"
              justify="stretch"
              wrap={false}
              gap="0"
            >
              <DividerLine />
              <OrLabelWrap>
                <Text as="span" variant="body3" color="color.text.subtle">
                  or
                </Text>
              </OrLabelWrap>
              <DividerLine />
            </Inline>

            <Box fullWidth>
              <OAuthButton
                variant="glass"
                size="large"
                disabled={oauthLoading}
                loading={oauthLoading}
                onClick={() => handleGoogleOAuth()}
              >
                <Inline gap="100" align="center" justify="center" wrap={false}>
                  <span>Google</span>
                </Inline>
              </OAuthButton>
            </Box>
          </Stack>
        </FormStack>
      </FormColumn>

      <PromoColumn>
        <PromoFill>
          <PromoSpacer aria-hidden />
          <PromoContent>
            <Stack gap="300" fullWidth align="stretch">
              <Stack gap="200" fullWidth align="stretch">
                <PromoAccentRule aria-hidden />
                <PromoHeadline>
                  Remember the plan.
                  <br />
                  Ship the work.
                </PromoHeadline>
                <PromoLead>
                  Projects, issues, and decisions stay in one place—so
                  integrations and AI agents can turn insight into the next
                  concrete move.
                </PromoLead>
              </Stack>
              <Stack gap="150" fullWidth align="stretch">
                <ValueRow>
                  <ValueText>
                    Pull signals from commerce, ops, or custom apps via API;
                    mirror what matters into issues your team actually tracks.
                  </ValueText>
                </ValueRow>
                <ValueRow>
                  <ValueText>
                    Let the project agent break down reports into initiatives,
                    sub-tasks, and measurable outcomes—not one-off chat threads.
                  </ValueText>
                </ValueRow>
                <ValueRow>
                  <ValueText>
                    Preserve context over time: status updates and decisions
                    stay attached to the work, ready for the next review cycle.
                  </ValueText>
                </ValueRow>
              </Stack>
            </Stack>
          </PromoContent>
          <PromoSpacer aria-hidden />
        </PromoFill>
      </PromoColumn>
    </PageRoot>
  )
}
