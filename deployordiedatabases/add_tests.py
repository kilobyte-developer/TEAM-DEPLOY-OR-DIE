import sqlite3

conn = sqlite3.connect("evaluation.db")
cursor = conn.cursor()

tests = [

(1,"assert add(2,3)==5"),
(1,"assert add(-1,1)==0"),

(3,"assert subtract(5,3)==2"),

(4,"assert divide(10,2)==5"),

(5,"assert is_even(4)==True"),

(6,"assert safe_divide(10,0)=='Error'")

]

cursor.executemany(
"""
INSERT INTO golden_tests
(sample_id,test_case)
VALUES (?,?)
""",
tests
)

conn.commit()
conn.close()

print("Tests Added Successfully")