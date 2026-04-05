import { Alert } from '@thedatablitz/alert';
import { Avatar } from '@thedatablitz/avatar';
import { Button } from '@thedatablitz/button';
import { Card, CardHeader } from '@thedatablitz/card';
import { Chat, formatResponseDuration } from '@thedatablitz/chat';
import { Inline } from '@thedatablitz/inline';
import { Stack } from '@thedatablitz/stack';
import { Text } from '@thedatablitz/text';
import { getToken } from '@thedatablitz/tokens';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { EnrichedMarkdownText } from 'react-native-enriched-markdown';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { postAiPrompt, type AiChatTurn } from '../../api/client';
import type { MarkdownStyle } from 'react-native-enriched-markdown';

export type ProjectAskModalProps = {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  projectName: string;
};

type ChatTurn =
  | { role: 'user'; content: string }
  | { role: 'assistant'; content: string; durationMs: number };

function buildContextualPrompt(
  projectId: string,
  projectName: string,
  userPrompt: string,
): string {
  const name = projectName.trim();
  return name
    ? `[Project: ${name} (id: ${projectId})]\n\n${userPrompt}`
    : `[Project id: ${projectId}]\n\n${userPrompt}`;
}

/** Native `Chat.Response` only supports text children; mirror its layout for markdown. */
function AskAssistantMarkdown({
  content,
  durationMs,
  markdownStyle,
}: {
  content: string;
  durationMs: number;
  markdownStyle: MarkdownStyle;
}) {
  const durationPart = durationMs > 0 ? formatResponseDuration(durationMs) : '';

  return (
    <View style={styles.assistantRow}>
      <Card variant="ai" size="small" style={styles.assistantCard}>
        <Stack gap="200" fullWidth>
          <Inline gap="200" align="flex-start" wrap={false} fullWidth>
            <Avatar name="Assistant" size="small" />
            <View style={styles.markdownWrap}>
              <EnrichedMarkdownText
                markdown={content.trim() || ' '}
                flavor="github"
                markdownStyle={markdownStyle}
                onLinkPress={({ url }) => {
                  void Linking.openURL(url);
                }}
              />
            </View>
          </Inline>
          {durationPart ? (
            <Text variant="caption2" color="color.text.subtle">
              {durationPart}
            </Text>
          ) : null}
        </Stack>
      </Card>
    </View>
  );
}

