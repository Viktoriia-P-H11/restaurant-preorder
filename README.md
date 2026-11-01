# Restaurant Group Pre-Order API & Application (Green & Tasty)

[![E2E Automation & Quality Gate](https://github.com/Viktoriia-P-H11/restaurant-preorder/actions/workflows/e2e-tests.yml/badge.svg)](https://github.com/Viktoriia-P-H11/restaurant-preorder/actions/workflows/e2e-tests.yml)

A full-stack application implementing the **Group Pre-Order** system for restaurant table reservations, built with **Node.js 22**, **React 18**, **Tailwind CSS**, and deployed serverless on **AWS Lambda** & **Amazon API Gateway** via **Terraform**.

🌐 **Live Application & API:**  
[https://8191ergrtg.execute-api.us-west-2.amazonaws.com/](https://8191ergrtg.execute-api.us-west-2.amazonaws.com/)

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
