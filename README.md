# Booky - Technical Documentation

## 1. Overview

**Booky** is a universal reservation platform designed to support a wide variety of services and venues. This document outlines the technical architecture, data structures, and the API specification for the frontend of the Booky application.

### 1.1. Technology Stack

- **Framework**: Angular (v20+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **Architecture**: Zoneless, Standalone Components
- **HTTP Client**: Angular HttpClient

### 1.2. Core Concepts

- **Zoneless Change Detection**: The application is built without Zone.js, relying on signals for granular and performant change detection.
- **Standalone Components**: The entire application uses the standalone component architecture, eliminating the need for NgModules.
- **Signal-Based State Management**: Component and service state is managed reactively using Angular Signals, `computed` for derived state, and `effect` for side effects.
- **API-Driven**: The application is architected to communicate with a remote backend via a RESTful API. The `ApiService` contains all HTTP logic.

## 2. Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── ... (UI components)
│   ├── services/
│   │   ├── api.service.ts      # Handles all backend communication
│   │   └── user.service.ts     # Manages user authentication state
│   ├── models/
│   │   └── reservili.model.ts  # Core data interfaces
│   ├── app.component.ts        # Main component and view orchestrator
│   └── ...
├── index.html                  # Main HTML file
└── index.tsx                   # Application bootstrap
```

## 3. Data Models

Defined in `src/models/reservili.model.ts`. These interfaces define the shape of data exchanged between the frontend and the backend.

- `User`: Represents a user of any role.
- `ServiceProvider`: The core business profile.
- `Service`: A specific service offered by a provider.
- `Worker`: An employee of a service provider.
- `Booking`: A confirmed appointment record.
- `Review`: Customer feedback for a provider or worker.
- `AvailabilitySlot`: A time slot that can be booked.
- `RecurringAvailability`: A weekly repeating schedule rule.
- `BlockedTime`: A specific time-off period.
- `ServiceCategory`: Defines a category for services.

---

## 4. API Specification

This section defines the RESTful API endpoints that the backend must implement. The base URL for all endpoints is assumed to be `/api`.

### 4.1. Authentication

---

**`POST /auth/register`**

- **Description**: Registers a new user and, if the role is `ServiceProvider`, creates their initial business profile.
- **Request Body**:
  ```json
  {
    "name": "string",
    "email": "string",
    "password": "string",
    "role": "Customer" | "ServiceProvider",
    "provider": { // Required if role is ServiceProvider
      "name": "string",
      "category": "string",
      "location": "string",
      "description": "string",
      "imageUrl": "string"
    }
  }
  ```
- **Response (201 Created)**: Returns the new user object and an auth token.
  ```json
  {
    "user": { "id": "string", "name": "string", "email": "string", "role": "string" },
    "token": "jwt.token.string"
  }
  ```

---

**`POST /auth/login`**

- **Description**: Authenticates a user.
- **Request Body**:
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response (200 OK)**: Returns the user object and an auth token.
  ```json
  {
    "user": { "id": "string", "name": "string", "email": "string", "role": "string" },
    "token": "jwt.token.string"
  }
  ```

### 4.2. Service Providers

---

**`GET /providers`**

- **Description**: Retrieves a list of all service providers. Can be filtered by search term or category.
- **Query Parameters**:
  - `search` (optional, string): A search term to filter by name, category, or service name.
  - `category` (optional, string): A category name to filter results.
- **Response (200 OK)**: `ServiceProvider[]`

---

**`GET /providers/featured`**

- **Description**: Retrieves a subset of top-rated service providers for the home page.
- **Response (200 OK)**: `ServiceProvider[]`

---

**`GET /providers/:id`**

- **Description**: Retrieves detailed information for a single service provider, including associated services, workers, and reviews.
- **Response (200 OK)**: `ServiceProvider`

---

**`PATCH /providers/:id`**

- **Description**: Updates a provider's profile information. This is an authenticated endpoint for the provider owner.
- **Request Body**: `Partial<ServiceProvider>`
- **Response (200 OK)**: The updated `ServiceProvider` object.

### 4.3. Services (within a Provider)

---

**`POST /providers/:providerId/services`**

- **Description**: Adds a new service to a provider. Authenticated.
- **Request Body**: `Omit<Service, 'id'>`
- **Response (201 Created)**: The newly created `Service` object.

---

**`PATCH /services/:serviceId`**

- **Description**: Updates an existing service. Authenticated.
- **Request Body**: `Partial<Service>`
- **Response (200 OK)**: The updated `Service` object.

---

**`DELETE /services/:serviceId`**

- **Description**: Deletes a service. Authenticated.
- **Response (204 No Content)**

### 4.4. Workers (within a Provider)

---

**`POST /providers/:providerId/workers`**

- **Description**: Adds a new worker to a provider. Authenticated.
- **Request Body**: `Omit<Worker, 'id'>`
- **Response (201 Created)**: The newly created `Worker` object.

---

**`PATCH /workers/:workerId`**

- **Description**: Updates a worker's details (e.g., name, role, assigned services). Authenticated.
- **Request Body**: `Partial<Worker>`
- **Response (200 OK)**: The updated `Worker` object.

---

**`DELETE /workers/:workerId`**

- **Description**: Deletes a worker. Authenticated.
- **Response (204 No Content)**

### 4.5. Availability & Bookings

---

**`GET /providers/:providerId/availability`**

- **Description**: Gets all available time slots for a provider on a specific day. The backend must calculate this based on the provider's recurring schedule, workers, existing bookings, and blocked time.
- **Query Parameters**: `date` (string, "YYYY-MM-DD")
- **Response (200 OK)**: `AvailabilitySlot[]`

---

**`POST /providers/:providerId/block-time`**

- **Description**: Adds a new time-off block for a provider. Authenticated.
- **Request Body**: `Omit<BlockedTime, 'id'>`
- **Response (201 Created)**: The newly created `BlockedTime` object.

---

**`POST /bookings`**

- **Description**: Creates a new booking for a user. Authenticated.
- **Request Body**:
  ```json
  {
    "providerId": "string",
    "serviceId": "string",
    "workerId": "string | null",
    "userId": "string",
    "startTime": "ISO-8601 string"
  }
  ```
- **Response (201 Created)**: The newly created `Booking` object.

### 4.6. Other Data

---

**`GET /categories`**

- **Description**: Retrieves the list of all service categories.
- **Response (200 OK)**: `ServiceCategory[]`

---

**`POST /reviews`**

- **Description**: Submits a new review for a provider and/or worker. Authenticated.
- **Request Body**: `Omit<Review, 'id' | 'date' | 'userName'>`
- **Response (201 Created)**: The newly created `Review` object.

### 4.7. Users

---

**`PATCH /users/:id`**

- **Description**: Updates a user's profile information (name, address, phone number, etc.). This is an authenticated endpoint for the user themselves.
- **Request Body**: `Partial<User>`
- **Response (200 OK)**: The updated `User` object.