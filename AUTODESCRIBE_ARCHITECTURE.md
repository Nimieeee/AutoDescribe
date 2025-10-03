# AutoDescribe System Architecture

## High-Level Architecture Diagram

```mermaid
graph TB
    %% User Layer
    subgraph "User Interface Layer"
        UI[Web Application<br/>Next.js 14 + Tailwind CSS]
        MOB[Mobile App<br/>Future: React Native]
    end

    %% CDN & Load Balancing
    subgraph "Content Delivery"
        CDN[Netlify CDN<br/>Global Edge Network]
        LB[Load Balancer<br/>Auto-scaling]
    end

    %% Application Layer
    subgraph "Application Services"
        API[REST API Server<br/>Node.js + Express]
        AUTH[Authentication<br/>Supabase Auth]
        MIDDLEWARE[KPI Tracking<br/>Middleware]
    end

    %% AI & ML Layer
    subgraph "AI/ML Services"
        MISTRAL[Mistral AI<br/>Large Language Model]
        RAG[RAG Engine<br/>Retrieval-Augmented Generation]
        EVAL[Quality Evaluator<br/>5-Dimensional Scoring]
        EMBED[Embedding Service<br/>Semantic Search]
    end

    %% Data Layer
    subgraph "Data Storage"
        DB[(Supabase PostgreSQL<br/>Primary Database)]
        CSV[(Product Catalog<br/>CSV Database)]
        CACHE[(Redis Cache<br/>Performance Layer)]
    end

    %% Analytics & Monitoring
    subgraph "Analytics & Monitoring"
        KPI[KPI Dashboard<br/>Real-time Analytics]
        METRICS[Performance Metrics<br/>System Health]
        ALERTS[Alert System<br/>Threshold Monitoring]
    end

    %% External Integrations
    subgraph "External Services"
        SHOP[E-commerce Platforms<br/>Shopify, WooCommerce]
        WEBHOOK[Webhook Endpoints<br/>Event Notifications]
        API_EXT[External APIs<br/>Third-party Integrations]
    end

    %% Connections
    UI --> CDN
    MOB --> CDN
    CDN --> LB
    LB --> API
    API --> AUTH
    API --> MIDDLEWARE
    API --> RAG
    API --> EVAL
    
    RAG --> MISTRAL
    RAG --> EMBED
    RAG --> CSV
    
    EVAL --> DB
    MIDDLEWARE --> KPI
    KPI --> METRICS
    METRICS --> ALERTS
    
    API --> DB
    API --> CACHE
    
    API --> SHOP
    API --> WEBHOOK
    API --> API_EXT

    %% Styling
    classDef userLayer fill:#e1f5fe
    classDef appLayer fill:#f3e5f5
    classDef aiLayer fill:#fff3e0
    classDef dataLayer fill:#e8f5e8
    classDef analyticsLayer fill:#fff8e1
    classDef externalLayer fill:#fce4ec

    class UI,MOB userLayer
    class API,AUTH,MIDDLEWARE appLayer
    class MISTRAL,RAG,EVAL,EMBED aiLayer
    class DB,CSV,CACHE dataLayer
    class KPI,METRICS,ALERTS analyticsLayer
    class SHOP,WEBHOOK,API_EXT externalLayer
```

## Detailed Component Architecture

### Frontend Architecture (Next.js 14)

```mermaid
graph TB
    subgraph "Frontend Application"
        subgraph "Pages & Routes"
            DASH[Dashboard<br/>/]
            GEN[Generate<br/>/generate]
            REV[Review<br/>/review]
            KPI_PAGE[KPIs<br/>/kpis]
            SUCCESS[Success Criteria<br/>/success-criteria]
        end
        
        subgraph "Components"
            NAV[Navigation<br/>Global Header]
            UI_COMP[UI Components<br/>Buttons, Cards, Forms]
            ICONS[Icon System<br/>Lucide React]
        end
        
        subgraph "State Management"
            HOOKS[React Hooks<br/>useState, useEffect]
            CONTEXT[Context API<br/>Global State]
            KPI_CLIENT[KPI Client<br/>Analytics Tracking]
        end
        
        subgraph "Services"
            SUPABASE_CLIENT[Supabase Client<br/>Database Access]
            API_CLIENT[API Client<br/>Backend Communication]
            ENV_CHECK[Environment Check<br/>Configuration Validation]
        end
    end

    DASH --> NAV
    GEN --> UI_COMP
    REV --> ICONS
    KPI_PAGE --> HOOKS
    SUCCESS --> CONTEXT
    
    HOOKS --> KPI_CLIENT
    CONTEXT --> SUPABASE_CLIENT
    KPI_CLIENT --> API_CLIENT
    API_CLIENT --> ENV_CHECK
```

