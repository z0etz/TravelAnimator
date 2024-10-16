import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MapScreen from './MapScreen'; // Correct import
import SavedRoutesScreen from './SavedRoutesScreen'; // Correct import
import { RouteProvider } from './RouteContext'; // Correct import

const Stack = createStackNavigator();

export default function App() {
  return (
    <RouteProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Map">
          <Stack.Screen name="Map" component={MapScreen} options={{ title: 'Travel Animator' }} />
          <Stack.Screen name="SavedRoutes" component={SavedRoutesScreen} options={{ title: 'Saved Routes' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </RouteProvider>
  );
}
