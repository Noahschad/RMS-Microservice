import os
from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Any
from pymongo import MongoClient, ReturnDocument
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME")

client = MongoClient(MONGO_URI)
db = client[MONGO_DB_NAME]
assessments_collection = db["assessments"]

app = FastAPI(title="RMS Microservice", version="1.0.0")

#CORS: erlaubt dem Frontend Anfragen an das Backend zu stellen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


#Pydantic validiert automatisch eingehende Daten

class AISystemInfo(BaseModel):
    assessor_name: str
    role: str
    ai_system_name: str
    date: str

class Scope(BaseModel):
    domain: str = ""
    phase: str = ""

class AssessmentCreate(BaseModel):
    ai_system: AISystemInfo
    scope: Scope = Scope()
    likelihood_scale: List[Any] = []
    impact_scale: List[Any] = []

class AssessmentUpdate(BaseModel):
    current_step: Optional[int] = None
    scope: Optional[Scope] = None
    likelihood_scale: Optional[List[Any]] = None
    impact_scale: Optional[List[Any]] = None
    risks: Optional[List[Any]] = None
    misuses: Optional[List[Any]] = None
    treatment_plans: Optional[List[Any]] = None
    status: Optional[str] = None


# MongoDB nutzt intern ein spezielles ObjectId-Format, das JSON nicht direkt
# versteht. Diese Funktion macht aus dem Dokument ein "normales" Dictionary.

def serialize_assessment(doc):
    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return doc



@app.get("/")
def root():
    return {"message": "RMS Microservice is running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-check")
def db_check():
    try:
        client.admin.command("ping")
        return {"mongodb": "connected", "database": MONGO_DB_NAME}
    except Exception as e:
        return {"mongodb": "error", "detail": str(e)}


#Assessment Endpoints
@app.post("/assessments") #neues Assessment anlegen
def create_assessment(payload: AssessmentCreate):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "status": "in_progress",
        "created_at": now,
        "updated_at": now,
        "current_step": 1,
        "ai_system": payload.ai_system.model_dump(),
        "scope": payload.scope.model_dump(),
        "likelihood_scale": payload.likelihood_scale,
        "impact_scale": payload.impact_scale,
        "risks": [],
        "misuses": [],
        "treatment_plans": [],
    }
    result = assessments_collection.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_assessment(doc)


@app.get("/assessments") #liste aller assessments
def list_assessments():
    docs = assessments_collection.find().sort("updated_at", -1)
    return [serialize_assessment(doc) for doc in docs]


@app.get("/assessments/{assessment_id}") #ein bestimmtes assessment laden
def get_assessment(assessment_id: str):
    try:
        doc = assessments_collection.find_one({"_id": ObjectId(assessment_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID")
    if not doc:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return serialize_assessment(doc)


@app.put("/assessments/{assessment_id}") #ein bestehendes assessment aktualisieren
def update_assessment(assessment_id: str, payload: AssessmentUpdate):
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        doc = assessments_collection.find_one_and_update(
            {"_id": ObjectId(assessment_id)},
            {"$set": update_data},
            return_document=ReturnDocument.AFTER,
        )
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid assessment ID")

    if not doc:
        raise HTTPException(status_code=404, detail="Assessment not found")
    return serialize_assessment(doc)