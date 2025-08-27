import { CameraType, CameraView, useCameraPermissions } from 'expo-camera'
import { ImageManipulator } from 'expo-image-manipulator'
import { cssInterop } from 'nativewind'
import { useRef, useState } from 'react'
import { Button, Pressable, StyleSheet, Text, View } from 'react-native'
const pixelPng = require('react-native-pixel-png')

export default function HomeScreen() {
  const [facing, setFacing] = useState<CameraType>('back')
  const [permission, requestPermission] = useCameraPermissions()
  const ref = useRef<CameraView>(null)

  if (!permission) {
    // Camera permissions are still loading.
    return <View />
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    )
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'))
  }
  async function takePicture() {
    const photo = await ref.current?.takePictureAsync()
    if (!photo) return
    runAIAnalysis(photo!.uri)
  }
  async function runAIAnalysis(photoUri: string) {
    const image = await ImageManipulator.manipulate(photoUri)
      .resize({ width: 224, height: 224 })
      .renderAsync()
    const result = await image.saveAsync()
    const pixels = await pixelPng.parse(result.uri)
    console.log(pixels)
  }

  cssInterop(CameraView, { className: 'style' })
  return (
    <View className="flex flex-col justify-start items-center h-screen w-screen">
      <View className="h-64 mt-4">
        <CameraView style={styles.camera} ref={ref} facing={facing} />
      </View>
      <View className="flex flex-row gap-2">
        <Pressable
          className="bg-green-500 p-4 rounded mt-4 font-bold"
          onPress={takePicture}
        >
          <Text className="text-white font-medium">Take a picture</Text>
        </Pressable>
        <Pressable className="bg-blue-500 p-4 rounded mt-4">
          <Text className="text-white font-medium">Upload from Gallery</Text>
        </Pressable>
      </View>
      <Pressable
        className="bg-gray-500 p-4 rounded mt-4"
        onPress={toggleCameraFacing}
      >
        <Text className="text-white font-medium">Flip Camera</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center'
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10
  },
  camera: {
    flex: 1,
    width: 256,
    height: 256,
    borderRadius: 12,
    overflow: 'hidden'
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 64,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    width: '100%',
    paddingHorizontal: 64
  },
  button: {
    flex: 1,
    alignItems: 'center'
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white'
  }
})
