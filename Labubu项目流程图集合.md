# Labubu 手电筒效果项目 - 流程图集合

## 📋 文档说明
本文档包含Labubu手电筒效果项目的所有关键流程图，用于技术实现、架构设计和开发指导。

---

## 🎯 1. 用户操作流程图

```mermaid
graph TD
    A[用户访问应用] --> B[文件上传模块]
    B --> C{文件验证}
    C -->|通过| D[Canvas图像渲染]
    C -->|失败| E[错误提示重试]
    E --> B
    
    D --> F[手电筒效果编辑]
    F --> G[光照区域设置]
    G --> H[动画路径设计]
    H --> I[实时预览]
    
    I --> J{用户满意?}
    J -->|否| F
    J -->|是| K[GIF导出设置]
    
    K --> L[帧序列生成]
    L --> M[GIF压缩优化]
    M --> N[文件下载]
    
    style A fill:#e1f5fe
    style N fill:#c8e6c9
    style C fill:#fff3e0
    style J fill:#fff3e0
```

**流程说明**:
- 用户从文件上传开始，经过验证后进入编辑模式
- 编辑包括手电筒效果设置、动画路径设计和实时预览
- 满意后进入GIF导出流程，最终下载成品

---

## 🏗️ 2. 技术架构图

```mermaid
graph TB
    subgraph "前端架构 (Next.js + React)"
        A1[Next.js App Router]
        A2[ShadCN UI 组件库]
        A3[Canvas/Konva 渲染引擎]
        A4[Zustand 状态管理]
        A5[GIF.js 导出引擎]
    end
    
    subgraph "后端架构 (Serverless)"
        B1[Next.js API Routes]
        B2[Vercel Serverless Functions]
        B3[Sharp 图像处理]
        B4[Vercel Blob Storage]
    end
    
    subgraph "基础设施 (Vercel Platform)"
        C1[Vercel Edge Network]
        C2[Vercel Analytics]
        C3[GitHub Actions CI/CD]
        C4[Sentry 错误监控]
    end
    
    A1 --> B1
    A3 --> A5
    A4 --> A3
    A2 --> A1
    
    B1 --> B3
    B1 --> B4
    B2 --> B1
    
    B1 --> C1
    A1 --> C2
    C3 --> C1
    C4 --> A1
    
    style A1 fill:#bbdefb
    style B1 fill:#c8e6c9
    style C1 fill:#ffe0b2
```

**架构说明**:
- **前端**: 基于Next.js的React应用，使用ShadCN UI和Canvas渲染
- **后端**: Serverless架构，基于Next.js API Routes
- **基础设施**: 完全基于Vercel平台的现代化部署

---

## 🔄 3. 数据交互时序图

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端应用
    participant API as API Routes
    participant S as 存储服务
    participant C as Canvas引擎
    participant G as GIF生成器

    U->>F: 1. 上传图片文件
    F->>API: 2. POST /api/upload
    API->>S: 3. 存储到 Vercel Blob
    S-->>API: 4. 返回文件URL
    API-->>F: 5. 返回处理结果
    
    F->>C: 6. 加载图片到Canvas
    U->>F: 7. 设计手电筒效果
    F->>C: 8. 渲染光照效果
    U->>F: 9. 创建动画路径
    F->>C: 10. 播放动画预览
    
    U->>F: 11. 开始GIF导出
    F->>G: 12. 初始化GIF生成器
    
    loop 帧序列生成
        F->>C: 13. 渲染动画帧
        C-->>F: 14. 返回帧数据
        F->>G: 15. 添加帧到GIF
    end
    
    G->>F: 16. 生成完成的GIF
    F->>U: 17. 提供下载链接
```

**交互说明**:
- 文件上传流程：前端→API→存储→返回URL
- 编辑流程：用户操作→Canvas渲染→实时预览
- 导出流程：帧生成循环→GIF合成→下载

---

## 🎨 4. Canvas渲染架构图

```mermaid
graph TB
    subgraph "Canvas渲染架构"
        subgraph "Stage容器"
            L1[背景图层 - Background Layer]
            L2[遮罩图层 - Mask Layer]
            L3[光照图层 - Light Layer]
            L4[UI交互图层 - UI Layer]
        end
        
        subgraph "光照效果处理"
            E1[径向渐变生成]
            E2[光照区域计算]
            E3[合成模式处理]
            E4[动画插值计算]
        end
        
        subgraph "性能优化"
            P1[内存管理]
            P2[帧率控制]
            P3[降级策略]
            P4[缓存机制]
        end
    end
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    
    E1 --> L3
    E2 --> L3
    E3 --> L3
    E4 --> L3
    
    P1 --> L1
    P2 --> E4
    P3 --> E1
    P4 --> L1
    
    style L1 fill:#e3f2fd
    style L3 fill:#fff3e0
    style P1 fill:#f3e5f5
