import { captureRef } from 'react-native-view-shot'; // Ensure this package is installed
import * as FileSystem from 'expo-file-system'; // Use expo-file-system for file operations
import { PermissionsAndroid } from 'react-native'; // For permissions on Android

const requestPermission = async () => {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: "Storage Permission",
        message: "This app needs access to your storage to save the video.",
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
};

export const exportVideo = async (viewRef) => {
  const permissionGranted = await requestPermission();
  if (!permissionGranted) {
    console.log("Storage permission denied");
    return;
  }

  try {
    const uri = await captureRef(viewRef, {
      format: 'png',
      quality: 1,
      result: 'tmpfile',
    });

    console.log("Image saved to:", uri);

    // Use expo-file-system to save the video
    const filePath = `${FileSystem.documentDirectory}myAnimatedRoute.mp4`;
    // Logic to save the video to filePath

    return filePath; // Return the file path
  } catch (error) {
    console.error("Error exporting video:", error);
  }
};
