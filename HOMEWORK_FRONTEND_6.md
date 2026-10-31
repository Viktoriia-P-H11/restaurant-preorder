# Домашнє завдання по Frontend #6
## Багаторольова платформа ресторанного Pre-Order (Host, Guest, Waiter, Kitchen)

* **Платформа:** EPAM IT Marathon 6.0 — Frontend Track
* **Стек:** JavaScript (ES2024), React 18, Tailwind CSS, Node.js 22, AWS Lambda & API Gateway (Terraform)
* **Дизайн:** Figma — EPAM IT Marathon 6.0 (*FOR DEVELOPERS* -> *Owner Flow*, *Guest Flow*, *Waiter View*, *Design System*)
* **Live застосунок та API в хмарі AWS:** [https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)
* **Виконані рівні:** Усі рівні (Практичне завдання, 1-й рівень, 2-й рівень, 3-й рівень + Бонус Remove Guest)

---

## 🚀 Повний цикл тестування для всіх ролей (Testing Role Switcher)

У верхній панелі сайту вбудовано швидкий перемикач ролей (**Testing Role: Host / Guest / Waiter / Kitchen**), що дозволяє протестувати весь життєвий цикл замовлення від броні столу до подачі на кухні:

### 1. Роль Овнера / Хоста (`Host: Walter`):
* **Бронювання столу (`Book a Table`):**
  * Повністю інтерактивний вибір слотів часу: `12:00 - 14:00`, `18:30 - 21:30`, `19:00 - 22:00`, `20:00 - 23:00`.
  * Вибір приводу свята (*Birthday Celebration*, *Dinner with Friends*).
  * Генерація прямого посилання на стіл для гостей.
* **Керування груповим Pre-Order (`Group Pre-Order`):**
  * Редагування назви столу, приводу та часу початку/завершення через модальне вікно.
  * Вибір режиму оплати: **Host Covers All** ($540.00), **Split Evenly** ($108.00 / гість), **By Own Order**.
  * Графік подачі страв кухнею (*When to Serve Dishes*).
  * Індивідуальні алергії та дієтичні нотатки до кожної страви.
  * Відправка запрошень гостям через **SMS**, **WhatsApp**, **Email** та нагадування **Remind Pending**.
  * Відправка замовлення в ресторан (`Sent to Restaurant`).

### 2. Роль Гостя (`Guest: Olena / Andrii / New Guest`):
* Вхід за згенерованим посиланням столу.
* Перегляд меню ресторану, додавання страв у власний кошик із грамажем та калорійністю.
* Введення персональних алергій та побажань до приготування.
* **Цифровий чек (`Чек`):**
  * Повний перелік обраних страв гостя та сума.
  * **Правило скасування за 3 години:** діє повідомлення про безкоштовне скасування або редагування страв за 3 години до початку броні (до 15:30 для столу о 18:30).
  * Інтерактивна кнопка **«Cancel Pre-Order (3-Hour Policy)»** для скасування страв із миттєвим перерахунком загального чека столу.

### 3. Роль Офіціанта (`Waiter: Alex Caper` — макет Figma Image 2):
* Спеціальний дашборд офіціанта **Alex Caper (Waiter)**.
* Картки столиків зі статусами: `Sent to Restaurant`, `In Progress`, `Confirmed by Restaurant`, `No Pre-Order`, `Rejected`.
* Кнопки **«Accept Order»** (підтвердження замовлення), **«Reject»**, **«Cancel Table»**.
* Модальне вікно інспекції Pre-Order із повним переліком страв замовлення, кількістю та прапорцями алергій.

### 4. Роль Шеф-кухаря / Кухні (`Kitchen Display System - KDS`):
* Монітор кухні з чергою приготування за графіком подачі (*Progressive Pacing*).
* **Критичні попередження про алергії:** червоний банер *«CRITICAL ALLERGY ALERT: Oleg K. — Severe Nut Allergy»*.
* Розподіл за чергами подачі:
  * Курс 1: Закуски та салати (18:30) — *Caesar Salad × 3*, *Tom Yum × 1*. Кнопка *«Mark Ready to Serve»*.
  * Курс 2: Гарячі страви (19:15) — *Grilled Salmon × 1*, *Avocado Quinoa Bowl × 1*.

---

## 🧪 Результати автоматичного тестування (`npm run test:hw`)

Усі 37 тестів Maraphon 6.0 успішно пройдені:

```
========================================================
  Green & Tasty - Group Pre-Order Test Suite (React)    
========================================================

1. Practice - Participant Card Tests:
  PASS ParticipantCard renders owner title ('Owner: Walter')
  PASS ParticipantCard renders guest title ('Guest: Andrii')
  PASS ParticipantCard renders status chip text 'Submitted' when isSubmitted=true
  PASS ParticipantCard renders status chip text 'Still choosing' when isSubmitted=false
  PASS ParticipantCard renders dish name, quantity, and item price
  PASS ParticipantCard renders subtotal formatted as currency ($360.00)
  PASS ParticipantCard renders 'No dishes yet' for guests with empty cart
  PASS ParticipantCard enforces 40x40 dimension reservation for CLS prevention

2. Level 1 - Owner Review Layout & Header Tests:
  PASS GroupOrderPage renders restaurant location address
  PASS GroupOrderPage renders event time slot
  PASS GroupOrderPage renders guest progress count ('4 of 5 guests')
  PASS GroupOrderPage enforces semantic hierarchy: <main>, <h1>, <ul>/<li>, <article>
  PASS GroupOrderPage layout validated against mobile 375px viewport boundary

3. Level 2 - Consolidated Pre-Order & Logic Tests:
  PASS consolidatePreOrder filters only participants with isSubmitted === true
  PASS consolidatePreOrder correctly counts unsubmitted participants
  PASS consolidatePreOrder merges identical dishes by dishId (Caesar Salad quantity = 3)
  PASS Grand Total equals exactly $540 (only submitted orders), not $760
  PASS Owner card is prominently labeled 'My Pre-Order'
  PASS Guest cards remain labeled with guest name
  PASS Warning banner displays warning for unsubmitted participants
  PASS Status badge displays 'Collecting pre-orders' for active group
  PASS Status badge transitions to 'Sent to Restaurant' after submit
  PASS Submit dialog contains required 'Submit' and 'Cancel' actions
  PASS Submit button disabled when no submitted dishes exist
  PASS Submit button active when submitted dishes exist
  PASS Submit button guards against double-submission while request is in-flight
  PASS Submit button disabled once pre-order has been submitted

4. Level 3 & Bonus - Sync & Remove Guest Tests:
  PASS Background polling configured with exact 15-second timer interval
  PASS Background sync executes silently without blocking full-screen loaders
  PASS Timestamp correctly displays 'Updated at 14:05:30'
  PASS Network error falls back to 'Couldn't refresh. Showing data from 14:05:30'
  PASS Polling runs while group status is Open
  PASS Polling immediately halts after pre-order is Submitted
  PASS Remove Guest action hidden from Owner card
  PASS Remove Guest action visible on Guest card
  PASS Remove Guest action disabled once order is Submitted to restaurant
  PASS Remove Guest modal text strictly complies with homework specification

========================================================
  ALL TESTS PASSED! 37 of 37 tests are GREEN.
  Levels 1, 2, and 3 (with Bonus) 100% Verified!
========================================================
```
