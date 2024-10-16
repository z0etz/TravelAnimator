import React, { useContext } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { RouteContext } from './RouteContext';

const SavedRoutesScreen = () => {
  const { routes } = useContext(RouteContext); // Access saved routes

  return (
    <View style={styles.container}>
      {routes.length === 0 ? (
        <Text style={styles.text}>No saved routes</Text>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <Text style={styles.text}>Route {index + 1} with {item.length} points</Text>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});

export default SavedRoutesScreen;
