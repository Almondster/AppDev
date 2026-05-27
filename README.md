# CREATECH Backend API

## Project Description
CREATECH Backend API is the server-side application for the CREATECH platform. It handles authentication, business logic, order management, uploads, notifications, realtime features, and database access for the web and mobile clients.

## Features
- JWT-based authentication and authorization
- User, creator, and admin role handling
- Services, orders, reviews, disputes, and reports management
- Messaging and notification endpoints
- File upload handling for images and order files
- Realtime notification support
- Database schema setup and migration helpers
- Health check and API documentation endpoints

## Technology Stack
- Backend: FastAPI
- Language: Python 3.13
- ASGI server: Uvicorn
- ORM: SQLAlchemy
- Database: PostgreSQL
- Authentication: `python-jose` and `bcrypt`
- File handling: `python-multipart`
- Realtime support: Redis-based pub/sub fallback logic
- Cloud storage: Cloudflare R2 via `boto3`

## System Architecture
The backend receives API requests from the web and mobile frontends, validates the request, performs business logic, accesses the database, and returns JSON responses. Some events also trigger realtime notification delivery and file storage operations.

Basic flow:
- Frontend sends HTTP request to FastAPI API
- Backend validates auth and request payload
- Backend performs database queries or updates
- Backend optionally triggers notifications, uploads, or realtime events
- Backend returns JSON response to the client

## Installation & Setup
1. Clone the repository.
2. Open the `CREATECH-BACKEND-FASTAPI` folder.
3. Create and activate a virtual environment:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

4. Install dependencies:

```powershell
pip install -r requirements.txt
```

5. Create a `.env` file and configure at least:

- `DATABASE_URL`
- `SECRET_KEY`

Optional environment variables:
- `RENDER_INTERNAL_DATABASE_URL`
- `CREATECH_EAGER_SCHEMA_INIT`
- `CREATECH_R2_BUCKET`
- `CREATECH_R2_REGION`
- `CREATECH_R2_ACCOUNT_ID`
- `CREATECH_R2_ENDPOINT_URL`
- `CREATECH_R2_ACCESS_KEY_ID`
- `CREATECH_R2_SECRET_ACCESS_KEY`
- `CREATECH_REDIS_URL`

6. Start the backend server:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

7. Open:

- Health check: `http://127.0.0.1:8000/health`
- Swagger docs: `http://127.0.0.1:8000/docs`

## Deployment Link
- Live Backend API: `https://createch-backend-fastapi.onrender.com`
- API Docs: `https://createch-backend-fastapi.onrender.com/docs`
- Website Link: https://app-dev-khaki.vercel.app/
## Test Account
ADMIN
admin.20260522@createch.app
CreatechAdmin!2026

CLIENT
rydigefo@mailinator.com
Pa$$w0rd!

CREATOR
fasixevyly@mailinator.com
Pa$$w0rd!

## Team Members and Roles
| Team Member | Role | Responsibilities |
| :--- | :--- | :--- |
| `Fel Kirstian Raut` | `` | `[Responsibilities]` |
| `Ralph John Ordiz` | `` | `[Responsibilities]` |
| `Ronald Rafaela` | `[Role]` | `[Responsibilities]` |
| `Stella Marie Galinada` | `[Role]` | `[Responsibilities]` |

## Known Limitations
- Storage limitations because it is using the cloudflare R2 for the storage of output
- The render is free tier therefore it sometimes slow to connect to the server

## SCREENSHOTS
