import { Button } from '@thedatablitz/button'
import { Text } from '@thedatablitz/text'
import {
  ArrowLeft,
  BarChart3,
  CreditCard,
  History,
  Plug,
  UserRound,
} from 'lucide-react'
import { type CSSProperties } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Root = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100%;
  background: #0a0a0a;
  color: #e5e2e1;
`

const SettingsAside = styled.aside`
  width: 20rem;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  box-sizing: border-box;
  padding: 1.5rem 1rem 1.5rem 1.25rem;
  border-right: 1px solid rgba(86, 67, 59, 0.12);
  background: #0a0a0a;
`

const Brand = styled.div`
  padding: 0 0.5rem 1.25rem;
  border-bottom: 1px solid rgba(86, 67, 59, 0.15);
  margin-bottom: 1rem;
`

const NavRoot = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  flex: 1;
  min-height: 0;
`

const navLinkStyle = ({ isActive }: { isActive: boolean }): CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.65rem 0.75rem',
  borderRadius: 6,
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '0.875rem',
  letterSpacing: '-0.01em',
  borderRight: isActive ? `2px solid #000` : '2px solid transparent',
  marginRight: isActive ? -1 : 0,
  color: isActive ? '#000' : '#e5e2e1',
  background: isActive ? 'rgba(255, 143, 92, 0.06)' : 'transparent',
})

const MainColumn = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`

const TopBar = styled.header`
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid rgba(86, 67, 59, 0.12);
  background: rgba(10, 10, 10, 0.92);
  backdrop-filter: blur(10px);
`

const Divider = styled.div`
  height: 1px;
  background: rgba(86, 67, 59, 0.15);
  margin: 0.75rem 0.5rem;
`

const FooterProfile = styled.div`
  margin-top: auto;
  padding-top: 1rem;
`

const items: {
  to: string
  label: string
  icon: typeof Plug
}[] = [
  { to: '/settings/integration', label: 'Intellebit Integration', icon: Plug },
  { to: '/settings/profile', label: 'Profile Detail', icon: UserRound },
  {
    to: '/settings/intellebit-usage',
    label: 'Intellebit Usage',
    icon: BarChart3,
  },
  { to: '/settings/history', label: 'History', icon: History },
  { to: '/settings/billing', label: 'Billing', icon: CreditCard },
]

export function SettingsLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromProjectId =
    (location.state as { fromProjectId?: string } | null)?.fromProjectId ??
    new URLSearchParams(location.search).get('fromProjectId') ??
    null

  return (
    <Root>
      <SettingsAside>
        <Brand>
          <Text
            as="div"
            variant="caption2"
            color="color.text.subtle"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.28em',
              fontWeight: 700,
              marginBottom: '0.35rem',
            }}
          >
            Settings
          </Text>
          <Text
            as="div"
            variant="body2"
            color="color.text.DEFAULT"
            style={{ fontWeight: 700 }}
          >
            Workspace
          </Text>
        </Brand>
        <NavRoot>
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              state={location.state}
              style={navLinkStyle}
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
              <span>{label}</span>
            </NavLink>
          ))}
        </NavRoot>
        <Divider />
        <FooterProfile>
          <Button variant="primary" size="medium" style={{ width: '100%' }}>
            Upgrade Plan
          </Button>
          <div style={{ marginTop: '1.25rem', paddingLeft: '0.25rem' }}>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  background: '#2a2a2a',
                  border: '1px solid rgba(86, 67, 59, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <UserRound
                  size={20}
                  color="rgba(255,255,255,0.45)"
                  aria-hidden
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <Text
                  as="div"
                  variant="caption1"
                  color="color.text.DEFAULT"
                  truncate
                  style={{ fontWeight: 700 }}
                >
                  Elite Curator
                </Text>
                <Text
                  as="div"
                  variant="caption2"
                  color="color.text.subtle"
                  truncate
                >
                  Premium Account
                </Text>
              </div>
            </div>
          </div>
        </FooterProfile>
      </SettingsAside>
      <MainColumn>
        <TopBar>
          <Button
            variant="ghost"
            size="small"
            icon={<ArrowLeft size={16} strokeWidth={2} aria-hidden />}
            onClick={() => {
              navigate(
                fromProjectId ? `/projects/${fromProjectId}` : '/projects'
              )
            }}
          >
            Back to project
          </Button>
        </TopBar>
        <Outlet />
      </MainColumn>
    </Root>
  )
}
