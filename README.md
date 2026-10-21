# LeaderSync — Team & Assignment Progress Hub

A modern bilingual (Khmer / English) workspace for student and project teams. Leaders create groups, add members, assign tasks with deadlines, and approve deliverables. Members post daily standups as simple checklists and track their progress transparently.

- **Frontend:** React 19, Vite, Tailwind CSS 4, modular component-based architecture (`client/`)
- **Backend:** Node.js 22, Express 5, TypeScript REST API (`server/`)
- **Database:** Standard PostgreSQL (pgAdmin 4, Neon, Supabase, Cloud SQL, Wamp/Postgres) with embedded PGlite fallback for zero-install instant dev
- **Auth:** Email + password (bcrypt), secure httpOnly JWT cookies, strict role-based access control (RBAC)

---

## 🗄️ Setting Up PostgreSQL with pgAdmin 4

You can manage your LeaderSync database directly in **pgAdmin 4** (or any PostgreSQL GUI):

1. **Create the Database in pgAdmin:**
   - Open **pgAdmin 4** and connect to your PostgreSQL server.
   - Right-click on **Databases** → **Create** → **Database...**
   - Name it `leadersync_db` (or your preferred name) and click **Save**.

2. **Initialize the Schema (Optional - Backend also auto-migrates):**
   - Right-click `leadersync_db` → click **Query Tool**.
   - Open `/database/pgadmin_schema.sql` (or copy its SQL contents into the Query Editor).
   - Press **F5** (or click the Execute ▶ button) to create all tables, indexes, and constraints.

3. **Configure your `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/leadersync_db
   DATABASE_SSL=false
   JWT_SECRET=your-secure-random-32-char-secret-key-here
   PORT=3000
   ```

4. **Start the Application:**
   ```bash
   npm run dev
   ```
   LeaderSync will automatically connect to your PostgreSQL database in pgAdmin!

---

## 👥 Onboarding & User Registration Policies

The system is designed with a clean slate (zero dummy mock users or fake teams hardcoded):

1. **Super Admin Creation (First Turn):**
   - When the database is fresh, the **very first user to register** automatically becomes the **Super Admin** with complete management authority.

2. **Inviting & Adding Members (Two Options):**
   - **Option A: Direct Invitation (ប្រព័ន្ធអញ្ជើញ / Invite-Only):**
     The Super Admin clicks **Add Member** in the group banner or members list, entering the member's email, student ID, and role. The student registers with that same email and student ID to claim their pre-authorized account.
   - **Option B: Shareable Group Code / ID (ចូលរួមតាមរយៈលេខកូដក្រុម ឬ ID):**
     Leaders can click the **Copy Code** button in the group banner (e.g. `GRP-101` or Group UUID) and send it to members. Members can click **Join Group** in the sidebar or banner to enter the code and join as a member instantly. New users can also paste the Group Code directly in the sign-up form!

---

## 📁 Project Structure (Component-Based)

```
database/
  pgadmin_schema.sql    Standard PostgreSQL DDL script ready for pgAdmin 4
client/                 React frontend (Vite)
  src/
    components/         Modular UI components
      JoinGroupModal.tsx       Join group via Code or ID modal
      CreateGroupModal.tsx     Group creation modal
      AddMemberModal.tsx       Member invitation modal
      GroupBanner.tsx          Active group switcher, copy code, stats
      TaskBoard.tsx            Kanban task board with review flow
      DailyStandupBox.tsx      Today's ToDo and progress submission
      DailyFeed.tsx            Peer daily standup stream with reactions
      MembersList.tsx          Member management and permission controls
      OverviewDashboard.tsx    KPI dashboard and activity audit trail
    context/AppContext.tsx     State & API coordinator
    lib/api.ts                 Typed REST client
    locales/translations.ts    Khmer (ខ្មែរ) + English translations
server/                 Express backend API
  app.ts                Express setup, helmet CSP, static serving
  config.ts             Environment configuration
  db/                   PostgreSQL connection pool & migrations
  routes/               auth, groups, tasks, dailyLogs, users, bootstrap
server.ts               Unified full-stack dev and production entry point (port 3000)
```

---

## 🚀 Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs full-stack server on `http://localhost:3000` with live Vite HMR |
| `npm run build` | Builds client to `dist/client` and bundles server to `dist/server` |
| `npm start` | Starts production server on port 3000 |
| `npm run lint` | TypeScript type check across client, shared, and server |

---

## 🛡️ Roles & Permissions Matrix

| Capability | Super Admin | Team Lead | Member | Viewer |
| --- | :-: | :-: | :-: | :-: |
| Create / delete groups, invite / remove members | ✅ | | | |
| Change group deadline | ✅ | Group Leader | | |
| Assign, reschedule, approve, and delete tasks | ✅ | ✅ | | |
| Approve member daily standups with notes | ✅ | ✅ | | |
| Post daily standup ToDo, update assigned tasks | ✅ | ✅ | ✅ | |
| Join groups via Group Code / ID, view & react | ✅ | ✅ | ✅ | ✅ |
