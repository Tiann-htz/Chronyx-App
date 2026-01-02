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
                  <Ionicons name="wallet" size={24} color="#0A6BA3" />
                </View>
                <Text style={styles.cardTitle}>Current Pay Period</Text>
              </View>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#0A6BA3" size="large" />
              </View>
            ) : currentPeriod ? (
              <>
                <View style={styles.periodDates}>
                  <View style={styles.dateIconWrapper}>
                    <Ionicons name="calendar-outline" size={18} color="#0A6BA3" />
                  </View>
                  <Text style={styles.periodText}>
                    {formatDate(currentPeriod.period_start)} - {formatDate(currentPeriod.period_end)}
                  </Text>
                </View>

                <View style={styles.salaryBreakdown}>
                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLabelContainer}>
                      <Ionicons name="time-outline" size={16} color="#64748b" />
                      <Text style={styles.breakdownLabel}>Total Hours</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {parseFloat(currentPeriod.total_hours).toFixed(2)} hrs
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLabelContainer}>
                      <Ionicons name="cash-outline" size={16} color="#64748b" />
                      <Text style={styles.breakdownLabel}>Hourly Rate</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(currentPeriod.hourly_rate)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLabelContainer}>
                      <Ionicons name="trending-up-outline" size={16} color="#10b981" />
                      <Text style={styles.breakdownLabel}>Gross Salary</Text>
                    </View>
                    <Text style={styles.breakdownValue}>
                      {formatCurrency(currentPeriod.gross_salary)}
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <View style={styles.breakdownLabelContainer}>
                      <Ionicons name="trending-down-outline" size={16} color="#ef4444" />
                      <Text style={styles.breakdownLabel}>Deductions</Text>
                    </View>
                    <Text style={[styles.breakdownValue, styles.deductionText]}>
                      - {formatCurrency(currentPeriod.deductions)}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={[styles.breakdownRow, styles.netSalaryRow]}>
                    <View style={styles.netSalaryIconContainer}>
                      <Ionicons name="wallet" size={20} color="#10b981" />
                    </View>
                    <View style={styles.netSalaryContent}>
                      <Text style={styles.netSalaryLabel}>Net Salary</Text>
                      <Text style={styles.netSalaryValue}>
                        {formatCurrency(currentPeriod.net_salary)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.statusContainer}>
                  {getStatusBadge(currentPeriod.status)}
                </View>
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <View style={styles.noDataIconContainer}>
                  <Ionicons name="wallet-outline" size={48} color="#cbd5e1" />
                </View>
                <Text style={styles.noDataText}>No current pay period data</Text>
                <Text style={styles.noDataSubtext}>
                  Your salary information will appear here once calculated
                </Text>
              </View>
            )}
          </View>

          {/* Salary History Header */}
          <View style={styles.historyHeader}>
            <View style={styles.historyHeaderContent}>
              <Ionicons name="time-outline" size={22} color="#1a365d" />
              <Text style={styles.historyTitle}>Salary History</Text>
            </View>
            {salaryHistory.length > 0 && (
              <View style={styles.historyCount}>
                <Text style={styles.historyCountText}>{salaryHistory.length}</Text>
              </View>
            )}
          </View>

          {/* Salary History List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#0A6BA3" size="large" />
            </View>
          ) : salaryHistory.length > 0 ? (
            salaryHistory.map((record) => {
              const isExpanded = expandedPeriod === record.payroll_id;
              
              return (
                <TouchableOpacity
                  key={record.payroll_id}
                  style={[
                    styles.historyCard,
                    isExpanded && styles.historyCardExpanded
                  ]}
                  onPress={() => togglePeriod(record.payroll_id)}
                  activeOpacity={0.7}
                >
                  {/* Period Header */}
                  <View style={styles.historyCardHeader}>
                    <View style={styles.historyCardLeft}>
                      <View style={styles.historyIconContainer}>
                        <Ionicons name="calendar" size={20} color="#0A6BA3" />
                      </View>
                      <View style={styles.historyCardInfo}>
                        <Text style={styles.historyPeriod}>
                          {formatDate(record.period_start)} - {formatDate(record.period_end)}
                        </Text>
                        <Text style={styles.historyAmount}>
                          {formatCurrency(record.net_salary)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyCardRight}>
                      <View style={styles.expandIconContainer}>
                        <Ionicons 
                          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
                          size={24} 
                          color="#0A6BA3" 
                        />
                      </View>
                    </View>
                  </View>

                  {/* Status */}
                  <View style={styles.historyStatus}>
                    {getStatusBadge(record.status)}
                  </View>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <View style={styles.expandedDetails}>
                      <View style={styles.dividerExpanded} />
                      
                      <View style={styles.detailSection}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="time-outline" size={16} color="#64748b" />
                            <Text style={styles.detailLabel}>Total Hours</Text>
                          </View>
                          <Text style={styles.detailValue}>
                            {parseFloat(record.total_hours).toFixed(2)} hrs
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="cash-outline" size={16} color="#64748b" />
                            <Text style={styles.detailLabel}>Hourly Rate</Text>
                          </View>
                          <Text style={styles.detailValue}>
                            {formatCurrency(record.hourly_rate)}
                          </Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailRow}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="trending-up-outline" size={16} color="#10b981" />
                            <Text style={styles.detailLabel}>Gross Salary</Text>
                          </View>
                          <Text style={styles.detailValue}>
                            {formatCurrency(record.gross_salary)}
                          </Text>
                        </View>

                        <View style={styles.detailRow}>
                          <View style={styles.detailLabelContainer}>
                            <Ionicons name="trending-down-outline" size={16} color="#ef4444" />
                            <Text style={styles.detailLabel}>Deductions</Text>
                          </View>
                          <Text style={[styles.detailValue, styles.deductionText]}>
                            - {formatCurrency(record.deductions)}
                          </Text>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.netSalaryDetailRow}>
                          <View style={styles.netSalaryDetailIcon}>
                            <Ionicons name="wallet" size={18} color="#10b981" />
                          </View>
                          <View style={styles.netSalaryDetailContent}>
                            <Text style={styles.detailLabelBold}>Net Salary</Text>
                            <Text style={styles.detailValueBold}>
                              {formatCurrency(record.net_salary)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="receipt-outline" size={64} color="#cbd5e1" />
              </View>
              <Text style={styles.emptyTitle}>No Salary History</Text>
              <Text style={styles.emptyText}>
                Your salary records will appear here once processed
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
        currentRoute="Salary"
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
  currentPeriodCard: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
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
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateIconWrapper: {
    marginRight: 10,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a365d',
  },
  salaryBreakdown: {
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  breakdownLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
  },
  breakdownValue: {
    fontSize: 15,
    color: '#1a365d',
    fontWeight: '700',
  },
  deductionText: {
    color: '#ef4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  netSalaryRow: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  netSalaryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  netSalaryContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  netSalaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a365d',
  },
  netSalaryValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#10b981',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
    marginLeft: 8,
  },
  historyCount: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  historyCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A6BA3',
  },
  historyCard: {
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
  historyCardExpanded: {
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#e0f2fe',
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyCardInfo: {
    flex: 1,
  },
  historyPeriod: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
    fontWeight: '500',
  },
  historyAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a365d',
  },
  historyCardRight: {
    marginLeft: 8,
  },
  expandIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyStatus: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  expandedDetails: {
    marginTop: 16,
  },
  dividerExpanded: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginBottom: 16,
  },
  detailSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#1a365d',
    fontWeight: '700',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  netSalaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  netSalaryDetailIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  netSalaryDetailContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabelBold: {
    fontSize: 15,
    color: '#1a365d',
    fontWeight: '700',
  },
  detailValueBold: {
    fontSize: 18,
    color: '#10b981',
    fontWeight: '700',
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
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 4,
  },
  noDataSubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
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