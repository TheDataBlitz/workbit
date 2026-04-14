import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ProjectListProps } from '../../navigation/types';
import { PhaseProjectCard } from './components/PhaseProjectCard';
import type { PhaseProjectCardProps } from './components/PhaseProjectCard';
import { CARD_WIDTH } from './components/PhaseProjectCard/style';
import { StreamSectionHeader } from './components/StreamSectionHeader';
import { SystemAlertBanner } from './components/SystemAlertBanner';
import { styles } from './style';

const U1 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC1GETg-flrJURUx_w1AQrZWPS9diBgq4VbkoujseMamkXdXsnBFE2KIuJHe4sgBl4AKT1XA82hRYk6aMZ8WvJf2gxjhk8SgQyxpY7oaPD9Q_XCkjAnK9rn6TFkrGeQWG3ael_8l34lOguzFQaEgSOolpRL6KPRD7FDl7cjJWKqDp0KwvJzXco3Q2c1t9dtHoUTwHUYUQSO0Zv3N-zMOPtjlKO-hqVgy0-HKV0lBR1i_N6KjkPXhpnyBtzT2ojyS_CTStPYIseZXjnd';
const U2 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAjfkPiMB1zaPVBcAo8b6sOThycQywC-w1JOi9PzucASgTi3Z3VTBNRp45BO6xuw0P1YRS1U3-SoJR68U3SCiN9_vrpS6PuN7cbz3Vdnn-0LndA-zJjzQgYGEqwZtn9_JyDYyLgV0S_2wBHS9FQcVfT3Ez5hPNK74iB5tcQ1NMDnRXbb7yIni6zHmp42UmLzeXYeF9byBMcrIWdCyehJ5O40fCNI0BIYZQDsFfvbfRYrRDfNe6RmbV2wx-QHYpSUg277RaKExQ8sq19';
const U3 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAEp_Q6wmphDDFSxNuNuLDpEM-JS7_z9Hrlx4Fnl6-1Hjo48iOXkMbX5FUbVwgFXuErhmA21YPgHDEDd_HURTHxnsaLUV8tC0ioUwPfes-4mcTbNix4YLquRnZMfeZTWMRVPFKkGR7KHntHDHjnBAvkuF_IKcBe2j_3ClYKWU4y_S3_SOqKz-AcsxCpH5tb2vXN6EPWYhOGjXXgNC9KI1XbVEaSTBXFfWFgcp9MXFSADCRD7KRnuOW7-FG0eFpJp-Ci39bFhQ02cCsI';
const U4 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuC_7OBd0Gij7nMvDeIQfvt_ZVcFLZ_GcunNIMnU3fh8rvPeEYczfkszDV_GuJUl_syf_BTq3odgmd72ZZyxJD2flP7lJLQToXf_92qV_pCfL32utsWwDmikUeZSvwudnHn_Wk5P42mv-Mk42arFFMtcQuKjQyXEaOjLnE9zNauajUcNNKA8K61o3yaRBVWqkf9tDqi2_XuwMUwoYw7P3cKcjCxV-KESIaMW6lV1oXOksyiQwZxZDo3Wo_0iuIH32NBgZjfsnw0T6WSL';

const U5 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBFR9En4Q-b3CgnYKrzSPT59NSeBnCd5xaCimvJB1SNWY77PBU_o8GWTtao1eGOgx5jmUyHtNUuQJKjr8G6p4SXHobYjZEBpf2mzgh8tsH_F-B6FZWReryPXI9sXU1j803YxVYCGkxSMSvcf7kuTcAQhqX4k6YwYL_Ju8v7Sc3AHhW7AoY6tkISM0YHtog9bsU9ZPKch7Ew2dmMHDjEHAhEAG9Wf7M-CPS8biFhUCIBhuiUVeZwEBVrXx1wlX4WGQ9dI-ykcrs3jm1i';

/** Must match `scrollContent.paddingHorizontal` in style.ts */
const SCROLL_PAD_X = 28;
/** Must match `scrollContent.gap` in style.ts */
const CAROUSEL_GAP = 40;
const SLOT = CARD_WIDTH + CAROUSEL_GAP;

const SCALE_FOCUS = 1.08;
const SCALE_SIDE = 0.9;

function cardCenterXContent(index: number) {
  return SCROLL_PAD_X + index * SLOT + CARD_WIDTH / 2;
}

function carouselContentWidth(cardCount: number) {
  if (cardCount <= 0) return SCROLL_PAD_X * 2;
  return (
    SCROLL_PAD_X * 2 +
    cardCount * CARD_WIDTH +
    Math.max(0, cardCount - 1) * CAROUSEL_GAP
  );
}

