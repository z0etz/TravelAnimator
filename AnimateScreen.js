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


const startAnimation = () => {
    const newAnimationId = animationIdRef.current + 1;
    animationIdRef.current = newAnimationId;

    animatedPosition.stopAnimation(() => {
      animatedPosition.setValue(0);

      Animated.timing(animatedPosition, {
        toValue: 1,
        duration: sliderValue, 
        easing: Easing.linear, 
        useNativeDriver: false,
      }).start(() => {
        console.log("newAnimationId = ", newAnimationId, " animationId = ", animationIdRef.current);
        if (newAnimationId === animationIdRef.current) {
          console.log('Animation finished, waiting 1 second to reset...');
          setTimeout(() => {
            console.log("newAnimationId = ", newAnimationId, " animationId = ", animationIdRef.current);
            if (newAnimationId === animationIdRef.current) { 
              animatedPosition.setValue(0);
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
        <View style={styles.buttonContainer}>
          <View style={styles.buttonWrapper}>
            <Button title="Start Animation" onPress={startAnimation} color="#1d5fc0" />
          </View>
          <View style={styles.buttonWrapper}>
            <Button title="Export Video" onPress={exportVideo} color="#1d5fc0" />
          </View>
        </View>
        <View style={styles.sliderContainer}>
          <Text style={styles.sliderText}>Animation Speed: {Math.round(sliderValue / 1000)}s</Text>
          <Slider
            style={styles.slider}
            minimumValue={1000}
            maximumValue={360000}
            value={sliderValue}
            onValueChange={value => setSliderValue(value)}
            step={500} 
            minimumTrackTintColor="#1d5fc0"
            maximumTrackTintColor="#dddddd"
            thumbTintColor="#1d5fc0"
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
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 15, 
    elevation: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  sliderContainer: {
    alignItems: 'center',
  },
  sliderText: {
    fontSize: 12,
    color: '#333333',
  },
  slider: {
    width: '100%',
    height: 20,
  },
});

export default AnimateScreen;
