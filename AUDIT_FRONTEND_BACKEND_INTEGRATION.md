# Frontend-Backend Integration Audit Report

## Executive Summary

**Status: ❌ NO API INTEGRATION**

The entire frontend is a UI-only prototype using mock data. All backend API routes are implemented and functional, but the frontend does not call any of them. The application displays hardcoded mock data and simulates all operations with local state and timers.

---

## 1. File Upload Component (upload-view.tsx)

**Status: ❌ NOT WIRED**

### Current Behavior
- ✓ Has file input element that accepts files
- ✓ Supports drag-and-drop
- ❌ Does NOT call `POST /api/upload`
- ❌ Files are added to local state with mock data (`seedFiles` from mock-data.ts)

### Issue
The `addFiles()` function only assigns `id`, `name`, `language`, `size`, and `status` locally — no actual file is sent to the server.

### "Generate Analysis" Button
- ❌ `onClick={() => setGenerated(true)}` — only sets local `status: "Analyzed"`
- ❌ Does NOT call `POST /api/analyze`
- ❌ No actual code analysis happens

---

## 2. Upload → Analyze → Generate Flow

**Status: ❌ NO AUTOMATION**

- Nothing automatically triggers after file upload
- No state passed between components
- No API calls happen in sequence
- The "Generate Analysis" button is the only action, and it's local-only
- Each view operates in isolation

---

## 3. Generated Tests Display (generate-view.tsx)

**Status: ❌ MOCK DATA ONLY**

### Current Behavior
- ✓ Panel displays code with `CodeViewer` component
- ❌ Shows hardcoded mock tests from `mock-data.ts` (`unitTestCode`, `edgeTestCode`)
- ❌ Does NOT call `POST /api/generate-tests`

### Button Status

| Button | Handler | API Call | Status |
|--------|---------|----------|--------|
| Generate Tests | `onClick={() => setGenerated(true)}` | ❌ No | Toggles mock code visibility |
| Regenerate | ❌ **None** | ❌ No | **Non-functional** |
| Save Test File | ❌ **None** | ❌ No | **Non-functional** (should call `GET /api/download-tests`) |

---

## 4. Test Execution (execution-view.tsx)

**Status: ❌ SIMULATED ONLY**

### Current Behavior
- ✓ "Run Tests" & "Re-run Tests" buttons have onClick handlers
- ❌ But they just simulate execution with `setInterval(..., 280ms)`
- ❌ Do NOT call `POST /run-tests` (FastAPI backend)
- Displays mock execution logs from `executionLogs` array
- Status/passed/failed counts calculated from mock data only

### What's Missing
- No actual pytest execution
- No connection to FastAPI backend
- No real-time output streaming
- No error capture from actual test runs

---

## 5. Results Display (results-view.tsx)

**Status: ❌ MOCK DATA ONLY**

### Current Behavior
- ✓ Shows summary stats, coverage, failed tests
- ❌ All data from mock-data.ts (`summaryStats`, `coverageByFile`, `failedTests`)
- ❌ Does NOT call `GET /api/results` or `GET /coverage`
- No way to refresh or fetch real results

---

## 6. State Management

**Status: ❌ NONE**

- ✗ Zero global state management (no Context, Zustand, Redux, Recoil)
- Each view uses local `useState` for UI state only
- **No cross-component communication**
- **No way to pass data between pages**

### Example Problem
Upload page saves a file locally, but Generate page doesn't know which file was uploaded. Each page re-renders with mock seed data independently.

---

## 7. Complete API Integration Matrix

### All API Endpoints

| Endpoint | Component | Status | Current Behavior | Required Fix |
|----------|-----------|--------|------------------|---------------|
| `POST /api/upload` | upload-view | ❌ Not called | Files added to local state only | Call endpoint with FormData |
| `POST /api/analyze` | upload-view | ❌ Not called | "Generate Analysis" sets local state | Call endpoint with file_name |
| `POST /api/generate-tests` | generate-view | ❌ Not called | Shows mock code from mock-data.ts | Call endpoint with source_code |
| `POST /api/generate-userstory-tests` | (not in UI) | ❌ Not implemented | No user story input in UI | Add UI for user story input |
| `GET /api/results` | results-view | ❌ Not called | Shows hardcoded mock stats | Call endpoint on page load |
| `GET /api/download-tests` | generate-view | ❌ Not called | "Save Test File" button non-functional | Call endpoint and trigger download |
| `POST /run-tests` (FastAPI) | execution-view | ❌ Not called | Simulated with timer | Call endpoint with test_code |
| `GET /coverage` (FastAPI) | results-view | ❌ Not called | Shows mock coverage data | Call endpoint after tests run |

---

## 8. Button Functionality Matrix

### All Interactive Buttons