### Backend Architecture (Node.js/Express)

```mermaid
graph TB
    subgraph "Backend Services"
        subgraph "API Layer"
            ROUTES[Route Handlers<br/>Express Routes]
            MIDDLEWARE_LAYER[Middleware Stack<br/>CORS, Auth, KPI]
            ERROR[Error Handling<br/>Global Error Handler]
        end
        
        subgraph "Business Logic"
            AI_SERVICE[AI Service<br/>Content Generation]
            RAG_SERVICE[RAG Service<br/>Context Retrieval]
            QUALITY_SERVICE[Quality Service<br/>Content Evaluation]
            PRODUCT_LOADER[Product Loader<br/>CSV Processing]
        end
        
        subgraph "Data Services"
            SUPABASE_LIB[Supabase Library<br/>Database Operations]
            CSV_RAG[CSV RAG Engine<br/>Product Search]
            KPI_COLLECTOR[KPI Event Collector<br/>Analytics Data]
        end
        
        subgraph "Analytics Engine"
            DATA_QUALITY[Data Quality Analyzer<br/>Completeness Metrics]
            USER_EXP[User Experience Analyzer<br/>Interaction Tracking]
            SYSTEM_PERF[System Performance Monitor<br/>Health Metrics]
            EVENT_PIPELINE[Event Processing Pipeline<br/>Real-time Analytics]
        end
    end

    ROUTES --> MIDDLEWARE_LAYER
    MIDDLEWARE_LAYER --> ERROR
    ROUTES --> AI_SERVICE
    AI_SERVICE --> RAG_SERVICE
    RAG_SERVICE --> QUALITY_SERVICE
    QUALITY_SERVICE --> PRODUCT_LOADER
    
    AI_SERVICE --> SUPABASE_LIB
    RAG_SERVICE --> CSV_RAG
    MIDDLEWARE_LAYER --> KPI_COLLECTOR
    
    KPI_COLLECTOR --> DATA_QUALITY
    DATA_QUALITY --> USER_EXP
    USER_EXP --> SYSTEM_PERF
    SYSTEM_PERF --> EVENT_PIPELINE
```

### Database Schema Architecture

```mermaid
erDiagram
    PRODUCTS {
        uuid id PK
        text sku UK
        text name
        text brand
        text category
        decimal price
        text description
        jsonb attributes
        timestamp created_at
        timestamp updated_at
    }
    
    GENERATED_CONTENT {
        uuid id PK
        uuid product_id FK
        text content_type
        text generated_text
        text edited_text
        text status
        text_array seo_keywords
        decimal quality_score
        jsonb metadata
        timestamp created_at
        timestamp updated_at
    }
    
    KPI_EVENTS {
        uuid id PK
        text type
        timestamp timestamp
        text session_id
        text user_id
        text source
        jsonb metadata
        timestamp created_at
    }
    
    DATA_QUALITY_METRICS {
        uuid id PK
        integer total_products
        integer complete_products
        decimal completeness_percentage
        jsonb completeness_by_field
        decimal quality_score
        timestamp timestamp
        timestamp created_at
    }
    
    SEARCH_SUCCESS_METRICS {
        uuid id PK
        text query
        text session_id
        integer total_results
        integer clicked_results
        integer time_to_first_click_ms
        integer query_refinements
        jsonb success_indicators
        decimal success_score
        timestamp timestamp
    }
    
    USER_SATISFACTION_SCORES {
        uuid id PK
        text session_id
        text user_id
        integer satisfaction_rating
        text feedback_text
        decimal completion_rate
        text task_type
        timestamp timestamp
    }

    PRODUCTS ||--o{ GENERATED_CONTENT : "has"
    GENERATED_CONTENT ||--o{ KPI_EVENTS : "tracks"
    KPI_EVENTS ||--o{ DATA_QUALITY_METRICS : "aggregates"
    KPI_EVENTS ||--o{ SEARCH_SUCCESS_METRICS : "measures"
    KPI_EVENTS ||--o{ USER_SATISFACTION_SCORES : "records"
```

### AI/ML Pipeline Architecture

