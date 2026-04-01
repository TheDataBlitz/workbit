import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Avatar } from '@thedatablitz/avatar'
import { Button } from '@thedatablitz/button'
import { Box } from '@thedatablitz/box'
import { Card, CardContent } from '@thedatablitz/card'
import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { Text } from '@thedatablitz/text'
import { TextInput } from '@thedatablitz/text-input'
import { Toggle } from '@thedatablitz/toggle'
import { ApiKeysTab, ProfileUsageTab } from '../../components'
import { useAuth } from '../auth/AuthContext'
import type { TabId } from './types'

export function ProfilePage() {
  const [searchParams] = useSearchParams()
  const { state } = useAuth()
  const tabParam = searchParams.get('tab')
  const activeTab: TabId =
    tabParam === 'profile'
      ? 'profile'
      : tabParam === 'usage'
        ? 'usage'
        : 'api-keys'
  const user = state.status === 'authenticated' ? state.session.user : null
  const fullNameRaw =
    (user?.user_metadata?.full_name as string | undefined) ??
    (user?.user_metadata?.name as string | undefined) ??
    ''
  const [firstName = '', ...restName] = fullNameRaw.trim().split(' ')
  const lastName = restName.join(' ')
  const email = user?.email ?? ''
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: false,
    push: true,
    monthly: false,
    quarterly: false,
  })

  const integrations = [
    {
      id: 'github',
      name: 'GitHub',
      description: 'Commits data and history',
      connected: true,
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Messages and channels',
      connected: false,
    },
    {
      id: 'linear',
      name: 'Linear',
      description: 'Issue sync and tracking',
      connected: false,
    },
  ] as const

  const headerTitle =
    activeTab === 'usage'
      ? 'Usage & Analytics'
      : activeTab === 'api-keys'
        ? 'API keys'
        : 'Profile settings'
  const headerSubtitle =
    activeTab === 'usage'
      ? 'Track token usage, interactions, and estimated cost across projects.'
      : activeTab === 'api-keys'
        ? 'Manage developer access keys for integrations and automation.'
        : 'Manage your personal account and developer access from the sidebar.'

  return (
    <Box fullWidth>
      <Stack gap="200" padding="200" fullWidth>
        <Stack gap="100" padding="200" fullWidth>
          <Inline align="center" gap="100">
            <Avatar name="WB" size="large" variant="brand" />
            <Stack gap="025" fullWidth>
              <Text variant="heading2">{headerTitle}</Text>
              <Text variant="body3" color="color.text.subtle">
                {headerSubtitle}
              </Text>
            </Stack>
          </Inline>
        </Stack>

        {activeTab === 'profile' ? (
          <Stack gap="200">
            <Card size="large" variant="default" fullWidth>
              <CardContent>
                <Stack gap="200">
                  <Text variant="heading5">Personal info</Text>
                  <Inline gap="150" wrap fullWidth>
                    <Box fullWidth className="min-w-[240px] flex-1">
                      <TextInput
                        label="Email address"
                        value={email}
                        disabled
                        fullWidth
                      />
                    </Box>
                    <Box fullWidth className="min-w-[200px] flex-1">
                      <TextInput
                        label="First name"
                        value={firstName}
                        placeholder="First name"
                        fullWidth
                      />
                    </Box>
                    <Box fullWidth className="min-w-[200px] flex-1">
                      <TextInput
                        label="Last name"
                        value={lastName}
                        placeholder="Last name"
                        fullWidth
                      />
                    </Box>
                  </Inline>
                  <Inline gap="150" wrap fullWidth>
                    <Box fullWidth className="min-w-[240px] flex-1">
                      <TextInput
                        label="Current password"
                        type="password"
                        value="********"
                        disabled
                        fullWidth
                      />
                    </Box>
                    <Box fullWidth className="min-w-[240px] flex-1">
                      <TextInput
                        label="New password"
                        type="password"
                        placeholder="New password"
                        fullWidth
                      />
                    </Box>
                    <Box fullWidth className="min-w-[240px] flex-1">
                      <TextInput
                        label="Confirm password"
                        type="password"
                        placeholder="Confirm new password"
                        fullWidth
                      />
                    </Box>
                  </Inline>
                  <Inline justify="start">
                    <Button variant="primary">Save changes</Button>
                  </Inline>
                </Stack>
              </CardContent>
            </Card>

            <Card size="large" variant="default" fullWidth>
              <CardContent>
                <Stack gap="200">
                  <Inline justify="between" align="center" fullWidth>
                    <Text variant="heading5">Integrations</Text>
                    <Button buttonType="link" variant="glass">
                      Manage
                    </Button>
                  </Inline>
                  <Inline gap="150" wrap fullWidth>
                    {integrations.map((integration) => (
                      <Box
                        key={integration.id}
                        border
                        padding="150"
                        className="min-w-[240px] flex-1 rounded-[10px]"
                      >
                        <Inline align="center" justify="between" fullWidth>
                          <Inline align="center" gap="100">
                            <Avatar
                              name={integration.name.slice(0, 2)}
                              size="medium"
                              variant="default"
                            />
                            <Stack gap="025">
                              <Text variant="body2">{integration.name}</Text>
                              <Text variant="body3" color="color.text.subtle">
                                {integration.description}
                              </Text>
                            </Stack>
                          </Inline>
                          <Button
                            variant={
                              integration.connected ? 'success' : 'glass'
                            }
                            size="small"
                          >
                            {integration.connected ? 'Connected' : 'Connect'}
                          </Button>
                        </Inline>
                      </Box>
                    ))}
                  </Inline>
                </Stack>
              </CardContent>
            </Card>

            <Card size="large" variant="default" fullWidth>
              <CardContent>
                <Stack gap="200">
                  <Text variant="heading5">Notifications</Text>
                  <Text variant="body3" color="color.text.subtle">
                    Control your notification and auto-follow settings.
                  </Text>
                  <Inline gap="200" wrap fullWidth>
                    <Box fullWidth className="min-w-[260px] flex-1">
                      <Stack gap="150">
                        <Inline justify="between" align="center" fullWidth>
                          <Stack gap="025">
                            <Text variant="body2">Email notifications</Text>
                            <Text variant="body3" color="color.text.subtle">
                              Commits data and history
                            </Text>
                          </Stack>
                          <Toggle
                            checked={notificationPrefs.email}
                            label="Email notifications"
                            size="small"
                            variant="primary"
                            onChange={(e) =>
                              setNotificationPrefs((prev) => ({
                                ...prev,
                                email: e.target.checked,
                              }))
                            }
                          />
                        </Inline>
                        <Inline justify="between" align="center" fullWidth>
                          <Stack gap="025">
                            <Text variant="body2">Push notifications</Text>
                            <Text variant="body3" color="color.text.subtle">
                              Commits data and history
                            </Text>
                          </Stack>
                          <Toggle
                            checked={notificationPrefs.push}
                            label="Push notifications"
                            size="small"
                            variant="primary"
                            onChange={(e) =>
                              setNotificationPrefs((prev) => ({
                                ...prev,
                                push: e.target.checked,
                              }))
                            }
                          />
                        </Inline>
                      </Stack>
                    </Box>

                    <Box fullWidth className="min-w-[260px] flex-1">
                      <Stack gap="150">
                        <Inline justify="between" align="center" fullWidth>
                          <Stack gap="025">
                            <Text variant="body2">Monthly reports</Text>
                            <Text variant="body3" color="color.text.subtle">
                              Commits data and history
                            </Text>
                          </Stack>
                          <Toggle
                            checked={notificationPrefs.monthly}
                            label="Monthly reports"
                            size="small"
                            variant="primary"
                            onChange={(e) =>
                              setNotificationPrefs((prev) => ({
                                ...prev,
                                monthly: e.target.checked,
                              }))
                            }
                          />
                        </Inline>
                        <Inline justify="between" align="center" fullWidth>
                          <Stack gap="025">
                            <Text variant="body2">Quarter reports</Text>
                            <Text variant="body3" color="color.text.subtle">
                              Commits data and history
                            </Text>
                          </Stack>
                          <Toggle
                            checked={notificationPrefs.quarterly}
                            label="Quarter reports"
                            size="small"
                            variant="primary"
                            onChange={(e) =>
                              setNotificationPrefs((prev) => ({
                                ...prev,
                                quarterly: e.target.checked,
                              }))
                            }
                          />
                        </Inline>
                      </Stack>
                    </Box>
                  </Inline>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        ) : null}

        {activeTab === 'api-keys' && <ApiKeysTab />}
        {activeTab === 'usage' && <ProfileUsageTab />}
      </Stack>
    </Box>
  )
}
