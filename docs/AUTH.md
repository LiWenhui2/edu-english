# 认证系统设计文档（Enterprise-Grade Auth System）

> 本文档描述一套本项目的认证系统设计方案，涵盖 **Access Token / Refresh Token 双 Token 机制、Refresh Token 轮换（Rotate + 重放检测）、Redis + DB 双层过期控制、降级策略、目录结构规范与 Redis Key 规范**。

------

## 1. 设计目标

### 1.1 核心目标

- 高安全性（可撤销、可轮换、防重放）
- 高可用性（Redis 故障不影响登录）
- 高可维护性（职责清晰、模块解耦）
- 可审计（会话可追踪、可失效）

### 1.2 非目标

- 不追求极简 Demo
- 不采用“纯 JWT 无状态认证”方案

------

## 2. 整体架构

```
Client
  │
  │ accessToken (短期)
  │ refreshToken (长期)
  ▼
Auth Controller
  │
  ▼
Auth Service
  │
  ├── AccessTokenService
  ├── RefreshTokenService
  └── UserSessionService
        │
        ├── Redis（缓存 / 风控）
        └── DB（权威状态）
```

------

## 3. Token 设计

### 3.1 Access Token

- 形式：JWT
- 有效期：15~30 分钟
- 存储：**不落库**
- 用途：接口鉴权

Payload 示例：

```json
{
  "sub": "userId",
  "username": "xxx",
  "iat": 1700000000,
  "exp": 1700001800
}
```

------

### 3.2 Refresh Token

- 形式：随机字符串（Opaque Token）
- 有效期：60 天
- 存储方式：
  - 客户端：明文
  - 服务端：**hash 后存储**

> Refresh Token **不携带任何业务信息**，生命周期完全由服务端控制。

------

## 4. 用户会话模型（User Session）

### 4.1 数据表设计

```sql
user_sessions
(
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  refresh_token_hash TEXT NOT NULL,
  refresh_expires_at TIMESTAMP NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)
```

### 4.2 设计原则

- 一条 session = 一个 refresh token
- DB 是 **最终权威来源**
- Redis 仅作为缓存和风控层

------

## 5. Refresh Token 轮换（Rotate）机制

### 5.1 为什么需要轮换

- 防止 refresh token 泄露后长期有效
- 防止中间人重放攻击

------

### 5.2 标准轮换流程

```
1. 客户端携带 refreshToken 请求刷新
2. 服务端 hash(refreshToken)
3. 检查 Redis：token 是否已使用（重放检测）
4. 查 Redis / DB 获取 session
5. 校验 refreshExpiresAt
6. 标记旧 refreshToken 已使用
7. 生成新 refreshToken
8. 更新 DB 中的 tokenHash
9. 写入 Redis
10. 返回新 accessToken + refreshToken
```

------

### 5.3 重放检测（Replay Detection）

- Redis Key：

```text
auth:refresh:used:{tokenHash}
```

- 若命中：
  - 直接拒绝请求
  - 可触发安全告警

------

## 6. Redis + DB 双层控制策略

### 6.1 职责划分

| 层级  | 职责                     |
| ----- | ------------------------ |
| DB    | 会话权威、过期判断、撤销 |
| Redis | 加速查询、重放检测、限流 |

------

### 6.2 Redis Key 规范

#### 命名规则

```
<系统>:<模块>:<资源>:<唯一标识>
```

#### Auth 模块 Key 列表

| Key                           | 含义                | TTL        |
| ----------------------------- | ------------------- | ---------- |
| auth:refresh:{tokenHash}      | refresh → sessionId | 剩余有效期 |
| auth:refresh:used:{tokenHash} | token 是否已使用    | 同上       |
| auth:rate:refresh:{userId}    | 刷新频率限制        | 60s        |

------

## 7. Redis 降级策略

### 7.1 设计原则

> Redis 是 **加速器，不是单点依赖**

- Redis 不可用时：
  - 系统性能下降
  - **业务不中断**

------

### 7.2 实现策略

- Redis 操作全部 try/catch
- Redis 失败返回 null / false
- Auth 层自动 fallback DB

```ts
const sessionId = await redis.getRefreshSession(hash);
if (!sessionId) {
  session = await db.findByTokenHash(hash);
}
```

------

### 7.3 安全取舍说明

| 能力       | Redis 可用 | Redis 不可用 |
| ---------- | ---------- | ------------ |
| 过期校验   | ✅          | ✅            |
| Token 轮换 | ✅          | ✅            |
| 重放检测   | ✅          | 降级         |
| 用户体验   | 正常       | 正常         |

> 原则：**宁可放过攻击，也不误伤用户**

------

## 8. 模块与目录结构规范

```text
src/
├── modules/
│   └── auth/
│       ├── auth.controller.ts
│       ├── auth.service.ts
│       ├── auth.module.ts
│       ├── dto/
│       ├── token/
│       ├── session/
│       └── strategies/
│
├── infrastructure/
│   └── redis/
│       ├── redis.module.ts
│       ├── redis.service.ts
│       └── redis.keys.ts
```

------

## 9. 安全最佳实践（Checklist）

-  refresh token 仅 hash 存储
-  refresh token 可撤销
-  refresh token 单次使用（Rotate）
-  Redis 故障可降级
-  Access Token 短有效期
-  会话可审计

------

## 10. 总结

本认证系统具备以下企业级特性：

- 双 Token 安全模型
- Refresh Token 轮换 + 重放检测
- DB + Redis 双层控制
- 高可用降级策略
- 清晰的模块与职责边界

> **该方案可直接用于生产环境，并满足系统的认证安全要求。**

------

## 11. 后续可扩展方向

- 登录设备指纹识别
- 异地登录告警
- Session 并发数控制
- 风控与审计日志系统