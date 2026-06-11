import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

cursor.execute("SELECT COUNT(*) FROM golden_tests")

print("Total Rows:", cursor.fetchone()[0])

conn.close()