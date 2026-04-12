import { useCallback, useState } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LoginScreenProps } from '../../navigation/types';
import { stitchColors } from '../../theme/stitchColors';
import { styles } from './style';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const GRID = 40;
const GRID_H_COUNT = Math.ceil(SCREEN_H / GRID) + 2;
const GRID_V_COUNT = Math.ceil(SCREEN_W / GRID) + 2;

export function LoginScreen({ navigation }: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailFocus, setEmailFocus] = useState(false);
  const [passwordFocus, setPasswordFocus] = useState(false);

  const onSubmit = useCallback(() => {
    navigation.replace('WorkspaceSelection');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: GRID_H_COUNT }).map((_, i) => (
            <View
              key={`gh${i}`}
              style={[styles.gridLineH, { top: i * GRID }]}
            />
          ))}
          {Array.from({ length: GRID_V_COUNT }).map((_, i) => (
            <View
              key={`gv${i}`}
              style={[styles.gridLineV, { left: i * GRID }]}
            />
          ))}
          <LinearGradient
            colors={[
              stitchColors.background,
              'transparent',
              `${stitchColors.primaryContainer}0d`,
            ]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientWash}
          />
          <View style={styles.glowTop} />
          <View style={styles.glowBottom} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainColumn}>
            <View style={styles.heroBlock}>
              <View style={styles.eyebrow}>
                <Text style={styles.eyebrowText}>
                  Secure Authentication Layer
                </Text>
              </View>
              <Text style={styles.title}>WORKBIT</Text>
              <Text style={styles.subtitle}>Your intelligent manager</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.lockDeco} pointerEvents="none">
                <Text style={styles.lockDecoText}>🔓</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.field}>
                  <Text
                    style={[styles.label, emailFocus && styles.labelFocused]}
                  >
                    Institutional Email
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="user@workbit.app"
                    placeholderTextColor={`${stitchColors.onSurfaceVariant}4d`}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocus(true)}
                    onBlur={() => setEmailFocus(false)}
                    style={[styles.input, emailFocus && styles.inputFocused]}
                  />
                </View>

                <View style={styles.field}>
                  <Text
                    style={[styles.label, passwordFocus && styles.labelFocused]}
                  >
                    Terminal Access Key
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={`${stitchColors.onSurfaceVariant}4d`}
                    secureTextEntry
                    onFocus={() => setPasswordFocus(true)}
                    onBlur={() => setPasswordFocus(false)}
                    style={[styles.input, passwordFocus && styles.inputFocused]}
                  />
                </View>

                <Pressable
                  onPress={onSubmit}
                  style={({ pressed }) => [
                    styles.ctaOuter,
                    pressed && { opacity: 0.96, transform: [{ scale: 0.99 }] },
                  ]}
                >
                  <LinearGradient
                    colors={[
                      stitchColors.primaryContainer,
                      stitchColors.tertiaryContainer,
                    ]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.cta}
                  >
                    <Text style={styles.ctaText}>AUTHORIZE ACCESS</Text>
                    <Text style={styles.ctaArrow}>→</Text>
                  </LinearGradient>
                </Pressable>

                <View style={styles.linksRow}>
                  <Pressable hitSlop={8}>
                    <Text style={styles.link}>Forgot credentials</Text>
                  </Pressable>
                  <Pressable hitSlop={8}>
                    <Text style={styles.link}>Request access</Text>
                  </Pressable>
                </View>
              </View>

              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaKicker}>Node Location</Text>
                  <Text style={styles.metaValue}>Global-North-01</Text>
                </View>
                <View style={[styles.metaCol, styles.metaColEnd]}>
                  <Text style={styles.metaKicker}>Encryption Status</Text>
                  <Text style={styles.metaValue}>AES-256 ACTIVE</Text>
                </View>
              </View>
            </View>

            <View style={styles.footerNote}>
              <Text style={styles.footerNoteText}>
                Digital Curator Protocol v2.4
              </Text>
              <View style={styles.footerRule} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
