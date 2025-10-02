import { supabase } from './supabase';
import { kpiEventCollector } from './kpi-event-collector';
import * as os from 'os';

// System performance monitoring interfaces
export interface SystemMetrics {
  timestamp: Date;
  cpu_usage_percent: number;
  memory_usage_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_usage_percent?: number;
  network_connections?: number;
  uptime_seconds: number;
}

export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  response_time_ms: number;
  status_code: number;
  error_message?: string;
  request_size_bytes?: number;
  response_size_bytes?: number;
  timestamp: Date;
  session_id?: string;
}

export interface DatabasePerformanceMetrics {
  query_type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
  execution_time_ms: number;
  rows_affected: number;
  table_name?: string;
  query_hash?: string;
  error_message?: string;
  timestamp: Date;
}

export interface SystemHealthStatus {
  overall_health: 'healthy' | 'warning' | 'critical';
  uptime_hours: number;
  cpu_status: 'normal' | 'high' | 'critical';
  memory_status: 'normal' | 'high' | 'critical';
  api_status: 'normal' | 'slow' | 'failing';
  database_status: 'normal' | 'slow' | 'failing';
  error_rate_percent: number;
  avg_response_time_ms: number;
  active_connections: number;
  last_updated: Date;
}

export interface PerformanceAlert {
  id: string;
  alert_type: 'cpu_high' | 'memory_high' | 'api_slow' | 'error_rate_high' | 'database_slow';
  severity: 'warning' | 'critical';
  message: string;
  current_value: number;
  threshold_value: number;
  triggered_at: Date;
  resolved_at?: Date;
  status: 'active' | 'resolved';
}

export class SystemPerformanceMonitor {
  private static instance: SystemPerformanceMonitor;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;
  
  // Performance thresholds
  private readonly thresholds = {
    cpu: { warning: 70, critical: 85 },
    memory: { warning: 80, critical: 90 },
    responseTime: { warning: 1000, critical: 3000 }, // ms
    errorRate: { warning: 5, critical: 10 }, // percent
    databaseTime: { warning: 500, critical: 1000 } // ms
  };
  
  // Metrics storage
  private recentMetrics: {
    system: SystemMetrics[];
    api: APIPerformanceMetrics[];
    database: DatabasePerformanceMetrics[];
  } = {
    system: [],
    api: [],
    database: []
  };
  
  // Alert tracking
  private activeAlerts: Map<string, PerformanceAlert> = new Map();

  private constructor() {}

  static getInstance(): SystemPerformanceMonitor {
    if (!SystemPerformanceMonitor.instance) {
      SystemPerformanceMonitor.instance = new SystemPerformanceMonitor();
    }
    return SystemPerformanceMonitor.instance;
  }

