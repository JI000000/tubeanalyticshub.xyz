'use client';

import { useState } from 'react';
import { useSmartAuth } from '@/hooks/useSmartAuth';
import { useLogout } from '@/hooks/useLogout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LogoutConfirmationDialog, useLogoutConfirmation } from '@/components/auth/LogoutConfirmationDialog';
import { UserProfile } from '@/components/auth/UserProfile';
import { 
  LogOut, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock,
  User,
  Settings,
  Save,
  Trash2
} from 'lucide-react';

export default function TestLogoutPage() {
  const { user, isAuthenticated } = useSmartAuth();
  const [testResults, setTestResults] = useState<Array<{
    test: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: Date;
  }>>([]);

  // 登出Hook测试
  const {
    isLoggingOut,
    logout,
    silentLogout,
    logoutWithConfirmation,
    preLogoutCheck,
    getConfirmationMessage,
    recordLogoutIntent,
  } = useLogout({
    defaultRedirectUrl: '/test-logout',
    autoConfirm: false,
    checkUnsavedData: true,
    onLogoutSuccess: (result) => {
      addTestResult('Logout Success Callback', 'success', `Logout completed: ${JSON.stringify(result)}`);
    },
    onLogoutError: (error) => {
      addTestResult('Logout Error Callback', 'error', `Logout failed: ${error}`);
    },
  });

  // 确认对话框Hook测试
  const {
    isOpen: isConfirmationOpen,
    isLoggingOut: isConfirmationLoggingOut,
    dialogProps,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    confirmLogout,
  } = useLogoutConfirmation();

  // 模拟数据状态
  const [hasUnsavedData, setHasUnsavedData] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);

  const addTestResult = (test: string, status: 'success' | 'error' | 'pending', message: string) => {
    setTestResults(prev => [...prev, {
      test,
      status,
      message,
      timestamp: new Date(),
    }]);
  };

  // 模拟保存未保存数据到localStorage
  const simulateUnsavedData = () => {
    if (hasUnsavedData) {
      localStorage.setItem('draft_reports', JSON.stringify({ report: 'test data' }));
      localStorage.setItem('unsaved_analysis', JSON.stringify({ analysis: 'test analysis' }));
    } else {
      localStorage.removeItem('draft_reports');
      localStorage.removeItem('unsaved_analysis');
    }
  };

  // 模拟进行中的操作
  const simulateInProgressOperation = () => {
    if (isInProgress) {
      sessionStorage.setItem('current_analysis', JSON.stringify({ status: 'processing' }));
    } else {
      sessionStorage.removeItem('current_analysis');
    }
  };

  // 测试预登出检查
  const testPreLogoutCheck = async () => {
    addTestResult('Pre-logout Check', 'pending', 'Running pre-logout check...');
    
    try {
      simulateUnsavedData();
      simulateInProgressOperation();
      
      const result = await preLogoutCheck();
      addTestResult('Pre-logout Check', 'success', 
        `Check completed: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addTestResult('Pre-logout Check', 'error', 
        `Check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 测试登出意图记录
  const testRecordLogoutIntent = async () => {
    addTestResult('Record Logout Intent', 'pending', 'Recording logout intent...');
    
    try {
      await recordLogoutIntent('test_intent');
      addTestResult('Record Logout Intent', 'success', 'Intent recorded successfully');
    } catch (error) {
      addTestResult('Record Logout Intent', 'error', 
        `Intent recording failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 测试确认消息生成
  const testConfirmationMessage = () => {
    const message = getConfirmationMessage(hasUnsavedData, isInProgress);
    addTestResult('Confirmation Message', 'success', `Generated message: "${message}"`);
  };

  // 测试简单登出
  const testSimpleLogout = async () => {
    addTestResult('Simple Logout', 'pending', 'Initiating simple logout...');
    
    try {
      const result = await logout({
        reason: 'user_initiated',
        metadata: { test: 'simple_logout' },
      });
      
      if (result.success) {
        addTestResult('Simple Logout', 'success', 'Logout completed successfully');
      } else {
        addTestResult('Simple Logout', 'error', `Logout failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult('Simple Logout', 'error', 
        `Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 测试静默登出
  const testSilentLogout = async () => {
    addTestResult('Silent Logout', 'pending', 'Initiating silent logout...');
    
    try {
      const result = await silentLogout('session_expired', '/test-logout');
      
      if (result.success) {
        addTestResult('Silent Logout', 'success', 'Silent logout completed successfully');
      } else {
        addTestResult('Silent Logout', 'error', `Silent logout failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult('Silent Logout', 'error', 
        `Silent logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 测试带确认的登出
  const testLogoutWithConfirmation = async () => {
    addTestResult('Logout with Confirmation', 'pending', 'Initiating logout with confirmation...');
    
    try {
      simulateUnsavedData();
      simulateInProgressOperation();
      
      const result = await logoutWithConfirmation({
        reason: 'user_initiated',
        metadata: { test: 'confirmation_logout' },
      });
      
      if (result.success) {
        addTestResult('Logout with Confirmation', 'success', 'Confirmation logout completed successfully');
      } else {
        addTestResult('Logout with Confirmation', 'error', `Confirmation logout failed: ${result.error}`);
      }
    } catch (error) {
      addTestResult('Logout with Confirmation', 'error', 
        `Confirmation logout error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 测试自定义确认对话框
  const testCustomConfirmationDialog = async () => {
    addTestResult('Custom Confirmation Dialog', 'pending', 'Showing custom confirmation dialog...');
    
    try {
      simulateUnsavedData();
      simulateInProgressOperation();
      
      const checkResult = await preLogoutCheck();
      
      showLogoutConfirmation({
        user: {
          name: user?.name,
          email: user?.email || '',
          image: user?.image,
        },
        warnings: checkResult.warnings,
        hasUnsavedData: checkResult.hasUnsavedData,
        isInProgress: checkResult.isInProgress,
        customMessage: 'This is a test logout confirmation',
        reason: 'user_initiated',
        onConfirm: async () => {
          await confirmLogout(async () => {
            addTestResult('Custom Confirmation Dialog', 'success', 'Custom dialog confirmed and logout initiated');
            await logout({
              reason: 'user_initiated',
              metadata: { test: 'custom_dialog' },
            });
          });
        },
      });
      
      addTestResult('Custom Confirmation Dialog', 'success', 'Custom dialog shown successfully');
    } catch (error) {
      addTestResult('Custom Confirmation Dialog', 'error', 
        `Custom dialog error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 清理测试结果
  const clearTestResults = () => {
    setTestResults([]);
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              登出功能测试
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                请先登录以测试登出功能。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            登出功能测试
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              这是登出功能的测试页面。请注意，某些测试可能会实际执行登出操作。
            </AlertDescription>
          </Alert>

          {/* 用户信息 */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">当前用户</h3>
            <UserProfile variant="full" />
          </div>

          {/* 测试状态控制 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasUnsavedData}
                  onChange={(e) => setHasUnsavedData(e.target.checked)}
                />
                <Save className="w-4 h-4" />
                模拟未保存数据
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isInProgress}
                  onChange={(e) => setIsInProgress(e.target.checked)}
                />
                <Clock className="w-4 h-4" />
                模拟进行中操作
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isLoggingOut ? 'destructive' : 'secondary'}>
                {isLoggingOut ? '正在登出' : '空闲'}
              </Badge>
              {isConfirmationOpen && (
                <Badge variant="outline">确认对话框已打开</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 测试按钮 */}
      <Card>
        <CardHeader>
          <CardTitle>测试功能</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button onClick={testPreLogoutCheck} variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              预登出检查
            </Button>
            
            <Button onClick={testRecordLogoutIntent} variant="outline">
              <Save className="w-4 h-4 mr-2" />
              记录登出意图
            </Button>
            
            <Button onClick={testConfirmationMessage} variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              生成确认消息
            </Button>
            
            <Button onClick={testCustomConfirmationDialog} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              自定义确认对话框
            </Button>
            
            <Button onClick={testSimpleLogout} variant="secondary" disabled={isLoggingOut}>
              <LogOut className="w-4 h-4 mr-2" />
              简单登出
            </Button>
            
            <Button onClick={testSilentLogout} variant="secondary" disabled={isLoggingOut}>
              <XCircle className="w-4 h-4 mr-2" />
              静默登出
            </Button>
            
            <Button onClick={testLogoutWithConfirmation} variant="destructive" disabled={isLoggingOut}>
              <AlertTriangle className="w-4 h-4 mr-2" />
              确认登出
            </Button>
            
            <Button onClick={clearTestResults} variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              清理结果
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>测试结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-shrink-0 mt-0.5">
                    {result.status === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                    {result.status === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                    {result.status === 'pending' && <Clock className="w-4 h-4 text-yellow-500 animate-spin" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.test}</span>
                      <Badge 
                        variant={
                          result.status === 'success' ? 'default' : 
                          result.status === 'error' ? 'destructive' : 
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {result.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 break-words">{result.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {result.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 登出确认对话框 */}
      <LogoutConfirmationDialog
        open={isConfirmationOpen}
        onClose={hideLogoutConfirmation}
        onConfirm={dialogProps.onConfirm || (() => {})}
        isLoggingOut={isConfirmationLoggingOut}
        {...dialogProps}
      />
    </div>
  );
}