```mermaid
graph LR
    subgraph "Input Processing"
        SKU[Product SKU<br/>Input]
        SEARCH[Search Query<br/>User Input]
    end
    
    subgraph "RAG Pipeline"
        RETRIEVAL[Product Retrieval<br/>CSV Database Search]
        CONTEXT[Context Building<br/>Similar Products]
        EMBEDDING[Semantic Embedding<br/>Mistral Embeddings]
    end
    
    subgraph "AI Generation"
        PROMPT[Prompt Engineering<br/>Context + Instructions]
        MISTRAL_API[Mistral AI API<br/>mistral-large-latest]
        RESPONSE[Generated Content<br/>Raw Output]
    end
    
    subgraph "Quality Assurance"
        EVALUATION[Quality Evaluation<br/>5-Dimensional Scoring]
        SCORING[Score Calculation<br/>Technical, SEO, Brand, etc.]
        FEEDBACK[Quality Feedback<br/>Recommendations]
    end
    
    subgraph "Output Processing"
        STORAGE[Content Storage<br/>Database Persistence]
        REVIEW[Review Queue<br/>Human Approval]
        PUBLISH[Content Publishing<br/>Final Output]
    end

    SKU --> RETRIEVAL
    SEARCH --> RETRIEVAL
    RETRIEVAL --> CONTEXT
    CONTEXT --> EMBEDDING
    EMBEDDING --> PROMPT
    
    PROMPT --> MISTRAL_API
    MISTRAL_API --> RESPONSE
    RESPONSE --> EVALUATION
    
    EVALUATION --> SCORING
    SCORING --> FEEDBACK
    FEEDBACK --> STORAGE
    
    STORAGE --> REVIEW
    REVIEW --> PUBLISH
```

### KPI Tracking & Analytics Architecture

```mermaid
graph TB
    subgraph "Data Collection Layer"
        CLIENT_EVENTS[Client-Side Events<br/>User Interactions]
        SERVER_EVENTS[Server-Side Events<br/>API Calls]
        SYSTEM_EVENTS[System Events<br/>Performance Metrics]
    end
    
    subgraph "Event Processing"
        EVENT_COLLECTOR[KPI Event Collector<br/>Centralized Collection]
        EVENT_PIPELINE[Event Processing Pipeline<br/>Real-time Processing]
        EVENT_STORAGE[Event Storage<br/>Time-series Data]
    end
    
    subgraph "Analytics Engines"
        DATA_ANALYZER[Data Quality Analyzer<br/>Completeness & Accuracy]
        UX_ANALYZER[User Experience Analyzer<br/>Behavior & Satisfaction]
        PERF_MONITOR[Performance Monitor<br/>System Health]
        RETRIEVAL_ANALYZER[Retrieval Quality Analyzer<br/>Search Effectiveness]
    end
    
    subgraph "Metrics Aggregation"
        REAL_TIME[Real-time Metrics<br/>Live Dashboard Data]
        HISTORICAL[Historical Analysis<br/>Trend Identification]
        PREDICTIVE[Predictive Analytics<br/>Future Projections]
    end
    
    subgraph "Visualization Layer"
        KPI_DASHBOARD[KPI Dashboard<br/>Executive View]
        OPERATIONAL_DASH[Operational Dashboard<br/>Technical Metrics]
        ALERTS_SYSTEM[Alert System<br/>Threshold Monitoring]
    end

    CLIENT_EVENTS --> EVENT_COLLECTOR
    SERVER_EVENTS --> EVENT_COLLECTOR
    SYSTEM_EVENTS --> EVENT_COLLECTOR
    
    EVENT_COLLECTOR --> EVENT_PIPELINE
    EVENT_PIPELINE --> EVENT_STORAGE
    
    EVENT_STORAGE --> DATA_ANALYZER
    EVENT_STORAGE --> UX_ANALYZER
    EVENT_STORAGE --> PERF_MONITOR
    EVENT_STORAGE --> RETRIEVAL_ANALYZER
    
    DATA_ANALYZER --> REAL_TIME
    UX_ANALYZER --> HISTORICAL
    PERF_MONITOR --> PREDICTIVE
    
    REAL_TIME --> KPI_DASHBOARD
    HISTORICAL --> OPERATIONAL_DASH
    PREDICTIVE --> ALERTS_SYSTEM
```

## Deployment Architecture

### Production Environment