  /**
   * Start continuous system monitoring
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.log('⚠️ System monitoring is already running');
      return;
    }

    console.log(`🔍 Starting system performance monitoring (interval: ${intervalMs}ms)`);
    this.isMonitoring = true;
    
    // Initial metrics collection
    this.collectSystemMetrics();
    
    // Set up periodic collection
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, intervalMs);
  }

  /**
   * Stop system monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('🛑 System performance monitoring stopped');
  }

  /**
   * Collect current system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    try {
      const cpuUsage = await this.getCPUUsage();
      const memoryInfo = this.getMemoryInfo();
      const uptime = process.uptime();
      
      const metrics: SystemMetrics = {
        timestamp: new Date(),
        cpu_usage_percent: cpuUsage,
        memory_usage_percent: memoryInfo.usagePercent,
        memory_used_mb: memoryInfo.usedMB,
        memory_total_mb: memoryInfo.totalMB,
        uptime_seconds: uptime
      };
      
      // Store in recent metrics (keep last 100 entries)
      this.recentMetrics.system.push(metrics);
      if (this.recentMetrics.system.length > 100) {
        this.recentMetrics.system.shift();
      }
      
      // Store in database
      await this.storeSystemMetrics(metrics);
      
      // Collect KPI events
      await kpiEventCollector.collectSystemPerformanceEvent(
        'cpu_usage',
        cpuUsage,
        'percent'
      );
      
      await kpiEventCollector.collectSystemPerformanceEvent(
        'memory_usage',
        memoryInfo.usagePercent,
        'percent'
      );
      
      // Check for alerts
      await this.checkSystemAlerts(metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('Error collecting system metrics:', error);
      throw error;
    }
  }

  /**
   * Record API performance metrics
   */
  async recordAPIPerformance(
    endpoint: string,
    method: string,
    responseTimeMs: number,
    statusCode: number,
    sessionId?: string,
    errorMessage?: string,
    requestSizeBytes?: number,
    responseSizeBytes?: number
  ): Promise<void> {
    try {
      const metrics: APIPerformanceMetrics = {
        endpoint,
        method,
        response_time_ms: responseTimeMs,
        status_code: statusCode,
        error_message: errorMessage,
        request_size_bytes: requestSizeBytes,
        response_size_bytes: responseSizeBytes,
        timestamp: new Date(),
        session_id: sessionId
      };
      
      // Store in recent metrics
      this.recentMetrics.api.push(metrics);
      if (this.recentMetrics.api.length > 1000) {
        this.recentMetrics.api.shift();
      }
      
      // Store in database
      await this.storeAPIMetrics(metrics);
      
      // Collect KPI event
      await kpiEventCollector.collectSystemPerformanceEvent(
        'api_response_time',
        responseTimeMs,
        'ms',
        sessionId || 'system',
        endpoint
      );
      
      // Check for performance alerts
      await this.checkAPIAlerts(metrics);
      
    } catch (error) {
      console.error('Error recording API performance:', error);
    }
  }

