import os
from dotenv import load_dotenv

load_dotenv()  # โหลดค่าจากไฟล์ .env

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import admin_retrain

app = FastAPI(title="TranSlate Admin Backend")

# อนุญาต Frontend (localhost:5173) เข้าถึงได้
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://final-project-ku-kps.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# รวม router ของ admin_retrain
app.include_router(admin_retrain.router)


@app.get("/")
def root():
    return {"status": "online", "service": "TranSlate Admin Backend"}
