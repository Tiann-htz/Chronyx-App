import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const scanLinePosition = useRef(new Animated.Value(-100)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animations
    Animated.sequence([
      // Fade in logos
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Wait a bit
      Animated.delay(300),
      // Scanning animation
      Animated.timing(scanLinePosition, {
        toValue: height + 100,
        duration: 1500,
        useNativeDriver: true,
      }),
      // Wait before finishing
      Animated.delay(300),
    ]).start(() => {
      // Call onFinish when animation completes
      if (onFinish) {
        onFinish();
      }
    });
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <Animated.View style={[styles.logoContainer, { opacity: logoOpacity }]}>
        <Image
          source={require('../assets/images/chronyxlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/chronyxtext.png')}
          style={styles.logoText}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Scanning Line Effect */}
      <Animated.View
        style={[
          styles.scanLine,
          {
            transform: [{ translateY: scanLinePosition }],
          },
        ]}
      >
        <View style={styles.scanLineGradient} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginRight: 16,
  },
  logoText: {
    width: 180,
    height: 50,
  },
  scanLine: {
    position: 'absolute',
    width: '100%',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLineGradient: {
    width: '100%',
    height: 3,
    backgroundColor: '#0A7EB1',
    shadowColor: '#0A7EB1',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 5,
  },
});