from fastapi import FastAPI

app = FastAPI(title="RMS Microservice", version="1.0.0")

@app.get("/")
def root():
    return {"message": "RMS Microservice is running"}

@app.get("/health")
def health():
    return {"status": "ok"}