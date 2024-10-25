import React, { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Animated, Easing, Text, Dimensions, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRegion, DEFAULT_COORDINATES } from './mapUtils';
import { exportVideo } from './videoExporter';
import Slider from '@react-native-community/slider'; 
import { Picker } from '@react-native-picker/picker';

const AnimateScreen = () => {
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [region, setRegion] = useState(DEFAULT_COORDINATES);
  const [sliderValue, setSliderValue] = useState(5000);
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const mapRef = useRef(null);
  const animatedPosition = useRef(new Animated.Value(0)).current;
  const animationIdRef = useRef(0);
  const [markerAngle, setMarkerAngle] = useState(0);

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

  const getMapHeight = () => {
    switch (aspectRatio) {
      case '9:16':
        return (deviceWidth / 9) * 16;
      case '3:2':
        return (deviceWidth / 3) * 2;
      case '1:1':
        return deviceWidth;
      default:
        return (deviceWidth / 9) * 16;
    }
  };

  useEffect(() => {
    if (routeCoordinates.length > 0) {
      const newRegion = calculateRegion(routeCoordinates);
      setRegion(newRegion);
    }
  }, [aspectRatio, routeCoordinates]);

  const { width: deviceWidth } = Dimensions.get('window');

  const interpolatePosition = () => {
    if (routeCoordinates.length === 0) return null;

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
        if (newAnimationId === animationIdRef.current) {
          setTimeout(() => {
            if (newAnimationId === animationIdRef.current) {
              animatedPosition.setValue(0);
            }
          }, 750);
        }
      });
    });
  };

  const calculateAngle = (currentCoord, nextCoord) => {
    const deltaLong = nextCoord.longitude - currentCoord.longitude;
    const deltaLat = nextCoord.latitude - currentCoord.latitude;
  
    const angleRadians = Math.atan2(deltaLong, deltaLat);
    const angleDegrees = (angleRadians * (180 / Math.PI) + 360) % 360;

    return angleDegrees;
  };
  
  const markerPosition = interpolatePosition();

  useEffect(() => {
    if (markerPosition && routeCoordinates.length > 1) {
      animatedPosition.addListener(({ value }) => {
        const currentIndex = value * (routeCoordinates.length - 1);
        const nextIndex = Math.min(Math.floor(currentIndex + 1), routeCoordinates.length - 1);
        
        const currentCoord = routeCoordinates[Math.floor(currentIndex)];
        const nextCoord = routeCoordinates[nextIndex];

        if (currentCoord && nextCoord) {
          const angle = calculateAngle(currentCoord, nextCoord);
          setMarkerAngle(angle);
        }
      });
    }

    return () => {
      animatedPosition.removeAllListeners();
    };
  }, [animatedPosition, routeCoordinates]);

  return (
    <View style={styles.container}>
      <MapView ref={mapRef} style={[styles.map, { height: getMapHeight() }]} region={region}>
        <Polyline coordinates={routeCoordinates} strokeColor="#8cb6ff" strokeWidth={3} />

        {markerPosition && (
          <Marker.Animated coordinate={markerPosition} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.markerContainer}>
              <Image
                source={require('./assets/blue_van.png')}
                style={{
                  width: 50, 
                  height: 50,
                  padding: 10,
                  transform: [{ rotate: `${markerAngle}deg` }],
                }}
                resizeMode="contain"
              />
            </View>
          </Marker.Animated>
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
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerLabel}>Aspect Ratio</Text>
          <Picker
            selectedValue={aspectRatio}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            onValueChange={(itemValue) => setAspectRatio(itemValue)}
          >
            <Picker.Item label="Portrait (9:16)" value="9:16" />
            <Picker.Item label="Landscape (3:2)" value="3:2" />
            <Picker.Item label="Square (1:1)" value="1:1" />
          </Picker>
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
    width: '100%',
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
  pickerContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  pickerLabel: {
    fontSize: 12,
    color: '#333333',
  },
  picker: {
    width: '80%',
    height: 40,
  },
  pickerItem: {
    fontSize: 12,
    height: 20,
  },
});

export default AnimateScreen;
