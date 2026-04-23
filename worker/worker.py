import json
import os
import traceback
from datetime import datetime

from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from redis import Redis

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://127.0.0.1:27017/ai_task_platform")
REDIS_HOST = os.getenv("REDIS_HOST", "127.0.0.1")
REDIS_PORT = int(os.getenv("REDIS_PORT", "6379"))
REDIS_QUEUE_KEY = os.getenv("REDIS_QUEUE_KEY", "task_jobs")
DB_NAME = os.getenv("MONGO_DB_NAME", "ai_task_platform")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client[DB_NAME]
tasks = db.tasks

redis_client = Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


def append_log(task_id, message):
    tasks.update_one(
        {"_id": ObjectId(task_id)},
        {"$push": {"logs": {"message": message, "at": datetime.utcnow()}}},
    )


def process_task(task):
    operation = task.get("operation")
    input_text = task.get("inputText", "")

    if operation == "uppercase":
        return input_text.upper()
    if operation == "lowercase":
        return input_text.lower()
    if operation == "reverse":
        return input_text[::-1]
    if operation == "word_count":
        word_count = len([word for word in input_text.split() if word.strip()])
        return str(word_count)

    raise ValueError(f"Unsupported operation: {operation}")


def run_loop():
    print("Worker started. Waiting for jobs...")
    while True:
        _, payload = redis_client.brpop(REDIS_QUEUE_KEY)

        try:
            data = json.loads(payload)
            task_id = data["taskId"]

            task = tasks.find_one({"_id": ObjectId(task_id)})
            if not task:
                continue

            tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"status": "running", "errorMessage": ""}},
            )
            append_log(task_id, "Worker picked the task")

            result = process_task(task)

            tasks.update_one(
                {"_id": ObjectId(task_id)},
                {"$set": {"status": "success", "result": result}},
            )
            append_log(task_id, "Task completed successfully")
        except Exception as error:
            print("Task processing failed:", error)
            traceback.print_exc()

            task_id = None
            try:
                maybe_data = json.loads(payload)
                task_id = maybe_data.get("taskId")
            except Exception:
                pass

            if task_id:
                tasks.update_one(
                    {"_id": ObjectId(task_id)},
                    {
                        "$set": {
                            "status": "failed",
                            "errorMessage": str(error),
                        }
                    },
                )
                append_log(task_id, f"Task failed: {error}")


if __name__ == "__main__":
    run_loop()
