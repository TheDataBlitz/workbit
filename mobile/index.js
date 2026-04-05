/**
 * @format
 */

import 'react-native-url-polyfill/auto';
import 'react-native-nitro-modules';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
