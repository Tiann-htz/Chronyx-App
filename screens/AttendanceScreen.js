import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import AttendanceFilterModal from '../components/AttendanceFilterModal';
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function AttendanceScreen({ navigation }) {
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Filter state - now mutable
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('all');

  useEffect(() => {
    // Set header with menu button
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

    fetchAttendanceData();
  }, [navigation]);

  // Add useEffect to refetch when filters change
  useEffect(() => {
    if (!loading) {
      fetchAttendanceData();
    }
  }, [currentMonth, currentYear, selectedStatus]);

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAttendanceHistory(),
        fetchMonthlySummary(),
      ]);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAttendanceData();
    setRefreshing(false);
  };

  const fetchAttendanceHistory = async () => {
    try {
      let url = `${API_URL}?endpoint=get-attendance-history&employeeId=${user.id}&month=${currentMonth}&year=${currentYear}`;
      
      // Add status filter if not 'all'
      if (selectedStatus !== 'all') {
        url += `&status=${selectedStatus}`;
      }

      const response = await axios.get(url);

      if (response.data.success) {
        setAttendanceHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      setAttendanceHistory([]);
    }
  };

  const fetchMonthlySummary = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?endpoint=get-monthly-summary&employeeId=${user.id}&month=${currentMonth}&year=${currentYear}`
      );

      if (response.data.success) {
        setMonthlySummary(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching monthly summary:', error);
      setMonthlySummary(null);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Format time from 24hr to 12hr
  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    
    const [hours, minutes, seconds] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Calculate hours worked
  const calculateHours = (timeIn, timeOut) => {
    if (!timeIn || !timeOut) return '0.00';
    
    const timeInDate = new Date(`2000-01-01 ${timeIn}`);
    const timeOutDate = new Date(`2000-01-01 ${timeOut}`);
    const diff = (timeOutDate - timeInDate) / (1000 * 60 * 60);
    
    return diff.toFixed(2);
  };

  // Get status icon and color
  const getStatusConfig = (status) => {
    const statusMap = {
      'on-time': { icon: 'checkmark-circle', color: '#10b981', label: 'On Time', bg: '#d1fae5' },
      'late': { icon: 'alert-circle', color: '#ef4444', label: 'Late', bg: '#fee2e2' },
      'overtime': { icon: 'time', color: '#3b82f6', label: 'Overtime', bg: '#dbeafe' },
      'undertime': { icon: 'time-outline', color: '#f59e0b', label: 'Undertime', bg: '#fef3c7' },
      'completed': { icon: 'checkmark-done-circle', color: '#10b981', label: 'Completed', bg: '#d1fae5' },
    };

    return statusMap[status] || { 
      icon: 'help-circle', 
      color: '#94A3B8', 
      label: 'Unknown',
      bg: '#f1f5f9'
    };
  };

  // Group attendance by date
  const groupedAttendance = attendanceHistory.reduce((acc, record) => {
    const dateKey = record.date;
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        timeIn: null,
        timeOut: null,
        status: null,
        late_minutes: 0,
        overtime_minutes: 0,
        undertime_minutes: 0,
      };
    }

    if (record.action_type === 'time-in') {
      acc[dateKey].timeIn = record.time;
      acc[dateKey].status = record.status;
      acc[dateKey].late_minutes = record.late_minutes;
    } else if (record.action_type === 'time-out') {
      acc[dateKey].timeOut = record.time;
      acc[dateKey].status = record.status;
      acc[dateKey].overtime_minutes = record.overtime_minutes;
      acc[dateKey].undertime_minutes = record.undertime_minutes;
    }

    return acc;
  }, {});

  // Convert to array and sort by date (newest first)
  const sortedAttendance = Object.values(groupedAttendance).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Get current month name
  const getMonthName = () => {
    const date = new Date(currentYear, currentMonth - 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // Handle filter apply
  const handleApplyFilter = (filters) => {
    setCurrentMonth(filters.month);
    setCurrentYear(filters.year);
    setSelectedStatus(filters.status);
    
    // Fetch new data will be triggered by useEffect
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
          {/* Monthly Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryIconContainer}>
                <Ionicons name="calendar" size={24} color="#0A6BA3" />
              </View>
              <View style={styles.summaryTitleContainer}>
                <Text style={styles.summaryTitle}>{getMonthName()} Summary</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#0A6BA3" size="large" />
              </View>
            ) : monthlySummary ? (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#10b98110' }]}>
                    <Ionicons name="checkmark-circle" size={32} color="#10b981" />
                  </View>
                  <Text style={styles.statValue}>{monthlySummary.totalDaysPresent}</Text>
                  <Text style={styles.statLabel}>Days Present</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#3b82f610' }]}>
                    <Ionicons name="time" size={32} color="#3b82f6" />
                  </View>
                  <Text style={styles.statValue}>{monthlySummary.totalHours}</Text>
                  <Text style={styles.statLabel}>Total Hours</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#ef444410' }]}>
                    <Ionicons name="alert-circle" size={32} color="#ef4444" />
                  </View>
                  <Text style={styles.statValue}>{monthlySummary.totalLate}</Text>
                  <Text style={styles.statLabel}>Late Count</Text>
                </View>

                <View style={styles.statBox}>
                  <View style={[styles.statIconContainer, { backgroundColor: '#f59e0b10' }]}>
                    <Ionicons name="trending-up" size={32} color="#f59e0b" />
                  </View>
                  <Text style={styles.statValue}>{monthlySummary.totalOvertime}</Text>
                  <Text style={styles.statLabel}>Overtime</Text>
                </View>
              </View>
            ) : (
              <View style={styles.noDataContainer}>
                <View style={styles.noDataIconContainer}>
                  <Ionicons name="bar-chart-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.noDataText}>No summary available</Text>
              </View>
            )}
          </View>

          {/* Attendance History Header */}
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderLeft}>
              <Ionicons name="time-outline" size={22} color="#1a365d" />
              <Text style={styles.historyTitle}>Attendance History</Text>
            </View>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons name="filter" size={20} color="#0A6BA3" />
              <Text style={styles.filterButtonText}>Filter</Text>
            </TouchableOpacity>
          </View>

          {/* Attendance History List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0A6BA3" size="large" />
            </View>
          ) : sortedAttendance.length > 0 ? (
            sortedAttendance.map((record, index) => {
              const statusConfig = getStatusConfig(record.status);
              const hoursWorked = calculateHours(record.timeIn, record.timeOut);

              return (
                <View key={index} style={styles.attendanceCard}>
                  {/* Date Header */}
                  <View style={styles.dateHeader}>
                    <View style={styles.dateIconContainer}>
                      <Ionicons name="calendar-outline" size={18} color="#0A6BA3" />
                    </View>
                    <Text style={styles.dateText}>{formatDate(record.date)}</Text>
                  </View>

                  {/* Time Details */}
                  <View style={styles.timeDetailsContainer}>
                    <View style={styles.timeRow}>
                      <View style={styles.timeItem}>
                        <View style={styles.timeIconWrapper}>
                          <Ionicons name="log-in" size={20} color="#10b981" />
                        </View>
                        <View style={styles.timeTextContainer}>
                          <Text style={styles.timeLabel}>Time In</Text>
                          <Text style={styles.timeValue}>{formatTime(record.timeIn)}</Text>
                        </View>
                      </View>

                      <View style={styles.timeItem}>
                        <View style={styles.timeIconWrapper}>
                          <Ionicons name="log-out" size={20} color="#ef4444" />
                        </View>
                        <View style={styles.timeTextContainer}>
                          <Text style={styles.timeLabel}>Time Out</Text>
                          <Text style={styles.timeValue}>
                            {record.timeOut ? formatTime(record.timeOut) : '--:--'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Hours Worked */}
                    <View style={styles.hoursContainer}>
                      <View style={styles.hoursIconWrapper}>
                        <Ionicons name="timer" size={18} color="#0A6BA3" />
                      </View>
                      <Text style={styles.hoursText}>
                        {record.timeOut ? `${hoursWorked} hours worked` : 'Incomplete'}
                      </Text>
                    </View>
                  </View>

                  {/* Status and Additional Info Row */}
                  <View style={styles.statusRow}>
                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
                      <Ionicons name={statusConfig.icon} size={16} color={statusConfig.color} />
                      <Text style={[styles.statusText, { color: statusConfig.color }]}>
                        {statusConfig.label}
                      </Text>
                    </View>
                  </View>

                  {/* Additional Info (Late/Overtime/Undertime) */}
                  {(record.late_minutes > 0 || 
                    record.overtime_minutes > 0 || 
                    record.undertime_minutes > 0) && (
                    <View style={styles.additionalInfo}>
                      {record.late_minutes > 0 && (
                        <View style={styles.infoItem}>
                          <Ionicons name="alert-circle" size={14} color="#ef4444" />
                          <Text style={styles.infoText}>
                            Late: {record.late_minutes} min
                          </Text>
                        </View>
                      )}
                      {record.overtime_minutes > 0 && (
                        <View style={styles.infoItem}>
                          <Ionicons name="time" size={14} color="#3b82f6" />
                          <Text style={styles.infoText}>
                            OT: {record.overtime_minutes} min
                          </Text>
                        </View>
                      )}
                      {record.undertime_minutes > 0 && (
                        <View style={styles.infoItem}>
                          <Ionicons name="time-outline" size={14} color="#f59e0b" />
                          <Text style={styles.infoText}>
                            UT: {record.undertime_minutes} min
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="calendar-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Attendance Records</Text>
              <Text style={styles.emptyText}>
                Your attendance records for {getMonthName()} will appear here
              </Text>
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacer} />
        </View>
      </ScrollView>

      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        currentRoute="Attendance"
      />

      <AttendanceFilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleApplyFilter}
        currentFilters={{
          month: currentMonth,
          year: currentYear,
          status: selectedStatus,
        }}
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
  summaryCard: {
    backgroundColor: '#FEFDFD',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTitleContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a365d',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
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
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a365d',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    fontWeight: '600',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
    marginLeft: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A6BA3',
    marginLeft: 6,
  },
  attendanceCard: {
    backgroundColor: '#FEFDFD',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dateIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a365d',
  },
  timeDetailsContainer: {
    marginBottom: 14,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  timeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  timeTextContainer: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '500',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a365d',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  hoursIconWrapper: {
    marginRight: 10,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A6BA3',
  },
  statusRow: {
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  additionalInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 6,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noDataContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  emptyContainer: {
    backgroundColor: '#FEFDFD',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});