# Architecture Overview

## System Architecture Diagram

```mermaid
graph TB
    subgraph "External"
        Feed[XML Job Feed API]
    end
    
    subgraph "Backend Server"
        Cron[node-cron<br/>Scheduler]
        Service[Job Import Service<br/>XML Parser]
        Queue[BullMQ Queue<br/>Redis-backed]
        Worker[Queue Worker<br/>Concurrent Processing]
    end
    
    subgraph "Data Layer"
        Redis[(Redis<br/>Queue Storage)]
        MongoDB[(MongoDB<br/>Job & Log Storage)]
        JobsCol[(jobs<br/>collection)]
        LogsCol[(import_logs<br/>collection)]
    end
    
    subgraph "API Layer"
        Express[Express Server<br/>REST API]
        Routes[Import Logs<br/>Route Handler]
    end
    
    subgraph "Frontend"
        NextJS[Next.js App<br/>Admin Dashboard]
        Pages[Pages & Components]
    end
    
    Feed -->|HTTP GET| Service
    Cron -->|Triggers Hourly| Service
    Service -->|Parse XML| Service
    Service -->|Enqueue Jobs| Queue
    Queue -->|Persist| Redis
    Queue -->|Consume| Worker
    Worker -->|Upsert| JobsCol
    Worker -->|Update Counters| LogsCol
    JobsCol -->|Store| MongoDB
    LogsCol -->|Store| MongoDB
    Routes -->|Query| LogsCol
    Express -->|Serve| Routes
    NextJS -->|Fetch /api/import-logs| Express
    NextJS -->|Render| Pages
```

## Detailed Data Flow

```mermaid
sequenceDiagram
    participant Cron as node-cron
    participant Service as Import Service
    participant Queue as BullMQ Queue
    participant Redis as Redis
    participant Worker as Queue Worker
    participant Mongo as MongoDB
    participant API as Express API
    participant UI as Next.js UI

    Note over Cron: Hourly Schedule (0 * * * *)
    Cron->>Service: Trigger feed fetch
    Service->>Service: Fetch XML from feed URL
    Service->>Service: Parse XML to JSON (xml2js)
    Service->>Mongo: Create ImportLog document
    Service->>Queue: Add job for each item
    Queue->>Redis: Persist job data
    
    Note over Worker: Concurrent Processing
    Worker->>Redis: Poll for jobs
    Redis->>Worker: Return job payload
    Worker->>Mongo: Upsert Job (findOneAndUpdate)
    Worker->>Mongo: Update ImportLog counters
    Worker->>Queue: Mark job complete
    
    Note over UI: User Views Dashboard
    UI->>API: GET /api/import-logs
    API->>Mongo: Query import_logs collection
    Mongo->>API: Return log documents
    API->>UI: JSON response
    UI->>UI: Render table with logs
```

## Queue Processing Workflow

```mermaid
graph TD
    Start[Feed Fetch Triggered] --> Fetch[Download XML Feed]
    Fetch -->|Success| Parse[Parse XML to JSON]
    Fetch -->|Error| LogError[Log to ImportLog<br/>failedJobs++]
    Parse --> CreateLog[Create ImportLog<br/>total = items.length]
    CreateLog --> Enqueue[For Each Job Item]
    Enqueue --> AddQueue[Add to BullMQ Queue<br/>attempts: 3<br/>backoff: exponential]
    AddQueue --> RedisStore[(Store in Redis)]
    
    RedisStore --> WorkerPoll[Worker Polls Queue]
    WorkerPoll --> ProcessJob[Process Job]
    ProcessJob --> CheckDB{Job Exists?}
    CheckDB -->|Yes| Update[Update Existing Job<br/>updatedJobs++]
    CheckDB -->|No| Create[Create New Job<br/>newJobs++]
    Update --> UpdateLog[Update ImportLog Counters]
    Create --> UpdateLog
    UpdateLog --> Success{Success?}
    Success -->|Yes| Complete[Mark Job Complete]
    Success -->|No| Retry{Retries Left?}
    Retry -->|Yes| Backoff[Exponential Backoff<br/>Retry Job]
    Retry -->|No| Failed[Mark Job Failed<br/>failedJobs++<br/>Add to failedReasons]
    Backoff --> ProcessJob
    Complete --> NextJob[Process Next Job]
    Failed --> NextJob
    LogError --> End[End]
    NextJob --> WorkerPoll
```

## Component Interaction Diagram

```mermaid
graph LR
    subgraph "Client (Next.js)"
        Index[index.js<br/>Main Page]
        LogTable[LogTable.js<br/>Component]
        App[_app.js<br/>App Wrapper]
        Styles[globals.css<br/>Global Styles]
    end
    
    subgraph "Server (Express)"
        AppJS[app.js<br/>Server Entry]
        Routes[importLogs.js<br/>Route Handler]
        CronJob[jobFetcher.js<br/>Cron Scheduler]
        Service[jobImportService.js<br/>Business Logic]
    end
    
    subgraph "Queue System"
        Queue[jobQueue.js<br/>BullMQ Queue]
        Worker[jobWorker.js<br/>Queue Worker]
    end
    
    subgraph "Data Models"
        JobModel[Job.js<br/>Mongoose Schema]
        LogModel[ImportLog.js<br/>Mongoose Schema]
    end
    
    App --> Index
    Index --> LogTable
    App --> Styles
    Index -->|GET /api/import-logs| Routes
    AppJS --> Routes
    AppJS --> CronJob
    CronJob --> Service
    Service --> Queue
    Queue --> Worker
    Worker --> JobModel
    Worker --> LogModel
    Routes --> LogModel
```