export function ProjectListScreen({ navigation }: ProjectListProps) {
  const projects: Omit<PhaseProjectCardProps, 'onOpenAnalysis'>[] = useMemo(
    () => [
      {
        phaseLabel: 'Phase 01',
        phaseIcon: '⚡',
        accent: 'primary',
        title: 'MCP Workflow',
        description: 'Model context orchestration for engineering simulations.',
        leadAvatarUrl: U1,
        leadKicker: 'Project Lead',
        leadName: 'Dr. Aris Thorne',
        contributorUrls: [U2, U3, U4],
        extraContributors: 4,
        metrics: { issues: '12', updates: '48', decisions: '03' },
        progressPct: 75,
        statusLabel: 'Status: Active',
        progressColor: '#ff8f5c',
        vertical: 'down',
        glow: true,
      },
      {
        phaseLabel: 'Phase 02',
        phaseIcon: '◇',
        accent: 'tertiary',
        title: 'Neural Lattice',
        description: 'Deep learning generative structural density analysis.',
        leadAvatarUrl: U5,
        leadKicker: 'Project Lead',
        leadName: 'Prof. Elena Vance',
        contributorUrls: [U2, U3],
        extraContributors: 2,
        metrics: { issues: '24', updates: '12', decisions: '01' },
        progressPct: 40,
        statusLabel: 'Status: Review',
        progressColor: '#ec9969',
        vertical: 'up',
        alertBanner: 'Awaiting QC',
      },
      {
        phaseLabel: 'Phase 03',
        phaseIcon: '📊',
        accent: 'primary',
        title: 'Quantum Telemetry',
        description: 'Sub-atomic collision monitoring and data streaming.',
        leadAvatarUrl: U1,
        leadKicker: 'Project Lead',
        leadName: 'Marcus Halloway',
        contributorUrls: [U2, U3, U4],
        metrics: { issues: '04', updates: '102', decisions: '08' },
        progressPct: 92,
        statusLabel: 'Status: Finalizing',
        progressColor: '#ff8f5c',
        vertical: 'down',
        glow: true,
      },
      {
        phaseLabel: 'Legacy',
        phaseIcon: '🔒',
        accent: 'outline',
        title: 'Synapse Core',
        description: 'Cross-institutional knowledge sharing framework.',
        leadAvatarUrl: U2,
        leadKicker: 'Archived',
        leadName: '—',
        contributorUrls: [],
        metrics: { issues: '0', updates: '852', decisions: '12' },
        progressPct: 100,
        statusLabel: 'Archived',
        progressColor: '#525252',
        vertical: 'up',
        disabled: true,
      },
    ],
    [],
  );

  const scrollX = useRef(new Animated.Value(0)).current;
  const [scrollViewportW, setScrollViewportW] = useState(
    () => Dimensions.get('window').width,
  );

  const onScrollLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setScrollViewportW(w);
  };

  const snapOffsets = useMemo(() => {
    const contentW = carouselContentWidth(projects.length);
    const maxScroll = Math.max(0, contentW - scrollViewportW);
    return projects.map((_, i) => {
      const target = cardCenterXContent(i) - scrollViewportW / 2;
      return Math.min(maxScroll, Math.max(0, target));
    });
  }, [projects, scrollViewportW]);

  const cardScales = useMemo(
    () =>
      projects.map((_, index) => {
        const cx = cardCenterXContent(index);
        const scrollWhenCentered = cx - scrollViewportW / 2;
        const falloff = SLOT * 0.9;
        return scrollX.interpolate({
          inputRange: [
            scrollWhenCentered - falloff,
            scrollWhenCentered,
            scrollWhenCentered + falloff,
          ],
          outputRange: [SCALE_SIDE, SCALE_FOCUS, SCALE_SIDE],
          extrapolate: 'clamp',
        });
      }),
    [projects, scrollX, scrollViewportW],
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: true },
  );

  const openAnalysis = (
    tab: 'updates' | 'issues' | 'decisions' = 'updates',
  ) => {
    navigation.navigate('ProjectAnalysis', { initialTab: tab });
  };

  const analysisHandlers: (() => void)[] = useMemo(
    () => [
      () => navigation.navigate('ProjectAnalysis', { initialTab: 'updates' }),
      () => navigation.navigate('ProjectAnalysis', { initialTab: 'issues' }),
      () => navigation.navigate('ProjectAnalysis', { initialTab: 'decisions' }),
      () => {},
    ],
    [navigation],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.main}>
        <StreamSectionHeader />
        <View style={styles.timelineLine} pointerEvents="none" />
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          scrollEventThrottle={16}
          onScroll={onScroll}
          onLayout={onScrollLayout}
          decelerationRate="fast"
          snapToOffsets={snapOffsets}
          snapToStart={false}
          snapToEnd={false}
          disableIntervalMomentum
        >
          {projects.map((p, i) => (
            <Animated.View
              key={`${p.phaseLabel}-${p.title}`}
              style={{
                width: CARD_WIDTH,
                transform: [{ scale: cardScales[i] ?? 1 }],
              }}
            >
              <PhaseProjectCard
                {...p}
                onOpenAnalysis={p.disabled ? undefined : analysisHandlers[i]}
              />
            </Animated.View>
          ))}
        </Animated.ScrollView>
        <SystemAlertBanner phaseName="Neural Lattice" />
        <Pressable style={styles.fab} onPress={() => openAnalysis('updates')}>
          <Text style={styles.fabText}>☰</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
