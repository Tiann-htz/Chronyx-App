import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';

export default function MyAccountScreen({ navigation }) {
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);

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

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="person" size={24} color="#1a365d" />
              <Text style={styles.cardTitle}>My Account</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.label}>Employee ID:</Text>
              <Text style={styles.value}>{user?.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>First Name:</Text>
              <Text style={styles.value}>{user?.firstName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Last Name:</Text>
              <Text style={styles.value}>{user?.lastName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{user?.email}</Text>
            </View>
          </View>

          <Text style={styles.infoText}>
            More account management features will be added here.
          </Text>
        </View>
      </ScrollView>

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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a365d',
    marginLeft: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  value: {
    fontSize: 16,
    color: '#1a365d',
    fontWeight: '500',
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 20,
  },
});