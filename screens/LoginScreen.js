import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [errors, setErrors] = useState({
    employeeId: false,
    firstName: false,
    lastName: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  
  const { login } = useAuth();

  const handleLogin = async () => {
    // Validate input
    if (!email || !password) {
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}?endpoint=login`, {
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (response.data.success) {
        // Save user data using auth context
        await login(response.data.user);
        
        // Clear form
        setEmail('');
        setPassword('');
        
        // Navigation will happen automatically via AuthContext
      }
    } catch (error) {
      console.error('Login error:', error);
      
      if (error.response) {
        Alert.alert('Error', error.response.data.message || 'Login failed');
      } else if (error.request) {
        Alert.alert('Error', 'Cannot connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const openForgotPasswordModal = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    setForgotEmail(email);
    setShowForgotModal(true);
  };

  const handleForgotPassword = async () => {
    // Reset errors
    setErrors({
      employeeId: false,
      firstName: false,
      lastName: false,
      newPassword: false,
      confirmNewPassword: false,
    });

    // Validate input
    if (!employeeId || !firstName || !lastName || !newPassword || !confirmNewPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrors(prev => ({ ...prev, confirmNewPassword: true }));
      return;
    }

    if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, newPassword: true }));
      return;
    }

    setForgotLoading(true);

    try {
      const response = await axios.post(`${API_URL}?endpoint=forgot-password`, {
        email: forgotEmail.trim().toLowerCase(),
        employeeId: employeeId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        newPassword: newPassword,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Password reset successfully! Please login with your new password.');
        
        // Close modal and clear form
        setShowForgotModal(false);
        setEmployeeId('');
        setFirstName('');
        setLastName('');
        setNewPassword('');
        setConfirmNewPassword('');
        setPassword('');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response) {
        // Set error borders for incorrect credentials
        if (error.response.data.message.includes('credentials')) {
          setErrors({
            employeeId: true,
            firstName: true,
            lastName: true,
            newPassword: false,
            confirmNewPassword: false,
          });
        }
      } else if (error.request) {
        Alert.alert('Error', 'Cannot connect to server. Please check your internet connection.');
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setShowForgotModal(false);
    setEmployeeId('');
    setFirstName('');
    setLastName('');
    setNewPassword('');
    setConfirmNewPassword('');
    setErrors({
      employeeId: false,
      firstName: false,
      lastName: false,
      newPassword: false,
      confirmNewPassword: false,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          <View style={styles.logoRow}>
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
          </View>
          <Text style={styles.tagline}>Streamline attendance, track time effortlessly</Text>
        </View>

        <View style={styles.cardContainer}>
          <View style={styles.card}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Sign in to continue</Text>
            </View>

            <View style={styles.inputWrapper}>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#A0AEC0"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#A0AEC0"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons 
                    name={showPassword ? "eye-outline" : "eye-off-outline"} 
                    size={20} 
                    color="#A0AEC0" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FEFDFD" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FEFDFD" style={styles.buttonIcon} />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={openForgotPasswordModal}
              disabled={loading}
              style={styles.forgotPasswordButton}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate('Signup')}
                disabled={loading}
              >
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Forgot Password Modal */}
        <Modal
          visible={showForgotModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeForgotModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContainer}>
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Reset Password</Text>
                  <TouchableOpacity onPress={closeForgotModal} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#2D3748" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalMessage}>
                  Forgot your password for{'\n'}
                  <Text style={styles.emailHighlight}>{forgotEmail}</Text>?
                </Text>
                <Text style={styles.modalSubtext}>
                  Please verify your account details to reset your password
                </Text>

                <View style={styles.modalInputWrapper}>
                  <View style={[styles.inputContainer, errors.employeeId && styles.inputError]}>
                    <Ionicons name="card-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Employee ID"
                      placeholderTextColor="#A0AEC0"
                      value={employeeId}
                      onChangeText={(text) => {
                        setEmployeeId(text);
                        setErrors(prev => ({ ...prev, employeeId: false }));
                      }}
                      editable={!forgotLoading}
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="First Name"
                      placeholderTextColor="#A0AEC0"
                      value={firstName}
                      onChangeText={(text) => {
                        setFirstName(text);
                        setErrors(prev => ({ ...prev, firstName: false }));
                      }}
                      editable={!forgotLoading}
                    />
                  </View>

                  <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                    <Ionicons name="person-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Last Name"
                      placeholderTextColor="#A0AEC0"
                      value={lastName}
                      onChangeText={(text) => {
                        setLastName(text);
                        setErrors(prev => ({ ...prev, lastName: false }));
                      }}
                      editable={!forgotLoading}
                    />
                  </View>

                  <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="New Password (min 6 characters)"
                      placeholderTextColor="#A0AEC0"
                      value={newPassword}
                      onChangeText={(text) => {
                        setNewPassword(text);
                        setErrors(prev => ({ ...prev, newPassword: false }));
                      }}
                      secureTextEntry={!showNewPassword}
                      editable={!forgotLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowNewPassword(!showNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#A0AEC0" 
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputContainer, errors.confirmNewPassword && styles.inputError]}>
                    <Ionicons name="lock-closed-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm New Password"
                      placeholderTextColor="#A0AEC0"
                      value={confirmNewPassword}
                      onChangeText={(text) => {
                        setConfirmNewPassword(text);
                        setErrors(prev => ({ ...prev, confirmNewPassword: false }));
                      }}
                      secureTextEntry={!showConfirmNewPassword}
                      editable={!forgotLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      style={styles.eyeIcon}
                    >
                      <Ionicons 
                        name={showConfirmNewPassword ? "eye-outline" : "eye-off-outline"} 
                        size={20} 
                        color="#A0AEC0" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity 
                  style={[styles.button, forgotLoading && styles.buttonDisabled]} 
                  onPress={handleForgotPassword}
                  disabled={forgotLoading}
                  activeOpacity={0.8}
                >
                  {forgotLoading ? (
                    <ActivityIndicator color="#FEFDFD" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>Reset Password</Text>
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FEFDFD" style={styles.buttonIcon} />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={closeForgotModal}
                  disabled={forgotLoading}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FEFDFD',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 30,
  },
  topSection: {
    paddingHorizontal: 24,
    marginBottom: 30,
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  logoText: {
    width: 140,
    height: 32,
  },
  tagline: {
    fontSize: 14,
    color: '#718096',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  cardContainer: {
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  headerContainer: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#105891',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D3748',
  },
  eyeIcon: {
    padding: 4,
  },
  button: {
    backgroundColor: '#0A7EB1',
    borderRadius: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#0A7EB1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#A0C4D8',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#FEFDFD',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    color: '#A0AEC0',
    paddingHorizontal: 16,
    fontSize: 13,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#718096',
    fontSize: 14,
  },
  signupLink: {
    color: '#0A7EB1',
    fontSize: 14,
    fontWeight: '600',
  },
});