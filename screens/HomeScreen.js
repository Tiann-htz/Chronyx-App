import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import QRCodeModal from '../components/QRCodeModal';
import Sidebar from '../components/Sidebar';
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrIsActive, setQrIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [checkingQR, setCheckingQR] = useState(true);
  const [refreshing, setRefreshing] = useState(false);  
  
  // New state for real data
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [timePolicy, setTimePolicy] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    checkUserQR();
    fetchAllData();
  }, []);

  // Add menu button to header
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

  
  const fetchAllData = async () => {
    setLoadingData(true);
    try {
      await Promise.all([
        fetchTodayAttendance(),
        fetchTimePolicy(),
        fetchMonthlyStats(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?endpoint=get-today-attendance&employeeId=${user.id}`
      );
      if (response.data.success) {
        setTodayAttendance(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
    }
  };

  const fetchTimePolicy = async () => {
    try {
      const response = await axios.get(`${API_URL}?endpoint=get-time-policy`);
      if (response.data.success) {
        setTimePolicy(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching time policy:', error);
      setTimePolicy(null);
    }
  };

  const fetchMonthlyStats = async () => {
    try {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      
      const response = await axios.get(
        `${API_URL}?endpoint=get-monthly-stats&employeeId=${user.id}&month=${month}&year=${year}`
      );
      if (response.data.success) {
        setMonthlyStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      setMonthlyStats(null);
    }
  };

  const checkUserQR = async () => {
    try {
      setCheckingQR(true);
      const response = await axios.get(
        `${API_URL}?endpoint=check-qr&userId=${user.id}`
      );

      if (response.data.success && response.data.qrCode) {
        setQrData(response.data.qrCode);
        setQrIsActive(response.data.isActive);
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

  const getInitials = () => {
    const first = user?.firstName?.charAt(0) || '';
    const last = user?.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  // Get current date info
  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  };

  // Format time from 24hr to 12hr
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format time range
  const formatTimeRange = (startTime, endTime) => {
    if (!startTime || !endTime) return 'Not set';
    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'on-time': { icon: 'checkmark-circle', color: '#10b981', label: 'On Time' },
      'late': { icon: 'alert-circle', color: '#ef4444', label: 'Late' },
      'overtime': { icon: 'time', color: '#3b82f6', label: 'Overtime' },
      'undertime': { icon: 'time-outline', color: '#f59e0b', label: 'Undertime' },
      'completed': { icon: 'checkmark-done-circle', color: '#10b981', label: 'Completed' },
    };

    const config = statusConfig[status] || { icon: 'help-circle', color: '#94A3B8', label: 'Unknown' };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  // Calculate hours worked
  const calculateHoursWorked = () => {
    if (!todayAttendance?.timeIn || !todayAttendance?.timeOut) return '0.0';
    
    const timeIn = new Date(`2000-01-01 ${todayAttendance.timeIn}`);
    const timeOut = new Date(`2000-01-01 ${todayAttendance.timeOut}`);
    const diff = (timeOut - timeIn) / (1000 * 60 * 60);
    
    return diff.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.content}>
          {/* Welcome Container */}
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeHeader}>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                {user?.avatarUrl ? (
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>{getInitials()}</Text>
                  </View>
                )}
              </View>

              {/* User Info Section */}
              <View style={styles.welcomeLeft}>
                <Text style={styles.welcomeGreeting}>Welcome back,</Text>
                <Text style={styles.welcomeTitle}>
                  {user?.firstName} {user?.lastName}
                </Text>
                <View style={styles.employeeIdContainer}>
                  <Ionicons name="card-outline" size={14} color="#64748b" />
                  <Text style={styles.employeeId}>ID: {user?.id}</Text>
                </View>
              </View>
            </View>

            {/* QR Code Button */}
            <View style={styles.qrButtonContainer}>
              {checkingQR ? (
                <View style={[styles.qrButton, styles.qrButtonLoading]}>
                  <ActivityIndicator color="#0A6BA3" />
                  <Text style={styles.qrButtonText}>Loading...</Text>
                </View>
             ) : qrData ? (
                <TouchableOpacity 
                  style={[
                    styles.qrButton, 
                    qrIsActive ? styles.qrButtonActive : styles.qrButtonDeactivated
                  ]} 
                  onPress={handleShowQR}
                >
                  <Ionicons 
                    name={qrIsActive ? "qr-code" : "alert-circle"} 
                    size={24} 
                    color="#ffffff" 
                  />
                  <Text style={styles.qrButtonTextActive}>
                    {qrIsActive ? "View My QR Code" : "QR Code Deactivated"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.qrButton, styles.qrButtonCreate]}
                  onPress={handleCreateQR}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator color="#0A6BA3" />
                      <Text style={styles.qrButtonText}>Creating...</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={24} color="#0A6BA3" />
                      <Text style={styles.qrButtonText}>Create My QR ID</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Today's Schedule Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="calendar-outline" size={24} color="#0A6BA3" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Today's Schedule</Text>
                <Text style={styles.dateText}>{getCurrentDate()}</Text>
              </View>
            </View>
            
            {loadingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#0A6BA3" />
              </View>
            ) : (
              <>
                <View style={styles.scheduleCard}>
                  <View style={styles.scheduleItem}>
                    <View style={styles.scheduleIconWrapper}>
                      <Ionicons name="time" size={20} color="#0A6BA3" />
                    </View>
                    <View style={styles.scheduleContent}>
                      <Text style={styles.scheduleLabel}>Working Hours</Text>
                      <Text style={styles.scheduleTimeText}>
                        {timePolicy 
                          ? formatTimeRange(timePolicy.time_in_start, timePolicy.official_time_out)
                          : 'Not set'}
                      </Text>
                    </View>
                  </View>

                  {timePolicy && (
                    <View style={styles.scheduleMeta}>
                      <View style={styles.scheduleMetaItem}>
                        <Ionicons name="hourglass-outline" size={16} color="#64748b" />
                        <Text style={styles.scheduleMetaText}>
                          {timePolicy.required_hours} hrs required
                        </Text>
                      </View>
                      <View style={styles.scheduleMetaItem}>
                        <Ionicons name="timer-outline" size={16} color="#64748b" />
                        <Text style={styles.scheduleMetaText}>
                          {timePolicy.grace_period} min grace
                        </Text>
                      </View>
                    </View>
                  )}
                </View>

                {todayAttendance?.status && (
                  <View style={styles.todayStatusContainer}>
                    <Text style={styles.todayStatusLabel}>Today's Status</Text>
                    {getStatusBadge(todayAttendance.status)}
                  </View>
                )}
              </>
            )}
          </View>

          {/* Attendance & Stats Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="stats-chart" size={24} color="#0A6BA3" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Today's Attendance</Text>
              </View>
            </View>
            
            {loadingData ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#0A6BA3" />
              </View>
            ) : todayAttendance ? (
              <>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#10b98110' }]}>
                      <Ionicons name="log-in" size={28} color="#10b981" />
                    </View>
                    <Text style={styles.statLabel}>Time In</Text>
                    <Text style={styles.statValue}>
                      {todayAttendance.timeIn ? formatTime(todayAttendance.timeIn) : '--:--'}
                    </Text>
                  </View>
                  
                  <View style={styles.statBox}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#ef444410' }]}>
                      <Ionicons name="log-out" size={28} color="#ef4444" />
                    </View>
                    <Text style={styles.statLabel}>Time Out</Text>
                    <Text style={styles.statValue}>
                      {todayAttendance.timeOut ? formatTime(todayAttendance.timeOut) : '--:--'}
                    </Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#0A6BA310' }]}>
                      <Ionicons name="timer" size={28} color="#0A6BA3" />
                    </View>
                    <Text style={styles.statLabel}>Hours Today</Text>
                    <Text style={styles.statValue}>{calculateHoursWorked()} hrs</Text>
                  </View>
                  
                  <View style={styles.statBox}>
                    <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b10' }]}>
                      <Ionicons name="calendar-number" size={28} color="#f59e0b" />
                    </View>
                    <Text style={styles.statLabel}>This Month</Text>
                    <Text style={styles.statValue}>
                      {monthlyStats?.totalDays || 0} days
                    </Text>
                  </View>
                </View>

                {(todayAttendance.late_minutes > 0 || 
                  todayAttendance.overtime_minutes > 0 || 
                  todayAttendance.undertime_minutes > 0) && (
                  <View style={styles.additionalStats}>
                    {todayAttendance.late_minutes > 0 && (
                      <View style={styles.additionalStatItem}>
                        <Ionicons name="alert-circle" size={16} color="#ef4444" />
                        <Text style={styles.additionalStatText}>
                          Late: {todayAttendance.late_minutes} min
                        </Text>
                      </View>
                    )}
                    {todayAttendance.overtime_minutes > 0 && (
                      <View style={styles.additionalStatItem}>
                        <Ionicons name="time" size={16} color="#3b82f6" />
                        <Text style={styles.additionalStatText}>
                          Overtime: {todayAttendance.overtime_minutes} min
                        </Text>
                      </View>
                    )}
                    {todayAttendance.undertime_minutes > 0 && (
                      <View style={styles.additionalStatItem}>
                        <Ionicons name="time-outline" size={16} color="#f59e0b" />
                        <Text style={styles.additionalStatText}>
                          Undertime: {todayAttendance.undertime_minutes} min
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <View style={styles.noDataIconContainer}>
                  <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.noDataText}>No attendance record yet today</Text>
                <Text style={styles.noDataSubtext}>Scan your QR code to clock in</Text>
              </View>
            )}
          </View>

          {/* Quick Actions Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIconContainer}>
                <Ionicons name="flash" size={24} color="#0A6BA3" />
              </View>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="calendar" size={22} color="#0A6BA3" />
              </View>
              <Text style={styles.actionButtonText}>View Full Attendance</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => navigation.navigate('Salary')}
            >
              <View style={styles.actionIconContainer}>
                <Ionicons name="cash" size={22} color="#0A6BA3" />
              </View>
              <Text style={styles.actionButtonText}>Check My Salary</Text>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sidebar */}
      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        currentRoute="Home"
      />

      {/* QR Code Modal */}
      <QRCodeModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrData={qrData || ''}
        userName={`${user?.firstName} ${user?.lastName}`}
        isActive={qrIsActive}
        navigation={navigation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  headerButton: {
    marginLeft: 15,
  },
  welcomeContainer: {
    marginBottom: 20,
    backgroundColor: '#FEFDFD',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  welcomeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarSection: {
    marginRight: 16,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#0A6BA3',
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#0A6BA3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#0A7EB1',
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: 6,
  },
  employeeIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  employeeId: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginLeft: 4,
  },
  qrButtonContainer: {
    marginTop: 8,
  },
  qrButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrButtonLoading: {
    backgroundColor: '#F1F5F9',
  },
  qrButtonActive: {
    backgroundColor: '#0A6BA3',
    shadowColor: '#0A6BA3',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  qrButtonDeactivated: {
    backgroundColor: '#ef4444',
  },
  qrButtonCreate: {
    backgroundColor: '#F1F5F9',
    borderWidth: 2,
    borderColor: '#0A6BA3',
    borderStyle: 'dashed',
  },
  qrButtonText: {
    color: '#0A6BA3',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  qrButtonTextActive: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#FEFDFD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
  dateText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  scheduleCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleContent: {
    flex: 1,
  },
  scheduleLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  scheduleTimeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a365d',
  },
  scheduleMeta: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  scheduleMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleMetaText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '500',
  },
  todayStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  todayStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
  additionalStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  additionalStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  additionalStatText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
    fontWeight: '600',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#94a3b8',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1a365d',
  },
});