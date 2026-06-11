import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

samples = [

(
1,
"Simple Function",
"def add(a,b): return a+b"
),

(
3,
"Simple Function",
"def subtract(a,b): return a-b"
),

(
4,
"Edge Case",
"def divide(a,b): return a/b"
),

(
5,
"Complex Logic",
"def is_even(n): return n%2==0"
),

(
6,
"Error Handling",
"""def safe_divide(a,b):
    try:
        return a/b
    except ZeroDivisionError:
        return 'Error'
"""
)

]

cursor.executemany(
"INSERT INTO code_samples VALUES (?,?,?)",
samples
)

conn.commit()
conn.close()

print("Samples Inserted Successfully")