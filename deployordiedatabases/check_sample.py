import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM code_samples WHERE id=6")

print(cursor.fetchall())

conn.close()