# AI Task Platform Architecture Document

## 1. Overview

The platform has five core components:

- Frontend (React) for user interaction.
- Backend API (Node.js + Express) for auth and task APIs.
- Worker service (Python) for async processing.
- MongoDB for persistent task and user data.
- Redis for queueing task jobs.

Flow:

1. User logs in with JWT auth.
2. User creates a task and clicks Run.
3. Backend stores task with `pending` status and pushes job to Redis list.
4. Worker pulls job from Redis, marks task `running`, performs operation, then stores `success` or `failed`.
5. Frontend polls task list and detail view for status/log/result updates.

## 2. Worker Scaling Strategy

Worker service is stateless, so horizontal scaling is safe:

- Multiple worker replicas can run in Kubernetes.
- Redis queue distributes jobs because each job is consumed by one worker.
- For burst traffic, increase worker replicas manually or using HPA based on CPU/memory or queue lag metric.

Scaling approach:

- Base replicas: 3 workers.
- Target during high load: 10+ workers.
- Keep backend and worker independent scaling to avoid over-provisioning API pods.

## 3. Handling High Task Volume (100k tasks/day)

100k/day is around 1.16 tasks/second average, with peak bursts expected.

Strategies:

- Queue-first architecture decouples API from processing speed.
- Redis runs in memory for fast enqueue/dequeue.
- Worker replicas can be increased during peaks.
- Store small payload in queue (task ID only), read full payload from MongoDB.
- Add monitoring dashboards for queue depth, worker throughput, and processing latency.

For improved resilience at larger scale:

- Use Redis persistence (AOF) and replica/sentinel or managed Redis.
- Add dead-letter queue for repeatedly failing jobs.
- Use exponential retry for transient failures.

## 4. Database Indexing Strategy

Current useful indexes:

- `users.email` unique index for login lookup.
- `tasks.userId + createdAt` for user task listing.
- `tasks.status + createdAt` for status-based monitoring/admin queries.

Optional future indexes:

- `tasks.updatedAt` for stale/running timeout scans.
- Partial index on `status = running` for fast recovery checks.

## 5. Redis Failure Handling

If Redis is unavailable:

- Backend should return a clear error for run request.
- Task stays in `pending` only if enqueue succeeds; otherwise API should report failure.
- Kubernetes restarts failed worker pods automatically.

Hardening options:

- Use Redis with persistence and replication.
- Add retry with backoff for enqueue operations.
- Add fallback alerting (PagerDuty/Slack) when queue is unavailable.

## 6. Staging and Production Deployment Strategy

Use separate Kubernetes namespaces and Argo CD apps:

- `ai-task-staging`
- `ai-task-production`

Git branching model:

- `develop` branch updates staging.
- `main` branch updates production.

Deployment model:

- CI builds and pushes images tagged with commit SHA.
- CI updates tag in infra repo.
- Argo CD auto-sync applies change to target environment.

Safety practices:

- Enable manual approval before production promotion.
- Use environment specific secrets (JWT, DB URI).
- Configure resource limits per environment.

## 6.1 GitOps Flow

GitOps in this project is based on Git being the source of truth for Kubernetes manifests:

1. Application code changes are pushed to the app repository.
2. CI builds container images and pushes them to a registry.
3. CI updates the Kubernetes image tag in the infra manifests stored in Git.
4. Argo CD watches the infra repository path and automatically syncs the cluster.

This means Docker Compose is not part of the GitOps loop. Docker Compose is only used for local development and end-to-end smoke testing.

For the Oracle single-node deployment path:

- Base manifests remain generic in `infra-repo/k8s/base`.
- Oracle-specific tuning lives in `infra-repo/k8s/overlays/oracle-single-node`.
- Argo CD should point at that overlay path for the single-node cluster.

## 7. Security Notes

- Password hashing with bcrypt.
- JWT auth for protected routes.
- Helmet middleware for secure HTTP headers.
- Rate limiting to reduce brute-force and abuse.
- Secrets injected by environment variables and Kubernetes Secret objects.
