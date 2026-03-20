# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**EDAN Academy Hub** is a comprehensive Learning Management System (LMS) built with React, TypeScript, and Supabase. It connects students, instructors, and administrators with features including course management, exams, forums, gamification, payments, and live streaming.

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: Shadcn UI (Radix UI) + Tailwind CSS
- **State Management**: Tanstack Query (React Query) v5
- **Forms**: React Hook Form + Zod validation
- **Rich Text**: Tiptap editor
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Real-time**: Socket.IO via Deno Edge Functions
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Routing**: React Router DOM v6

## Common Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Development build (less optimization)
npm run build:dev

# Lint codebase (ESLint)
npm run lint

# Preview production build
npm run preview
```

## Project Architecture

### Directory Structure

```
src/
├── app/                    # App-level components (not present yet, structure prepared)
├── components/
│   ├── ui/                # Shadcn UI components (60+ components)
│   ├── admin/             # Admin-specific components
│   ├── dashboard/         # Dashboard layout components (sidebar, etc.)
│   ├── editor/            # Course/lesson editor components
│   ├── assignments/       # Assignment-related components
│   ├── comments/          # Discussion/comment components
│   ├── content/           # Content player components
│   └──PageTransition.tsx  # Route transition wrapper
├── hooks/
│   ├── useAuth.tsx        # Authentication & profile management
│   ├── useCourses.tsx     # Course data fetching
│   ├── useExams.tsx       # Exam management
│   ├── useForumPosts.tsx  # Forum functionality
│   ├── useGamification.tsx # Points & badges
│   ├── usePayments.tsx    # Payment & subscription handling
│   ├── useAssignments.tsx # Assignment submissions
│   ├── useStudentPreview.tsx # Instructor preview mode
│   ├── useLiveSessions.tsx # Live streaming integration
│   ├── useAnalytics.tsx   # Analytics data
│   ├── useCertificates.tsx
│   ├── useComments.tsx
│   ├── useEmailSettings.tsx
│   ├── useEnrollmentRequests.tsx
│   ├── useInstructorData.tsx
│   ├── useLiveStream.ts   # Live stream hook
│   ├── useMicroQuizzes.tsx
│   ├── useNotifications.tsx
│   ├── useScholarships.tsx
│   ├── useStudentPayments.tsx
│   └── useAdminUsers.tsx
├── pages/
│   ├── Index.tsx          # Landing page
│   ├── Auth.tsx           # Login/Register
│   ├── Payment.tsx        # Payment flow
│   ├── AccountSuspended.tsx
│   ├── NotFound.tsx
│   ├── dashboard/         # Student/user dashboard pages
│   ├── admin/             # Admin panel pages
│   └── instructor/        # Instructor dashboard pages
├── lib/
│   └── utils.ts           # Utility functions (cn for classnames)
├── integrations/
│   └── supabase/
│       ├── client.ts      # Supabase client singleton
│       └── types.ts       # TypeScript Database types (auto-generated)
├── utils/                 # Additional utility modules
└── main.tsx               # Application entry point

