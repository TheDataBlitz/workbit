import { Alert } from '@thedatablitz/alert';
import { Avatar } from '@thedatablitz/avatar';
import { Button } from '@thedatablitz/button';
import { Inline } from '@thedatablitz/inline';
import { Stack } from '@thedatablitz/stack';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from './useAuth';
import { getSupabase, isAuthConfigured } from './supabaseClient';

export function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { state } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const surface = getToken('elevation.surface.DEFAULT');
  const border = getToken('color.border.DEFAULT');
  const inputBg = getToken('color.background.neutral.subtle');
  const fg = getToken('color.text.DEFAULT');
  const placeholderColor = getToken('color.text.subtle');

  if (!isAuthConfigured) {
    return (
      <View
        style={[
          styles.centered,
          {
            paddingTop: insets.top,
            paddingHorizontal: 24,
            backgroundColor: surface,
          },
        ]}
      >
        <Stack gap="150" fullWidth>
          <Text variant="heading3">Auth not configured</Text>
          <Text variant="body2" color="color.text.subtle">
            Add SUPABASE_URL and SUPABASE_ANON_KEY to mobile/.env (same values
            as the web app’s VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY). See
            .env.example.
          </Text>
        </Stack>
      </View>
    );
  }

  if (state.status === 'loading') {
    return (
      <View
        style={[
          styles.centered,
          { paddingTop: insets.top, backgroundColor: surface },
        ]}
      >
        <ActivityIndicator
          size="large"
          color={getToken('color.icon.information')}
        />
      </View>
    );
  }

  async function handleSignIn() {
    setError(null);
    setLoading(true);
    const supabase = getSupabase();
    if (!supabase) {
      setError('Auth not configured');
      setLoading(false);
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
    }
  }

  function handleGooglePlaceholder() {
    setError(
      'Google sign-in on mobile is not set up yet. Use email and password, or log in on the web app.',
    );
  }

  const inputStyle = {
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: inputBg,
    color: fg,
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: surface }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Stack gap="300" fullWidth>
          <Inline align="center" gap="150" wrap={false}>
            <Avatar name="Workbit" size="small" variant="brand" />
            <Text variant="heading4">Workbit</Text>
          </Inline>

          <Stack gap="100" fullWidth>
            <Text variant="heading2">Log in to your account.</Text>
            <Text variant="body2" color="color.text.subtle">
              Enter your email address and password to log in.
            </Text>
          </Stack>

          <TextInput
            style={[inputStyle, { marginBottom: 0 }]}
            placeholder="Email address"
            placeholderTextColor={placeholderColor}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <View style={styles.passwordRow}>
            <TextInput
              style={[inputStyle, styles.passwordInput]}
              placeholder="Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="password"
              value={password}
              onChangeText={setPassword}
            />
            <View style={styles.showPasswordWrap}>
              <Button
                buttonType="link"
                variant="primary"
                size="small"
                onPress={() => setShowPassword(v => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </View>
          </View>

          {error ? (
            <Alert variant="error" placement="inline" description={error} />
          ) : null}

          <Button
            buttonType="default"
            variant="primary"
            size="large"
            loading={loading}
            disabled={loading}
            onPress={() => void handleSignIn()}
          >
            Login
          </Button>

          <Inline
            align="center"
            justify="stretch"
            gap="100"
            fullWidth
            wrap={false}
          >
            <View style={[styles.orLine, { backgroundColor: border }]} />
            <Text variant="body3" color="color.text.subtle">
              or
            </Text>
            <View style={[styles.orLine, { backgroundColor: border }]} />
          </Inline>

          <Button
            buttonType="default"
            variant="glass"
            size="large"
            onPress={handleGooglePlaceholder}
          >
            Google
          </Button>
        </Stack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollContent: {
    maxWidth: 448,
    width: '100%',
    alignSelf: 'center',
  },
  passwordRow: {
    position: 'relative',
    marginBottom: 0,
  },
  passwordInput: {
    paddingRight: 80,
  },
  showPasswordWrap: {
    position: 'absolute',
    right: 4,
    top: 10,
  },
  orLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
});
