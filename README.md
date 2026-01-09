# Ping the Human

**Instant lead response for home service businesses.** When a lead comes in from Angi, we automatically send an email within milliseconds—so you're always first to respond.

## Screenshots

![Dashboard - View all leads with geographic heatmap](docs/screenshots/dashboard.png)

*Dashboard showing leads by state with sortable table*

![Lead Detail - Full conversation history and customer info](docs/screenshots/lead-detail.png)

*Lead detail view with message thread and customer panel*

## How It Works

1. **Lead comes in** → Angi sends a webhook to `/api/v1/lead/angi`
2. **We match the customer** → Find existing user by email or phone, or create new one
3. **Email goes out instantly** → Personalized response with booking link
4. **Track everything** → Speed-to-lead metrics, message history, duplicate detection

## Quick Start

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech Stack

- Next.js 15 + React 19
- SQLite with Drizzle ORM
- Tailwind CSS
- TypeScript

## Testing

**Debug Console** — Test individual API requests at [localhost:3000/debug](http://localhost:3000/debug)

**Mock Data** — Load 10 test leads covering edge cases (faulty, duplicates, same person, distinct):

```bash
pnpm test:mock
```

**Unit/Integration Tests:**

```bash
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage
```

## Database

View your data with Drizzle Studio:

```bash
pnpm db:studio
```

## API

### Receive Lead
```
POST /api/v1/lead/angi
```

### List Leads
```
GET /api/v1/lead?status=processed&limit=10
```

### Get Lead Stats
```
GET /api/v1/lead/stats
```

## Future Improvements

### Analytics Enhancements

**Email Engagement Metrics** — Integrate with a third-party email provider (e.g., SendGrid, Postmark) to track:

- **Open rate** — Percentage of leads who open the email
- **Time-to-open** — How long it takes for customers to open after delivery
- **Read rate** — Engagement depth beyond just opening
- **Response rate** — Replies or interactions with the email
- **Conversion rate** — Leads who actually book a job

**Delivery Performance Metrics:**

- Total emails sent over time
- Average time-to-send (from lead received to email delivered)
- P90 latency — Ensuring consistent fast delivery at the 90th percentile

**A/B Testing for Response Timing** — Allow vendors to experiment with send delays:

- Instant (milliseconds)
- 5 minutes, 10 minutes, 30 minutes (configurable by store managers)
- Track correlation between send speed and conversion rates
- Answer: Does instant response always win, or do certain lead types benefit from a short delay?

### AI-Powered Email Drafting

Currently, we use static templates for responses. Future enhancement:

- **GPT integration** for dynamic email generation
- **Personalized subject lines** — Use customer name, service type, and context to craft compelling openers
- **Context-aware body copy** — Reference specific details from the lead request
- **A/B test AI vs templates** — Measure if personalization improves open and conversion rates

### Cloud Infrastructure & Scalability

**Serverless Architecture** — Deploy to AWS for handling unpredictable lead volume spikes:

- **Amazon Aurora Serverless** — Auto-scaling database that handles traffic bursts without provisioning
- **AWS Lambda** — Serverless compute for the lead ingestion endpoint, scales to zero when idle
- **API Gateway** — Managed endpoint with built-in throttling, DDoS protection, and authentication/authorization (AuthN/AuthZ) via Lambda authorizers or Cognito integration

**Observability & Monitoring:**

- **CloudWatch** — Centralized logging, metrics, and alarms for all services
- **Lambda built-in metrics** — Invocation count, latency (avg/P90/P99), error rate, success rate, throttles
- **Custom dashboards** — Real-time visibility into lead processing health and performance

**Cost Optimization Path:**

- Start serverless to handle unpredictable spikes and validate traffic patterns
- Once volume stabilizes, evaluate migrating to EC2 + RDS for predictable workloads
- Potential 40-60% cost savings for steady-state traffic on reserved instances

### Advanced Duplicate Detection

Duplicate detection is critical for two reasons: **customer experience** (don't spam the same person) and **cost recovery** (claim refunds from lead providers for duplicate leads).

**Detection Strategies:**

- **Correlation ID matching** — Direct duplicate if same ID received twice
- **Content similarity** — Different correlation ID but identical/near-identical content
- **User-scoped filtering** — Once a user is identified (by email/phone), query only their recent leads for faster comparison
- **Time-window checks** — Flag leads from the same customer within X minutes as potential duplicates

**Database Scaling Considerations:**

- Duplicate detection increases read load significantly
- **Database replication** — Read replicas to distribute query load
- **Database sharding** — Partition by user ID or region for horizontal scaling
- **Caching layer** — Redis/Memcached for recent lead fingerprints

**Refund Automation:**

- Store confirmed duplicates in a NoSQL database (DynamoDB) with full context
- **Weekly cron job** to compile duplicate report and submit to Angi for refunds
- Track refund status and success rate per lead provider
- Generate reports showing duplicate patterns (time of day, lead source, etc.)

---

*Speed-to-lead matters. Studies show the first responder wins 78% of the time.*
