import sqlite3

conn = sqlite3.connect('db.sqlite3')
cursor = conn.cursor()
cursor.execute('DROP TABLE IF EXISTS recipes_recipe_ingredients;')
conn.commit()
conn.close()
print("Dropped table recipes_recipe_ingredients.")