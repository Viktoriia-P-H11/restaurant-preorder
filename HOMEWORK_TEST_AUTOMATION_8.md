# Звіт до домашнього завдання: Test Automation #8
## Автоматизація end-to-end (E2E) сценаріїв групового pre-order (Green & Tasty)

* **Репозиторій проєкту:** [https://github.com/Viktoriia-P-H11/restaurant-preorder](https://github.com/Viktoriia-P-H11/restaurant-preorder)
* **Живий хмарний застосунок (AWS):** [https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)
* **CI/CD Workflow (GitHub Actions):** [https://github.com/Viktoriia-P-H11/restaurant-preorder/actions](https://github.com/Viktoriia-P-H11/restaurant-preorder/actions)

---

## 1. Загальний огляд реалізації

Для автоматизації тестування розроблено надійний набір End-to-End автотестів, які виконуються безпосередньо проти реальної хмарної інфраструктури (AWS API Gateway + AWS Lambda) та валідують повний життєвий цикл групового замовлення від ініціалізації сесії до відправки замовлення на кухню ресторану.

Автоматизований тестовий фреймворк побудований на Node.js та містить:
1. **End-to-End Suite (`tests/e2e-automation.test.js`):** 25 тестів, що покривають рівні 1, 2, 3 та граничні умови з точними вимірюваннями таймінгів запитів.
2. **Frontend & Unit Suite (`tests/run-hw-tests.js`):** 37 компонентних та інтеграційних тестів логіки клієнтського інтерфейсу.
3. **Хмарний пайплайн CI/CD (`ci/workflows/e2e-tests.yml`):** конфігурація для GitHub Actions із підтримкою автоматизованого прогону обох тестових сьютів при кожному push та pull request із публікацією зведеного звіту в `$GITHUB_STEP_SUMMARY`.
4. **Інтеграція зі звітами Report Portal (`tests/reporters/reportportal.js`):** збір структурованих метрик запуску (`launch`), статусів кожного тесту та експорт артефакту `reports/reportportal-summary.json`.

---

## 2. Деталізація покритих рівнів автоматизації

### 🟢 Рівень 1: Basic E2E & Endpoint Contract Tests
* **AWS Live Application Healthcheck:** валідація доступності веб-інтерфейсу на AWS (HTTP 200 OK, час відповіді ~500 мс), наявність брендових заголовків Green & Tasty та кореневого DOM-вузла `<div id="root">` для монтування React.
* **GET `/guest/groups/{id}/sessions` Contract:** перевірка контракту повернення масиву сесій гостей за столом, валідація структури схеми кожного об'єкта учасника (`id`, `name`, `items`, `isSubmitted`).
* **Header Authorization & RBAC Contract:** перевірка передачі заголовка ролі `Role: Owner`.

### 🔵 Рівень 2: End-to-End Consolidated Pre-Order Workflow
* **Отримання сесії хоста:** виконання запиту `GET /reservations/{reservationId}/guest-session-id`, верифікація повернення ідентифікатора хоста `owner-session-123`.
* **Синхронізація та об'єднання кошика столу:** емуляція повної логіки фронтенду: об'єднання сесії Owner (Walter, Caesar Salad x 1, $180) з віддаленими даними гостей (Andrii, Caesar Salad x 2, $360 та Olena, Tom Yum x 1, $220).
* **Перевірка бізнес-правил консолідації:**
  * Фільтрація учасників: вибірка лише тих, у кого `isSubmitted === true` (Walter + Andrii = 2 особи).
  * Облік гостей у процесі вибору: точний підрахунок неподаних кошиків (`unsubmittedCount === 1`, Olena).
  * Агрегація однакових страв за `dishId`: сумування порцій Caesar Salad (1 від хоста + 2 від Андрія = 3 порції).
  * Розрахунок підсумку: Grand Total дорівнює рівно $540.00 (виключаючи $220 непідтвердженого замовлення Олени).
* **Відправка замовлення в ресторан:** виконання `POST /group-reservations/{id}/submit` з тілом `{ reservationId: "res-8492" }`, перевірка успішного коду HTTP 200 та повернення списку консолідованих страв для ресторану.

### 🟣 Рівень 3: Dynamic Lifecycle, Error Handling & Policy Rules
* **Видалення гостя зі столу:** виконання `DELETE /guest/groups/{id}/sessions/{sessionId}`, перевірка коду HTTP 200, підтвердження видалення `session1` (Андрія) та автоматичний перерахунок залишку кошика на сервері до $220.00.
* **RBAC & Security Guard:** спроба видалення сесії без прав хоста (`Role: Guest`) повертає статус HTTP 403 Forbidden.
* **Owner Protection Rule:** перевірка захисту від видалення сесії організатора застілля (`type: 'Owner'`).
* **3-Hour Cancellation Policy:** бізнес-перевірка вікна безкоштовного скасування замовлення (дозволено за 4 год 15 хв до події, заблоковано за 2 год 30 хв).
* **Background Polling & Sync:** валідація налаштування 15-секундного інтервалу тихого фонового опитування сервера без блокування екрана.
* **Negative Contract Testing:** обробка помилок при зверненні до неіснуючої групи повертає валідний статус HTTP 404 Not Found.

### ⭐️ Зірочка: Пайплайн у хмарі та Report Portal
* **GitHub Actions Workflow:** файл конфігурації `ci/workflows/e2e-tests.yml` (готові декларації для GitHub Actions) забезпечує безперервну інтеграцію (CI) на віртуальній машині `ubuntu-latest`, проганяє `npm run test:hw` та `npm run test:e2e`, генерує зведений Markdown-звіт у Step Summary та завантажує артефакт результатів.
* **Звіти Report Portal:** реалізовано клієнт `tests/reporters/reportportal.js`, що підтримує змінні оточення `REPORTPORTAL_ENDPOINT`, `REPORTPORTAL_API_KEY`, `REPORTPORTAL_PROJECT`, `REPORTPORTAL_LAUNCH`, збирає статистику та зберігає звіт у JSON-форматі (`reports/reportportal-summary.json`).

---

## 3. Матриця автоматизованих тестів (Test Matrix)

| ID | Рівень | Назва тесту | Тип | Очікуваний результат | Статус |
|---|---|---|---|---|---|
| E2E-01 | Level 1 | AWS Live Application responds with HTTP 200 OK | E2E / Healthcheck | HTTP 200, latency < 1000ms | PASS |
| E2E-02 | Level 1 | HTML payload contains valid application branding header | E2E / UI | Містить "Green & Tasty" | PASS |
| E2E-03 | Level 1 | DOM contains root container for React 18 mounting | E2E / UI | Елемент `#root` присутній | PASS |
| E2E-04 | Level 1 | GET /guest/groups/{id}/sessions returns HTTP 200 status | API / Contract | HTTP 200 OK | PASS |
| E2E-05 | Level 1 | Response payload contains 'participants' array | API / Schema | Масив `participants` присутній | PASS |
| E2E-06 | Level 1 | Group contains active participant sessions | API / Data | Кількість гостей >= 2 | PASS |
| E2E-07 | Level 1 | All participants adhere to contract schema | API / Schema | Поля `id`, `name`, `items`, `isSubmitted` | PASS |
| E2E-08 | Level 2 | GET /reservations/{id}/guest-session-id retrieves valid Host session ID | API / Integration | `guestSessionId === "owner-session-123"` | PASS |
| E2E-09 | Level 2 | Host combines personal pre-order cart with remote table guests | Logic / State | Об'єднано 3 учасників столу | PASS |
| E2E-10 | Level 2 | Consolidation identifies all submitted participants | Logic / Flow | `submittedCount === 2` | PASS |
| E2E-11 | Level 2 | Consolidation identifies unsubmitted carts | Logic / Flow | `unsubmittedCount === 1` | PASS |
| E2E-12 | Level 2 | Consolidation merges identical dishes by dishId | Logic / Calculation | Caesar Salad: 1 + 2 = 3 шт | PASS |
| E2E-13 | Level 2 | Consolidated Grand Total strictly equals $540.00 | Logic / Calculation | Точний підсумок $540.00 (без $220) | PASS |
| E2E-14 | Level 2 | POST /group-reservations/{id}/submit successfully sends order to restaurant | API / E2E | HTTP 200 OK | PASS |
| E2E-15 | Level 2 | Server responds with consolidated dishes payload upon submission | API / Contract | Повернено консолідований список страв | PASS |
| E2E-16 | Level 3 | DELETE /guest/groups/{id}/sessions/{sessionId} removes guest successfully | API / Lifecycle | HTTP 200 OK | PASS |
| E2E-17 | Level 3 | Server confirms session removal and excludes removed guest from group snapshot | API / Lifecycle | `session1` відсутня у відповіді | PASS |
| E2E-18 | Level 3 | Server recalculates group subtotal after guest removal | API / Business | Новий підсумок $220.00 | PASS |
| E2E-19 | Level 3 | RBAC Security: Non-owner guest deletion is rejected with HTTP 403 Forbidden | Security / RBAC | HTTP 403 Forbidden при `Role: Guest` | PASS |
| E2E-20 | Level 3 | Security: Owner session is protected and cannot be deleted | Business Rule | Організатор столу захищений | PASS |
| E2E-21 | Level 3 | Guests can be removed by the table Host | Business Rule | Гості можуть видалятися хостом | PASS |
| E2E-22 | Level 3 | 3-Hour Policy: Free cancellation permitted at 14:15 for 18:30 reservation (> 3h) | Policy Rule | Скасування дозволено (true) | PASS |
| E2E-23 | Level 3 | 3-Hour Policy: Cancellation locked at 16:00 for 18:30 reservation (< 3h) | Policy Rule | Скасування заблоковано (false) | PASS |
| E2E-24 | Level 3 | Polling configuration enforces exact 15-second silent sync interval | Config / Rule | Інтервал рівно 15 000 мс | PASS |
| E2E-25 | Level 3 | Graceful error handling: API returns HTTP 404 for non-existent group | API / Negative | HTTP 404 Not Found | PASS |

---

## 4. Логи запуску тестових сьютів

### Команда запуску E2E тестів:
```bash
npm run test:e2e
```

### Вивід у консоль:
```text
> restaurant-group-preorder@1.0.0 test:e2e
> node tests/e2e-automation.test.js


========================================================
  Green & Tasty - E2E Automation Test Suite (Level 1-3) 
  Target Cloud: AWS API Gateway + Lambda                
========================================================

  INFO Test fixture: Remote state successfully reset to initial mock dataset.

1. Level 1 - Basic E2E & Endpoint Contract Tests:
  PASS AWS Live Application responds with HTTP 200 OK (516ms)
  PASS HTML payload contains valid application branding header
  PASS DOM contains root container for React 18 mounting
  PASS GET /guest/groups/{id}/sessions returns HTTP 200 status (177ms)
  PASS Response payload contains 'participants' array
  PASS Group contains active participant sessions (found: 2)
  PASS All participants adhere to contract schema (id, name, items, isSubmitted)

2. Level 2 - End-to-End Consolidated Pre-Order Workflow:
  PASS GET /reservations/{id}/guest-session-id retrieves valid Host session ID (176ms)
  PASS Host combines personal pre-order cart with remote table guests
  PASS Consolidation identifies all submitted participants (Walter + Andrii = 2)
  PASS Consolidation identifies unsubmitted carts (Olena = 1)
  PASS Consolidation merges identical dishes by dishId (Caesar Salad x 3)
  PASS Consolidated Grand Total strictly equals $540.00 (submitted only, excluding $220 unsubmitted)
  PASS POST /group-reservations/{id}/submit successfully sends order to restaurant (173ms)
  PASS Server responds with consolidated dishes payload upon submission

3. Level 3 - Dynamic Lifecycle, Error Handling & Policy Rules:
  PASS DELETE /guest/groups/{id}/sessions/{sessionId} removes guest successfully (172ms)
  PASS Server confirms session removal and excludes removed guest from group snapshot
  PASS Server recalculates group subtotal after guest removal (updated total: $220)
  PASS RBAC Security: Non-owner guest deletion is rejected with HTTP 403 Forbidden (182ms)
  PASS Security: Owner session is protected and cannot be deleted
  PASS Guests can be removed by the table Host
  PASS 3-Hour Policy: Free cancellation permitted at 14:15 for 18:30 reservation (> 3h)
  PASS 3-Hour Policy: Cancellation locked at 16:00 for 18:30 reservation (< 3h)
  PASS Polling configuration enforces exact 15-second silent sync interval
  PASS Graceful error handling: API returns HTTP 404 for non-existent group

  Report Portal Summary: Launch EPAM_Marathon_HW8_E2E [PASSED]
  Report artifact saved: reports/reportportal-summary.json (25/25 passed)

========================================================
  ALL E2E TESTS PASSED! 25 of 25 tests are GREEN.
  Levels 1, 2, 3 & Edge Cases 100% Verified in 2.79s!
========================================================
```

### Комплексний запуск усіх тестів репозиторію:
```bash
npm run test:all
```
**Результат: 62 з 62 тестів успішно пройдено (37 Frontend/Logic + 25 E2E/Cloud).**
