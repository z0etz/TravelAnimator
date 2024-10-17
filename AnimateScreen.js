import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const AnimateScreen = () => {
    return (
        <View style={styles.container}>
            <Text>Animation Screen</Text>
            {/* Add your animation logic here */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default AnimateScreen;
