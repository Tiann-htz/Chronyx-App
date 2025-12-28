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
import axios from 'axios';

const API_URL = 'https://chronyx-app.vercel.app/api/chronyxApi';

export default function SalaryScreen({ navigation }) {
  const { user } = useAuth();
  const [showSidebar, setShowSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [expandedPeriod, setExpandedPeriod] = useState(null);

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

    fetchSalaryData();
  }, [navigation]);

  const fetchSalaryData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCurrentPeriod(),
        fetchSalaryHistory(),
      ]);
    } catch (error) {
      console.error('Error fetching salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSalaryData();
    setRefreshing(false);
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?endpoint=get-current-salary&employeeId=${user.id}`
      );

      if (response.data.success) {
        setCurrentPeriod(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching current period:', error);
      setCurrentPeriod(null);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      const response = await axios.get(
        `${API_URL}?endpoint=get-salary-history&employeeId=${user.id}`
      );

      if (response.data.success) {
        setSalaryHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching salary history:', error);
      setSalaryHistory([]);
    }
  };

  // Format date to readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${parseFloat(amount).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { icon: 'time', color: '#f59e0b', label: 'Pending', bg: '#fef3c7' },
      'approved': { icon: 'checkmark-circle', color: '#10b981', label: 'Approved', bg: '#d1fae5' },
      'paid': { icon: 'checkmark-done-circle', color: '#3b82f6', label: 'Paid', bg: '#dbeafe' },
    };

    const config = statusConfig[status] || { 
      icon: 'help-circle', 
      color: '#94A3B8', 
      label: 'Unknown',
      bg: '#f1f5f9'
    };
    
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
        <Ionicons name={config.icon} size={16} color={config.color} />
        <Text style={[styles.statusText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  // Toggle period expansion
  const togglePeriod = (payrollId) => {
    setExpandedPeriod(expandedPeriod === payrollId ? null : payrollId);
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
          {/* Current Period Summary Card */}
          <View style={styles.currentPeriodCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="wallet" size={24} color="#1a365d" />
                </View>
                <Text style={styles.cardTitle}>Current Pay Period</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#1a365d" size="large" />
              </View>
            ) : currentPeriod ? (
              <>
                <View style={styles.periodDates}>
                  <Ionicons name="calendar-outline" size={18} color="#64748b" />
                  <Text style={styles.periodText}>
                    {formatDate(currentPeriod.period_start)} - {formatDate(currentPeriod.period_end)}
                  </Text>
                </View>

                <View style={styles.salaryBreakdown}>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Hours</Text>
                    <Text style={styles.breakdownValue}>
                      {parseFloat(currentPeriod.total_hours).toFixed(2)} hrs
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Hourly Rate</Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(currentPeriod.hourly_rate)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Gross Salary</Text>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(currentPeriod.gross_salary)}
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Deductions</Text>
                    <Text style={[styles.breakdownValue, styles.deductionText]}>
                      - {formatCurrency(currentPeriod.deductions)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={[styles.breakdownRow, styles.netSalaryRow]}>
                    <Text style={styles.netSalaryLabel}>Net Salary</Text>
                    <Text style={styles.netSalaryValue}>
                      {formatCurrency(currentPeriod.net_salary)}
                    </Text>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  {getStatusBadge(currentPeriod.status)}
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
                <Text style={styles.noDataText}>No current pay period data</Text>
                <Text style={styles.noDataSubtext}>
                  Your salary information will appear here once calculated
                </Text>
              </View>
            )}
          </View>

          {/* Salary History Header */}
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Salary History</Text>
          </View>

          {/* Salary History List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#1a365d" size="large" />
            </View>
          ) : salaryHistory.length > 0 ? (
            salaryHistory.map((record) => {
              const isExpanded = expandedPeriod === record.payroll_id;
              
              return (
                <TouchableOpacity
                  key={record.payroll_id}
                  style={styles.historyCard}
                  onPress={() => togglePeriod(record.payroll_id)}
                  activeOpacity={0.7}
                >
                  {/* Period Header */}
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardLeft}>
                      <Ionicons name="calendar" size={20} color="#1a365d" />
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyPeriod}>
                          {formatDate(record.period_start)} - {formatDate(record.period_end)}
                        </Text>
                        <Text style={styles.historyAmount}>
                          {formatCurrency(record.net_salary)}
                        </Text>
                      </View>
                    </View>

                    <Ionicons 
                      name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                      size={24} 
                      color="#94a3b8" 
                    />
                  </View>

                  {/* Status */}
                  <View style={styles.historyStatus}>
                    {getStatusBadge(record.status)}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.divider} />
                      
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Total Hours</Text>
                        <Text style={styles.detailValue}>
                          {parseFloat(record.total_hours).toFixed(2)} hrs
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hourly Rate</Text>
                        <Text style={styles.detailValue}>
                          {formatCurrency(record.hourly_rate)}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Gross Salary</Text>
                        <Text style={styles.detailValue}>
                          {formatCurrency(record.gross_salary)}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Deductions</Text>
                        <Text style={[styles.detailValue, styles.deductionText]}>
                          - {formatCurrency(record.deductions)}
                        </Text>
                      </View>

                      <View style={styles.divider} />

                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabelBold}>Net Salary</Text>
                        <Text style={styles.detailValueBold}>
                          {formatCurrency(record.net_salary)}
                        </Text>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Salary History</Text>
              <Text style={styles.emptyText}>
                Your salary records will appear here once processed
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Sidebar
        visible={showSidebar}
        onClose={() => setShowSidebar(false)}
        navigation={navigation}
        currentRoute="Salary"
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
    padding: 16,
  },
  headerButton: {
    marginLeft: 15,
  },
  currentPeriodCard: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a365d',
  },
  periodDates: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 8,
  },
  salaryBreakdown: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 15,
    color: '#1a365d',
    fontWeight: '600',
  },
  deductionText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
  netSalaryRow: {
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  netSalaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a365d',
  },
  netSalaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10b981',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
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
    fontWeight: '600',
    marginLeft: 6,
  },
  historyHeader: {
    marginBottom: 16,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyCardInfo: {
    marginLeft: 12,
    flex: 1,
  },
  historyPeriod: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
  historyStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  expandedDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '600',
  },
  detailLabelBold: {
    fontSize: 15,
    color: '#1a365d',
    fontWeight: '700',
  },
  detailValueBold: {
    fontSize: 16,
    color: '#10b981',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noDataContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
});