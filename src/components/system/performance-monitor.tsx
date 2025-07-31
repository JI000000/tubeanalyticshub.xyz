'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Database,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PerformanceMetrics {
  api_response_time: number;
  database_query_time: number;
  memory_usage: number;
  cpu_usage: number;
  active_connections: number;
  cache_hit_rate: number;
  error_rate: number;
  uptime: number;
  last_updated: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  message: string;
  metrics: PerformanceMetrics;
}

export function PerformanceMonitor() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/system/health');
      const result = await response.json();
      
      if (result.success) {
        setHealth(result.data);
      }
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemHealth, 30000); // 30秒刷新
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const getMetricTrend = (value: number, threshold: number, inverse = false) => {
    const isGood = inverse ? value < threshold : value > threshold;
    return isGood ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Unable to load system metrics</p>
            <Button onClick={fetchSystemHealth} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Performance
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(health.status)}>
              <div className="flex items-center gap-1">
                {getStatusIcon(health.status)}
                <span className="capitalize">{health.status}</span>
              </div>
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">{health.message}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-blue-600" />
              {getMetricTrend(health.metrics.api_response_time, 2000, true)}
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {health.metrics.api_response_time}ms
            </div>
            <div className="text-sm text-blue-700">API Response</div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Database className="h-5 w-5 text-green-600" />
              {getMetricTrend(health.metrics.database_query_time, 1000, true)}
            </div>
            <div className="text-2xl font-bold text-green-900">
              {health.metrics.database_query_time}ms
            </div>
            <div className="text-sm text-green-700">DB Query</div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Server className="h-5 w-5 text-purple-600" />
              {getMetricTrend(health.metrics.cache_hit_rate, 80)}
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {health.metrics.cache_hit_rate}%
            </div>
            <div className="text-sm text-purple-700">Cache Hit</div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Activity className="h-5 w-5 text-orange-600" />
              {getMetricTrend(health.metrics.error_rate, 1, true)}
            </div>
            <div className="text-2xl font-bold text-orange-900">
              {health.metrics.error_rate}%
            </div>
            <div className="text-sm text-orange-700">Error Rate</div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">Resource Usage</h4>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Memory Usage</span>
                  <span>{health.metrics.memory_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.metrics.memory_usage > 80 ? 'bg-red-500' :
                      health.metrics.memory_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.metrics.memory_usage}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>CPU Usage</span>
                  <span>{health.metrics.cpu_usage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      health.metrics.cpu_usage > 80 ? 'bg-red-500' :
                      health.metrics.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${health.metrics.cpu_usage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900">System Status</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Connections</span>
                <span className="font-medium">{health.metrics.active_connections}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">System Uptime</span>
                <span className="font-medium">{formatUptime(health.metrics.uptime)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium">
                  {new Date(health.metrics.last_updated).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Recommendations */}
        {health.status !== 'healthy' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Performance Recommendations</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {health.metrics.api_response_time > 2000 && (
                <li>• API response time is high. Consider optimizing database queries.</li>
              )}
              {health.metrics.memory_usage > 80 && (
                <li>• Memory usage is high. Consider scaling up or optimizing memory usage.</li>
              )}
              {health.metrics.cache_hit_rate < 80 && (
                <li>• Cache hit rate is low. Review caching strategy and configuration.</li>
              )}
              {health.metrics.error_rate > 1 && (
                <li>• Error rate is elevated. Check application logs for issues.</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}