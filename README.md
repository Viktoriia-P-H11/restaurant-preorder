# Restaurant Group Pre-Order (Green & Tasty) 🥗🍽️

A full-stack cloud application implementing a group pre-order system for restaurant table reservations, built with **Node.js 22**, **React 18**, **Tailwind CSS**, and deployed serverless on **AWS Lambda** & **Amazon API Gateway** via **Terraform**.

🌐 **Live Application & API:**  
[https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)

---

## 📌 Architecture & Tech Stack

* **Frontend:** React 18 (CDN), Tailwind CSS, interactive group cart matching the restaurant design system (Table & Time management, guest accordions, real-time total calculation, meal deletion, interactive invitation sharing via Email, SMS & WhatsApp).
* **Backend:** Node.js 22 ES Modules running on AWS Lambda. Serves both the interactive visual web application at `/` and the REST API endpoints.
* **Infrastructure as Code (IaC):** Terraform (`infra/main.tf`) managing AWS Lambda (`nodejs22.x`), IAM roles, CloudWatch logs, and HTTP API Gateway v2.

---

## 🚀 Implemented Levels & API Endpoints

### 🟢 Level 1: Get Group Participant Sessions (Owner View)
Returns all participant guest sessions, ordered dishes, individual totals, and overall group total.

* **Endpoint:** `GET /guest/groups/{groupReservationId}/sessions`
* **Response (200 OK):**
```json
{
  "participants": [
    {
      "id": "session1",
      "type": "Guest",
      "name": "Andrii",
      "items": [
        {
          "dish": {
            "id": "dish1",
            "name": "Caesar Salad",
            "price": 180
          },
          "quantity": 2
        }
      ],
      "total": 360,
      "isSubmitted": true
    },
    {
      "id": "session2",
      "type": "Guest",
      "name": "Olena",
      "items": [
        {
          "dish": {
            "id": "dish2",
            "name": "Tom Yum",
            "price": 220
          },
          "quantity": 1
        }
      ],
      "total": 220,
      "isSubmitted": false
    }
  ],
  "total": 580
}
```

---

### 🔵 Level 2: Owner Session & Consolidated Pre-Order Submission

#### 1. Get Owner Session ID
* **Endpoint:** `GET /reservations/{reservationId}/guest-session-id`
* **Response (200 OK):**
```json
{
  "guestSessionId": "owner-session-123"
}
```

#### 2. Submit Consolidated Pre-Order
Filters only submitted sessions (`isSubmitted: true`), aggregates and consolidates dishes by `dishId`, updates order status to `SubmittedByCustomer` and group reservation to `Submitted`.

* **Endpoint:** `POST /group-reservations/{groupReservationId}/submit`
* **Request Body:**
```json
{
  "reservationId": "reservation-123"
}
```
* **Response (200 OK):**
```json
[
  {
    "dishId": "dish1",
    "quantity": 3
  },
  {
    "dishId": "dish2",
    "quantity": 2
  }
]
```

---

### 🟣 Level 3: Remove Guest Session
Removes a specific guest session from the group reservation and returns an updated snapshot with recalculated totals.

* **Endpoint:** `DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}`
* **Response (200 OK):**
```json
{
  "participants": [
    {
      "id": "session2",
      "type": "Guest",
      "name": "Olena",
      "items": [
        {
          "dish": {
            "id": "dish2",
            "name": "Tom Yum",
            "price": 220
          },
          "quantity": 1
        }
      ],
      "total": 220,
      "isSubmitted": false
    }
  ],
  "total": 220
}
```

---

### 🔄 Utility: Reset State
Resets in-memory mock data back to default values for grading and repeated automated testing:
* **Endpoint:** `GET /reset` or `POST /reset`

---

## 🛠️ Project Structure

```
restaurant-js/
├── backend/
│   ├── index.js          # AWS Lambda handler & REST API implementation
│   ├── index.html        # Visual React application bundle
│   └── package.json
├── frontend/
│   └── index.html        # Standalone frontend development file
├── infra/
│   └── main.tf           # Terraform infrastructure configuration (AWS Lambda & API Gateway)
└── README.md
```

---

## 💻 Local Testing & Deployment

### Run Terraform:
```bash
cd infra
terraform init
terraform apply
```
