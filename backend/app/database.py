from pymongo import MongoClient
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")

try:
    client = MongoClient(MONGODB_URL)
    db = client.get_database("smart_attendance")
    logger.info("Successfully connected to MongoDB")
except Exception as e:
    logger.error(f"Error connecting to MongoDB: {e}")
    raise e

def get_db():
    """Dependency to get the MongoDB database instance per request"""
    try:
        yield db
    finally:
        pass
