# Restaurant Group Pre-Order API & Application (Green & Tasty)

A full-stack application implementing the **Group Pre-Order** system for restaurant table reservations, built with **Node.js 22**, **React 18**, **Tailwind CSS**, and deployed serverless on **AWS Lambda** & **Amazon API Gateway** via **Terraform**.

🌐 **Live Application & API:**  
[https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)

---

## 📑 Звіти до домашніх завдань марафону

У цьому репозиторії повністю виконані обидва практичні завдання EPAM IT Marathon 6.0:

1. **[Звіт до завдання Backend #5 (Груповий pre-order: функціонал для Owner)](HOMEWORK_BACKEND_5.md)**
   * Дедлайн: 02.11 до 10:00
   * Форма здачі: `https://forms.cloud.microsoft/e/g40fjREuAq`
   * Реалізовані рівні: 1-й, 2-й та 3-й рівні REST API на Node.js та AWS Lambda.

2. **[Звіт до завдання Frontend #6 (Екран Owner групового pre-order)](HOMEWORK_FRONTEND_6.md)**
   * Дедлайн: 02.11 до 23:59
   * Форма здачі: `https://forms.cloud.microsoft/e/Fq1zqQ9VwP`
   * Реалізовані рівні: Практичне, 1-й, 2-й та 3-й рівні (+ Бонус Remove Guest) за макетом Figma на React, з проходженням усіх 37 автотестів (`npm run test:hw`).

---

## Architecture and Technology Stack

* **Frontend:** React 18, Tailwind CSS, modular component structure (`ParticipantCard`, `Header`, `WarningBanner`, `ConsolidatedSummary`, `Modals`). Exact implementation of the Figma *FOR DEVELOPERS* -> *Owner Flow* design.
* **Backend:** Node.js 22 (ES Modules) running on AWS Lambda. Serves the web application at `/` and the complete REST API contract.
* **Infrastructure as Code (IaC):** Terraform (`infra/main.tf`) provisioning AWS Lambda (`nodejs22.x`), IAM execution roles, CloudWatch logs, and HTTP API Gateway v2.
* **Automated Testing:** Test suite (`npm run test:hw`) covering Practice, Level 1, Level 2, and Level 3 (+ Bonus).

---

## Automated Test Execution

Run the comprehensive test suite locally:

```bash
npm run test:hw
```

**Result: 37 of 37 tests passing green.**

---

## Deployment Instructions

Execute Terraform commands from the `infra` directory:
```bash
cd infra
terraform init
terraform apply -auto-approve
```
