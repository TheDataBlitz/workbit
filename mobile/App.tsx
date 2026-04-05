/**
 * @format
 */

import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { ApiWorkspace } from './src/api/client';
import { AppProviders } from './src/providers/AppProviders';
import { isAuthConfigured, LoginScreen, useAuth } from './src/pages/auth';
import { SelectWorkspacesScreen } from './src/pages/WorkspacesScreen';

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
        <View style={styles.signedInBar}>
          <Text style={[styles.signedInEmail, { color: fg }]} numberOfLines={1}>
            {state.session.user.email ?? state.session.user.id}
          </Text>
          <Text
            style={styles.signOut}
            onPress={() => void signOut()}
            accessibilityRole="button"
          >
            Sign out
          </Text>
        </View>
        {activeWorkspace ? (
          <View style={styles.workspaceOpen}>
            <Text style={[styles.workspaceOpenTitle, { color: fg }]}>
              {activeWorkspace.name}
            </Text>
            <Text style={[styles.workspaceOpenMeta, { color: muted }]}>
              workbit.app/{activeWorkspace.slug} ·{' '}
              {activeWorkspace.region.toUpperCase()}
            </Text>
            <Pressable
              onPress={() => setActiveWorkspace(null)}
              style={({ pressed }) => [
                styles.switchWsBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.switchWsBtnText}>Switch workspace</Text>
            </Pressable>
          </View>
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
  signedInBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  signedInEmail: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  signOut: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  workspaceOpen: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  workspaceOpenTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  workspaceOpenMeta: {
    fontSize: 15,
    marginBottom: 20,
  },
  switchWsBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: '#2563eb',
  },
  switchWsBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
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
