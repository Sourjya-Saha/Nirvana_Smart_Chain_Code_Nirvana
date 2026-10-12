import datetime
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

__cnx = None

def get_sql_connection():
  print("Opening mysql connection")
  global __cnx

  if __cnx is None or not __cnx.is_connected():
    __cnx = mysql.connector.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        user=os.getenv('DB_USER', 'root'),
        password=os.getenv('DB_PASSWORD', 'sourjya@1614'),
        database=os.getenv('DB_NAME', 'drug_inventory_new')
    )

  return __cnx




