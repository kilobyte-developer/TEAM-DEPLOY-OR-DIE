import type {
  ActivityItem,
  AnalysisResult,
  CoverageReport,
  EvaluationRecord,
  ExecutionResult,
  GeneratedTests,
  UploadedSourceFile,
  UserStoryTestSuite,
} from "@/lib/testgenai-types"

export const DEMO_MODE_ENABLED = true

export const USER_STORY_PLACEHOLDER = `As a customer,
I should be able to reset my password
using a registered email.`

export const SOURCE_CODE_ACCEPT = ".py,.ts,.tsx,.js,.jsx,.java,.go,.rb,.rs,.cs,.cpp,.c"

const LANGUAGE_MAP: Record<string, string> = {
  c: "C",
  cpp: "C++",
  cs: "C#",
  go: "Go",
  java: "Java",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  rb: "Ruby",
  rs: "Rust",
  ts: "TypeScript",
  tsx: "TypeScript",
}

export function detectLanguageFromFilename(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? ""
  return LANGUAGE_MAP[extension] ?? "Unknown"
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getWordCount(value: string) {
  return value.trim() ? value.trim().split(/\s+/).length : 0
}

export function createLocalUploadedFile(
  file: Pick<File, "name" | "size">,
  index: number,
): UploadedSourceFile {
  return {
    id: `local-${Date.now()}-${index}`,
    name: file.name,
    language: detectLanguageFromFilename(file.name),
    repository: "local-workspace",
    sizeBytes: file.size,
    sizeLabel: formatBytes(file.size),
    source: "local",
    status: "Uploaded",
    uploadedAt: new Date().toISOString(),
  }
}

export const demoUploadedFiles: UploadedSourceFile[] = [
  {
    id: "demo-file-1",
    name: "auth_service.py",
    language: "Python",
    repository: "testgenai-demo",
    sizeBytes: 8430,
    sizeLabel: "8.2 KB",
    source: "demo",
    status: "Analyzed",
    uploadedAt: "2026-06-10T09:10:00.000Z",
  },
  {
    id: "demo-file-2",
    name: "pricing_engine.ts",
    language: "TypeScript",
    repository: "testgenai-demo",
    sizeBytes: 10752,
    sizeLabel: "10.5 KB",
    source: "demo",
    status: "Analyzed",
    uploadedAt: "2026-06-10T09:14:00.000Z",
  },
  {
    id: "demo-file-3",
    name: "session_manager.js",
    language: "JavaScript",
    repository: "testgenai-demo",
    sizeBytes: 4124,
    sizeLabel: "4.0 KB",
    source: "demo",
    status: "Uploaded",
    uploadedAt: "2026-06-10T09:18:00.000Z",
  },
]

export const demoAnalysisResult: AnalysisResult = {
  repository: "testgenai-demo",
  generatedAt: "2026-06-10T09:20:00.000Z",
  imports: ["bcrypt", "jwt", "email-validator", "zod", "date-fns"],
  dependencies: ["bcrypt", "jwt", "email-validator", "zod", "date-fns"],
  classes: [
    {
      id: "analysis-class-1",
      name: "AuthService",
      fileName: "auth_service.py",
      methods: ["login_user", "reset_password", "verify_reset_token"],
      dependencies: ["bcrypt", "jwt"],
    },
    {
      id: "analysis-class-2",
      name: "PricingEngine",
      fileName: "pricing_engine.ts",
      methods: ["applyDiscount", "resolveTier", "calculateTax"],
      dependencies: ["zod", "date-fns"],
    },
  ],
  functions: [
    {
      id: "analysis-fn-1",
      name: "reset_password",
      fileName: "auth_service.py",
      className: "AuthService",
      parameters: [
        { name: "email", type: "str" },
        { name: "reset_token", type: "str" },
        { name: "new_password", type: "str" },
      ],
      returnType: "bool",
      dependencies: ["email-validator", "bcrypt"],
      description: "Validates email ownership and rotates the stored password hash.",
    },
    {
      id: "analysis-fn-2",
      name: "verify_reset_token",
      fileName: "auth_service.py",
      className: "AuthService",
      parameters: [{ name: "token", type: "str" }],
      returnType: "TokenPayload | None",
      dependencies: ["jwt"],
      description: "Verifies token expiry, issuer, and signature before password reset.",
    },
    {
      id: "analysis-fn-3",
      name: "applyDiscount",
      fileName: "pricing_engine.ts",
      className: "PricingEngine",
      parameters: [
        { name: "subtotal", type: "number" },
        { name: "promoCode", type: "string | null" },
      ],
      returnType: "number",
      dependencies: ["zod"],
      description: "Applies rule-based discounts with promo code validation and bounds checks.",
    },
    {
      id: "analysis-fn-4",
      name: "refreshSession",
      fileName: "session_manager.js",
      parameters: [
        { name: "sessionId", type: "string" },
        { name: "deviceFingerprint", type: "string" },
      ],
      returnType: "Promise<Session>",
      dependencies: ["jwt", "date-fns"],
      description: "Extends a valid session while logging device mismatch warnings.",
    },
  ],
}

export const demoGeneratedTests: GeneratedTests = {
  repository: "testgenai-demo",
  generatedAt: "2026-06-10T09:24:00.000Z",
  summary: {
    filesCovered: 3,
    unitTestsGenerated: 14,
    edgeTestsGenerated: 8,
  },
  unitTests: [
    {
      id: "unit-1",
      fileName: "tests/test_auth_service.py",
      label: "Auth Service Unit Tests",
      language: "python",
      testCount: 8,
      code: `import pytest
from auth_service import AuthService


def test_reset_password_accepts_registered_email(auth_service: AuthService):
    assert auth_service.reset_password(
        email="sam@example.com",
        reset_token="valid-token",
        new_password="N3wPassword!"
    ) is True


def test_verify_reset_token_returns_payload(auth_service: AuthService):
    payload = auth_service.verify_reset_token("valid-token")
    assert payload["email"] == "sam@example.com"


def test_apply_discount_honors_promo_code(pricing_engine):
    assert pricing_engine.applyDiscount(200, "SPRING20") == 160


def test_refresh_session_extends_expiry(session_manager):
    refreshed = session_manager.refreshSession("sess-123", "device-abc")
    assert refreshed["expires_in"] > 0`,
    },
  ],
  edgeCaseTests: [
    {
      id: "edge-1",
      fileName: "tests/test_auth_service_edge.py",
      label: "Auth Service Edge Cases",
      language: "python",
      testCount: 6,
      code: `import pytest
from auth_service import AuthService


def test_reset_password_rejects_unregistered_email(auth_service: AuthService):
    with pytest.raises(ValueError):
        auth_service.reset_password(
            email="missing@example.com",
            reset_token="valid-token",
            new_password="N3wPassword!"
        )


def test_verify_reset_token_rejects_expired_token(auth_service: AuthService):
    assert auth_service.verify_reset_token("expired-token") is None


def test_apply_discount_caps_discount_to_subtotal(pricing_engine):
    assert pricing_engine.applyDiscount(50, "FREE100") == 0


def test_refresh_session_rejects_unknown_device(session_manager):
    with pytest.raises(PermissionError):
        session_manager.refreshSession("sess-123", "unknown-device")`,
    },
  ],
}

export const demoUserStoryInput = USER_STORY_PLACEHOLDER

export const demoUserStoryTestSuite: UserStoryTestSuite = {
  story: demoUserStoryInput,
  status: "Generated",
  wordCount: getWordCount(demoUserStoryInput),
  generatedAt: "2026-06-10T09:27:00.000Z",
  positiveCases: [
    {
      id: "TC-US-001",
      priority: "High",
      scenario: "Registered customer requests a password reset with a valid email.",
      steps: [
        "Open the forgot password screen.",
        "Enter a registered customer email address.",
        "Submit the reset request.",
      ],
      expectedResult: "A reset email is issued and the UI confirms the request without exposing account state.",
    },
    {
      id: "TC-US-002",
      priority: "High",
      scenario: "Customer completes reset using a valid token before expiration.",
      steps: [
        "Open the reset link from email.",
        "Enter a compliant new password.",
        "Submit the new password.",
      ],
      expectedResult: "Password is updated and the customer can authenticate with the new password.",
    },
  ],
  negativeCases: [
    {
      id: "TC-US-NEG-001",
      priority: "Critical",
      scenario: "Unregistered email address is submitted for password reset.",
      steps: [
        "Open the forgot password screen.",
        "Enter an email address not present in the system.",
        "Submit the request.",
      ],
      expectedResult: "The system returns a generic confirmation and does not leak user existence.",
    },
    {
      id: "TC-US-NEG-002",
      priority: "High",
      scenario: "Customer enters a password that violates policy rules.",
      steps: [
        "Open a valid reset link.",
        "Enter a weak password such as 123456.",
        "Submit the form.",
      ],
      expectedResult: "Validation blocks submission and highlights the password policy issue.",
    },
  ],
  edgeCases: [
    {
      id: "TC-US-EDGE-001",
      priority: "Medium",
      scenario: "Reset token expires while the customer is on the reset screen.",
      steps: [
        "Open a reset link close to expiry.",
        "Wait until the token is no longer valid.",
        "Attempt to submit a new password.",
      ],
      expectedResult: "The system rejects the submission and prompts the user to request a fresh link.",
    },
    {
      id: "TC-US-EDGE-002",
      priority: "Medium",
      scenario: "Customer requests multiple reset emails in quick succession.",
      steps: [
        "Submit a password reset request several times within one minute.",
        "Open the most recent email.",
        "Attempt reset with an older token first.",
      ],
      expectedResult: "Older tokens are invalidated and only the latest valid token completes the flow.",
    },
  ],
}

export const demoExecutionResult: ExecutionResult = {
  mode: "source-code",
  status: "completed",
  generatedAt: "2026-06-10T09:30:00.000Z",
  totalTests: 22,
  passedTests: 19,
  failedTests: 3,
  executionTime: "1.84s",
  passRate: 86.4,
  logs: [
    { timestamp: "09:30:01", level: "info", message: "$ pytest tests/ --cov --verbose" },
    { timestamp: "09:30:01", level: "info", message: "platform linux -- Python 3.12.2, pytest-8.4.0" },
    { timestamp: "09:30:02", level: "info", message: "collected 22 items" },
    { timestamp: "09:30:03", level: "pass", message: "tests/test_auth_service.py::test_reset_password_accepts_registered_email PASSED" },
    { timestamp: "09:30:03", level: "pass", message: "tests/test_auth_service.py::test_verify_reset_token_returns_payload PASSED" },
    { timestamp: "09:30:03", level: "warn", message: "session_manager emitted a device fingerprint warning during refreshSession." },
    { timestamp: "09:30:04", level: "fail", message: "tests/test_auth_service_edge.py::test_verify_reset_token_rejects_expired_token FAILED" },
    { timestamp: "09:30:04", level: "pass", message: "tests/test_pricing_engine.py::test_apply_discount_honors_promo_code PASSED" },
    { timestamp: "09:30:04", level: "pass", message: "tests/test_pricing_engine_edge.py::test_apply_discount_caps_discount_to_subtotal PASSED" },
    { timestamp: "09:30:05", level: "fail", message: "tests/test_session_manager.py::test_refresh_session_rejects_unknown_device FAILED" },
    { timestamp: "09:30:05", level: "fail", message: "tests/test_session_manager.py::test_refresh_session_extends_expiry FAILED" },
    { timestamp: "09:30:06", level: "info", message: "---------- coverage: 91.8% ----------" },
    { timestamp: "09:30:06", level: "info", message: "19 passed, 3 failed in 1.84s" },
  ],
}

export const demoUserStoryExecutionResult: ExecutionResult = {
  mode: "user-story",
  status: "completed",
  generatedAt: "2026-06-10T09:32:00.000Z",
  totalTests: 6,
  passedTests: 6,
  failedTests: 0,
  executionTime: "0.73s",
  passRate: 100,
  logs: [
    { timestamp: "09:32:01", level: "info", message: "$ pytest tests/user_story/ --verbose" },
    { timestamp: "09:32:01", level: "info", message: "executing generated scenario validations for password reset workflow" },
    { timestamp: "09:32:02", level: "pass", message: "TC-US-001 registered email flow PASSED" },
    { timestamp: "09:32:02", level: "pass", message: "TC-US-002 valid reset token flow PASSED" },
    { timestamp: "09:32:02", level: "pass", message: "TC-US-NEG-001 unknown email privacy validation PASSED" },
    { timestamp: "09:32:03", level: "pass", message: "TC-US-NEG-002 weak password policy validation PASSED" },
    { timestamp: "09:32:03", level: "pass", message: "TC-US-EDGE-001 expired token recovery PASSED" },
    { timestamp: "09:32:03", level: "pass", message: "TC-US-EDGE-002 newest token wins PASSED" },
    { timestamp: "09:32:04", level: "info", message: "6 passed in 0.73s" },
  ],
}

export const demoCoverageReport: CoverageReport = {
  generatedAt: "2026-06-10T09:31:00.000Z",
  coveragePercent: 91.8,
  functionsCovered: 22,
  functionsMissingCoverage: [
    "verify_reset_token.invalid_signature_path",
    "refreshSession.device_lockout_guard",
    "applyDiscount.rounding_rule_for_fractional_tax",
  ],
  edgeCasesCovered: 7,
  summary:
    "Coverage is strong across authentication and pricing logic, with the remaining gaps concentrated in expiry handling, invalid signatures, and device anomaly branches.",
  byFile: [
    {
      fileName: "auth_service.py",
      coveragePercent: 94,
      coveredFunctions: 9,
      missingFunctions: ["verify_reset_token.invalid_signature_path"],
    },
    {
      fileName: "pricing_engine.ts",
      coveragePercent: 92,
      coveredFunctions: 7,
      missingFunctions: ["applyDiscount.rounding_rule_for_fractional_tax"],
    },
    {
      fileName: "session_manager.js",
      coveragePercent: 87,
      coveredFunctions: 6,
      missingFunctions: ["refreshSession.device_lockout_guard"],
    },
  ],
}

export const demoEvaluationResults: EvaluationRecord[] = [
  { repository: "auth-service", testsGenerated: 9, passed: 8, failed: 1, coverage: 94, status: "PARTIAL" },
  { repository: "pricing-engine", testsGenerated: 7, passed: 7, failed: 0, coverage: 92, status: "PASS" },
  { repository: "session-manager", testsGenerated: 6, passed: 4, failed: 2, coverage: 87, status: "PARTIAL" },
  { repository: "notifications", testsGenerated: 5, passed: 3, failed: 2, coverage: 74, status: "FAIL" },
]

export const demoInitialActivity: ActivityItem[] = [
  { id: "activity-1", type: "coverage", label: "Coverage Calculated", detail: "91.8% coverage across 3 modules", time: "1 min ago" },
  { id: "activity-2", type: "execution", label: "Test Run Completed", detail: "19 passed and 3 failed in 1.84s", time: "3 min ago" },
  { id: "activity-3", type: "generation", label: "Tests Generated", detail: "22 source-code tests prepared for review", time: "7 min ago" },
  { id: "activity-4", type: "analysis", label: "AST Analysis Ready", detail: "4 functions and 2 classes detected", time: "10 min ago" },
  { id: "activity-5", type: "upload", label: "Source Files Uploaded", detail: "3 files staged for analysis", time: "14 min ago" },
]
