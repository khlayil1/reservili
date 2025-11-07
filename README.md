# Reservili - Technical Documentation

## 1. Overview

**Reservili** is a universal reservation platform designed to support a wide variety of services and venues. This document outlines the technical architecture, data structures, and simulated API endpoints for the frontend of the Reservili application.

### 1.1. Technology Stack

- **Framework**: Angular (v20+)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Angular Signals
- **Architecture**: Zoneless, Standalone Components

### 1.2. Core Concepts

- **Zoneless Change Detection**: The application is built without Zone.js, relying on signals for granular and performant change detection.
- **Standalone Components**: The entire application uses the standalone component architecture, eliminating the need for NgModules.
- **Signal-Based State Management**: Component and service state is managed reactively using Angular Signals, `computed` for derived state, and `effect` for side effects.
- **Mock Backend**: A `DataService` is used to simulate a backend, managing all data in-memory. The API specification below describes the contract this service fulfills, which a real backend would need to implement.

## 2. Project Structure

```
/
├── src/
│   ├── components/
│   │   ├── header/
│   │   ├── home/
│   │   ├── login/
│   │   ├── provider-dashboard/
│   │   ├── provider-detail/
│   │   ├── registration/
│   │   └── ... (other components)
│   ├── services/
│   │   ├── data.service.ts   # Mock backend and data logic
│   │   └── user.service.ts   # Manages user authentication state
│   ├── models/
│   │   └── reservili.model.ts # Core data interfaces
│   ├── app.component.ts      # Main component, router, and state orchestrator
│   └── app.component.html
├── index.html                # Main HTML file
└── index.tsx                 # Application bootstrap
```

## 3. Data Models

Defined in `src/models/reservili.model.ts`.

| Interface | Description | Key Properties |
| :--- | :--- | :--- |
| `User` | Represents a user of any role. | `id`, `name`, `email`, `role` |
| `ServiceProvider` | The core business profile. | `id`, `ownerId`, `name`, `category`, `location`, `services`, `workers`, `recurringAvailability`, `blockedTimes`, `rating` |
| `Service` | A specific service offered by a provider. | `id`, `name`, `description`, `durationMinutes`, `price` |
| `Worker` | An employee of a service provider. | `id`, `name`, `role`, `serviceIds`, `imageUrl` |
| `Booking` | A confirmed appointment record. | `id`, `userId`, `providerId`, `serviceId`, `startTime`, `endTime` |
| `Review` | Customer feedback for a provider or worker. | `id`, `userId`, `providerId`, `workerId`, `rating`, `comment` |
| `AvailabilitySlot` | A time slot that can be booked. | `startTime`, `endTime`, `isBooked`, `workerId` |
| `RecurringAvailability`| A weekly repeating schedule rule. | `dayOfWeek`, `startTime`, `endTime`, `isEnabled` |
| `BlockedTime`| A specific time-off period. | `id`, `startTime`, `endTime`, `reason` |


## 4. Services

### 4.1. `UserService`
- **Responsibility**: Manages the current user's session and authentication state.
- **Key Methods**:
    - `loginAsCustomer() / loginAsProvider()`: Simulates logging in and sets the `currentUser` signal.
    - `logout()`: Clears the `currentUser` signal.
    - `registerUser()`: Creates a new user, adds them to the in-memory user list, and logs them in.

### 4.2. `DataService`
- **Responsibility**: Acts as a mock backend. It manages all application data (providers, bookings, reviews, etc.) and contains the business logic for data manipulation.
- **Key Methods**:
    - `getServiceProviders()`: Fetches all providers and dynamically calculates their ratings.
    - `generateSlotsForProviderForDay(provider, date)`: The core scheduling engine. Generates available time slots for a given day based on the provider's recurring schedule, workers, and any blocked time.
    - `createBooking()`: Creates a new booking and updates slot availability.
    - `addReview()`: Adds a new review.
    - Data manipulation methods for providers, services, workers, etc. (`updateProvider`, `addServiceToProvider`, `deleteWorkerForProvider`).

## 5. API Specification (Simulated Backend)

This section defines the HTTP endpoints a real backend would need to implement to replace the mock `DataService`.

---

### Authentication

**POST** `/auth/register`
- **Description**: Registers a new user and potentially a new service provider profile.
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
- **Response (201 Created)**:
  ```json
  {
    "user": { "id": "string", "name": "string", "email": "string", "role": "string" },
    "token": "jwt.token.string"
  }
  ```

---

### Service Providers

**GET** `/providers`
- **Description**: Retrieves a list of all service providers. Can be filtered by search term or category.
- **Query Parameters**: `search` (string), `category` (string)
- **Response (200 OK)**: `ServiceProvider[]`

**GET** `/providers/featured`
- **Description**: Retrieves the top-rated service providers for the home page.
- **Response (200 OK)**: `ServiceProvider[]` (subset)

**GET** `/providers/:id`
- **Description**: Retrieves detailed information for a single service provider.
- **Response (200 OK)**: `ServiceProvider`

**PATCH** `/providers/:id`
- **Description**: Updates a provider's profile information (name, location, gallery, schedule, etc.).
- **Request Body**: Partial `ServiceProvider` object.
- **Response (200 OK)**: The updated `ServiceProvider` object.

---

### Services (within a Provider)

**POST** `/providers/:providerId/services`
- **Description**: Adds a new service to a provider.
- **Request Body**: `Omit<Service, 'id'>`
- **Response (201 Created)**: The newly created `Service` object.

**PATCH** `/services/:serviceId`
- **Description**: Updates an existing service.
- **Request Body**: Partial `Service` object.
- **Response (200 OK)**: The updated `Service` object.

**DELETE** `/services/:serviceId`
- **Description**: Deletes a service.
- **Response (204 No Content)**

---

### Workers (within a Provider)

**POST** `/providers/:providerId/workers`
- **Description**: Adds a new worker to a provider.
- **Request Body**: `Omit<Worker, 'id'>`
- **Response (201 Created)**: The newly created `Worker` object.

**PATCH** `/workers/:workerId`
- **Description**: Updates a worker's details (name, role, imageUrl, assigned services).
- **Request Body**: Partial `Worker` object.
- **Response (200 OK)**: The updated `Worker` object.

**DELETE** `/workers/:workerId`
- **Description**: Deletes a worker.
- **Response (204 No Content)**

---

### Availability & Bookings

**GET** `/providers/:providerId/availability`
- **Description**: Gets all available slots for a provider on a specific day. The backend should apply recurring availability and blocked time rules.
- **Query Parameters**: `date` (string, e.g., "YYYY-MM-DD")
- **Response (200 OK)**: `AvailabilitySlot[]`

**POST** `/providers/:providerId/block-time`
- **Description**: Adds a new time-off block for a provider.
- **Request Body**: `Omit<BlockedTime, 'id'>`
- **Response (201 Created)**: The newly created `BlockedTime` object.

**POST** `/bookings`
- **Description**: Creates a new booking for a user.
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

---

### Reviews

**POST** `/reviews`
- **Description**: Submits a new review for a provider and/or worker.
- **Request Body**: `Omit<Review, 'id' | 'date' | 'userName'>`
- **Response (201 Created)**: The newly created `Review` object.
