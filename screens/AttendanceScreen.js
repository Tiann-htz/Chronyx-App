import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Sidebar from '../components/Sidebar';

export default function AttendanceScreen({ navigation }) {
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
      headerStyle: { backgroundColor: '#1a365d' },
      headerTintColor: '#ffffff',
      headerTitleStyle: { fontWeight: 'bold' },
      title: 'My Attendance',
    });
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar" size={24} color="#1a365d" />
              <Text style={styles.cardTitle}>My Attendance</Text>
            </View>
            <Text style={styles.infoText}>
              Your attendance records will be displayed here.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.emptyText}>No attendance records yet.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>This Month Summary</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="checkmark-circle" size={40} color="#10b981" />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Days Present</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="close-circle" size={40} color="#ef4444" />
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Days Absent</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={40} color="#94A3B8" />
                <Text style={styles.statValue}>0h</Text>
                <Text style={styles.statLabel}>Total Hours</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        currentRoute="Attendance"
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a365d',
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a365d',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#64748b',
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a365d',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
});