  /**
   * Record database performance metrics
   */
  async recordDatabasePerformance(
    queryType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
    executionTimeMs: number,
    rowsAffected: number,
    tableName?: string,
    queryHash?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const metrics: DatabasePerformanceMetrics = {
        query_type: queryType,
        execution_time_ms: executionTimeMs,
        rows_affected: rowsAffected,
        table_name: tableName,
        query_hash: queryHash,
        error_message: errorMessage,
        timestamp: new Date()
      };
      
      // Store in recent metrics
      this.recentMetrics.database.push(metrics);
      if (this.recentMetrics.database.length > 1000) {
        this.recentMetrics.database.shift();
      }
      
      // Store in database
      await this.storeDatabaseMetrics(metrics);
      
      // Collect KPI event
      await kpiEventCollector.collectSystemPerformanceEvent(
        'database_query_time',
        executionTimeMs,
        'ms',
        'system',
        `${queryType}_${tableName || 'unknown'}`
      );
      
      // Check for database alerts
      await this.checkDatabaseAlerts(metrics);
      
    } catch (error) {
      console.error('Error recording database performance:', error);
    }
  }

  /**
   * Get current system health status
   */
  async getSystemHealthStatus(): Promise<SystemHealthStatus> {
    try {
      const recentSystemMetrics = this.recentMetrics.system.slice(-10); // Last 10 entries
      const recentAPIMetrics = this.recentMetrics.api.slice(-100); // Last 100 API calls
      const recentDBMetrics = this.recentMetrics.database.slice(-100); // Last 100 DB queries
      
      // Calculate averages
      const avgCPU = this.calculateAverage(recentSystemMetrics.map(m => m.cpu_usage_percent));
      const avgMemory = this.calculateAverage(recentSystemMetrics.map(m => m.memory_usage_percent));
      const avgResponseTime = this.calculateAverage(recentAPIMetrics.map(m => m.response_time_ms));
      const avgDBTime = this.calculateAverage(recentDBMetrics.map(m => m.execution_time_ms));
      
      // Calculate error rate
      const errorCount = recentAPIMetrics.filter(m => m.status_code >= 400).length;
      const errorRate = recentAPIMetrics.length > 0 ? (errorCount / recentAPIMetrics.length) * 100 : 0;
      
      // Determine status levels
      const cpuStatus = this.getStatusLevel(avgCPU, this.thresholds.cpu);
      const memoryStatus = this.getStatusLevel(avgMemory, this.thresholds.memory);
      const apiStatus = this.getApiStatusLevel(avgResponseTime, this.thresholds.responseTime);
      const databaseStatus = this.getApiStatusLevel(avgDBTime, this.thresholds.databaseTime);
      
      // Determine overall health
      const statuses = [cpuStatus, memoryStatus, apiStatus, databaseStatus];
      let overallHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
      
      if (statuses.includes('critical')) {
        overallHealth = 'critical';
      } else if (statuses.includes('high') || statuses.includes('slow') || statuses.includes('failing')) {
        overallHealth = 'warning';
      }
      
      const uptime = process.uptime();
      
      return {
        overall_health: overallHealth,
        uptime_hours: uptime / 3600,
        cpu_status: cpuStatus,
        memory_status: memoryStatus,
        api_status: apiStatus,
        database_status: databaseStatus,
        error_rate_percent: errorRate,
        avg_response_time_ms: avgResponseTime,
        active_connections: recentAPIMetrics.length, // Approximate
        last_updated: new Date()
      };
      
    } catch (error) {
      console.error('Error getting system health status:', error);
      throw error;
    }
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values()).filter(alert => alert.status === 'active');
  }

  /**
   * Get performance metrics for a time range
   */
  async getPerformanceMetrics(
    startTime: Date,
    endTime: Date,
    metricType: 'system' | 'api' | 'database' = 'system'
  ): Promise<any[]> {
    try {
      let tableName: string;
      switch (metricType) {
        case 'system':
          tableName = 'system_performance_metrics';
          break;
        case 'api':
          tableName = 'api_performance_metrics';
          break;
        case 'database':
          tableName = 'database_performance_metrics';
          break;
      }
      
      const { data: metrics, error } = await supabase
        .from(tableName)
        .select('*')
        .gte('timestamp', startTime.toISOString())
        .lte('timestamp', endTime.toISOString())
        .order('timestamp', { ascending: true });
      
      if (error) {
        throw new Error(`Failed to fetch ${metricType} metrics: ${error.message}`);
      }
      
      return metrics || [];
      
    } catch (error) {
      console.error(`Error fetching ${metricType} metrics:`, error);
      throw error;
    }
  }

  /**
   * Get CPU usage percentage
   */
  private async getCPUUsage(): Promise<number> {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = process.hrtime();
      
      setTimeout(() => {
        const endUsage = process.cpuUsage(startUsage);
        const endTime = process.hrtime(startTime);
        
        const totalTime = endTime[0] * 1000000 + endTime[1] / 1000; // microseconds
        const totalCPUTime = endUsage.user + endUsage.system; // microseconds
        
        const cpuPercent = (totalCPUTime / totalTime) * 100;
        resolve(Math.min(100, Math.max(0, cpuPercent)));
      }, 100);
    });
  }

  /**
   * Get memory usage information
   */
  private getMemoryInfo(): { usagePercent: number; usedMB: number; totalMB: number } {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      usagePercent: (usedMemory / totalMemory) * 100,
      usedMB: usedMemory / (1024 * 1024),
      totalMB: totalMemory / (1024 * 1024)
    };
  }

  /**
   * Check for system performance alerts
   */
  private async checkSystemAlerts(metrics: SystemMetrics): Promise<void> {
    // Check CPU usage
    if (metrics.cpu_usage_percent >= this.thresholds.cpu.critical) {
      await this.triggerAlert('cpu_high', 'critical', 
        `Critical CPU usage: ${metrics.cpu_usage_percent.toFixed(1)}%`,
        metrics.cpu_usage_percent, this.thresholds.cpu.critical);
    } else if (metrics.cpu_usage_percent >= this.thresholds.cpu.warning) {
      await this.triggerAlert('cpu_high', 'warning',
        `High CPU usage: ${metrics.cpu_usage_percent.toFixed(1)}%`,
        metrics.cpu_usage_percent, this.thresholds.cpu.warning);
    } else {
      await this.resolveAlert('cpu_high');
    }
    
    // Check memory usage
    if (metrics.memory_usage_percent >= this.thresholds.memory.critical) {
      await this.triggerAlert('memory_high', 'critical',
        `Critical memory usage: ${metrics.memory_usage_percent.toFixed(1)}%`,
        metrics.memory_usage_percent, this.thresholds.memory.critical);
    } else if (metrics.memory_usage_percent >= this.thresholds.memory.warning) {
      await this.triggerAlert('memory_high', 'warning',
        `High memory usage: ${metrics.memory_usage_percent.toFixed(1)}%`,
        metrics.memory_usage_percent, this.thresholds.memory.warning);
    } else {
      await this.resolveAlert('memory_high');
    }
  }

  /**
   * Check for API performance alerts
   */
  private async checkAPIAlerts(metrics: APIPerformanceMetrics): Promise<void> {
    // Check response time
    if (metrics.response_time_ms >= this.thresholds.responseTime.critical) {
      await this.triggerAlert('api_slow', 'critical',
        `Critical API response time: ${metrics.response_time_ms}ms for ${metrics.endpoint}`,
        metrics.response_time_ms, this.thresholds.responseTime.critical);
    } else if (metrics.response_time_ms >= this.thresholds.responseTime.warning) {
      await this.triggerAlert('api_slow', 'warning',
        `Slow API response time: ${metrics.response_time_ms}ms for ${metrics.endpoint}`,
        metrics.response_time_ms, this.thresholds.responseTime.warning);
    }
    
    // Check error rate (based on recent metrics)
    const recentErrors = this.recentMetrics.api.slice(-50).filter(m => m.status_code >= 400);
    const errorRate = (recentErrors.length / Math.min(50, this.recentMetrics.api.length)) * 100;
    
    if (errorRate >= this.thresholds.errorRate.critical) {
      await this.triggerAlert('error_rate_high', 'critical',
        `Critical error rate: ${errorRate.toFixed(1)}%`,
        errorRate, this.thresholds.errorRate.critical);
    } else if (errorRate >= this.thresholds.errorRate.warning) {
      await this.triggerAlert('error_rate_high', 'warning',
        `High error rate: ${errorRate.toFixed(1)}%`,
        errorRate, this.thresholds.errorRate.warning);
    } else {
      await this.resolveAlert('error_rate_high');
    }
  }

  /**
   * Check for database performance alerts
   */
  private async checkDatabaseAlerts(metrics: DatabasePerformanceMetrics): Promise<void> {
    if (metrics.execution_time_ms >= this.thresholds.databaseTime.critical) {
      await this.triggerAlert('database_slow', 'critical',
        `Critical database query time: ${metrics.execution_time_ms}ms for ${metrics.query_type}`,
        metrics.execution_time_ms, this.thresholds.databaseTime.critical);
    } else if (metrics.execution_time_ms >= this.thresholds.databaseTime.warning) {
      await this.triggerAlert('database_slow', 'warning',
        `Slow database query: ${metrics.execution_time_ms}ms for ${metrics.query_type}`,
        metrics.execution_time_ms, this.thresholds.databaseTime.warning);
    }
  }

  /**
   * Trigger a performance alert
   */
  private async triggerAlert(
    alertType: string,
    severity: 'warning' | 'critical',
    message: string,
    currentValue: number,
    thresholdValue: number
  ): Promise<void> {
    const existingAlert = this.activeAlerts.get(alertType);
    
    // Don't retrigger the same alert
    if (existingAlert && existingAlert.status === 'active') {
      return;
    }
    
    const alert: PerformanceAlert = {
      id: `${alertType}_${Date.now()}`,
      alert_type: alertType as any,
      severity,
      message,
      current_value: currentValue,
      threshold_value: thresholdValue,
      triggered_at: new Date(),
      status: 'active'
    };
    
    this.activeAlerts.set(alertType, alert);
    
    // Store alert in database
    await this.storeAlert(alert);
    
    console.log(`🚨 ${severity.toUpperCase()} ALERT: ${message}`);
  }

  /**
   * Resolve a performance alert
   */
  private async resolveAlert(alertType: string): Promise<void> {
    const alert = this.activeAlerts.get(alertType);
    if (alert && alert.status === 'active') {
      alert.status = 'resolved';
      alert.resolved_at = new Date();
      
      // Update alert in database
      await this.updateAlert(alert);
      
      console.log(`✅ RESOLVED: ${alertType} alert`);
    }
  }

  /**
   * Get status level based on thresholds
   */
  private getStatusLevel(
    value: number, 
    thresholds: { warning: number; critical: number }
  ): 'normal' | 'high' | 'critical' {
    if (value >= thresholds.critical) {
      return 'critical';
    } else if (value >= thresholds.warning) {
      return 'high';
    } else {
      return 'normal';
    }
  }

  private getApiStatusLevel(
    value: number, 
    thresholds: { warning: number; critical: number }
  ): 'normal' | 'slow' | 'failing' {
    if (value >= thresholds.critical) {
      return 'failing';
    } else if (value >= thresholds.warning) {
      return 'slow';
    } else {
      return 'normal';
    }
  }

  /**
   * Calculate average of numbers
   */
  private calculateAverage(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  }

  /**
   * Store system metrics in database
   */
  private async storeSystemMetrics(metrics: SystemMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_performance_metrics')
        .insert({
          timestamp: metrics.timestamp.toISOString(),
          cpu_usage_percent: metrics.cpu_usage_percent,
          memory_usage_percent: metrics.memory_usage_percent,
          memory_used_mb: metrics.memory_used_mb,
          memory_total_mb: metrics.memory_total_mb,
          uptime_seconds: metrics.uptime_seconds
        });
      
      if (error) {
        console.warn('Failed to store system metrics:', error.message);
      }
    } catch (error) {
      console.warn('Error storing system metrics:', error);
    }
  }

  /**
   * Store API metrics in database
   */
  private async storeAPIMetrics(metrics: APIPerformanceMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('api_performance_metrics')
        .insert({
          endpoint: metrics.endpoint,
          method: metrics.method,
          response_time_ms: metrics.response_time_ms,
          status_code: metrics.status_code,
          error_message: metrics.error_message,
          request_size_bytes: metrics.request_size_bytes,
          response_size_bytes: metrics.response_size_bytes,
          timestamp: metrics.timestamp.toISOString(),
          session_id: metrics.session_id
        });
      
      if (error) {
        console.warn('Failed to store API metrics:', error.message);
      }
    } catch (error) {
      console.warn('Error storing API metrics:', error);
    }
  }

  /**
   * Store database metrics in database
   */
  private async storeDatabaseMetrics(metrics: DatabasePerformanceMetrics): Promise<void> {
    try {
      const { error } = await supabase
        .from('database_performance_metrics')
        .insert({
          query_type: metrics.query_type,
          execution_time_ms: metrics.execution_time_ms,
          rows_affected: metrics.rows_affected,
          table_name: metrics.table_name,
          query_hash: metrics.query_hash,
          error_message: metrics.error_message,
          timestamp: metrics.timestamp.toISOString()
        });
      
      if (error) {
        console.warn('Failed to store database metrics:', error.message);
      }
    } catch (error) {
      console.warn('Error storing database metrics:', error);
    }
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_alerts')
        .insert({
          id: alert.id,
          alert_type: alert.alert_type,
          severity: alert.severity,
          message: alert.message,
          current_value: alert.current_value,
          threshold_value: alert.threshold_value,
          triggered_at: alert.triggered_at.toISOString(),
          status: alert.status
        });
      
      if (error) {
        console.warn('Failed to store alert:', error.message);
      }
    } catch (error) {
      console.warn('Error storing alert:', error);
    }
  }

  /**
   * Update alert in database
   */
  private async updateAlert(alert: PerformanceAlert): Promise<void> {
    try {
      const { error } = await supabase
        .from('performance_alerts')
        .update({
          status: alert.status,
          resolved_at: alert.resolved_at?.toISOString()
        })
        .eq('id', alert.id);
      
      if (error) {
        console.warn('Failed to update alert:', error.message);
      }
    } catch (error) {
      console.warn('Error updating alert:', error);
    }
  }
}

// Export singleton instance
export const systemPerformanceMonitor = SystemPerformanceMonitor.getInstance();