export function ProjectAskModal({
  visible,
  onClose,
  projectId,
  projectName,
}: ProjectAskModalProps) {
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const scrollRef = useRef<ScrollView>(null);
  const requestStartedAtRef = useRef<number | null>(null);

  const askMutation = useMutation({
    mutationFn: (messages: AiChatTurn[]) => postAiPrompt({ messages }),
    onSuccess: data => {
      const start = requestStartedAtRef.current;
      requestStartedAtRef.current = null;
      const durationMs = start != null ? Math.max(0, Date.now() - start) : 0;
      setTurns(t => [
        ...t,
        { role: 'assistant', content: data.reply, durationMs },
      ]);
    },
    onError: () => {
      requestStartedAtRef.current = null;
    },
  });
  const resetMutationRef = useRef(askMutation.reset);
  resetMutationRef.current = askMutation.reset;

  useEffect(() => {
    if (!visible) return;
    setPrompt('');
    setTurns([]);
    requestStartedAtRef.current = null;
    resetMutationRef.current();
  }, [visible, projectId]);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(t);
  }, [visible, turns, askMutation.isPending]);

  const markdownStyle = useMemo(
    (): MarkdownStyle => ({
      paragraph: {
        color: getToken('color.text.DEFAULT'),
        fontSize: 15,
        lineHeight: 22,
      },
      h1: { color: getToken('color.text.DEFAULT') },
      h2: { color: getToken('color.text.DEFAULT') },
      h3: { color: getToken('color.text.DEFAULT') },
      h4: { color: getToken('color.text.DEFAULT') },
      h5: { color: getToken('color.text.DEFAULT') },
      h6: { color: getToken('color.text.DEFAULT') },
      strong: { color: getToken('color.text.DEFAULT') },
      em: { color: getToken('color.text.DEFAULT') },
      link: {
        color: getToken('color.text.information'),
      },
      code: {
        color: getToken('color.text.DEFAULT'),
        backgroundColor: getToken('color.background.neutral.subtle'),
      },
      codeBlock: {
        color: getToken('color.text.DEFAULT'),
        backgroundColor: getToken('color.background.neutral.subtle'),
      },
      blockquote: {
        color: getToken('color.text.subtle'),
        borderColor: getToken('color.border.DEFAULT'),
      },
      list: { color: getToken('color.text.DEFAULT') },
    }),
    [],
  );

  const handleSend = useCallback(() => {
    const trimmed = prompt.trim();
    if (!trimmed || !projectId || askMutation.isPending) return;
    const isFirstUserMessage = turns.length === 0;
    const userContent = isFirstUserMessage
      ? buildContextualPrompt(projectId, projectName, trimmed)
      : trimmed;
    const messages: AiChatTurn[] = [
      ...turns.map(t => ({ role: t.role, content: t.content })),
      { role: 'user', content: userContent },
    ];
    setTurns(t => [...t, { role: 'user', content: trimmed }]);
    setPrompt('');
    requestStartedAtRef.current = Date.now();
    askMutation.mutate(messages);
  }, [askMutation, projectId, projectName, prompt, turns]);

  const surface = getToken('elevation.surface.DEFAULT');
  const sendPending = askMutation.isPending;

  const mutationError =
    askMutation.error instanceof Error
      ? askMutation.error.message
      : askMutation.error
        ? String(askMutation.error)
        : null;

  const subtitle =
    projectName.trim() ||
    (projectId.length > 12 ? `${projectId.slice(0, 8)}…` : projectId);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
      >
        <SafeAreaView
          style={[styles.flex, { backgroundColor: surface }]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <Card
            fullWidth
            variant="default"
            size="small"
            style={styles.chatCard}
          >
            <CardHeader>
              <Inline
                justify="space-between"
                align="center"
                fullWidth
                wrap={false}
                gap="150"
              >
                <View style={styles.headerMain}>
                  <Inline
                    gap="200"
                    align="flex-start"
                    wrap={false}
                    style={styles.headerTitleRow}
                  >
                    <Avatar name="InteleBit" size="small" />
                    <Stack gap="050" style={styles.headerText}>
                      <Text variant="heading6">Ask</Text>
                      <Text
                        variant="caption2"
                        color="color.text.subtle"
                        truncate
                      >
                        {subtitle}
                      </Text>
                    </Stack>
                  </Inline>
                </View>
                <View style={styles.headerClose}>
                  <Button
                    buttonType="default"
                    variant="glass"
                    size="small"
                    onPress={onClose}
                    accessibilityLabel="Close"
                  >
                    Close
                  </Button>
                </View>
              </Inline>
            </CardHeader>

            <View style={styles.bodyShell}>
              <ScrollView
                ref={scrollRef}
                style={styles.flex}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
              >
                <Stack gap="400" fullWidth>
                  {turns.length === 0 && !sendPending ? (
                    <Text variant="body3" color="color.text.subtle">
                      Ask something about this project. Replies support
                      markdown.
                    </Text>
                  ) : null}

                  {turns.map((turn, i) =>
                    turn.role === 'user' ? (
                      <Chat.Request key={`u-${i}`}>{turn.content}</Chat.Request>
                    ) : (
                      <AskAssistantMarkdown
                        key={`a-${i}`}
                        content={turn.content}
                        durationMs={turn.durationMs}
                        markdownStyle={markdownStyle}
                      />
                    ),
                  )}

                  {sendPending ? <Chat.Loading /> : null}

                  {mutationError && !sendPending ? (
                    <Alert
                      variant="error"
                      placement="inline"
                      description={mutationError}
                    />
                  ) : null}
                </Stack>
              </ScrollView>
            </View>

            <Chat.Input
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSend}
              placeholder="Type here…"
              disabled={false}
              sendPending={sendPending}
            />
          </Card>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  chatCard: {
    flex: 1,
    minHeight: 0,
    marginHorizontal: 0,
    alignSelf: 'stretch',
  },
  headerMain: {
    flex: 1,
    minWidth: 0,
  },
  headerTitleRow: {
    minWidth: 0,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  headerClose: {
    flexShrink: 0,
  },
  bodyShell: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  assistantRow: {
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  assistantCard: {
    maxWidth: '92%',
  },
  markdownWrap: {
    flex: 1,
    minWidth: 0,
  },
});
