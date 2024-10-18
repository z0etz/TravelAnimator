import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRegion, DEFAULT_COORDINATES, getDistanceToSegment, formatDate } from './mapUtils';

const AnimateScreen = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [animatedPosition] = useState(new Animated.Value(0)); // Controls the animation progress (0 to 1)
  const [region, setRegion] = useState(DEFAULT_COORDINATES);

  useEffect(() => {
    const loadCurrentRoute = async () => {
      try {
        const currentRoute = await AsyncStorage.getItem('currentRoute');
        if (currentRoute) {
          const coordinates = JSON.parse(currentRoute);
          setRouteCoordinates(coordinates);
          setRegion(calculateRegion(coordinates));
        }
      } catch (error) {
        console.log('Error loading current route:', error);
      }
    };

    loadCurrentRoute();
  }, []);

  // Function to interpolate the animated marker position along the route
  const interpolatePosition = () => {
    if (routeCoordinates.length === 0) return null;
    
    // Use the animated value to interpolate the position between points
    const inputRange = routeCoordinates.map((_, index) => index / (routeCoordinates.length - 1));
    const latitude = animatedPosition.interpolate({
      inputRange,
      outputRange: routeCoordinates.map(point => point.latitude),
    });
    const longitude = animatedPosition.interpolate({
      inputRange,
      outputRange: routeCoordinates.map(point => point.longitude),
    });

    return { latitude, longitude };
  };

  // Start the animation
  const startAnimation = () => {
    Animated.timing(animatedPosition, {
      toValue: 1, // Animate from 0 (start of route) to 1 (end of route)
      duration: 5000, // Duration of the animation (in milliseconds)
      easing: Easing.linear, // Linear easing to move at constant speed
      useNativeDriver: false, // This should be false since we're animating map coordinates
    }).start();
  };

  const markerPosition = interpolatePosition();

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region}>
        {/* Polyline showing the route */}
        <Polyline coordinates={routeCoordinates} strokeColor="#8cb6ff" strokeWidth={5} />

        {/* Marker that moves along the route */}
        {markerPosition && (
          <Marker.Animated
            coordinate={markerPosition}
            pinColor="red" // You can replace this with a car icon or something similar later
          />
        )}
      </MapView>

      <View style={styles.buttonContainer}>
        <Text onPress={startAnimation} style={styles.buttonText}>Start Animation</Text>
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
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    backgroundColor: '#1d5fc0',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
  },
});

export default AnimateScreen;