```mermaid
graph TB
    subgraph "Internet"
        USERS[End Users<br/>Global Access]
        ADMIN[Admin Users<br/>Management Interface]
    end
    
    subgraph "Netlify (Frontend)"
        NETLIFY_CDN[Global CDN<br/>Edge Locations]
        NETLIFY_BUILD[Build Pipeline<br/>CI/CD]
        NETLIFY_FUNCTIONS[Serverless Functions<br/>Edge Computing]
    end
    
    subgraph "Render (Backend)"
        RENDER_LB[Load Balancer<br/>Auto-scaling]
        RENDER_INSTANCES[App Instances<br/>Container Deployment]
        RENDER_HEALTH[Health Checks<br/>Monitoring]
    end
    
    subgraph "Supabase (Database)"
        SUPABASE_DB[(PostgreSQL<br/>Primary Database)]
        SUPABASE_AUTH[Authentication<br/>User Management]
        SUPABASE_API[Auto-generated APIs<br/>Real-time Subscriptions]
    end
    
    subgraph "External Services"
        MISTRAL_CLOUD[Mistral AI<br/>Cloud API]
        MONITORING[Monitoring Services<br/>Uptime & Performance]
        BACKUP[Backup Services<br/>Data Protection]
    end

    USERS --> NETLIFY_CDN
    ADMIN --> NETLIFY_CDN
    NETLIFY_CDN --> NETLIFY_BUILD
    NETLIFY_BUILD --> NETLIFY_FUNCTIONS
    
    NETLIFY_FUNCTIONS --> RENDER_LB
    RENDER_LB --> RENDER_INSTANCES
    RENDER_INSTANCES --> RENDER_HEALTH
    
    RENDER_INSTANCES --> SUPABASE_DB
    RENDER_INSTANCES --> SUPABASE_AUTH
    SUPABASE_AUTH --> SUPABASE_API
    
    RENDER_INSTANCES --> MISTRAL_CLOUD
    RENDER_INSTANCES --> MONITORING
    SUPABASE_DB --> BACKUP
```

### Development Environment

```mermaid
graph TB
    subgraph "Local Development"
        DEV_FRONTEND[Next.js Dev Server<br/>localhost:3001]
        DEV_BACKEND[Express Dev Server<br/>localhost:3000]
        DEV_DB[(Local PostgreSQL<br/>Development Data)]
    end
    
    subgraph "Development Tools"
        GIT[Git Repository<br/>Version Control]
        VSCODE[VS Code<br/>IDE + Extensions]
        DOCKER[Docker<br/>Containerization]
    end
    
    subgraph "CI/CD Pipeline"
        GITHUB[GitHub Repository<br/>Source Control]
        GITHUB_ACTIONS[GitHub Actions<br/>Automated Testing]
        DEPLOY_STAGING[Staging Deployment<br/>Preview Environment]
    end
    
    subgraph "Testing Environment"
        UNIT_TESTS[Unit Tests<br/>Jest + Testing Library]
        INTEGRATION_TESTS[Integration Tests<br/>API Testing]
        E2E_TESTS[E2E Tests<br/>Playwright/Cypress]
    end

    DEV_FRONTEND --> DEV_BACKEND
    DEV_BACKEND --> DEV_DB
    
    DEV_FRONTEND --> GIT
    DEV_BACKEND --> VSCODE
    DEV_DB --> DOCKER
    
    GIT --> GITHUB
    GITHUB --> GITHUB_ACTIONS
    GITHUB_ACTIONS --> DEPLOY_STAGING
    
    GITHUB_ACTIONS --> UNIT_TESTS
    UNIT_TESTS --> INTEGRATION_TESTS
    INTEGRATION_TESTS --> E2E_TESTS
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        subgraph "Network Security"
            HTTPS[HTTPS/TLS 1.3<br/>End-to-end Encryption]
            CORS[CORS Policy<br/>Cross-origin Protection]
            RATE_LIMIT[Rate Limiting<br/>DDoS Protection]
        end
        
        subgraph "Authentication & Authorization"
            AUTH_LAYER[Supabase Auth<br/>JWT Tokens]
            RBAC[Role-based Access<br/>Permission System]
            SESSION[Session Management<br/>Secure Sessions]
        end
        
        subgraph "Data Protection"
            ENCRYPTION[Data Encryption<br/>At Rest & In Transit]
            PII_PROTECTION[PII Protection<br/>Data Anonymization]
            BACKUP_SECURITY[Secure Backups<br/>Encrypted Storage]
        end
        
        subgraph "API Security"
            API_KEYS[API Key Management<br/>Secure Key Storage]
            INPUT_VALIDATION[Input Validation<br/>SQL Injection Prevention]
            OUTPUT_SANITIZATION[Output Sanitization<br/>XSS Prevention]
        end
        
        subgraph "Monitoring & Compliance"
            AUDIT_LOGS[Audit Logging<br/>Activity Tracking]
            COMPLIANCE[Compliance Monitoring<br/>GDPR, SOC 2]
            VULNERABILITY[Vulnerability Scanning<br/>Security Assessment]
        end
    end

    HTTPS --> AUTH_LAYER
    CORS --> RBAC
    RATE_LIMIT --> SESSION
    
    AUTH_LAYER --> ENCRYPTION
    RBAC --> PII_PROTECTION
    SESSION --> BACKUP_SECURITY
    
    ENCRYPTION --> API_KEYS
    PII_PROTECTION --> INPUT_VALIDATION
    BACKUP_SECURITY --> OUTPUT_SANITIZATION
    
    API_KEYS --> AUDIT_LOGS
    INPUT_VALIDATION --> COMPLIANCE
    OUTPUT_SANITIZATION --> VULNERABILITY
```

