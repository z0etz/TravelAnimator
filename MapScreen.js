import React, { useState, useContext } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import { RouteContext } from './RouteContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MapScreen = ({ navigation }) => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const { addRoute } = useContext(RouteContext);

  const toggleDrawing = () => {
    setIsDrawing((prev) => !prev);
    if (!isDrawing) {
      setRouteCoordinates([]);
    }
  };

  const addCoordinate = (event) => {
    if (isDrawing) {
      const newCoordinate = {
        latitude: event.nativeEvent.coordinate.latitude,
        longitude: event.nativeEvent.coordinate.longitude,
      };
      setRouteCoordinates((prev) => [...prev, newCoordinate]);
    }
  };

  const saveRoute = async () => {
    addRoute(routeCoordinates);
    try {
      await AsyncStorage.setItem('savedRoute', JSON.stringify(routeCoordinates));
    } catch (error) {
      console.log('Error saving route');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        onPress={addCoordinate}
      >
        <Polyline coordinates={routeCoordinates} strokeColor="blue" strokeWidth={5} />
      </MapView>
      <View style={styles.buttonContainer}>
        <Button title={isDrawing ? 'Stop Drawing' : 'Start Drawing'} onPress={toggleDrawing} />
        <Button title="Save Route" onPress={saveRoute} />
        <Button title="View Saved Routes" onPress={() => navigation.navigate('SavedRoutes')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});

export default MapScreen;
