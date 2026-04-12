import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { stitchColors } from '../theme/stitchColors';
import { LoginScreen } from '../pages/Login';
import { ProjectAnalysisScreen } from '../pages/ProjectAnalysisScreen';
import { ProjectListScreen } from '../pages/ProjectListScreen';
import { WorkspaceSelectionScreen } from '../pages/WorkspaceSelectionScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: stitchColors.background,
    card: stitchColors.background,
    primary: stitchColors.primary,
    text: stitchColors.onBackground,
    border: stitchColors.white10,
    notification: stitchColors.secondary,
  },
};

export function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: stitchColors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="WorkspaceSelection"
          component={WorkspaceSelectionScreen}
        />
        <Stack.Screen name="ProjectList" component={ProjectListScreen} />
        <Stack.Screen
          name="ProjectAnalysis"
          component={ProjectAnalysisScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
