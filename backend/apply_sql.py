import psycopg2, os
from dotenv import load_dotenv

load_dotenv('c:/global/backend/.env')
conn = psycopg2.connect(os.getenv('SUPABASE_DB_URL'))
cur = conn.cursor()
with open('c:/global/backend/database/003_phase9_tables.sql', 'r') as f:
    cur.execute(f.read())
conn.commit()
cur.execute("NOTIFY pgrst, 'reload schema';")
conn.commit()
print('SQL applied and schema reloaded.')
