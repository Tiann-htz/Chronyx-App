import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingQR, setCheckingQR] = useState(true);

  // Check if user has QR on component mount
  useEffect(() => {
    checkUserQR();
  }, []);

  const checkUserQR = async () => {
    try {
      setCheckingQR(true);
      const response = await axios.get(
        `${API_URL}?endpoint=check-qr&userId=${user.id}`
      );

      if (response.data.success && response.data.qrCode) {
        setQrData(response.data.qrCode);
      }
    } catch (error) {
      console.error('Error checking QR:', error);
    } finally {
      setCheckingQR(false);
    }
  };

  const handleCreateQR = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}?endpoint=create-qr`, {
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      });

      if (response.data.success) {
        setQrData(response.data.qrCode);
        Alert.alert('Success', 'Your QR code has been created!');
        setShowQRModal(true);
      }
    } catch (error) {
      console.error('Error creating QR:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create QR code'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
  };

  

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeTitle}>
            Welcome, {user?.firstName} {user?.lastName}!
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {user?.email}
          </Text>
         

          {/* QR Code Button */}
          <View style={styles.qrButtonContainer}>
            {checkingQR ? (
              <View style={styles.qrButton}>
                <ActivityIndicator color="#fff" />
                <Text style={styles.qrButtonText}>Loading...</Text>
              </View>
            ) : qrData ? (
              <TouchableOpacity
                style={styles.qrButton}
                onPress={handleShowQR}
              >
                <Text style={styles.qrButtonIcon}>📱</Text>
                <Text style={styles.qrButtonText}>View My QR Code</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.qrButton, styles.qrButtonCreate]}
                onPress={handleCreateQR}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" />
                    <Text style={styles.qrButtonText}>Creating...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.qrButtonIcon}>➕</Text>
                    <Text style={styles.qrButtonText}>Create My QR ID</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{user?.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>
              {user?.firstName} {user?.lastName}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>QR Status:</Text>
            <Text style={[styles.infoValue, qrData ? styles.statusActive : styles.statusInactive]}>
              {qrData ? '✓ Active' : '✗ Not Created'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Dashboard</Text>
          <Text style={styles.cardText}>
            You're successfully logged in! Your dashboard features will be added here.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Tasks</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Records</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Actions</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrData || ''}
        userName={`${user?.firstName} ${user?.lastName}`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  content: {
    padding: 20,
  },
  welcomeContainer: {
    marginBottom: 24,
    backgroundColor: '#48bb78',
    borderRadius: 12,
    padding: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#e6fffa',
    marginBottom: 12,
  },
  userTypeBadge: {
    backgroundColor: '#2f855a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  userTypeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  qrButtonContainer: {
    marginTop: 8,
  },
  qrButton: {
    backgroundColor: '#2f855a',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  qrButtonCreate: {
    backgroundColor: '#38a169',
  },
  qrButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  qrButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 16,
  },
  cardText: {
    fontSize: 14,
    color: '#718096',
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4a5568',
  },
  infoValue: {
    fontSize: 14,
    color: '#718096',
    flex: 1,
    textAlign: 'right',
  },
  statusActive: {
    color: '#48bb78',
    fontWeight: '600',
  },
  statusInactive: {
    color: '#f56565',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#48bb78',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#718096',
  },
  logoutButton: {
    backgroundColor: '#f56565',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});