```

**渲染架构说明**:
- **图层管理**: 背景、遮罩、光照、UI四层结构
- **光照处理**: 径向渐变、区域计算、合成模式
- **性能优化**: 内存管理、帧率控制、降级策略

---

## 🚀 5. 部署架构图

```mermaid
graph TB
    subgraph "用户端"
        U1[桌面浏览器]
        U2[移动浏览器]
        U3[平板设备]
    end
    
    subgraph "Vercel Edge Network"
        CDN[全球CDN节点]
        EDGE[Edge Functions]
    end
    
    subgraph "Vercel Platform"
        subgraph "前端部署"
            NEXT[Next.js 应用]
            STATIC[静态资源]
        end
        
        subgraph "后端服务"
            API[API Routes]
            FUNC[Serverless Functions]
        end
        
        subgraph "存储服务"
            BLOB[Vercel Blob Storage]
            CACHE[Edge Cache]
        end
        
        subgraph "监控服务"
            ANALYTICS[Vercel Analytics]
            LOGS[应用日志]
        end
    end
    
    subgraph "第三方服务"
        SENTRY[Sentry 错误监控]
        GITHUB[GitHub 代码仓库]
    end
    
    U1 --> CDN
    U2 --> CDN
    U3 --> CDN
    
    CDN --> NEXT
    CDN --> STATIC
    CDN --> EDGE
    
    NEXT --> API
    API --> FUNC
    API --> BLOB
    
    FUNC --> CACHE
    BLOB --> CACHE
    
    NEXT --> ANALYTICS
    API --> LOGS
    
    LOGS --> SENTRY
    GITHUB --> NEXT
    
    style CDN fill:#e1f5fe
    style NEXT fill:#c8e6c9
    style BLOB fill:#fff3e0
    style SENTRY fill:#ffebee
```

**部署架构说明**:
- **用户接入**: 多端设备通过CDN访问
- **核心服务**: Next.js应用+API Routes+存储
- **监控体系**: Analytics+日志+错误监控

---

## 📊 6. 状态管理架构图

```mermaid
graph TD
    subgraph "Zustand Store状态管理"
        subgraph "编辑器状态"
            S1[背景图片状态]
            S2[图片变换状态]
            S3[手电筒配置]
            S4[动画路径数据]
        end
        
        subgraph "UI状态"
            U1[工具栏状态]
            U2[预览窗口状态]
            U3[进度指示器]
            U4[错误消息状态]
        end
        
        subgraph "导出状态"
            E1[GIF参数配置]
            E2[导出进度]
            E3[生成队列]
            E4[下载状态]
        end
    end
    
    subgraph "组件层"
        C1[上传组件]
        C2[Canvas组件]
        C3[控制面板]
        C4[预览组件]
        C5[导出组件]
    end
    
    C1 --> S1
    C2 --> S2
    C2 --> S3
    C3 --> S4
    C4 --> U2
    C5 --> E1
    
    S1 --> C2
    S2 --> C2
    S3 --> C2
    S4 --> C4
    
    E2 --> U3
    E4 --> U4
    
    style S1 fill:#e8f5e8
    style E1 fill:#fff3e0
    style C2 fill:#e3f2fd
```

**状态管理说明**:
- **编辑器状态**: 图片、变换、手电筒、动画数据
- **UI状态**: 工具栏、预览、进度、错误信息
- **导出状态**: GIF参数、进度、队列、下载

---

## 📚 图表使用指南

### 🎯 开发阶段使用
1. **需求分析**: 参考用户操作流程图
2. **架构设计**: 参考技术架构图和部署架构图
3. **功能开发**: 参考Canvas渲染架构图和状态管理图
4. **接口设计**: 参考数据交互时序图

### 🔧 实施阶段使用
1. **前端开发**: Canvas架构图+状态管理图
2. **后端开发**: 技术架构图+数据交互图
3. **部署运维**: 部署架构图
4. **测试验证**: 用户操作流程图

### 📖 文档维护
- 每个功能模块完成后更新对应流程图
- 架构变更时及时同步图表内容
- 定期review图表的准确性和完整性

---

## 🔗 相关文档链接
- [技术实现方案详细文档]
- [TODO任务清单]
- [API接口文档]
- [部署配置文档]

---

**文档版本**: v1.0  
**创建时间**: 2024年1月  
**维护团队**: Labubu Studio开发团队 