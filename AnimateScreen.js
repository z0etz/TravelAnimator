import React, { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Animated, Easing, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRegion, DEFAULT_COORDINATES } from './mapUtils';
import { exportVideo } from './videoExporter';
import Slider from '@react-native-community/slider'; 

const AnimateScreen = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState(DEFAULT_COORDINATES);
  const [sliderValue, setSliderValue] = useState(5000);
  const mapRef = useRef(null);
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const animationIdRef = useRef(0); 

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
        toValue: 1,
        duration: sliderValue, 
        easing: Easing.linear, 
        useNativeDriver: false,
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
      <MapView ref={mapRef} style={styles.map} region={region}>
        <Polyline coordinates={routeCoordinates} strokeColor="#8cb6ff" strokeWidth={5} />
        {markerPosition && (
          <Marker.Animated
            coordinate={markerPosition}
            pinColor="red"
          />
        )}
      </MapView>

      <View style={styles.controlsContainer}>
        {/* Button Container with Equal Widths */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Start Animation" onPress={startAnimation} color="#1d5fc0" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Export Video" onPress={exportVideo} color="#1d5fc0" />
          </View>
        </View>

        {/* Speed Control Slider */}
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderText}>Animation Speed: {Math.round(sliderValue / 1000)}s</Text>
          <Slider
            style={styles.slider}
            minimumValue={1000} // Minimum duration of 1 second
            maximumValue={10000} // Maximum duration of 10 seconds
            value={sliderValue}
            onValueChange={value => setSliderValue(value)} // Update slider value in real-time
            step={500} // Step of 500ms
            minimumTrackTintColor="#1d5fc0"
            maximumTrackTintColor="#dddddd"
            thumbTintColor="#1d5fc0" // Color of the thumb
          />
        </View>
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
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffff', // Background color for better contrast
    borderRadius: 10, // Rounded corners
    padding: 15, // Padding for better spacing
    elevation: 5, // Shadow effect for elevation
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Space between buttons
    marginBottom: 15, // Space between buttons and slider
  },
  buttonWrapper: {
    flex: 1, // Each button will take equal width
    marginHorizontal: 5, // Margin between buttons
  },
  sliderContainer: {
    alignItems: 'center', // Center the text and slider
  },
  sliderText: {
    fontSize: 16,
    color: '#333333', // Text color
    marginBottom: 5, // Space between text and slider
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default AnimateScreen;
