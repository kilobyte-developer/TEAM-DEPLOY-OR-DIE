import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

sample_id = 1

# Expected tests (Ground Truth)
expected_tests = {
    "assert add(2,3)==5",
    "assert add(-1,1)==0"
}

# Fetch generated tests from database
cursor.execute(
    """
    SELECT generated_test
    FROM generated_tests
    WHERE sample_id = ?
    """,
    (sample_id,)
)

generated_tests = set(row[0] for row in cursor.fetchall())

# Evaluation
matched = len(expected_tests.intersection(generated_tests))

total_expected = len(expected_tests)

accuracy = (
    matched / total_expected * 100
    if total_expected > 0
    else 0
)

print("\n===== EVALUATION REPORT =====")
print("Sample ID:", sample_id)
print("Expected Tests:", total_expected)
print("Generated Tests:", len(generated_tests))
print("Matched Tests:", matched)
print("Accuracy:", round(accuracy, 2), "%")

conn.close()