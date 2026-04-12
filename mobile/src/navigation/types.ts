import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AnalysisTab = 'overview' | 'updates' | 'issues' | 'decisions';

export type RootStackParamList = {
  Login: undefined;
  WorkspaceSelection: undefined;
  ProjectList: undefined;
  ProjectAnalysis: { initialTab?: AnalysisTab };
};

export type LoginScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Login'
>;

export type WorkspaceSelectionProps = NativeStackScreenProps<
  RootStackParamList,
  'WorkspaceSelection'
>;
export type ProjectListProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectList'
>;
export type ProjectAnalysisProps = NativeStackScreenProps<
  RootStackParamList,
  'ProjectAnalysis'
>;
