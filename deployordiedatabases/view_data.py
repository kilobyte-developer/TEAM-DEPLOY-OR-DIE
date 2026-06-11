import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

print("\n===== CODE SAMPLES =====\n")

cursor.execute("SELECT * FROM code_samples")

for row in cursor.fetchall():
    print(row)

print("\n===== GOLDEN TESTS =====\n")

cursor.execute("SELECT * FROM golden_tests")

for row in cursor.fetchall():
    print(row)

conn.close()