import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS code_samples(
    id INTEGER PRIMARY KEY,
    category TEXT,
    code TEXT
)
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS golden_tests(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sample_id INTEGER,
    test_case TEXT
)
""")

conn.commit()
conn.close()

print("Database Created Successfully")