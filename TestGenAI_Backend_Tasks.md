# TestGenAI Backend Tasks (Yogesh)

## Objective
Build the complete backend workflow for the hackathon MVP.

---

# Priority P0 (Must Complete)

## 1. File Upload API

### Endpoint
`POST /upload`

### Responsibilities
- Accept Python (.py) files
- Validate file type
- Store uploaded file locally
- Return file metadata

### Response Example

```json
{
  "file_name": "calculator.py",
  "file_size": "2.3 KB",
  "status": "uploaded"
}
```

---

## 2. AST Analysis Engine

### Endpoint
`POST /analyze`

### Responsibilities
- Parse uploaded Python code using Python AST
- Extract:
  - Functions
  - Parameters
  - Classes
  - Imports

### Example Output

```json
{
  "functions": [
    {
      "name": "add",
      "parameters": ["a", "b"]
    }
  ]
}
```

---

## 3. Code → Test Generation API

### Endpoint
`POST /generate-tests`

### Input
Python source code

### Responsibilities
- Send code to Gemini
- Generate pytest-compatible test cases
- Generate:
  - Unit Tests
  - Edge Cases

### Output

```json
{
  "generated_tests": "...pytest code..."
}
```

---

## 4. User Story → Test Case Generation

### Endpoint
`POST /generate-userstory-tests`

### Input Example

```text
As a user,
I should be able to reset my password
using a valid email address.
```

### Responsibilities
Generate:

- Functional Test Cases
- Negative Test Cases
- Edge Cases

### Output Example

```json
{
  "test_cases": [
    "Valid email reset",
    "Invalid email reset",
    "Empty email field"
  ]
}
```

---

## 5. Test Execution Engine

### Endpoint
`POST /run-tests`

### Responsibilities
- Save generated tests
- Execute pytest
- Capture:
  - stdout
  - stderr
- Return execution results

### Example Response

```json
{
  "passed": 8,
  "failed": 2,
  "status": "completed"
}
```

---

## 6. Results API

### Endpoint
`GET /results`

### Responsibilities
Return:

- Total Tests Generated
- Passed Tests
- Failed Tests
- Pass Rate

### Example

```json
{
  "tests_generated": 12,
  "passed": 10,
  "failed": 2,
  "pass_rate": 83
}
```

---

# Priority P1 (Should Complete)

## 7. Coverage Reporting

### Endpoint
`GET /coverage`

### Responsibilities
- Integrate pytest-cov
- Calculate coverage percentage
- Return coverage summary

### Example

```json
{
  "coverage": 78,
  "functions_covered": 14,
  "functions_missing": 4
}
```

---

## 8. Download Generated Tests

### Endpoint
`GET /download-tests`

### Responsibilities
- Return generated test file
- Download as:

```text
test_generated.py
```

---

# API List Summary

## Required

- POST /upload
- POST /analyze
- POST /generate-tests
- POST /generate-userstory-tests
- POST /run-tests
- GET /results

## Recommended

- GET /coverage
- GET /download-tests

---

# Folder Structure Suggestion

```text
backend/
│
├── main.py
├── routes/
│   ├── upload.py
│   ├── analyze.py
│   ├── generate.py
│   ├── execution.py
│   └── results.py
│
├── services/
│   ├── ast_parser.py
│   ├── gemini_service.py
│   ├── test_runner.py
│   └── coverage_service.py
│
├── uploads/
├── generated_tests/
└── reports/
```

---

# MVP Success Criteria

The MVP is considered complete when the following flow works:

```text
Upload Python File
        OR
Enter User Story

↓

Generate Tests

↓

View Generated Tests

↓

Run Tests

↓

View Results

↓

View Coverage
```

Focus on functionality first.
Ignore Docker, GitHub Actions, authentication, databases, and multi-language support.
