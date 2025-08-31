import { CameraView } from 'expo-camera'
import { cssInterop } from 'nativewind'
import { useEffect, useRef, useState } from 'react'
import { Button, Pressable, StyleSheet, Text, View } from 'react-native'
import { useTensorflowModel } from 'react-native-fast-tflite'
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor
} from 'react-native-vision-camera'
import { useSharedValue } from 'react-native-worklets-core'
import { useResizePlugin } from 'vision-camera-resize-plugin'

export default function HomeScreen() {
  const device = useCameraDevice('front')
  const { hasPermission, requestPermission } = useCameraPermission()
  const predictedAge = useSharedValue<string>('0')
  const ageConfidence = useSharedValue<number>(0)
  const predictedGender = useSharedValue<string>('0')
  const genderConfidence = useSharedValue<number>(0)
  const predictedEmotion = useSharedValue<string>('0')
  const emotionConfidence = useSharedValue<number>(0)
  const emotionLabels = [
    'Angry',
    'Disgust',
    'Fear',
    'Happy',
    'Sad',
    'Surprise',
    'Neutral'
  ]

  const ref = useRef<Camera>(null)

  const ageDetection = useTensorflowModel(
    require('@/assets/models/age_model.tflite')
  )
  const emotionDetection = useTensorflowModel(
    require('@/assets/models/emotion_model.tflite')
  )
  const genderDetection = useTensorflowModel(
    require('@/assets/models/gender_model.tflite')
  )
  const ageModel = ageDetection.state === 'loaded' ? ageDetection.model : null
  const emotionModel =
    emotionDetection.state === 'loaded' ? emotionDetection.model : null
  const genderModel =
    genderDetection.state === 'loaded' ? genderDetection.model : null

  const { resize } = useResizePlugin()

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet'
      if (!ageModel) return
      if (!genderModel) return
      const resized = resize(frame, {
        scale: {
          width: 224,
          height: 224
        },
        pixelFormat: 'rgb',
        dataType: 'float32'
      })

      const ageOutput = ageModel.runSync([resized])
      const genderOutput = genderModel.runSync([resized])

      // Find the age with the highest confidence
      const ageScores = ageOutput[0]
      const [predictedAgeV, confidence] = Object.entries(ageScores).reduce(
        (max, [age, score]) => (score > max[1] ? [age, score] : max),
        ['', -Infinity]
      )
      console.log(
        `Predicted age: ${predictedAgeV}, Confidence: ${(
          confidence * 100
        ).toFixed(2)}%`
      )
      predictedAge.value = predictedAgeV
      ageConfidence.value = confidence

      // Find the gender with the highest confidence
      const genderScores = genderOutput[0]
      const [predictedGenderV, genderConfidenceV] = Object.entries(
        genderScores
      ).reduce(
        (max, [gender, score]) => (score > max[1] ? [gender, score] : max),
        ['', -Infinity]
      )
      console.log(
        `Predicted gender: ${predictedGenderV}, Confidence: ${(
          genderConfidenceV * 100
        ).toFixed(2)}%`
      )
      predictedGender.value = predictedGenderV
      genderConfidence.value = genderConfidenceV

      if (!emotionModel) return
      // Resize for emotion model
      const emotionResized = resize(frame, {
        scale: {
          width: 48,
          height: 48
        },
        pixelFormat: 'rgb',
        dataType: 'float32'
      })

      // Convert RGB to grayscale
      const rgbData = emotionResized
      // Ensure grayscaleData is 48*48*1 shape
      const grayscaleData = new Float32Array(48 * 48 * 1)
      for (let i = 0; i < 48 * 48; i++) {
        const r = rgbData[i * 3]
        const g = rgbData[i * 3 + 1]
        const b = rgbData[i * 3 + 2]
        grayscaleData[i] = 0.299 * r + 0.587 * g + 0.114 * b
      }
      const emotionOutput = emotionModel.runSync([grayscaleData])
      // Find the emotion with the highest confidence
      const emotionScores = emotionOutput[0]
      const [predictedEmotionV, emotionConfidenceV] = Object.entries(
        emotionScores
      ).reduce(
        (max, [emotion, score]) => (score > max[1] ? [emotion, score] : max),
        ['', -Infinity]
      )
      console.log(
        `Predicted emotion: ${predictedEmotionV}, Confidence: ${(
          emotionConfidenceV * 100
        ).toFixed(2)}%`
      )
      predictedEmotion.value = predictedEmotionV
      emotionConfidence.value = emotionConfidenceV
    },
    [
      ageModel,
      emotionModel,
      genderModel,
      predictedAge,
      ageConfidence,
      predictedGender,
      genderConfidence,
      predictedEmotion,
      emotionConfidence
    ]
  )
  const [age, setAge] = useState<string>('0')
  const [ageConf, setAgeConf] = useState<number>(0)
  const [gender, setGender] = useState<string>('0')
  const [genderConf, setGenderConf] = useState<number>(0)
  const [emotion, setEmotion] = useState<string>('0')
  const [emotionConf, setEmotionConf] = useState<number>(0)

  useEffect(() => {
    const id = setInterval(() => {
      setAge(predictedAge.value)
      setAgeConf(ageConfidence.value)
      setGender(predictedGender.value)
      setGenderConf(genderConfidence.value)
      setEmotion(predictedEmotion.value)
      setEmotionConf(emotionConfidence.value)
    }, 100)
    return () => clearInterval(id)
  }, [
    ageConfidence.value,
    emotionConfidence.value,
    genderConfidence.value,
    predictedAge.value,
    predictedGender.value,
    predictedEmotion.value
  ])

  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    )
  }

  cssInterop(CameraView, { className: 'style' })
  if (device == null) return <View />
  return (
    <View className="flex flex-col justify-start items-center h-screen w-screen">
      <View className="h-64 mt-4">
        <Camera
          device={device}
          isActive={true}
          style={styles.camera}
          photo={true}
          ref={ref}
          frameProcessor={frameProcessor}
        />
      </View>
      <View className="flex flex-row gap-2">
        <Pressable className="bg-blue-500 p-4 rounded mt-4">
          <Text className="text-white font-medium">Upload from Gallery</Text>
        </Pressable>
      </View>
      <View className="bg-white rounded-lg p-4 m-4 w-11/12">
        <Text className="font-bold text-2xl mb-2">Predictions:</Text>
        {ageDetection.state !== 'loaded' ||
        genderDetection.state !== 'loaded' ||
        emotionDetection.state !== 'loaded' ? (
          <Text>Loading...</Text>
        ) : (
          <View>
            <Text>
              Predicted Age: {age}, Confidence:{' '}
              {(ageConf * 100)?.toFixed(2) + '%'}
            </Text>
            <Text>
              Predicted Gender: {gender === '0' ? 'Woman' : 'Man'}, Confidence:{' '}
              {(genderConf * 100)?.toFixed(2) + '%'}
            </Text>
            <Text>
              Predicted Emotion: {emotionLabels[Number(emotion)]}, Confidence:{' '}
              {(emotionConf * 100)?.toFixed(2) + '%'}
            </Text>
          </View>
        )}
      </View>
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
