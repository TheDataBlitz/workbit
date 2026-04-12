import { useCallback, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { WorkspaceSelectionProps } from '../../navigation/types';
import { WorkspaceCard } from './components/WorkspaceCard';
import { CARD_WIDTH } from './components/WorkspaceCard/style';
import { WorkspaceFooter } from './components/WorkspaceFooter';
import { styles } from './style';

const GAP = 20;
const SCREEN_W = Dimensions.get('window').width;
const SIDE_PAD = Math.max(16, (SCREEN_W - CARD_WIDTH) / 2);

export function WorkspaceSelectionScreen({
  navigation,
}: WorkspaceSelectionProps) {
  const [index, setIndex] = useState(0);

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const w = CARD_WIDTH + GAP;
    const i = Math.round(x / w);
    setIndex(Math.min(2, Math.max(0, i)));
  }, []);

  const goProjects = useCallback(() => {
    navigation.navigate('ProjectList');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.title}>Select Workspace</Text>
        <Text style={styles.subtitle}>Initialize Spatial Link</Text>
      </View>
      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + GAP}
        snapToAlignment="center"
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.carouselContent,
          { paddingHorizontal: SIDE_PAD },
        ]}
        style={styles.carousel}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={{ marginRight: GAP }}>
          <WorkspaceCard
            variant="acme"
            eyebrow="Protocol Alpha"
            titleLine1="Acme"
            titleLine2="Inc"
            description="Navigate to the primary corporate node. High-frequency trade environment."
            iconChar="◎"
            accentColor="#ffb89a"
            onPress={goProjects}
          />
        </View>
        <View style={{ marginRight: GAP }}>
          <WorkspaceCard
            variant="studio"
            eyebrow="Creative Sector"
            titleLine1="Design"
            titleLine2="Studio"
            description="Initialize aesthetic synthesis engine. European regional node active."
            iconChar="◈"
            accentColor="#dcc1b6"
            onPress={goProjects}
          />
        </View>
        <WorkspaceCard
          variant="personal"
          eyebrow="Private Core"
          titleLine1="Personal"
          description="Access local consciousness vault. Global synchronization enabled."
          iconChar="◉"
          accentColor="#dcc1b6"
          onPress={goProjects}
        />
      </ScrollView>
      <WorkspaceFooter activeIndex={index} total={3} />
    </SafeAreaView>
  );
}