| Page | Button | Handler? | API Call? | Works? | Issue |
|------|--------|----------|-----------|--------|-------|
| Upload | Generate Analysis | ✓ Yes | ❌ No | ❌ Local state only | Should call `/api/analyze` |
| Generate | Generate Tests | ✓ Yes | ❌ No | ❌ Shows mock code | Should call `/api/generate-tests` |
| Generate | Regenerate | ❌ **None** | ❌ No | ❌ **Non-functional** | No onClick handler |
| Generate | Save Test File | ❌ **None** | ❌ No | ❌ **Non-functional** | No onClick handler, should call `/api/download-tests` |
| Execution | Run Tests | ✓ Yes | ❌ No | ❌ Simulated | Should call `/run-tests` (FastAPI) |
| Execution | Re-run Tests | ✓ Yes | ❌ No | ❌ Simulated | Should call `/run-tests` (FastAPI) |
| Dashboard | Quick Actions | ✓ Yes | ✓ Nav | ✓ Works | Navigation links only (no API) |

---

## 9. Code Analysis

### Key Findings

#### Missing Infrastructure
1. **No API client utility** — no fetch wrapper or request builder
2. **No global state** — upload/analyze/generate/execute steps can't communicate
3. **No error handling** — no try/catch, no error messages for users
4. **No loading states** — no visual feedback during API calls (spinners, disabled buttons, etc.)
5. **No data persistence** — refresh page = lose all state

#### Mock Data Dependency
All views depend on hardcoded mock objects in `lib/mock-data.ts`:
- `uploadedFiles` (seed data for file list)
- `detectedFunctions` (seed data for analysis results)
- `unitTestCode` / `edgeTestCode` (mock generated tests)
- `executionLogs` (mock test output)
- `summaryStats` (mock results)

#### UI Component Issues
- `upload-view.tsx`: Files added locally, never uploaded
- `generate-view.tsx`: Shows mock code, two buttons have no handlers
- `execution-view.tsx`: Simulates execution with a timer
- `results-view.tsx`: Displays mock stats only

---

## 10. Data Flow Gaps

### Current (Broken) Flow
```
Upload Page → Local state only (never reaches backend)
Generate Page → Shows hardcoded mock code
Execution Page → Simulates with timer
Results Page → Displays mock stats
```

### Required Flow
```
Upload Page → POST /api/upload → Store file
             → POST /api/analyze → Extract functions, classes, imports
                ↓
Generate Page → POST /api/generate-tests → Generate pytest code
                ↓
Execution Page → POST /run-tests (FastAPI) → Execute tests, get results
                 ↓
Results Page ← GET /api/results → Display real results
             ← GET /coverage → Display real coverage
```

---

## 11. State Management Architecture (Missing)

**Current**: Each component has isolated `useState`

**Required**: Global state to share:
- Currently uploaded file
- Analysis results (functions, classes, imports)
- Generated test code
- Test execution results
- Coverage metrics

**Recommended Solution**: React Context or Zustand to pass data between views

---

## 12. Missing Features in UI

These endpoints exist but have no UI:
- `POST /api/generate-userstory-tests` — No user story input form in UI
- User story → test generation flow is not implemented

---

## 13. Backend Status (Reference)

### Next.js API Routes (Ready)
- ✓ `POST /api/upload` — implemented
- ✓ `POST /api/analyze` — implemented
- ✓ `POST /api/generate-tests` — implemented
- ✓ `POST /api/generate-userstory-tests` — implemented
- ✓ `GET /api/results` — implemented
- ✓ `GET /api/download-tests` — implemented

### FastAPI Backend (Ready)
- ✓ `POST /run-tests` — implemented
- ✓ `GET /coverage` — implemented
- ✓ `GET /health` — implemented

**All backend routes are functional and tested. Frontend just doesn't call them.**

---

## 14. Recommendations (Priority Order)

### P0 (Critical)
1. Create API client utility (`lib/api.ts`) with fetch wrappers
2. Add global state manager (Context or Zustand) for cross-page data
3. Wire `POST /api/upload` button to actual upload
4. Wire `POST /api/analyze` to run after upload
5. Wire `POST /api/generate-tests` to generate button
6. Add error handling and loading states

### P1 (Important)
7. Wire `POST /run-tests` execution button to FastAPI
8. Wire `GET /api/results` to fetch real results
9. Wire `GET /coverage` to fetch real coverage
10. Implement "Save Test File" button
11. Add upload validation (file type, size)

### P2 (Nice-to-Have)
12. Add user story input form and wire `POST /api/generate-userstory-tests`
13. Add real-time test output streaming
14. Add retry logic and request timeout handling

---

## 15. Summary Table

| Area | Status | Details |
|------|--------|---------|
| **Backend** | ✓ Ready | All 8 endpoints implemented |
| **Frontend API Calls** | ❌ None | 0 of 8 endpoints called |
| **State Management** | ❌ None | Isolated component state only |
| **Data Flow** | ❌ Broken | Views can't share data |
| **Buttons** | ⚠️ Partial | 6 buttons functional (4 are no-ops), 2 missing handlers |
| **Error Handling** | ❌ None | No try/catch or user feedback |
| **Loading States** | ❌ None | No visual feedback for API calls |
| **Mock Data** | ✓ Present | Entire UI uses mock-data.ts |

---

## Next Steps

**To make the application functional:**

1. Stop using mock data
2. Implement API client utility
3. Add global state management
4. Wire all buttons to real API endpoints
5. Add error and loading state handling
6. Test end-to-end workflow: upload → analyze → generate → execute → results

**Current Status**: 🎨 UI Design Complete | 🔌 Backend Ready | ❌ Frontend Integration Missing
