# Hospital System

## Run without Docker
```bash
pip install -r requirements.txt
uvicorn app.main:app --reload


## Run with Docker
```bash
docker-compose up --build