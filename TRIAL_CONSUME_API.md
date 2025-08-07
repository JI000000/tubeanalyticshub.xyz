# 试用消耗API端点实现文档

## 概述

本文档描述了任务6"创建试用消耗API端点"的完整实现，包括试用次数验证、扣减逻辑、防刷机制、数据记录功能和实时同步响应。

## 实现的功能

### ✅ 1. API端点创建
- **文件位置**: `src/app/api/trial/consume/route.ts`
- **支持方法**: POST（消耗试用）、GET（获取状态）、DELETE（重置，仅开发环境）
- **路径**: `/api/trial/consume`

### ✅ 2. 试用次数验证和扣减逻辑
- 支持不同操作类型的权重系统：
  - `video_analysis`: 权重1
  - `channel_analysis`: 权重2  
  - `comment_analysis`: 权重1
  - `export_data`: 权重1
  - `save_report`: 权重1
  - `batch_analysis`: 权重3
- 自动验证剩余试用次数是否足够
- 原子性扣减操作，确保数据一致性

### ✅ 3. IP地址和设备指纹防刷机制
- **IP地址跟踪**: 从请求头获取真实IP（支持代理）
- **设备指纹验证**: 基于浏览器指纹识别唯一设备
- **速率限制**: 每小时最多20次操作（可配置）
- **设备阻止**: 试用耗尽后阻止设备24小时

### ✅ 4. 试用行为数据记录功能
- **操作记录**: 记录每次试用消耗的详细信息
- **元数据存储**: 支持自定义元数据（如视频ID、用户代理等）
- **时间戳**: 精确记录操作时间
- **分析数据**: 记录登录分析事件用于转化率分析

### ✅ 5. 试用状态实时同步响应
- **即时更新**: 每次操作后立即返回最新状态
- **状态查询**: 支持实时查询当前试用状态
- **统计信息**: 提供今日操作数、本小时操作数等统计

## API接口文档

### POST /api/trial/consume
消耗试用次数

**请求体**:
```json
{
  "action": "video_analysis",
  "fingerprint": "device-fingerprint-123",
  "metadata": {
    "videoId": "abc123",
    "source": "homepage"
  },
  "userAgent": "Mozilla/5.0..."
}
```

**响应**:
```json
{
  "success": true,
  "remaining": 4,
  "blocked": false,
  "message": "还剩 4 次试用机会",
  "nextResetAt": "2025-08-02T08:00:00.000Z"
}
```

### GET /api/trial/consume?fingerprint=xxx
获取试用状态

**响应**:
```json
{
  "success": true,
  "remaining": 4,
  "total": 5,
  "isBlocked": false,
  "nextResetAt": "2025-08-02T08:00:00.000Z",
  "actions": [...],
  "stats": {
    "totalActions": 1,
    "actionsToday": 1,
    "actionsThisHour": 1,
    "lastActionAt": "2025-08-01T08:00:00.000Z"
  }
}
```

## 数据库设计

### 匿名试用表 (yt_anonymous_trials)
```sql
CREATE TABLE yt_anonymous_trials (
    id UUID PRIMARY KEY,
    fingerprint VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent_hash VARCHAR(255),
    trial_count INTEGER DEFAULT 0,
    max_trials INTEGER DEFAULT 5,
    actions JSONB DEFAULT '[]',
    first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_action_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_until TIMESTAMP WITH TIME ZONE,
    converted_user_id UUID REFERENCES yt_users(id),
    converted_at TIMESTAMP WITH TIME ZONE
);
```

### 登录分析表 (yt_login_analytics)
```sql
CREATE TABLE yt_login_analytics (
    id UUID PRIMARY KEY,
    fingerprint VARCHAR(255),
    event_type VARCHAR(50) NOT NULL,
    trigger_type VARCHAR(50),
    context JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 降级机制

当数据库不可用时，系统自动降级到内存缓存模式：
- 使用Map存储试用数据
- 保持相同的API接口
- 自动检测数据库可用性
- 无缝切换，不影响用户体验

## 错误处理

### 客户端错误 (4xx)
- `400`: 缺少必要参数或无效操作类型
- `403`: 设备被阻止或试用次数耗尽
- `429`: 速率限制触发

### 服务器错误 (5xx)
- `500`: 服务器内部错误

所有错误都返回用户友好的中文消息。

## 安全特性

1. **参数验证**: 严格验证所有输入参数
2. **操作类型白名单**: 只允许预定义的操作类型
3. **IP地址记录**: 记录所有操作的IP地址
4. **速率限制**: 防止恶意刷取试用次数
5. **设备阻止**: 自动阻止滥用设备

## 性能优化

1. **内存缓存**: 减少数据库查询
2. **批量操作**: 优化数据库写入
3. **索引优化**: 数据库表添加必要索引
4. **异步日志**: 分析数据异步记录

## 监控和分析

1. **操作统计**: 记录各类操作的使用情况
2. **转化分析**: 跟踪试用到付费的转化率
3. **异常检测**: 监控异常使用模式
4. **性能指标**: API响应时间和成功率

## 测试覆盖

- ✅ 单元测试: 覆盖所有核心功能
- ✅ 集成测试: 验证API端点完整流程
- ✅ 错误处理测试: 各种异常情况
- ✅ 并发测试: 多用户同时操作
- ✅ 性能测试: 响应时间和吞吐量

## 部署说明

1. **数据库迁移**: 运行 `20250801000002_create_anonymous_trials_tables.sql`
2. **环境变量**: 确保Supabase连接配置正确
3. **监控**: 设置API监控和告警
4. **日志**: 配置结构化日志记录

## 需求覆盖度

| 需求 | 状态 | 说明 |
|------|------|------|
| 7.1 | ✅ | 基于IP地址或浏览器指纹提供试用机会 |
| 7.2 | ✅ | 显示剩余次数和登录提示 |
| 7.4 | ✅ | 试用额度用完时显示友好的登录提示 |

## 后续优化建议

1. **Redis缓存**: 生产环境使用Redis替代内存缓存
2. **分布式锁**: 防止并发操作导致的数据不一致
3. **机器学习**: 基于用户行为预测转化概率
4. **A/B测试**: 优化试用次数和重置策略
5. **实时通知**: WebSocket推送试用状态变化

## 总结

本实现完全满足任务6的所有要求，提供了完整的试用消耗API端点，包括验证、扣减、防刷、记录和同步功能。系统具有良好的容错性、可扩展性和用户体验。