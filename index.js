/**
 * @format
 */

import { AppRegistry, NativeModules } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Estraiamo il modulo nativo dal bridge
const { VoiceGuideForeground } = NativeModules;

// (Opzionale) puoi loggarlo per debug
// console.log('VoiceGuideForeground module:', VoiceGuideForeground);

AppRegistry.registerComponent(appName, () => App);
