import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function ForgotPasswordModal({ visible, onClose, email }) {
  const [employeeId, setEmployeeId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    employeeId: false,
    firstName: false,
    lastName: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const resetForm = () => {
    setEmployeeId('');
    setFirstName('');
    setLastName('');
    setNewPassword('');
    setConfirmNewPassword('');
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
    setErrors({
      employeeId: false,
      firstName: false,
      lastName: false,
      newPassword: false,
      confirmNewPassword: false,
    });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
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
      return;
    }

    if (newPassword.length < 6) {
      setErrors(prev => ({ ...prev, newPassword: true }));
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrors(prev => ({ ...prev, confirmNewPassword: true }));
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}?endpoint=forgot-password`, {
        email: email.trim().toLowerCase(),
        employeeId: employeeId.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        newPassword: newPassword,
      });

      if (response.data.success) {
        alert('Password reset successfully! Please login with your new password.');
        handleClose();
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      if (error.response && error.response.data.message.includes('credentials')) {
        setErrors({
          employeeId: true,
          firstName: true,
          lastName: true,
          newPassword: false,
          confirmNewPassword: false,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        
        <View style={styles.modalContainer}>
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>Reset Password</Text>
                <Text style={styles.subtitle}>Verify your account details</Text>
              </View>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close-circle" size={28} color="#718096" />
              </TouchableOpacity>
            </View>

            <View style={styles.emailBox}>
              <Ionicons name="mail" size={20} color="#0A7EB1" />
              <Text style={styles.emailText}>{email}</Text>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Employee ID</Text>
              <View style={[styles.inputContainer, errors.employeeId && styles.inputError]}>
                <Ionicons name="card-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your Employee ID"
                  placeholderTextColor="#A0AEC0"
                  value={employeeId}
                  onChangeText={(text) => {
                    setEmployeeId(text);
                    setErrors(prev => ({ ...prev, employeeId: false }));
                  }}
                  editable={!loading}
                  keyboardType="numeric"
                />
              </View>

              <Text style={styles.label}>First Name</Text>
              <View style={[styles.inputContainer, errors.firstName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your first name"
                  placeholderTextColor="#A0AEC0"
                  value={firstName}
                  onChangeText={(text) => {
                    setFirstName(text);
                    setErrors(prev => ({ ...prev, firstName: false }));
                  }}
                  editable={!loading}
                />
              </View>

              <Text style={styles.label}>Last Name</Text>
              <View style={[styles.inputContainer, errors.lastName && styles.inputError]}>
                <Ionicons name="person-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your last name"
                  placeholderTextColor="#A0AEC0"
                  value={lastName}
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors(prev => ({ ...prev, lastName: false }));
                  }}
                  editable={!loading}
                />
              </View>

              <Text style={styles.label}>New Password</Text>
              <View style={[styles.inputContainer, errors.newPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#A0AEC0"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    setErrors(prev => ({ ...prev, newPassword: false }));
                  }}
                  secureTextEntry={!showNewPassword}
                  editable={!loading}
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

              <Text style={styles.label}>Confirm Password</Text>
              <View style={[styles.inputContainer, errors.confirmNewPassword && styles.inputError]}>
                <Ionicons name="lock-closed-outline" size={20} color="#0A7EB1" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#A0AEC0"
                  value={confirmNewPassword}
                  onChangeText={(text) => {
                    setConfirmNewPassword(text);
                    setErrors(prev => ({ ...prev, confirmNewPassword: false }));
                  }}
                  secureTextEntry={!showConfirmNewPassword}
                  editable={!loading}
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
              style={[styles.button, loading && styles.buttonDisabled]} 
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FEFDFD" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Reset Password</Text>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FEFDFD" />
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleClose}
              disabled={loading}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  scrollContent: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#105891',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#718096',
  },
  closeButton: {
    padding: 4,
  },
  emailBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  emailText: {
    fontSize: 15,
    color: '#0A7EB1',
    fontWeight: '600',
    marginLeft: 10,
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
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
  inputError: {
    borderColor: '#F56565',
    borderWidth: 2,
    backgroundColor: '#FFF5F5',
  },
  button: {
    backgroundColor: '#0A7EB1',
    borderRadius: 12,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
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
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#718096',
    fontSize: 15,
    fontWeight: '500',
  },
});