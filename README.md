# RMS Microservice

Risk Management System (RMS) prototype developed as part of the bachelor thesis.

Bachelor thesis: "Design and Implementation of a Risk Management System Based on Article 9 of the EU AI Act".

The prototype implements a software-supported risk management workflow for high-risk AI systems.

## Technology Stack

- Frontend: React + Vite
- Backend: FastAPI
- Database: MongoDB
- Local AI inference: Ollama with `phi3:mini`
- Database container: Docker Compose

## Prerequisites

Install the following software before starting the RMS:

- Python 3
- Node.js and npm
- Docker with Docker Compose
- Ollama

## 1. Clone the Repository

```bash
git clone https://github.com/Noahschad/RMS-Microservice.git
cd RMS-Microservice
```

## 2. Start MongoDB

From the repository root, run:

```bash
docker compose up -d mongodb
```

To verify that the container is running:

```bash
docker compose ps
```

MongoDB is exposed on port `27017`.

## 3. Set Up the Backend

Navigate to the backend directory:

```bash
cd backend/rms
```

Create a Python virtual environment:

```bash
python3 -m venv venv
```

Activate it on macOS or Linux:

```bash
source venv/bin/activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create the local environment file from the provided example:

```bash
cp .env.example .env
```

The default configuration is:

```env
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=rms_db
DEMO_MODE=false
```

## 4. Set Up Ollama

Install the model used by the prototype:

```bash
ollama pull phi3:mini
```

Make sure Ollama is running locally. The RMS expects the Ollama API at:

```text
http://localhost:11434
```

If Ollama is not already running as an application or service, start it with:

```bash
ollama serve
```

## 5. Start the Backend

From `backend/rms`, with the virtual environment activated, run:

```bash
python -m uvicorn main:app --reload
```

The backend is then available at:

```text
http://127.0.0.1:8000
```

A database connection check is available at:

```text
http://127.0.0.1:8000/db-check
```

## 6. Set Up and Start the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend/rms-frontend-vite
```

Install the dependencies:

```bash
npm ci
```

Start the development server:

```bash
npm run dev
```

The RMS user interface is then available at:

```text
http://localhost:5173
```

## Demonstration Mode

By default, the RMS runs with:

```env
DEMO_MODE=false
```

In this mode, AI Model Checks are executed through live inference using Ollama.

Setting `DEMO_MODE=true` enables reuse of configuration-specific cached AI Model Check results. This mode is intended only for demonstrations. The corresponding test configuration must have been executed at least once with `DEMO_MODE=false` before a cached result can be reused.

## Example Data

The repository contains example data used during development and evaluation:

- `backend/rms/test_data.py` contains the eight synthetic credit applicants used by the built-in Finance example.
- `backend/rms/bpi_sample.csv` contains a sample derived from the BPI Challenge 2017 data for testing the custom CSV upload.
- `backend/rms/hr_test.csv` contains a small HR & Recruitment example dataset for testing the domain-independent upload functionality.

## Project Structure

```text
RMS-Microservice/
├── backend/
│   └── rms/
│       ├── main.py
│       ├── test_data.py
│       ├── bpi_sample.csv
│       ├── hr_test.csv
│       ├── requirements.txt
│       └── .env.example
├── frontend/
│   └── rms-frontend-vite/
│       ├── src/
│       ├── package.json
│       └── package-lock.json
├── docker-compose.yml
└── README.md
```

## Notes

This repository contains a research prototype developed for a bachelor thesis. It is intended to demonstrate the operationalization of selected risk management requirements of Article 9 of the EU AI Act. It should not be interpreted as a standalone compliance solution or as demonstrating full regulatory compliance.