## Performance & Scalability

### Caching Strategy

```mermaid
graph LR
    subgraph "Caching Layers"
        CDN_CACHE[CDN Cache<br/>Static Assets]
        BROWSER_CACHE[Browser Cache<br/>Client-side Caching]
        API_CACHE[API Response Cache<br/>Redis/Memory]
        DB_CACHE[Database Query Cache<br/>PostgreSQL Cache]
        AI_CACHE[AI Response Cache<br/>Generated Content]
    end
    
    subgraph "Cache Invalidation"
        TTL[Time-based Expiry<br/>TTL Strategy]
        EVENT_BASED[Event-based Invalidation<br/>Real-time Updates]
        MANUAL[Manual Cache Clear<br/>Admin Controls]
    end

    CDN_CACHE --> TTL
    BROWSER_CACHE --> EVENT_BASED
    API_CACHE --> MANUAL
    DB_CACHE --> TTL
    AI_CACHE --> EVENT_BASED
```

### Auto-scaling Configuration

```mermaid
graph TB
    subgraph "Scaling Triggers"
        CPU_USAGE[CPU Usage > 70%<br/>Scale Up Trigger]
        MEMORY_USAGE[Memory Usage > 80%<br/>Scale Up Trigger]
        REQUEST_RATE[Request Rate > 1000/min<br/>Scale Up Trigger]
        RESPONSE_TIME[Response Time > 2s<br/>Scale Up Trigger]
    end
    
    subgraph "Scaling Actions"
        HORIZONTAL[Horizontal Scaling<br/>Add/Remove Instances]
        VERTICAL[Vertical Scaling<br/>Increase Resources]
        LOAD_BALANCING[Load Balancing<br/>Distribute Traffic]
    end
    
    subgraph "Scaling Limits"
        MIN_INSTANCES[Minimum: 1 Instance<br/>Always Available]
        MAX_INSTANCES[Maximum: 10 Instances<br/>Cost Control]
        COOLDOWN[Cooldown Period: 5min<br/>Prevent Thrashing]
    end

    CPU_USAGE --> HORIZONTAL
    MEMORY_USAGE --> VERTICAL
    REQUEST_RATE --> LOAD_BALANCING
    RESPONSE_TIME --> HORIZONTAL
    
    HORIZONTAL --> MIN_INSTANCES
    VERTICAL --> MAX_INSTANCES
    LOAD_BALANCING --> COOLDOWN
```

## Technology Stack Summary

### Frontend Stack
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API
- **Build Tool**: Webpack (Next.js built-in)
- **Deployment**: Netlify

### Backend Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **AI/ML**: Mistral AI API
- **Caching**: Redis (future)
- **Deployment**: Render

### DevOps & Infrastructure
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Monitoring**: Built-in analytics + external monitoring
- **Security**: HTTPS, CORS, Rate limiting
- **Backup**: Automated database backups

### External Services
- **AI Provider**: Mistral AI
- **Database**: Supabase (PostgreSQL + Auth)
- **CDN**: Netlify Edge Network
- **Hosting**: Render (Backend) + Netlify (Frontend)

This architecture provides a robust, scalable, and maintainable foundation for the AutoDescribe platform, supporting current needs while enabling future growth and feature expansion.