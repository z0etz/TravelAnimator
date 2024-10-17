import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RouteContext } from './RouteContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_COORDINATES = {
    latitude: 59.3293,
    longitude: 18.0686,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
};

const MapScreen = ({ navigation }) => {
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const mapRef = useRef(null);
    const [region, setRegion] = useState(DEFAULT_COORDINATES);

     // Load the current route when the app is opened
     useEffect(() => {
        const loadCurrentRoute = async () => {
            setIsDrawing(false)
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

        loadCurrentRoute();

        // Listen for focus events on the screen
        const unsubscribe = navigation.addListener('focus', loadCurrentRoute);

        // Automatically save the current route when the component unmounts
        return () => {
            saveCurrentRoute();
        };
    }, []);

    // Save the current route to AsyncStorage
    const saveCurrentRoute = async (coordinates) => {
        if (coordinates) { // Check if coordinates are valid
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
        const thresholdDistance = 0.01; // Adjust the proximity threshold as needed

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

        // Find the closest segment
        let closestSegmentIndex = 0;
        let minDistance = Number.MAX_VALUE;

        for (let i = 0; i < routeCoordinates.length - 1; i++) {
            const start = routeCoordinates[i];
            const end = routeCoordinates[i + 1];

            // Calculate the distance from the pressed point to the line segment
            const distance = getDistanceToSegment(newCoordinate, start, end);

            if (distance < minDistance) {
                minDistance = distance;
                closestSegmentIndex = i; // Segment index before which we should insert
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

    const getDistanceToSegment = (point, start, end) => {
        const x0 = point.latitude;
        const y0 = point.longitude;
        const x1 = start.latitude;
        const y1 = start.longitude;
        const x2 = end.latitude;
        const y2 = end.longitude;

        const A = x0 - x1;
        const B = y0 - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        const param = lenSq !== 0 ? dot / lenSq : -1;

        let xx, yy;

        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = x0 - xx;
        const dy = y0 - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const formatDate = (date) => {
        const day = String(date.getDate()).padStart(2, '0'); // Day
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month (0-indexed)
        const year = String(date.getFullYear()).slice(-2); // Last two digits of the year
        const hours = String(date.getHours()).padStart(2, '0'); // Hours
        const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutes
    
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
    };

    const calculateRegion = (coordinates) => {
        if (!Array.isArray(coordinates) || coordinates.length === 0) {
            console.log("Cordinates empty", coordinates);
            return DEFAULT_COORDINATES;
        }
    
        const latitudes = coordinates.map(coord => coord.latitude);
        const longitudes = coordinates.map(coord => coord.longitude);
    
        const latitudeDelta = Math.max(...latitudes) - Math.min(...latitudes) + 0.1; // Adding padding
        const longitudeDelta = Math.max(...longitudes) - Math.min(...longitudes) + 0.1;
    
        const centerLatitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2;
        const centerLongitude = (Math.max(...longitudes) + Math.min(...longitudes)) / 2;
    
        const calculatedRegion = {
            latitude: centerLatitude,
            longitude: centerLongitude,
            latitudeDelta,
            longitudeDelta,
        };
        
        console.log("Calculated region:", calculatedRegion);
    
        return calculatedRegion;
    };

    const saveRoute = async () => {
        try {
            const existingRoutes = await AsyncStorage.getItem('savedRoutes');
            const routesArray = existingRoutes ? JSON.parse(existingRoutes) : [];

            const routeToSave = {
                coordinates: routeCoordinates,
                savedAt: formatDate(new Date()),
            };

            // Add the current route to the saved routes
            routesArray.push(routeToSave);
            await AsyncStorage.setItem('savedRoutes', JSON.stringify(routesArray));
            alert('Route saved successfully!'); // Notify the user of success
        } catch (error) {
            console.log('Error saving route:', error);
            alert('Failed to save route. Please try again.'); 
        }
    };

    return (
        <View style={styles.container}>
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
                <Button title={isDrawing ? 'Stop Drawing' : 'Start Drawing'} onPress={toggleDrawing} />
                <Button title="Clear Route" onPress={clearRoute} />
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
    marker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        borderWidth: 3,
        opacity: 0.85,
    },
});

export default MapScreen;
