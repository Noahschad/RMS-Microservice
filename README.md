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

- Git: https://git-scm.com/downloads
- Python 3: https://www.python.org/downloads/
- Node.js and npm: https://nodejs.org/en/download
- Docker Desktop with Docker Compose: https://www.docker.com/products/docker-desktop/
- Ollama: https://ollama.com/download

After installation, make sure that Docker Desktop and Ollama are running before starting the RMS.

The prototype was developed and tested with Python 3.12, Node.js 24, npm 11, Docker 29 with Docker Compose 5, and Ollama 0.31.

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

Create a Python virtual environment.

On macOS or Linux:

```bash
python3 -m venv venv
```

On Windows:

```cmd
python -m venv venv
```

Activate it on macOS or Linux:

```bash
source venv/bin/activate
```

On Windows PowerShell:

```powershell
venv\Scripts\Activate.ps1
```

On Windows Command Prompt:

```cmd
venv\Scripts\activate.bat
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Create the local environment file from the provided example.

On macOS or Linux:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

On Windows Command Prompt:

```cmd
copy .env.example .env
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

Open a second terminal, navigate to the cloned `RMS-Microservice` repository root, and then open the frontend directory:

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

## Verify the Installation

After starting MongoDB, the backend, and the frontend, verify the setup as follows:

1. Open `http://127.0.0.1:8000/db-check` in a browser. The response should confirm that MongoDB is connected.
2. Open `http://localhost:5173` in a browser. The RMS user interface should load.
3. Run one complete assessment workflow in the RMS to confirm that frontend, backend, database, and Ollama are working together.

> **Note:** On the first execution of an AI Model Check after starting Ollama, the local model may require a cold start. If the first result is incomplete, run the test once more after the model has warmed up. A fresh installation also does not contain previously cached AI Model Check results.
