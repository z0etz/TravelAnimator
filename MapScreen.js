import React, { useState, useRef, useEffect } from 'react';
import { View, Button, StyleSheet, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateRegion, DEFAULT_COORDINATES, getDistanceToSegment, formatDate } from './mapUtils';

const MapScreen = ({ navigation }) => {
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const mapRef = useRef(null);
    const [region, setRegion] = useState(DEFAULT_COORDINATES);
    const [quote, setQuote] = useState('');
    const isFocused = useIsFocused();

     useEffect(() => {
        const loadCurrentRoute = async () => {
            setIsDrawing(false);
            try {
                const currentRoute = await AsyncStorage.getItem('currentRoute');
                if (currentRoute) {
                    const coordinates = JSON.parse(currentRoute);
                    console.log("Retrieved coordinates:", coordinates);
                    setRouteCoordinates(coordinates);
                    setRegion(calculateRegion(coordinates));
                }
            } catch (error) {
                console.log('Error loading current route:', error);
            }
        };

        if (isFocused) {
            loadCurrentRoute();
        }
    }, [isFocused]);

    useEffect(() => {
        const loadQuote = async () => {
            const randomQuote = await fetchQuote();
            setQuote(randomQuote);
        };

        if (isFocused) {
            loadQuote();
        }
    }, [isFocused]);

    const saveCurrentRoute = async (coordinates) => {
        if (coordinates) {
            try {
                await AsyncStorage.setItem('currentRoute', JSON.stringify(coordinates));
            } catch (error) {
                console.log('Error saving current route:', error);
            }
        }
    };

    const toggleDrawing = () => {
        setIsDrawing(prev => !prev);
    };

    const clearRoute = () => {
        setRouteCoordinates([]);
        saveCurrentRoute([]);
    };

    const addCoordinate = (coordinate) => {
        console.log("Adding coordinate");
        const updatedRoute = [...routeCoordinates, coordinate];
        setRouteCoordinates(updatedRoute);
        saveCurrentRoute(updatedRoute);
    };

    const removeMarker = (index) => {
        const updatedRoute = routeCoordinates.filter((_, i) => i !== index);
        setRouteCoordinates(updatedRoute);
        saveCurrentRoute(updatedRoute); 
    };

    const handleMarkerDragEnd = (event, index) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const updatedRoute = [...routeCoordinates];
        updatedRoute[index] = { latitude, longitude };
        setRouteCoordinates(updatedRoute);
        saveCurrentRoute(updatedRoute); 
    };

    const handleMapPress = (event) => {
        const pressedCoordinate = {
            latitude: event.nativeEvent.coordinate.latitude,
            longitude: event.nativeEvent.coordinate.longitude,
        };

        if (isDrawing) {
            if (isPolylinePressed(pressedCoordinate)) {
                handlePolylinePress(pressedCoordinate);
            } else {
                addCoordinate(pressedCoordinate);
            }
        }
    };

    const isPolylinePressed = (pressedCoordinate) => {
        const thresholdDistance = 0.01;

        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const start = routeCoordinates[i];
            const end = routeCoordinates[i + 1];
            const distance = getDistanceToSegment(pressedCoordinate, start, end);

            if (distance < thresholdDistance) {
                return true;
            }
        }
        return false;
    };

    const handlePolylinePress = (pressedCoordinate) => {
        console.log("Handling polyline press");
        const newCoordinate = {
            latitude: pressedCoordinate.latitude,
            longitude: pressedCoordinate.longitude,
        };

        let closestSegmentIndex = 0;
        let minDistance = Number.MAX_VALUE;

        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const start = routeCoordinates[i];
            const end = routeCoordinates[i + 1];
            const distance = getDistanceToSegment(newCoordinate, start, end);

            if (distance < minDistance) {
                minDistance = distance;
                closestSegmentIndex = i;
            }
        }

        // Insert the new marker between the two points defining the closest segment
        const updatedRoute = [
            ...routeCoordinates.slice(0, closestSegmentIndex + 1),
            newCoordinate,
            ...routeCoordinates.slice(closestSegmentIndex + 1),
        ];

        setRouteCoordinates(updatedRoute);
        saveCurrentRoute(updatedRoute); 
    };

    const saveRoute = async () => {
        try {
            const existingRoutes = await AsyncStorage.getItem('savedRoutes');
            const routesArray = existingRoutes ? JSON.parse(existingRoutes) : [];

            const routeToSave = {
                coordinates: routeCoordinates,
                savedAt: formatDate(new Date()),
            };

            routesArray.push(routeToSave);
            await AsyncStorage.setItem('savedRoutes', JSON.stringify(routesArray));
            alert('Route saved successfully!');
        } catch (error) {
            console.log('Error saving route:', error);
            alert('Failed to save route. Please try again.'); 
        }
    };

    const fetchQuote = async () => {
        try {
            const response = await fetch('https://zenquotes.io/api/random');
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const data = await response.json();
            const quote = data[0]?.q;
            console.log("Fetched quote:", quote);
            if (quote === "Too many requests. Obtain an auth key for unlimited access.") {
                    return 'To travel is to live.'
            }
            return quote || 'To travel is to live.';
        } catch (error) {
            console.error('Error fetching quote:', error);
            return 'To travel is to live.';
        }
    };
    
    return (
        <View style={styles.container}>
            <Text style={styles.quoteText}>{quote}</Text>
            <MapView
                ref={mapRef}
                style={styles.map}
                region={region}
                onPress={handleMapPress}
            >
                {/* Border Polyline */}
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#1d5fc0"
                    strokeWidth={7}
                />

                {/* Main Polyline */}
                <Polyline
                    coordinates={routeCoordinates}
                    strokeColor="#8cb6ff"
                    strokeWidth={3}
                />
                {routeCoordinates.map((coordinate, index) => (
                    <Marker
                        key={index}
                        coordinate={coordinate}
                        onPress={isDrawing ? () => removeMarker(index) : null}
                        draggable={isDrawing} 
                        onDragEnd={(e) => handleMarkerDragEnd(e, index)}
                        hitSlop={{ top: 0, bottom: 0, left: 0, right: 0 }}
                    >
                        <View style={[styles.marker, { backgroundColor: index === routeCoordinates.length - 1 ? '#ffefc6' : '#addbb5' },
                        { borderColor: index === routeCoordinates.length - 1 ? '#efb836' : '#2d994c' }
                        ]} />
                    </Marker>
                ))}
            </MapView>

            <View style={styles.buttonContainer}>
                <Button title={isDrawing ? 'Stop Drawing' : 'Start Drawing'} onPress={toggleDrawing} color="#1d5fc0" />
                <Button title="Clear Route" onPress={clearRoute} color="#1d5fc0" />
                <Button title="Save Route" onPress={saveRoute} color="#1d5fc0" />
                <Button title="View Saved Routes" onPress={() => navigation.navigate('SavedRoutes')} color="#1d5fc0" />
                <Button title="Animate" onPress={() => navigation.navigate('Animate')} color="#1d5fc0" />
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
    marker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 3,
        opacity: 0.85,
    },
    quoteText: {
        fontSize: 16,
        fontStyle: 'italic',
        textAlign: 'center',
        margin: 7,
    },
});

export default MapScreen;
