# Домашнє завдання по Frontend #6
## Екран Owner групового pre-order та повний функціонал платформи

* **Платформа:** EPAM IT Marathon 6.0 — Frontend Track
* **Стек:** JavaScript (ES2024), React 18, Tailwind CSS, Node.js 22
* **Дизайн:** Figma — EPAM IT Marathon 6.0 (*FOR DEVELOPERS* -> *Owner Flow*, *Design System*, *Empty State*, *Auth Flow*)
* **Форма для здачі:** `https://forms.cloud.microsoft/e/Fq1zqQ9VwP`
* **Live застосунок та API в хмарі AWS:** [https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)
* **Виконані рівні:** Усі рівні (Практичне завдання, 1-й рівень, 2-й рівень, 3-й рівень + Бонус Remove Guest)

---

## Архітектура повноцінного веб-сайту

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
   * Шапка із привітанням гостя *«Hello, Jasmine Smith»* та телефоном підтримки *«+123 456 678 8899»*.
   * Картка активної броні з можливістю редагування або переходу до Pre-Order.
   * Кнопка перемикання на точний **Empty State** (*«No Reservations»*) із макета Figma.

4. **Групове попереднє замовлення (`Group Pre-Order`):**
   * Чиста навігація без міток «Homework» та бейджів, професійне оформлення.
   * Повний набір кастомних функцій координації перед відправкою до ресторану.

5. **Автентифікація (`Sign In`, `Create Account`, `Reset Password`):**
   * Повноцінне модальне вікно за макетами Figma (вхід, створення акаунту, скидання пароля з 4-значним перевірочним кодом).

---

## Реалізований функціонал екрана Group Pre-Order

1. **Деталі столу та свята (Table Name & Occasion):**
   * Назва столу (наприклад, *Table #4 (Indoor Lounge) • 6 Seats*).
   * Тип свята / привід (наприклад, *Birthday Celebration*, *Dinner with Friends*, *Business Dinner*).
   * Адреса локації (*Main Dining Hall, 140 Rockwell Avenue*) та прогрес гостей (*4 of 5 guests*).
   * Часовий слот замовлення (*18:30 – 21:30*).

2. **Редагування деталей перед відправкою (Edit Reservation Modal):**
   * Кнопка **«Edit Details & Time»** відкриває модальне вікно редагування:
     * Зміна приводу свята (текстове поле).
     * Вибір столу зі списку доступних (*Table #4 Indoor*, *Table #2 Terrace*, *Table #7 Main Hall*, *Table #10 VIP*).
     * Зміна слотів часу початку та завершення броні (*18:30 – 21:30*, *19:00 – 22:00*, тощо).
     * Вибір графіка подачі страв кухнею.
     * Спеціальні коментарі та інструкції для шеф-кухаря.

3. **Розподіл рахунку (Payment Mode):**
   * **Host Covers All:** Walter оплачує весь загальний рахунок $540.00 одним чеком.
   * **Split Evenly:** сума $540.00 порівну ділиться на 5 гостей ($108.00 / гість).
   * **By Own Order:** окремий рахунок для кожного гостя за фактично обрані страви.

4. **Графік подачі страв (When to Serve Dishes):**
   * Випадаючий список швидкості та черговості подачі:
     * *Serve starters upon arrival (18:30), mains at 19:15*
     * *Serve all dishes together once everyone arrives*
     * *Serve drinks & appetizers first, hot food 30 mins later*
     * *Progressive course pacing (Appetizers -> Salads -> Mains -> Dessert)*

5. **Алергії та дієтичні обмеження (Dietary & Allergy Notes):**
   * Бейджі загальних обмежень для столу: *Nut Allergy: Oleg K. (Severe)*, *Gluten-Free (1 guest)*, *Vegetarian (2 guests)*, *No Cilantro*.
   * Персональні дієтичні нотатки в кожній картці учасника (Walter, Andrii, Olena, Alex).
   * Кнопка **«Edit Note»** біля кожного гостя для зміни індивідуального коментаря до страви.

6. **Комунікація та шерінг (Share Drawer & Modals):**
   * Пряме копіювання посилання на підключення до столу.
   * Швидкі інтерактивні вікна для відправки через **SMS**, **WhatsApp**, **Email**.
   * Функція **«Remind Pending»** для персональних нагадувань гостям зі статусом *Still choosing*.

---

## Результати автоматичного тестування (`npm run test:hw`)

Усі 37 тестів успішно проходять перевірку:

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
