import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function MyAccountScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowSidebar(true)}
        >
          <Ionicons name="menu" size={28} color="#ffffff" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data when canceling
      setFormData({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
      });
    }
    setIsEditing(!isEditing);
  };

  const handleUpdateProfile = async () => {
    // Validate input
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}?endpoint=update-profile`, {
        userId: user.id,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      });

      if (response.data.success) {
        // Update local user context
        await updateUser({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
        });

        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validate passwords
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('Error', 'All password fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}?endpoint=change-password`, {
        userId: user.id,
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setShowPasswords({ current: false, new: false, confirm: false });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Profile Information Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="person-circle" size={28} color="#1a365d" />
                <Text style={styles.cardTitle}>Profile Information</Text>
              </View>
              <TouchableOpacity
                onPress={handleEditToggle}
                style={styles.editButton}
              >
                <Ionicons
                  name={isEditing ? 'close-circle' : 'pencil'}
                  size={24}
                  color={isEditing ? '#ef4444' : '#1a365d'}
                />
              </TouchableOpacity>
            </View>

            {/* Employee ID (Read-only) */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Employee ID</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.valueReadOnly}>{user?.id}</Text>
              </View>
            </View>

            {/* First Name */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>First Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.firstName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, firstName: text })
                  }
                  placeholder="Enter first name"
                />
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{user?.firstName}</Text>
                </View>
              )}
            </View>

            {/* Last Name */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Name</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.lastName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, lastName: text })
                  }
                  placeholder="Enter last name"
                />
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{user?.lastName}</Text>
                </View>
              )}
            </View>

            {/* Email */}
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email</Text>
              {isEditing ? (
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              ) : (
                <View style={styles.valueContainer}>
                  <Text style={styles.value}>{user?.email}</Text>
                </View>
              )}
            </View>

            {/* Update Button */}
            {isEditing && (
              <TouchableOpacity
                style={styles.updateButton}
                onPress={handleUpdateProfile}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    <Text style={styles.updateButtonText}>Update Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Security Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="shield-checkmark" size={28} color="#1a365d" />
                <Text style={styles.cardTitle}>Security</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowPasswordModal(true)}
            >
              <View style={styles.actionButtonLeft}>
                <Ionicons name="key" size={22} color="#1a365d" />
                <Text style={styles.actionButtonText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Account Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Ionicons name="information-circle" size={28} color="#1a365d" />
                <Text style={styles.cardTitle}>Account Information</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="calendar" size={20} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>Account active</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="time" size={20} color="#64748b" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Last Updated</Text>
                <Text style={styles.infoValue}>Profile information synced</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                  });
                  setShowPasswords({ current: false, new: false, confirm: false });
                }}
              >
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Current Password */}
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, currentPassword: text })
                  }
                  placeholder="Enter current password"
                  secureTextEntry={!showPasswords.current}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, current: !showPasswords.current })
                  }
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPasswords.current ? 'eye-off' : 'eye'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* New Password */}
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, newPassword: text })
                  }
                  placeholder="Enter new password (min. 6 characters)"
                  secureTextEntry={!showPasswords.new}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, new: !showPasswords.new })
                  }
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPasswords.new ? 'eye-off' : 'eye'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, confirmPassword: text })
                  }
                  placeholder="Confirm new password"
                  secureTextEntry={!showPasswords.confirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })
                  }
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPasswords.confirm ? 'eye-off' : 'eye'}
                    size={22}
                    color="#64748b"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.changePasswordButton}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
                    <Text style={styles.changePasswordButtonText}>
                      Change Password
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        currentRoute="MyAccount"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  headerButton: {
    marginLeft: 15,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#1a365d',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a365d',
    marginLeft: 12,
  },
  editButton: {
    padding: 4,
  },
  infoRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  valueContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  value: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: '500',
  },
  valueReadOnly: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#38aa62ff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1a365d',
  },
  updateButton: {
    backgroundColor: '#38aa62ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
    marginLeft: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a365d',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 8,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#1a365d',
  },
  eyeIcon: {
    padding: 12,
  },
  changePasswordButton: {
    backgroundColor: '#38aa62ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  changePasswordButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});