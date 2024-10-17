import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SavedRoutesScreen = ({ navigation }) => {
    const [savedRoutes, setSavedRoutes] = useState([]);
    const [editingIndex, setEditingIndex] = useState(null); // Index of the route being edited
    const [newRouteName, setNewRouteName] = useState(''); // New name for the route

    useEffect(() => {
        const loadSavedRoutes = async () => {
            try {
                const routes = await AsyncStorage.getItem('savedRoutes');
                if (routes) {
                    setSavedRoutes(JSON.parse(routes));
                }
            } catch (error) {
                console.log('Error loading saved routes:', error);
            }
        };

        loadSavedRoutes();
    }, []);

    const loadRoute = async (route) => {
        await AsyncStorage.setItem('currentRoute', JSON.stringify(route.coordinates));
        navigation.navigate('Map', { route });
    };

    const deleteRoute = async (index) => {
        const updatedRoutes = savedRoutes.filter((_, i) => i !== index);
        await AsyncStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
        setSavedRoutes(updatedRoutes);
    };

    const startEditing = (index, currentName) => {
        setEditingIndex(index);
        setNewRouteName(currentName || `Route ${index + 1}`);
    };

    const saveRouteName = async (index) => {
        const updatedRoutes = [...savedRoutes];
        updatedRoutes[index].name = newRouteName.trim() || `Route ${index + 1}`; // Update route name or set default name if empty
        await AsyncStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
        setSavedRoutes(updatedRoutes);
        setEditingIndex(null);
        setNewRouteName('');
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={savedRoutes}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item, index }) => (
                    <View style={styles.routeItem}>
                        <View style={styles.routeTextContainer}>
                        {editingIndex === index ? (
                                <TextInput
                                    style={styles.input}
                                    value={newRouteName}
                                    onChangeText={setNewRouteName}
                                    onSubmitEditing={() => saveRouteName(index)}
                                    autoFocus
                                    placeholder="Enter new route name"
                                />
                            ) : (
                                <TouchableOpacity onPress={() => startEditing(index, item.name)}>
                                    <Text style={styles.routeText}>
                                        {item.name || `Route ${index + 1}`} - {item.coordinates.length} points
                                    </Text>
                                    <Text style={styles.savedAtText}>{item.savedAt}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        <View style={styles.buttonContainer}>
                            <Button title="Load" onPress={() => loadRoute(item)} />
                            <Button title="Delete" onPress={() => deleteRoute(index)} />
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    routeItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
    },
    routeTextContainer: {
        flex: 1,  // Allows the text container to take up available space
        marginRight: 10, // Adds space between text and buttons
    },
    routeText: {
        flex: 1, // Ensures text wraps properly if too long
        flexWrap: 'wrap', 
        marginRight: 10, // Adds space between text and buttons
    },
    savedAtText: {
        fontSize: 12,
        color: '#555',
    },
    buttonContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginBottom: 10,
        borderRadius: 4,
    },
});

export default SavedRoutesScreen;
