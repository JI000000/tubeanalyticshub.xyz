'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, LogOut, X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// 登出确认对话框属性
export interface LogoutConfirmationDialogProps {
  /** 是否显示对话框 */
  open: boolean;
  /** 关闭对话框回调 */
  onClose: () => void;
  /** 确认登出回调 */
  onConfirm: () => void;
  /** 是否正在登出 */
  isLoggingOut?: boolean;
  /** 用户信息 */
  user?: {
    name?: string | null;
    email?: string;
    image?: string | null;
  };
  /** 警告信息 */
  warnings?: string[];
  /** 是否有未保存数据 */
  hasUnsavedData?: boolean;
  /** 是否有进行中的操作 */
  isInProgress?: boolean;
  /** 自定义确认消息 */
  customMessage?: string;
  /** 登出原因 */
  reason?: 'user_initiated' | 'session_expired' | 'security' | 'admin_action';
}

/**
 * 登出确认对话框组件
 */
export function LogoutConfirmationDialog({
  open,
  onClose,
  onConfirm,
  isLoggingOut = false,
  user,
  warnings = [],
  hasUnsavedData = false,
  isInProgress = false,
  customMessage,
  reason = 'user_initiated',
}: LogoutConfirmationDialogProps) {
  const [countdown, setCountdown] = useState<number | null>(null);

  // 根据登出原因获取标题和描述
  const getDialogContent = () => {
    switch (reason) {
      case 'session_expired':
        return {
          title: '会话已过期',
          description: '您的登录会话已过期，需要重新登录。',
          confirmText: '重新登录',
          variant: 'warning' as const,
        };
      case 'security':
        return {
          title: '安全登出',
          description: '出于安全考虑，您的账户已被登出。',
          confirmText: '确定',
          variant: 'destructive' as const,
        };
      case 'admin_action':
        return {
          title: '管理员操作',
          description: '管理员已将您的账户登出。',
          confirmText: '确定',
          variant: 'destructive' as const,
        };
      default:
        return {
          title: '确认退出登录',
          description: customMessage || '您确定要退出登录吗？',
          confirmText: '退出登录',
          variant: 'default' as const,
        };
    }
  };

  const dialogContent = getDialogContent();

  // 对于非用户主动登出，显示倒计时自动确认
  useEffect(() => {
    if (open && reason !== 'user_initiated' && !isLoggingOut) {
      setCountdown(10); // 10秒倒计时
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(timer);
            onConfirm();
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [open, reason, isLoggingOut, onConfirm]);

  // 重置倒计时当对话框关闭时
  useEffect(() => {
    if (!open) {
      setCountdown(null);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {reason === 'user_initiated' ? (
              <LogOut className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            )}
            {dialogContent.title}
          </DialogTitle>
          <DialogDescription>
            {dialogContent.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 用户信息显示 */}
          {user && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-medium text-sm">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.name || '用户'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
            </div>
          )}

          {/* 警告信息 */}
          {warnings.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">请注意：</p>
                  <ul className="text-sm space-y-1">
                    {warnings.map((warning, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-current rounded-full" />
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* 状态标识 */}
          {(hasUnsavedData || isInProgress) && (
            <div className="flex gap-2">
              {hasUnsavedData && (
                <Badge variant="outline" className="text-amber-600 border-amber-200">
                  <Save className="w-3 h-3 mr-1" />
                  未保存数据
                </Badge>
              )}
              {isInProgress && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  进行中
                </Badge>
              )}
            </div>
          )}

          {/* 倒计时显示 */}
          {countdown !== null && (
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                将在 <span className="font-bold text-lg">{countdown}</span> 秒后自动确认
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {/* 取消按钮 - 只在用户主动登出时显示 */}
          {reason === 'user_initiated' && (
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoggingOut}
            >
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
          )}

          {/* 确认按钮 */}
          <Button
            variant={dialogContent.variant === 'destructive' ? 'destructive' : 'default'}
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="min-w-[120px]"
          >
            {isLoggingOut ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                正在退出...
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 mr-2" />
                {dialogContent.confirmText}
                {countdown !== null && ` (${countdown})`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 便捷Hook用于管理登出确认对话框
export function useLogoutConfirmation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [dialogProps, setDialogProps] = useState<Partial<LogoutConfirmationDialogProps>>({});

  const showLogoutConfirmation = (props: Partial<LogoutConfirmationDialogProps> = {}) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  const hideLogoutConfirmation = () => {
    setIsOpen(false);
    setIsLoggingOut(false);
    setDialogProps({});
  };

  const confirmLogout = async (onConfirm?: () => Promise<void> | void) => {
    if (onConfirm) {
      setIsLoggingOut(true);
      try {
        await onConfirm();
      } finally {
        setIsLoggingOut(false);
        hideLogoutConfirmation();
      }
    } else {
      hideLogoutConfirmation();
    }
  };

  return {
    isOpen,
    isLoggingOut,
    dialogProps,
    showLogoutConfirmation,
    hideLogoutConfirmation,
    confirmLogout,
  };
}