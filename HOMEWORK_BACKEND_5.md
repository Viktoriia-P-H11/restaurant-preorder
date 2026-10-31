# Домашнє завдання до воркшопу по Backend #5
## Груповий pre-order: функціонал для Owner

* **Платформа:** EPAM IT Marathon 6.0 — Backend Track
* **Стек:** Node.js 22 (ES Modules), AWS Lambda, Amazon API Gateway (HTTP API v2), Terraform
* **Форма для здачі:** `https://forms.cloud.microsoft/e/g40fjREuAq`
* **Live API & Application URL:** [https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)
* **Виконані рівні:** Усі 3 рівні (🟢 1-й рівень, 🔵 2-й рівень, 🟣 3-й рівень)

---

## 🟢 1-й рівень складності

### Отримання списку сесій учасників групового pre-order для Owner
**Метод і шлях:** `GET /guest/groups/{groupReservationId}/sessions`

**Опис:**  
Повертає перелік учасників (Guest сесій), список доданих ними страв, суму по кожному учаснику та загальну суму по групі.

**Приклад відповіді (200 OK):**
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

## 🔵 2-й рівень складності

### 1. Отримати owner session id
**Метод і шлях:** `GET /reservations/{reservationId}/guest-session-id`

**Приклад відповіді (200 OK):**
```json
{
  "guestSessionId": "owner-session-123"
}
```

### 2. Підтвердити консолідований pre-order
**Метод і шлях:** `POST /group-reservations/{groupReservationId}/submit`

**Тіло запиту:**
```json
{
  "reservationId": "reservation-123"
}
```

**Опис логіки:**
* Фільтрує лише підтверджені сесії (`isSubmitted: true`).
* Об'єднує всі однакові страви за `dishId` та підсумовує їхню кількість.
* Змінює статус замовлення на `SubmittedByCustomer`.
* Змінює статус групового бронювання на `Submitted`.

**Приклад відповіді (200 OK):**
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

**Реалізовані умови та валідація:**
* Доступ дозволено для ролі Owner (інші ролі повертають `403 Forbidden`).
* Якщо reservation або group reservation не знайдено — повертається `404 Not Found`.
* Якщо немає жодної submitted session — повертається `400 Bad Request`.
* Якщо в submitted sessions немає жодної страви — повертається `400 Bad Request`.
* Якщо order не знайдено — повертається `400 Bad Request`.

---

## 🟣 3-й рівень складності

### Видалення guest session із групи
**Метод і шлях:** `DELETE /guest/groups/{groupReservationId}/sessions/{guestSessionId}`

**Опис логіки:**
Owner може видалити сесію конкретного гостя з групового замовлення. Після видалення сервер автоматично повертає оновлений snapshot групи з перерахованою сумою.

**Приклад відповіді (200 OK):**
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

**Реалізовані умови:**
* Тільки Owner може викликати видалення.
* Якщо guest session не належить цій групі — повертається `400 Bad Request`.
* Якщо guest session не знайдено — повертається `404 Not Found`.
* Повертається актуальний оновлений snapshot групи.

---

## Службовий ендпоінт скидання стану

Для зручності повторного тестування та автоматичних перевірок додано маршрут скидання стану сесій до початкового мок-набору:
* `GET /reset` або `POST /reset`

---

## Інфраструктура (IaC Terraform)

Розгортання реалізовано в папці `infra/main.tf`:
* **AWS Lambda:** `restaurant-js-api` на рантаймі `nodejs22.x`.
* **API Gateway:** `restaurant-js-http-api` (HTTP API v2).
* **IAM Roles:** `restaurant_js_lambda_role` з політикою CloudWatch Logs.
* **CORS:** налаштовані заголовки `Access-Control-Allow-Origin: *`, підтримка `OPTIONS` preflight запитів.
