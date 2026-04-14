import { useCallback, useState } from 'react';
import { BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import type { AnalysisTab, ProjectAnalysisProps } from '../../navigation/types';
import { AnalysisTabRow } from './components/AnalysisTabRow';
import { AskIntellebitBar } from './components/AskIntellebitBar';
import { DecisionEntry } from './components/DecisionEntry';
import { IssueCard } from './components/IssueCard';
import { UpdateEntry } from './components/UpdateEntry';
import { styles } from './style';

const AV1 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuD8lNDU6cUxeLeu6W11RVUgN8mN_mvWldUuA4vm3T9cR1Iee5t7L0YRneSW8R_W5_H_J8GcWf2kTlLdacooLzWm_9SA1SFye56gSz6YpO7FsCiVQ8nOGWoxtKd7HNcCoLnpiYUY-U-cAcHlR7gxBnbxuDO6UdHhCscegHRAEkzdxNr0KpVbVvHcilrK52F0teiC_00PYXfdzq1TV6fqDCQx2eh9jVyvFu2HlElWhpCfMyRKFGk6ZKbAhXKbq6wBBIs0U1DoNMZ4uXWu';
const AV2 =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuCg6fStswKPDl2QF28weQAgMj_mSsZrZGPcVwpNO4cUchE0z_4lYjQuXKAILVP8oKBU59VhI_cbKZ4Aqx809anhZQ29ORmA7Z7inFdFMee9hvXCbV_PD5L-DQDz1MYAkZcowSVrrANyYPtBeRltr4mHxwdyQN5C6N-D3Zj2hjbXfhvtIbESFid2OdZ587y7_B9KS0mQ-aGISk5w3DhJpMvQNS_MIp8o5gbYWWt7CI3DxYxLN7UYzwlXanlYF--WysXcFETnAeXe7fbw';

export function ProjectAnalysisScreen({
  navigation,
  route,
}: ProjectAnalysisProps) {
  const paramTab = route.params?.initialTab;
  const [tab, setTab] = useState<AnalysisTab>(paramTab ?? 'updates');

  useFocusEffect(
    useCallback(() => {
      setTab(route.params?.initialTab ?? 'updates');
    }, [route.params?.initialTab]),
  );

  const close = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('ProjectList');
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        close();
        return true;
      });
      return () => sub.remove();
    }, [close]),
  );

  return (
    <View style={styles.root}>
      <Pressable
        style={styles.dim}
        onPress={close}
        accessibilityRole="button"
        accessibilityLabel="Close"
        collapsable={false}
      />
      <View style={styles.sheet}>
        <LinearGradient colors={['#111111', '#050505']} style={{ flex: 1 }}>
          <AnalysisTabRow active={tab} onChange={setTab} onClose={close} />
          <ScrollView
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            {tab === 'overview' ? (
              <View style={styles.overview}>
                <Text style={styles.overviewTitle}>MCP Workflow</Text>
                <Text style={styles.overviewBody}>
                  Model context orchestration for engineering simulations.
                  Matches Stitch “Temporal Registry” flow — use Updates, Issues,
                  and Decisions for detail.
                </Text>
              </View>
            ) : null}
            {tab === 'updates' ? (
              <>
                <UpdateEntry
                  avatarUrl={AV1}
                  name="Dr. Elias Vance"
                  role="Lead Structural Engineer"
                  timeAgo="2 hours ago"
                  statusLabel="In Progress"
                  statusTone="primary"
                  body="Phase 4 stress testing initiated on the primary manifold. We've observed a 0.04% variance in thermal expansion coefficients. Adjusting the coolant flow rates to compensate for the nocturnal ambient shift."
                  ownerLabel="Owner:"
                  ownerValue="Structural Integrity Lab"
                  ownerTone="primary"
                />
                <UpdateEntry
                  avatarUrl={AV2}
                  name="Alyx Vance"
                  role="Network Specialist"
                  timeAgo="5 hours ago"
                  statusLabel="Sync Complete"
                  statusTone="muted"
                  body="Sub-node handshake protocols have been updated to the latest 0.9.x spec. Latency across the Blitz node cluster has dropped by 12ms."
                  ownerLabel="Owner:"
                  ownerValue="Network Operations"
                  ownerTone="muted"
                />
                <View style={{ height: 24 }} />
              </>
            ) : null}
            {tab === 'issues' ? (
              <>
                <IssueCard
                  issueId="#ISS-102"
                  title="Cryogenic Manifold Stabilization"
                  statusLabel="Blocked"
                  owner="Dr. Elias Vance"
                  project="MCP Workflow"
                  dueDate="24 OCT 2024"
                  subIssues={[
                    {
                      id: '#SUB-102.1',
                      status: 'In Progress',
                      statusVariant: 'warning',
                      title: 'Recalibrate thermal sensors on block B4',
                      assignee: 'Alyx Vance',
                    },
                    {
                      id: '#SUB-102.2',
                      status: 'Queued',
                      statusVariant: 'muted',
                      title: 'Replace manifold gasket set 7B',
                      assignee: 'Dr. Aris Thorne',
                    },
                  ]}
                />
                <View style={{ height: 24 }} />
              </>
            ) : null}
            {tab === 'decisions' ? (
              <>
                <DecisionEntry
                  status="Approved"
                  date="2026-04-10"
                  title="Implement Cached Revenue Reporting System"
                  decisionBy="You"
                  rationale="Real-time aggregation is causing significant database latency and performance bottlenecks during peak reporting hours. Shifting to a cached materialized view updated every 15 minutes reduces load by 64% while maintaining acceptable freshness."
                  impact="Significantly reduces database load. Dashboard load times improved from 8.2s to 0.4s. Minor increase in cloud storage costs ($12/mo) offset by reduced compute cycles."
                />
                <DecisionEntry
                  status="Approved"
                  date="2026-04-10"
                  title="Consolidate Shop Analytics Endpoints into Unified Dispatcher"
                  decisionBy="You"
                  rationale="Consolidating analytics endpoints reduces boilerplate code and network overhead across client applications by 30%. It allows for centralized caching logic and uniform security policy enforcement."
                  impact="Simplifies the API surface significantly. Engineering effort estimated at 6 story points. Expected to reduce future feature integration time by 15%."
                />
                <View style={{ height: 100 }} />
              </>
            ) : null}
          </ScrollView>
          <AskIntellebitBar onPress={() => {}} />
        </LinearGradient>
      </View>
    </View>
  );
}
