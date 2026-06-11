import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

cursor.execute(
    """
    UPDATE golden_tests
    SET test_case = ?
    WHERE id = ?
    """,
    ("assert safe_divide(10,0)=='Error'", 6)
)

conn.commit()

print("Rows Updated:", cursor.rowcount)

conn.close()