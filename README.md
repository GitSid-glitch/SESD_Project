# Smart Project Management System

Backend-focused full stack SESD project for managing users, projects, sprints, tasks, comments, activity logs, and notifications.

## Submission Checklist

This repository now includes:

- [idea.md](/Users/siddharthshukla/Desktop/Everything/SESD_Project/idea.md)
- [useCaseDiagram.md](/Users/siddharthshukla/Desktop/Everything/SESD_Project/useCaseDiagram.md)
- [sequenceDiagram.md](/Users/siddharthshukla/Desktop/Everything/SESD_Project/sequenceDiagram.md)
- [classDiagram.md](/Users/siddharthshukla/Desktop/Everything/SESD_Project/classDiagram.md)
- [ErDiagram.md](/Users/siddharthshukla/Desktop/Everything/SESD_Project/ErDiagram.md)
- Full backend implementation
- Minimal frontend interface
- Seed data and test coverage

## Tech Stack

- Backend: Node.js + TypeScript
- Frontend: HTML, CSS, TypeScript-compiled browser script
- Persistence: JSON-based local datastore
- Auth: signed token-based authentication
- Testing: Node built-in test runner with TypeScript-compiled tests

## How To Run

1. Start with seeded demo data:

```bash
npm run seed
```

2. Run the application:

```bash
npm start
```

3. Open the browser at:

```text
http://127.0.0.1:3000
```

4. Run tests:

```bash
npm test
```

TypeScript build:

```bash
npm run build
```

## Deployment

This project is now deployment-ready for simple Node hosts.

Environment variables:

- `HOST=0.0.0.0`
- `PORT=3000` or the platform-provided port
- `TOKEN_SECRET=<secure-secret>`
- `DATA_FILE=data/database.json`

Options included in the repo:

- [Dockerfile](/Users/siddharthshukla/Desktop/Everything/SESD_Project/Dockerfile) for container deployment
- [render.yaml](/Users/siddharthshukla/Desktop/Everything/SESD_Project/render.yaml) for Render
- [.env.example](/Users/siddharthshukla/Desktop/Everything/SESD_Project/.env.example) for local/prod env setup

Important note:

- The current app persists data in a local JSON file. This works for demos and small single-instance deployments, but a real production deployment should eventually move to PostgreSQL or another DBMS.

## Demo Credentials

- Admin: `admin@sesd.local / Admin@123`
- Manager: `manager@sesd.local / Manager@123`
- Member: `member@sesd.local / Member@123`

## Implemented Features

- User registration and login
- Role-based access control for `ADMIN`, `MANAGER`, and `MEMBER`
- Project creation, update, archive, and membership management
- Project member removal with reassignment safety checks
- Sprint creation and status tracking
- Task creation, assignment, filtering, pagination, status transitions, and soft delete
- Comment creation on tasks
- Activity logging for important operations
- Notification generation for assignments and comments
- Dashboard summary for projects, tasks, activity, and notifications
- Backend validations for project data, sprint date ranges, due dates, and sprint-project consistency
- Admin deactivation safeguards to preserve system access integrity

## Architecture

The code follows the required layered architecture:

- Controllers: request handling and response coordination
- Services: business rules and authorization
- Repositories: persistence abstraction over the datastore
- Models: domain entities and OOP behavior

The implementation is intentionally backend-heavy to match the SESD evaluation weightage. The frontend is a thin client over the service layer, while most complexity lives in authorization, validations, lifecycle rules, analytics, and test-covered business operations.

## OOP And Design Patterns

The implementation explicitly demonstrates:

- Encapsulation through model methods such as `updateProject`, `assignUser`, `editComment`, and `completeSprint`
- Inheritance through `Notification`, `EmailNotification`, and `InAppNotification`
- Polymorphism in notification sending behavior
- Strategy Pattern in task status transition rules
- Factory Pattern in notification creation
- Validation Pipeline pattern for structured business-rule validation
- Singleton-style shared datastore instance for centralized persistence access

The OOP structure is now clearer in the codebase:

- Models own state changes and domain behavior
- Services orchestrate use cases and coordinate repositories
- Repositories isolate persistence concerns
- Validators encapsulate business validation rules outside controllers
- Controllers stay thin and delegate to services
- TypeScript source reinforces these boundaries through explicit class-based modules and typed build separation

## Project Structure

```text
public/                  Frontend UI
src/controllers/         API controllers
src/services/            Business logic
src/repositories/        Data access layer
src/models/              Domain models
src/patterns/            Factory and strategy implementations
src/scripts/seed.js      Demo data setup
test/                    Automated tests
```

## Important Notes

- The project uses a local JSON datastore so it runs without external setup.
- Data is stored in `data/database.json` after seeding or using the app.
- The backend codebase is intentionally the major part of the implementation to match the SESD backend-heavy evaluation weightage.
