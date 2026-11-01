# Restaurant Group Pre-Order API & Application (Green & Tasty)

[![E2E Automation & Quality Gate](https://github.com/Viktoriia-P-H11/restaurant-preorder/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/Viktoriia-P-H11/restaurant-preorder/actions/workflows/e2e-tests.yml)

A full-stack application implementing the **Group Pre-Order** system for restaurant table reservations, built with **Node.js 22**, **React 18**, **Tailwind CSS**, and deployed serverless on **AWS Lambda** & **Amazon API Gateway** via **Terraform**.

🌐 **Live Application & API:**  
[https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)

---

## 📑 Звіти до домашніх завдань марафону

У цьому репозиторії повністю виконані всі практичні завдання EPAM IT Marathon 6.0:

1. **[Звіт до завдання Backend #5 (Груповий pre-order: функціонал для Owner)](HOMEWORK_BACKEND_5.md)**
   * Дедлайн: 02.11 до 10:00
   * Форма здачі: `https://forms.cloud.microsoft/e/g40fjREuAq`
   * Реалізовані рівні: 1-й, 2-й та 3-й рівні REST API на Node.js та AWS Lambda.

2. **[Звіт до завдання Frontend #6 (Екран Owner групового pre-order)](HOMEWORK_FRONTEND_6.md)**
   * Дедлайн: 02.11 до 23:59
   * Форма здачі: `https://forms.cloud.microsoft/e/Fq1zqQ9VwP`
   * Реалізовані рівні: Практичне, 1-й, 2-й та 3-й рівні (+ Бонус Remove Guest) за макетом Figma на React, з проходженням усіх 37 автотестів (`npm run test:hw`).

3. **[Звіт до завдання Manual QA #7 (Аналіз вимог і тестування User Story)](HOMEWORK_MANUAL_QA_7.md)**
   * Форма здачі: `https://forms.cloud.microsoft/e/npFt9LcT1K`
   * Зміст: Повний аналіз вимог User Story US11, набір тест-кейсів за шаблоном EPAM, дефект-репорти за скріншотом реалізації та готові відповіді для форми.

4. **[Звіт до завдання Test Automation #8 (Автоматизація end-to-end сценаріїв)](HOMEWORK_TEST_AUTOMATION_8.md)**
   * Дедлайн: 04.11 до 08:00
   * Форма здачі: `https://forms.cloud.microsoft/e/6Y8eBy6EyJ?origin=lprLink`
   * Реалізовані рівні: 1-й, 2-й, 3-й рівні та Зірочка (CI/CD пайплайн у GitHub Actions та інтеграція з Report Portal).
   * Автотести: 25 E2E тестів проти реальної хмари AWS Lambda + 37 юніт/компонентних тестів (всього 62 тести, 100% Green).

---

## Architecture and Technology Stack

* **Frontend:** React 18, Tailwind CSS, modular component structure (`ParticipantCard`, `Header`, `WarningBanner`, `ConsolidatedSummary`, `Modals`). Exact implementation of the Figma *FOR DEVELOPERS* -> *Owner Flow* design.
* **Backend:** Node.js 22 (ES Modules) running on AWS Lambda. Serves the web application at `/` and the complete REST API contract.
* **Infrastructure as Code (IaC):** Terraform (`infra/main.tf`) provisioning AWS Lambda (`nodejs22.x`), IAM execution roles, CloudWatch logs, and HTTP API Gateway v2.
* **CI/CD & Automation:** GitHub Actions CI/CD пайплайн (`ci/workflows/e2e-tests.yml`), automated test reporter for Report Portal (`reports/reportportal-summary.json`), and comprehensive multi-tier test suites.

---

## Automated Test Execution

Run the automated test suites locally:

### 1. Frontend Component & Logic Test Suite (37 tests):
```bash
npm run test:hw
```

### 2. End-to-End Cloud Automation Suite (25 tests against live AWS):
```bash
npm run test:e2e
```

### 3. Full Quality Gate Test Suite (All 62 tests):
```bash
npm run test:all
```

**Result: 62 of 62 tests passing green.**

---

## Deployment Instructions

Execute Terraform commands from the `infra` directory:
```bash
cd infra
terraform init
terraform apply -auto-approve
```