## Error Handling Flow

```mermaid
graph TD
    Start[Operation Starts] --> Try{Try Block}
    Try -->|Feed Fetch| FetchError{Network Error?}
    FetchError -->|Yes| CatchFetch[Catch Error]
    CatchFetch --> LogFetch[Log to ImportLog<br/>failedJobs = total<br/>failedReasons.push]
    
    FetchError -->|No| ParseError{XML Parse Error?}
    ParseError -->|Yes| CatchParse[Catch Error]
    CatchParse --> LogFetch
    
    ParseError -->|No| QueueError{Queue Add Error?}
    QueueError -->|Yes| CatchQueue[Catch Error]
    CatchQueue --> LogFetch
    
    QueueError -->|No| WorkerError{Worker Processing Error?}
    WorkerError -->|Yes| RetryCheck{Retries Left?}
    RetryCheck -->|Yes| Backoff[Exponential Backoff<br/>Retry Job]
    RetryCheck -->|No| CatchWorker[Catch in Worker]
    CatchWorker --> LogWorker[Update ImportLog<br/>failedJobs++<br/>failedReasons.push]
    
    WorkerError -->|No| Success[Operation Success]
    Backoff --> WorkerError
    LogFetch --> End[End]
    LogWorker --> End
    Success --> End
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        subgraph "Load Balancer"
            LB[Load Balancer<br/>HTTPS]
        end
        
        subgraph "Application Servers"
            API1[Express API<br/>Instance 1]
            API2[Express API<br/>Instance 2]
            Worker1[Queue Worker<br/>Instance 1]
            Worker2[Queue Worker<br/>Instance 2]
        end
        
        subgraph "Frontend"
            NextJS[Next.js<br/>Static Build]
            CDN[CDN<br/>Static Assets]
        end
        
        subgraph "Data Services"
            Mongo[(MongoDB<br/>Atlas/Cluster)]
            Redis[(Redis<br/>Cloud/Cluster)]
        end
    end
    
    LB --> API1
    LB --> API2
    API1 --> Mongo
    API2 --> Mongo
    Worker1 --> Redis
    Worker2 --> Redis
    Worker1 --> Mongo
    Worker2 --> Mongo
    NextJS -->|API Calls| LB
    CDN --> NextJS
```

---

## System Flow Summary

1. `node-cron` triggers an hourly import task.
2. The cron job downloads XML feeds, converts them to JSON, and enqueues each job payload.
3. BullMQ persists jobs in Redis, handles retries/backoff, and fans out work to concurrent workers.
4. Workers upsert jobs into MongoDB and increment ImportLog documents for observability.
5. The Express API exposes `/api/import-logs`, which the Next.js UI consumes to render an audit table.

## Technology Choices

- **BullMQ + Redis:** Preferred for reliability, built-in retries, delayed jobs, and effortless horizontal scaling. Using Redis keeps operational overhead low compared to heavier brokers.
- **xml2js:** Simple, battle-tested XML-to-JS converter; perfect for mapping feed fields before persistence.
- **node-cron:** Lightweight scheduler that fits a single-process deployment. In production, the same code could be run inside a dedicated worker pod or replaced with an external orchestrator.
- **MongoDB + Mongoose:** Schemaless flexibility plus a convenient ODM for enforcing job/import log shapes. Upsert semantics (`findOneAndUpdate` with `{ upsert: true }`) prevent duplicates.
- **Next.js:** Provides SSR/SSG flexibility for the admin UI and easy environment variable exposure using `NEXT_PUBLIC_*` conventions.

## Error Handling & Observability

- Worker retries leverage BullMQ's `attempts` and `backoff` options. Failures bubble into the failed set and are appended to the `failedReasons` array on the relevant `ImportLog` document.
- Fetch-level errors (e.g., network issues) are caught inside the cron service and logged against the run, ensuring every scheduled execution has an audit trail.
- Structured logging (see `server/utils/logger.js`) keeps console output consistent and ready for redirection to tools like Datadog or CloudWatch.

## Scalability Considerations

- Increase `QUEUE_CONCURRENCY` or start multiple worker processes to scale write throughput.
- The queue and worker modules are decoupled, enabling separate deployment units (e.g., worker-only containers).
- Future enhancements could include WebSocket notifications for UI updates, sharded Mongo clusters, or partitioned queue streams for extremely large imports.

## Security & Configuration

- Secrets remain in `.env`; templates (`.env.example`, `server/.env.example`) list required keys without real credentials.
- Add authentication (JWT, API keys, or OAuth) around the Express routes before exposing externally.
- Enforce HTTPS between the UI and API when deploying to production.