supabase/
├── functions/             # Edge Functions (Deno)
│   ├── live-stream-handler/
│   ├── check-expiring-subscriptions/
│   ├── create-test-users/
│   ├── create-user/
│   ├── generate-certificate/
│   ├── generate-payment-receipt/
│   ├── send-* (various email functions)
│   └── ...
├── migrations/            # SQL migration files
└── config.toml           # Supabase configuration
```

### Key Architectural Patterns

**1. Role-Based Access Control**
- Three roles: `admin`, `instructor`, `estudiante` (student)
- `ProtectedRoute` wrapper for route guarding
- `RoleRoute` component inside Dashboard for role-specific routes
- Admin inherits all instructor permissions

**2. Data Layer**
- Supabase as primary backend (PostgreSQL + Auth + Storage)
- Tanstack Query for client-side caching and state synchronization
- Each domain has a dedicated `use*` hook (e.g., `useCourses.tsx`, `useExams.tsx`)
- Hooks encapsulate all CRUD operations and return typed data

**3. Component Structure**
- Shadcn UI components in `components/ui/` (unstyled, accessible primitives)
- Feature components organized by domain (admin, assignments, editor, etc.)
- Layout components in `components/dashboard/`
- Heavy use of composition and context providers

**4. Student Preview Mode**
- Instructors can preview courses as students
- Implemented via `StudentPreviewProvider` context
- Toggle stored in sessionStorage
- Conditionally renders student UI while instructor is logged in

**5. Lazy Loading**
- Pages are lazy-loaded in `App.tsx` using `React.lazy()`
- Wrapped in `Suspense` with a `PageLoader` component
- Improves initial bundle size

**6. Real-time Features**
- Live streaming via WebSocket/Socket.IO
- Deno Edge Function handles WebSocket upgrades and room management
- `useLiveStream.ts` hook manages client connection

## Database Schema (Supabase)

Core tables:
- `profiles` - User profile data
- `user_roles` - Role assignments
- `courses`, `modules`, `lessons` - Course structure
- `enrollments` - Student course registrations
- `exams`, `questions`, `answer_options` - Assessment system
- `exam_attempts` - Exam results
- `micro_quizzes` - In-lesson quick quizzes
- `assignments`, `assignment_submissions`
- `forum_posts`, `forum_post_likes`, `lesson_comments`
- `user_points`, `points_history`, `badges`, `user_badges` - Gamification
- `payment_plans`, `subscriptions`, `payments`, `scholarships`
- `notifications`, `email_settings`, `email_logs`
- `live_session_messages` - Chat in live sessions

## Routing Structure

**Public Routes:**
- `/` - Landing page
- `/auth` - Login/Register

**Protected Routes:** (all under `/dashboard/*`)
- Student: `/my-courses`, `/catalog`, `/course/:courseId`, `/achievements`, `/leaderboard`, `/certificates`, `/payment-history`, `/renew`, `/exam/:examId`
- Instructor: `/instructor-courses`, `/instructor-students`, `/instructor-exams`, `/instructor-assignments`, `/course-editor/:courseId`, `/exam-editor/:examId`
- Admin: `/admin-users`, `/admin-courses`, `/admin-settings`, `/admin-analytics`, `/admin-exams`, `/admin-certificates`, `/admin-badges`, `/admin-enrollments`, `/admin-enrollment-requests`, `/admin-notifications`, `/admin-payments`, `/admin-scholarships`, `/admin-forums`

Dashboard home varies by role (student dashboard, instructor dashboard, or admin dashboard).

## Environment Configuration

- Vite environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Edge Functions require: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (set in Supabase dashboard)
- `.env` file exists locally (never commit secrets)
- Supabase client configured in `src/integrations/supabase/client.ts`

## Code Style & Conventions

- TypeScript strict mode
- React functional components with hooks
- Path aliases: `@/components`, `@/hooks`, `@/lib`, `@/pages`
- Tailwind CSS with Shadcn UI styling patterns
- Dark mode support via `next-themes`
- ESLint config extends TypeScript ESLint + React hooks + React refresh
- No explicit test setup yet (package.json has no test script)

## Important Notes

1. **Supabase Types**: The `src/integrations/supabase/types.ts` file is auto-generated from the database schema. If you change the DB, regenerate with `npx supabase gen types typescript --project-id <id> > src/integrations/supabase/types.ts`.

2. **Edge Functions**: Written in Deno (TypeScript). Deployed via Supabase CLI (`supabase functions deploy`). They handle email sending, live streaming, scheduled tasks, etc.

3. **Student Preview**: Instructors can toggle "student preview" mode from the UI to see exactly what students see. This is stored in sessionStorage and verified on the frontend only.

4. **VIP Access Logic**: Membership uses a tiered level system (Básico < Intermedio < Avanzado < Experto). Higher tiers automatically include lower tier courses.

5. **Image Compression**: Client-side WebP compression before uploading to Supabase Storage to save bandwidth.

6. **No Tests**: The project currently has no test suite. Consider adding Vitest or Jest if introducing critical business logic.

7. **Lovable Tagger**: Development-only plugin (`lovable-tagger`) auto-tags components for AI IDEs. Only runs in development mode.

## Migration Notes

The project has recently integrated Supabase's native migration system (see `supabase/migrations/`). Schema changes should be tracked via Supabase CLI migrations, not direct DB edits.

## When Working On...

- **New API/DB changes**: Update `types.ts` after any schema change.
- **New page**: Add route in `App.tsx` or `Dashboard.tsx` using the established lazy-load pattern.
- **Custom hook**: Follow the pattern in existing `use*` hooks - encapsulate all Supabase calls, use Tanstack Query for caching.
- **UI component**: Use Shadcn UI primitives when possible. Add to `components/ui/` if reusable.
- **Admin feature**: Add route guard with `RoleRoute allowedRoles={["admin"]}` and create page in `pages/admin/`.
- **Instructor feature**: Allow both `instructor` and `admin` roles.
- **Real-time updates**: Consider using Supabase Realtime or the existing WebSocket infrastructure (`live-stream-handler`).

## Resources

- README.md (Spanish) contains detailed documentation
- BITACORA.md & BITACORA_ACTUALIZADA.md track project progress
- Supabase dashboard: https://qntnclsoudflabjrvyer.supabase.co
- Local dev server: http://localhost:8080
