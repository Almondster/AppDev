# CREATECH Web Frontend

## Project Description
CREATECH Web Frontend is the browser-based interface for the CREATECH platform. It allows clients, creators, and administrators to access role-based pages for services, orders, messaging, moderation, and account management.

## Features
- Role-based user interface for client, creator, and admin users
- Authentication and login flow
- Service browsing and management
- Order tracking and status updates
- Messaging and notifications interface
- Wallet, payments, and profile management
- Admin dashboard and moderation tools

## Technology Stack
- Frontend: React 19
- Build tool: Vite
- Routing: React Router
- Styling: CSS and Tailwind CSS
- Icons: Lucide React
- Backend API: FastAPI backend
- Deployment: Vercel or other static hosting

## System Architecture
The web frontend communicates with the backend API over HTTP. Users access the React application in the browser, the frontend sends requests to the FastAPI backend, and the backend reads and writes application data from the database.

Basic flow:
- User opens the web app
- Frontend renders React pages and sends API requests
- Backend processes business logic and database operations
- Frontend displays returned data to the user

## Installation & Setup
1. Clone the repository.
2. Open the `AppDev` folder.
3. Install dependencies:

```powershell
npm install
```

4. Start the development server:

```powershell
npm run dev -- --host 0.0.0.0 --port 5173
```

5. Open:

- `http://localhost:5173`

## Deployment Link
- Live Web App: `https://app-dev-khaki.vercel.app`
- Demo Link: `[Add deployment link here]`

## Test Account
- Client account: `[Add test account here]`
- Creator account: `[Add test account here]`
- Admin account: `[Add test account here]`

## Team Members and Roles
| Team Member | Role | Responsibilities |
| :--- | :--- | :--- |
| `Fel Kristian Raut` | `[Role]` | `[Responsibilities]` |
| `Ralph John Ordiz` | `[Role]` | `[Responsibilities]` |
| `Ronald Rafaela` | `[Role]` | `[Responsibilities]` |
| `Stella Marie Galinada` | `[Role]` | `[Responsibilities]` |

## Known Limitations
- Some features depend on backend API availability
- Authentication and live data depend on correct environment configuration
- Realtime behavior may vary depending on backend and network availability
- Test account details and production deployment details still need to be finalized

## Screenshots
- `[Insert homepage screenshot here]`
- `[Insert dashboard screenshot here]`
- `[Insert messaging screenshot here]`
