import React, { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Animated, Easing } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRegion, DEFAULT_COORDINATES } from './mapUtils';
import { exportVideo } from './videoExporter';

console.log("exportVideo:", exportVideo);

const AnimateScreen = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState(DEFAULT_COORDINATES);
  const mapRef = useRef(null);
  const animatedPosition = useRef(new Animated.Value(0)).current; // Keep animatedPosition as a ref
  const animationIdRef = useRef(0); // Create a ref for animation ID

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
    // Increment animation ID each time a new animation starts
    const newAnimationId = animationIdRef.current + 1;
    animationIdRef.current = newAnimationId; // Update the ref

    // Stop any ongoing animation before starting a new one
    animatedPosition.stopAnimation(() => {
      // Reset the animation value to 0 before starting
      animatedPosition.setValue(0);

      Animated.timing(animatedPosition, {
        toValue: 1, // Animate from 0 (start of route) to 1 (end of route)
        duration: 5000, // Duration of the animation (in milliseconds)
        easing: Easing.linear, // Linear easing to move at constant speed
        useNativeDriver: false, // This should be false since we're animating map coordinates
      }).start(() => {
        // Check if the animation is still the latest one
        console.log("newAnimationId = ", newAnimationId, " animationId = ", animationIdRef.current);
        if (newAnimationId === animationIdRef.current) {
          console.log('Animation finished, waiting 1 second to reset...');
          setTimeout(() => {
            console.log("newAnimationId = ", newAnimationId, " animationId = ", animationIdRef.current);
            if (newAnimationId === animationIdRef.current) { // Check again if it's still the current animation
              animatedPosition.setValue(0); // Reset the animation value to 0 after 1 second
              console.log('Animation reset');
            }
          }, 750); // 750 milliseconds delay
        }
      });
    });
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
        <Button title="Start Animation" onPress={startAnimation} color="#1d5fc0" />
        <Button title="Export Video" onPress={exportVideo} color="#1d5fc0" />
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
    justifyContent: 'space-between', // Ensure buttons are spaced apart
  },
});


export default AnimateScreen;
