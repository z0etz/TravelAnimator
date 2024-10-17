import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from './MapScreen';
import AnimateScreen from './AnimateScreen.js';
import SavedRoutesScreen from './SavedRoutesScreen'; 
import { RouteProvider } from './RouteContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <RouteProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Map">
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Travel Animator' }} />
          <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} options={{ title: 'Saved Routes' }} />
          <Stack.Screen name="Animate" component={AnimateScreen} options={{ title: 'Animate' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </RouteProvider>
  );
}
