# Домашнє завдання по Frontend #6
## Екран Owner групового pre-order

* **Платформа:** EPAM IT Marathon 6.0 — Frontend Track
* **Стек:** JavaScript (ES2024), React 18, Tailwind CSS, Node.js 22
* **Дизайн:** Figma — EPAM IT Marathon 6.0 (*FOR DEVELOPERS* -> *Owner Flow*, *Design System*)
* **Форма для здачі:** `https://forms.cloud.microsoft/e/Fq1zqQ9VwP`
* **Live застосунок та API в хмарі AWS:** [https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)
* **Виконані рівні:** Усі рівні (Практичне завдання, 🟢 1-й рівень, 🔵 2-й рівень, 🟣 3-й рівень + Бонус Remove Guest)

---

## 🏗️ Архітектура повноцінного веб-сайту

Застосунок реалізовано як повноцінний багатосторінковий ресторанний портал **Green & Tasty**:

1. **Головна сторінка (`Main page`):**
   * **Hero-банер:** *«Green by nature, Georgian by heart»* із кнопками переходу до бронювання столу та перегляду групового замовлення.
   * **Most Popular Dishes:** картки популярних страв з якісними зображеннями, цінами, грамажем.
   * **Dish Detail Modal:** інтерактивне модальне вікно при кліку на будь-яку страву (калорійність, білки, жири, вуглеводи, вибір кількості порцій).
   * **Locations:** картки закладів (*48 Rustaveli Avenue*, *14 Baratashvili Street*, *9 Abashidze Street*) з рейтингами, фото та годинами роботи.
   * **Customer Reviews:** блок відгуків гостей.

2. **Бронювання столика (`Book a Table`):**
   * Вибір локації, дати, розміру компанії, вільних слотів часу та підтвердження броні.

3. **Список бронювань (`Reservations`):**
   * Перегляд активних броней столів та перехід до координації замовлення.

4. **Екран Owner Flow (`Owner Review` / `Group Pre-Order`):**
   * Основний екран виконання завдання воркшопу #6.

---

## 🎯 Реалізація рівнів домашнього завдання

### 🟢 1. Практичне завдання та 1-й рівень складності (Верстка за макетом):
* **Шапка:** адреса ресторану, дата, час, лічильник «4 of 5 guests».
* **Семантика:** валідна HTML-структура `<main>`, `<h1>`, `<ul>`/`<li>`, `<article>`.
* **Картка учасника (`ParticipantCard`):**
  * Заголовок: `Owner: Walter` (або `My Pre-Order`) та `Guest: Name`.
  * Статус текстом: `Submitted` (зелений бейдж) та `Still choosing` (жовтий бейдж).
  * Список страв: назва, кількість `× 2`, ціна та підсумок `Subtotal`.
  * Стан порожнього кошика: текст `No dishes yet`.
  * Зображення страв: резервування розміру 40×40 px для уникнення CLS-зсувів.
  * Адаптивність: коректне відображення від 375 px (мобільні пристрої) до десктопів 1440+ px.

---

### 🔵 2. 2-й рівень складності (Повна логіка та консолідація):
* **Картка власника:** окремо підписана **«My Pre-Order»** із бейджем `Host`.
* **Алгоритм консолідації (`consolidatePreOrder`):** фільтрує сесії з `isSubmitted === true`, об'єднує однакові страви за `dishId` (*Caesar Salad × 3*).
* **Grand Total:** суворо **$540.00** (кошик непідтвердженої Олени на $220 виключено; загальна сума $760 не відображається).
* **Жовта плашка (Warning banner):** попередження *«N participants haven't submitted their cart yet — their dishes won't be included in the order»*.
* **Бейдж статусу:** динамічно змінюється з `Collecting pre-orders` на `Sent to Restaurant`.
* **Модальне вікно підтвердження:** діалог *«Confirm Order Submission»* із кнопками `Submit` та `Cancel`.
* **Блокування повторної відправки:** захист кнопки від подвійного кліку та перехід екрана в режим read-only після успішного submit.

---

### 🟣 3. 3-й рівень складності (Фонова синхронізація 15 с + Бонус Remove Guest):
* **Фонова синхронізація:** автооновлення даних кожні 15 секунд без блокування інтерфейсу повноцінним лоадером.
* **Рядок статусу:** відображення `Updated at HH:mm:ss` та кнопка ручного оновлення `Refresh`.
* **Обробка помилок мережі:** текст *«Couldn't refresh. Showing data from [час]»*.
* **Зупинка таймера:** після `Sent to Restaurant` синхронізація автоматично завершується.
* **Бонус (Remove Guest):**
  * Посилання `Remove Guest` біля гостей (приховано у власника та після submit).
  * Модальне вікно підтвердження: *«Are you sure you want to remove Alex and their pre-order from this reservation? This action cannot be undone.»*
  * Кнопки `Cancel` та `Remove` з викликом ендпоінту `DELETE` та миттєвим перерахунком сум.

---

### 📲 Додатковий інтерактивний функціонал: Share Link & Reminders
* **Пряме посилання на замовлення:** реальний робочий URL у хмарі AWS з кнопкою `Copy`.
* **SMS:** модальне вікно для введення номера телефону гостя та генерації `sms:...`.
* **WhatsApp:** перехід у WhatsApp із готовим текстом та посиланням на стіл.
* **Email:** модальне вікно для введення адреси гостя та відкриття поштового клієнта `mailto:...`.
* **Remind Pending:** окреме вікно для швидкої персональної відправки нагадувань гостям, які ще обирають страви.

---

## 🧪 Результати автотестування (`npm run test:hw`)

Усі перевірки практичного завдання, 1-го, 2-го та 3-го рівнів реалізовано в автоматичному тестовому наборі:

```bash
npm run test:hw
```

**Результат проходження (37 з 37 тестів зелені):**
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
