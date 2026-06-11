# DATASET CREATION REPORT

## 1. Folder Structure Created
- datasets/source_code/simple
- datasets/source_code/medium
- datasets/source_code/large
- datasets/source_code/buggy
- datasets/user_stories/banking
- datasets/user_stories/ecommerce
- datasets/user_stories/healthcare
- datasets/user_stories/authentication
- datasets/evaluation/golden_dataset.json

## 2. Dataset Counts
- Source code datasets: 40
- User story datasets: 40
- Golden dataset files: 1
- Report files: 1
- Total dataset files: 81
- Total files created including this report: 82

## 3. Source Code Dataset Summary
- Simple: 10 Python files with 1 to 3 focused business functions for smoke testing.
- Medium: 10 Python files with classes, validation, business rules, and multiple branches.
- Large: 10 enterprise-style Python files with multiple classes, exceptions, state transitions, audit logging, limits, and document validation.
- Buggy: 10 Python files with intentional semantic defects for intent-based logic issue detection.

## 4. User Story Dataset Summary
- Banking: 10 Agile stories covering transfers, lending, KYC, fraud, remittance, and ATM flows.
- Ecommerce: 10 Agile stories covering checkout, coupons, returns, refunds, inventory, reviews, and subscriptions.
- Healthcare: 10 Agile stories covering appointments, prescriptions, reports, registration, insurance, and telemedicine.
- Authentication: 10 Agile stories covering login, reset, MFA, recovery, device checks, sessions, RBAC, registration, verification, and lockout.

## 5. Golden Dataset Summary
- datasets/evaluation/golden_dataset.json contains 80 benchmark entries.
- Source entries include expected function counts, class counts, category, file name, and expected test categories.
- User story entries include category, story slug, and expected test categories.

## 6. Coverage Matrix
| Capability | Covered By |
| --- | --- |
| AST parsing | Simple, medium, and large Python files |
| Class/method extraction | Medium and large Python files |
| Human-readable test generation | All source code and user story datasets |
| Executable test generation | Python source datasets |
| User story generation | All 40 user story files |
| Logic defect detection | Buggy source code datasets |
| Boundary conditions | Numeric limits in source and user stories |
| Security | Authentication stories, banking OTP rules, healthcare access rules |
| Compliance | Banking KYC, healthcare privacy, audit requirements |
| State transitions | Large enterprise source files |
| Exception handling | Medium and large source files |
| Rate limiting/session management | Authentication user stories |

## 7. Business Domains Covered
Authentication, banking, healthcare, ecommerce, finance, inventory, HR, education, security, payments, scheduling, notifications, compliance, fraud detection, role-based access, OTP validation, boundary validation, rate limiting, session management, data validation, and exception handling.

## 8. Evaluation Readiness Assessment
The dataset is ready for demos, screenshots, regression testing, golden evaluation, and hackathon judging. Files are named predictably, grouped by difficulty/domain, and aligned with TESTGENAI's AST, semantic, executable, user-story, coverage, and logic-defect workflows.

## 9. Total Files Created
- 40 source code files
- 40 user story files
- 1 golden dataset JSON file
- 1 dataset creation report
- Total: 82 files

## 10. Assumptions Made
- Python-only source code datasets are sufficient for the current MVP upload and AST pipeline.
- Large files target enterprise-style AST stress rather than external service execution.
- Buggy files intentionally preserve syntactically valid Python while violating semantic intent.
- Dataset files are self-contained and do not require dependency or configuration changes.
