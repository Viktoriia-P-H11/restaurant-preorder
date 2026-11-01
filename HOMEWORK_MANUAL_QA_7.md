# Домашнє завдання по Manual QA #7
## Аналіз вимог, тест-кейси та тестування User Story (US11_Guest Viewing Reservation Menu)

* **Студентка:** Viktoriia P.
* **Курс:** EPAM IT Marathon 6.0 — Manual QA Track
* **Вимога (User Story):** `[Draft] US11_Guest Viewing Reservation Menu` (Order Management)
* **Дизайн у Figma:** [EPAM IT Marathon 6.0 — Menu View](https://www.figma.com/design/P9rkBNLJZ3WabXSQX9b5DO/EPAM-IT-Marathon-6.0?node-id=111683-86716)
* **Форма для здачі:** `https://forms.cloud.microsoft/e/npFt9LcT1K`

---

## 1. Аналіз вимог (Requirements Review) та виявлені недоліки в User Story

Я уважно вичитала User Story US11 та порівняла її з макетами у Figma. Нижче список зауважень, нестиковок та запитань до бізнес-аналітика / Product Owner:

### Недоліки та запитання до вимог (Questions / Gaps):
1. **Неузгодженість статусів (On Stop vs Out Of Stock):**
   * *У тексті US (AC 4):* чітко написано `On Stop`.
   * *У макетах Figma та на UI розробників:* на бейджі написано `Out Of Stock`. 
   * *Питання до BA:* який саме термін ми використовуємо в системі для ресторану? Потрібно привести до єдиного стандарту, бо зараз плутанина між термінами бекенду і фронта.

2. **Немає опису Empty State для категорій меню:**
   * *Проблема:* В AC 1 вказано, що меню розбите по категоріях, але взагалі не описано поведінку, якщо у якійсь категорії (наприклад, `Desserts`) наразі немає доступних страв або кухар вимкнув усі позиції. 
   * *Що треба додати:* який текст/ілюстрацію показувати гостю (наприклад: *"No dishes available in this category yet"*), чи ховати таку вкладку взагалі.

3. **Відсутня логіка для сортування (Sort by dropdown):**
   * *Проблема:* На UI та в макеті є селект `Sort by: Recommended`, але в критеріях приймання (Acceptance Criteria) сортування взагалі не згадується.
   * *Питання:* які варіанти сортування мають бути у випадаючому списку (за ціною від меншої до більшої, за алфавітом, за популярністю)? Як саме працює сортування за замовчуванням `Recommended`?

4. **Не описано поведінку кнопки [Pre-Order] при повторному кліку:**
   * *Проблема:* В AC 3 написано просто: *"The Guest can add an available dish directly to their personal subcart by interacting with a clear action button"*. 
   * *Не ясно:* Що відбувається після першого кліку? Кнопка змінюється на лічильник `[- 1 +]`? Чи відкривається модалка з деталями та вибором кількості? Чи кожен новий клік просто додає +1 порцію у кошик і показує тост-повідомлення?

5. **Немає вимог до відображення кошика (Cart Icon / Drawer):**
   * *Проблема:* У зеленій плашці праворуч є іконка кошика. Чи має на ній відображатися бейдж із цифрою (кількість доданих страв)? Чи має кошик відкриватися по кліку на іконку? У User Story про це ні слова.

6. **Стандарт форматування ваги страв:**
   * *Проблема:* Не задано правило відображення ваги — писати з пробілом чи без (`450 g` чи `450g`). Розробники через це пишуть хто як хоче.

---

## 2. Набір тест-кейсів (Test Cases)

Тест-кейси складені суворо за наданим шаблоном Google Sheets для покриття функціоналу `US11_Guest Viewing Reservation Menu`:

| ID | Title | Pre-conditions | Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC_01** | Verify that Guest can view full restaurant menu structured by categories | 1. Guest joined valid session via link.<br>2. Reservation status is "Reserved". | 1. Open guest menu link in browser.<br>2. Observe the category tabs below the hero banner. | 1. Menu page loads successfully.<br>2. Categories are clearly displayed: "All dishes", "Appetizers", "Main Courses", "Desserts".<br>3. "All dishes" is active by default with green underline indicator. | **Passed** |
| **TC_02** | Verify that each dish card displays all mandatory attributes according to AC 2 | 1. Guest is on the menu page.<br>2. Restaurant has active dishes. | 1. Inspect any available dish card (e.g. Avocado Toast). | Dish card clearly displays:<br>- Dish title/name<br>- High-quality image matching the dish<br>- Serving size in grams (e.g. 200g)<br>- Price formatted in USD (e.g. $12.00)<br>- Interactive action button [Pre-Order]. | **Failed** |
| **TC_03** | Verify that Guest can add available dish to personal subcart | 1. Guest is on the menu page.<br>2. Dish has active green [Pre-Order] button. | 1. Click on green [Pre-Order] button on available dish.<br>2. Observe cart counter and UI response. | 1. Dish is successfully added to guest's personal subcart.<br>2. Confirmation toast notification appears.<br>3. Cart icon in top green banner updates counter. | **Passed** |
| **TC_04** | Verify that dishes marked "On Stop" / "Out Of Stock" are disabled and cannot be added | 1. Restaurant marked item as unavailable.<br>2. Guest is on menu page. | 1. Locate dish with "Out Of Stock" status.<br>2. Check status badge.<br>3. Try to click [Pre-Order] button. | 1. Dish has visible unavailable badge ("Out Of Stock" / "On Stop").<br>2. [Pre-Order] button is greyed out and disabled (`disabled` state).<br>3. Clicking the button does nothing; dish is not added to cart. | **Passed** |
| **TC_05** | Verify that filtering by categories works correctly | 1. Guest is on menu page with "All dishes" selected. | 1. Click on "Appetizers" tab.<br>2. Click on "Main Courses" tab. | 1. When clicking "Appetizers", only appetizer dishes are displayed.<br>2. When clicking "Main Courses", only main course dishes are displayed. | **Passed** |
| **TC_06** | Verify reservation details banner at the top of menu page | 1. Guest opened table invitation link. | 1. Inspect green info banner below navigation header. | Banner displays accurate reservation details:<br>- Restaurant location address (48 Rustaveli Avenue)<br>- Table number (Table 1)<br>- Time slot (15:30 - 17:00)<br>- Cart icon on the right. | **Passed** |
| **TC_07** | Verify menu data refreshes upon page reload | 1. Admin/waiter updated dish price or status in backend.<br>2. Guest is on menu page. | 1. Press F5 / browser reload button. | Page reloads and displays fresh menu data from backend without stale cache. | **Passed** |

---

## 3. Дефект-репорти (Bug Reports) за результатами тестування реалізації

Тестування проводилося по реальному скріншоту застосунку:  
`https://d28jftogiwtein.cloudfront.net/join/613fc98442f44b9f97e74ad0beb0a5f0`

Нижче оформлені баг-репорти за офіційним шаблоном EPAM Bug Report:

---

### Bug Report #1 (Критична невідповідність фотографій стравам)

* **ID:** `BUG-01`
* **Summary:** Dish images do not match dish titles (Salad photo is displayed for "Margherita Pizza" and "Truffle Mushroom Risotto")
* **Environment:** `P_PRD` (CloudFront Web App, Chrome 129+, Windows 11)
* **Priority:** `High`
* **Severity:** `Major`
* **Pre-conditions:**
  1. Guest has joined reservation session via shared invite link.
  2. Reservation status is "Reserved".
  3. Menu page is opened.
* **Steps to Reproduce:**
  1. Open the Menu page via guest invite link.
  2. Scroll down to the dish cards section.
  3. Look at the 2nd dish card with title *"Truffle Mushroom Risotto"*.
  4. Look at the 3rd dish card with title *"Margherita Pizza"*.
* **Actual Result:**  
  Для страви *"Margherita Pizza"* та *"Truffle Mushroom Risotto"* відображається одне й те саме фото овочевого салату з полуницею та сиром фета. Реальних фотографій піци та різотто немає. Гість бачить салат замість замовленої гарячої страви, це вводить користувача в оману.
* **Expected Result:**  
  Кожна картка страви повинна містити релевантне фото: для *"Margherita Pizza"* має бути фото класичної піци Маргарита, для різотто — фото грибного різотто, згідно з макетом Figma.
* **Attachments:** Скріншот екрана (`qa_screenshot.jpg`), виділені картки №2 та №3.

---

### Bug Report #2 (Відсутня обов'язкова категорія «Desserts»)

* **ID:** `BUG-02`
* **Summary:** Mandatory category "Desserts" is missing from the category filter tabs on Menu page
* **Environment:** `P_PRD` (CloudFront Web App, Chrome 129+, Windows 11)
* **Priority:** `Medium`
* **Severity:** `Major`
* **Pre-conditions:**
  1. Guest joined active reservation session.
  2. Menu page is loaded.
* **Steps to Reproduce:**
  1. Open the Menu page.
  2. Pay attention to the category navigation bar under the banner.
* **Actual Result:**  
  Відображаються лише три категорії: `All dishes`, `Appetizers`, `Main Courses`. Категорії десертів `Desserts` на екрані взагалі немає, хоча в меню ресторану десерти передбачені. Порушено AC 1.
* **Expected Result:**  
  Відповідно до AC 1 (*"view the full restaurant menu structured logically by category (e.g., Appetizers, Main Course, Desserts)"*) та макетів Figma, категорія `Desserts` має відображатися у списку табів.
* **Attachments:** Скріншот блоку категорій.

---

### Bug Report #3 (Неузгоджений формат відображення ваги страв)

* **ID:** `BUG-03`
* **Summary:** Inconsistent spacing format for dish weight across menu cards ("450 g" vs "200g")
* **Environment:** `P_PRD` (CloudFront Web App, Chrome 129+, Windows 11)
* **Priority:** `Low`
* **Severity:** `Minor`
* **Pre-conditions:**
  1. Guest is on the Menu page.
* **Steps to Reproduce:**
  1. Inspect the weight label under the price for Card 1 (*Fresh Avocado Toast*).
  2. Inspect the weight label for Card 2 (*Truffle Mushroom Risotto*).
  3. Inspect the weight label for Card 3 (*Margherita Pizza*).
* **Actual Result:**  
  У перших двох картках грами вказані злитно без пробілу (`200g`, `350g`), а в третій картці — окремо з пробілом (`450 g`). UI виглядає неохайно та не за єдиним гайдлайном.
* **Expected Result:**  
  Форматування ваги має бути уніфікованим для всіх карток каталогу за дизайн-системою (наприклад, суворо `450g` або `450 g`).
* **Attachments:** Порівняння карток №1, №2 та №3.

---

### Bug Report #4 (Розбіжність назви бейджа: Out Of Stock замість On Stop)

* **ID:** `BUG-04`
* **Summary:** Inconsistent badge label "Out Of Stock" used instead of specification requirement "On Stop"
* **Environment:** `P_PRD` (CloudFront Web App, Chrome 129+, Windows 11)
* **Priority:** `Medium`
* **Severity:** `Medium`
* **Pre-conditions:**
  1. At least one dish is marked unavailable.
  2. Guest is on the Menu page.
* **Steps to Reproduce:**
  1. Open the Menu page.
  2. Observe unavailable dish cards (e.g. Avocado Toast).
  3. Inspect badge text in top right corner of the card.
* **Actual Result:**  
  Бейдж відображає текст `"Out Of Stock"`.
* **Expected Result:**  
  Згідно з Acceptance Criteria 4 (*"Items currently marked 'On Stop' are clearly indicated as unavailable"*), статус має бути підписаний `"On Stop"` (або вимогу в US треба офіційно синхронізувати з фронтенд-дизайном).
* **Attachments:** Скріншот бейджа на картці страви.

---

## 4. Готові відповіді для форми здачі завдання (Microsoft Forms)

Посилання на форму: [https://forms.cloud.microsoft/e/npFt9LcT1K](https://forms.cloud.microsoft/e/npFt9LcT1K)

### Поле 1: Ваше ім'я / Email
> Вкажіть ваші реєстраційні дані на марафоні (Viktoriia P. / ваш email).

### Поле 2: Результати аналізу вимог (Requirements Analysis & Gaps)
> **Текст для копіювання:**  
> Під час аналізу User Story US11 та макетів Figma виявлено низку суперечностей та недоліків:  
> 1. Термінологічний конфлікт: у AC 4 вказано статус "On Stop", а в дизайні та коді бейдж називається "Out Of Stock". Потрібно узгодити єдиний стандарт між бекендом та дизайном.  
> 2. Відсутній опис Empty State: не описано, як система має поводитися, якщо в обраній категорії немає жодної активної страви.  
> 3. Не описано функціонал сортування: у макеті присутній селект "Sort by: Recommended", проте критерії сортування (за зростанням/спаданням ціни, рейтингом, назвою) у User Story відсутні.  
> 4. Не специфіковано логіку додавання кількох порцій страви кнопкою [Pre-Order] (лічильник кількості чи повторний клік).  
> 5. Відсутні стандарти форматування ваги страв у грамах (наприклад, "200g" vs "200 g").

### Поле 3: Посилання на таблицю тест-кейсів (Test Cases)
> Можна прикріпити посилання на файл у репозиторії:  
> `https://github.com/Viktoriia-P-H11/restaurant-preorder/blob/main/HOMEWORK_MANUAL_QA_7.md` (розділ 2: Набір тест-кейсів TC_01 – TC_07).

### Поле 4: Результати тестування реалізації та дефект-репорти (Bug Reports)
> **Текст для копіювання:**  
> За результатами тестування реалізованої частини за скріншотом виявлено 4 дефекти:  
> 1. BUG-01 (Major): Невідповідність фотографій стравам — для страв "Margherita Pizza" та "Truffle Mushroom Risotto" замість реальних фото відображається фотографія полуничного салату.  
> 2. BUG-02 (Major): Відсутня категорія "Desserts" у списку вкладок меню, що прямо порушує Acceptance Criteria 1.  
> 3. BUG-03 (Minor): Неузгоджене форматування ваги — у перших двох картках грами вказані разом ("200g", "350g"), а в третій окремо з пробілом ("450 g").  
> 4. BUG-04 (Medium): Розбіжність назви статусу недоступності ("Out Of Stock" замість зазначеного у вимогах "On Stop").  
> Повний опис кроків відтворення та очікуваних результатів зафіксовано в баг-репортах у файлі `HOMEWORK_MANUAL_QA_7.md`.
