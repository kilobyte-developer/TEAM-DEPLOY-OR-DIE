import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

cursor.execute(
    """
    INSERT INTO golden_tests(sample_id,test_case)
    VALUES (?,?)
    """,
    (6, "assert safe_divide(10,0)=='Error'")
)

conn.commit()

print("Inserted:", cursor.rowcount)

conn.close()