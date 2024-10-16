import React, { useState, useContext, useRef } from 'react';
import { View, Button, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { RouteContext } from './RouteContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MapScreen = ({ navigation }) => {
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const mapRef = useRef(null);

    const toggleDrawing = () => {
        setIsDrawing(prev => !prev);
        if (isDrawing) {
            setRouteCoordinates([]);
        }
    };

    const addCoordinate = (event) => {
        if (isDrawing) {
            const newCoordinate = {
                latitude: event.nativeEvent.coordinate.latitude,
                longitude: event.nativeEvent.coordinate.longitude,
            };
            setRouteCoordinates(prev => [...prev, newCoordinate]);
        }
    };

    const removeMarker = (index) => {
        const updatedRoute = routeCoordinates.filter((_, i) => i !== index);
        setRouteCoordinates(updatedRoute);
    };

    const handleMarkerDragEnd = (event, index) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        const updatedRoute = [...routeCoordinates];
        updatedRoute[index] = { latitude, longitude };
        setRouteCoordinates(updatedRoute);
    };

    const saveRoute = async () => {
        // Save route to context and async storage
        const { addRoute } = useContext(RouteContext);
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
                ref={mapRef}
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
                {routeCoordinates.map((coordinate, index) => (
                    <Marker
                        key={index}
                        coordinate={coordinate}
                        draggable
                        onPress={() => removeMarker(index)} 
                        onDragEnd={(e) => handleMarkerDragEnd(e, index)}
                    />
                ))}
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
