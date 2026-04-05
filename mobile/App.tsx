/**
 * @format
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { ApiWorkspace } from './src/api/client';
import { SignedInHeader } from './src/components/SignedInHeader';
import { AppProviders } from './src/providers/AppProviders';
import { isAuthConfigured, LoginScreen, useAuth } from './src/pages/auth';
import {
  SelectWorkspacesScreen,
  WorkspaceProjectsScreen,
} from './src/pages/WorkspacesScreen';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <AppProviders>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <AppContent />
      </AppProviders>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAllowed, state, signOut } = useAuth();
  const [activeWorkspace, setActiveWorkspace] = useState<ApiWorkspace | null>(
    null,
  );

  useEffect(() => {
    if (state.status === 'unauthenticated') {
      setActiveWorkspace(null);
    }
  }, [state.status]);

  const bg = isDark ? '#0f172a' : '#f8fafc';
  const fg = isDark ? '#f8fafc' : '#0f172a';
  const muted = isDark ? '#94a3b8' : '#64748b';

  if (state.status === 'loading') {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: bg }]}
      >
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!isAllowed) {
    return <LoginScreen />;
  }

  if (isAuthConfigured && state.status === 'authenticated') {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: bg }]}
        edges={['top', 'left', 'right']}
      >
        <SignedInHeader
          email={state.session.user.email}
          userId={state.session.user.id}
          onSignOut={signOut}
          workspaceActive={Boolean(activeWorkspace)}
          onSwitchWorkspace={
            activeWorkspace ? () => setActiveWorkspace(null) : undefined
          }
        />
        {activeWorkspace ? (
          <WorkspaceProjectsScreen workspace={activeWorkspace} />
        ) : (
          <SelectWorkspacesScreen onWorkspaceSelected={setActiveWorkspace} />
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: bg }]}
      edges={['top', 'left', 'right']}
    >
      <View style={styles.home}>
        <Text style={[styles.homeTitle, { color: fg }]}>Workbit</Text>
        <Text style={[styles.homeSubtitle, { color: muted }]}>
          Supabase URL and anon key were not loaded. Set SUPABASE_URL and
          SUPABASE_ANON_KEY (or VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY) in
          mobile/.env, then restart Metro with --reset-cache.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  home: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    justifyContent: 'center',
  },
  homeTitle: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 12,
  },
  homeSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
});

export default App;
