from pymongo import MongoClient
import sys

try:
    client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
    client.server_info() # trigger connection
    print("MongoDB is running")
except Exception as e:
    print(f"MongoDB error: {e}")
    sys.exit(1)
