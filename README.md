# 🐟 Salmon Allocation Dashboard

A comprehensive and responsive web application designed to manage, track, and allocate salmon inventory to various customer orders based on priority, available stock, and customer credit limits.


## Link Demo
**[Click here to view the Demo project](https://yurakung.github.io/Salmon-Allocation/)**

---

## ✨ Key Features

*   **Smart Auto-Allocation:** Automated distribution of stock based on predefined business rules and order priorities (EMERGENCY, OVERDUE, DAILY).
*   **Manual Allocation & Override:** An intuitive modal allowing users to manually adjust allocations with real-time validation against remaining warehouse stock and customer credit limits (supports decimal values like 1.15 kg).
*   **High-Performance Data Table:** Built with `TanStack Virtual` to handle massive datasets seamlessly without browser lag.
*   **Advanced Pagination & Search:** Filter orders globally or by specific fields (Order ID, Customer ID, Item ID, etc.) with customizable row limits per page.
*   **Dynamic Dashboard:** Real-time summary cards displaying available credit, emergency orders, and overall allocation statuses.
*   **Fully Responsive Design:** Optimized for both Desktop and Mobile experiences, featuring horizontal scrolling tables and adaptive layouts.

## 🛠️ Built With

*   **[React 18](https://reactjs.org/)** - UI Library
*   **[TypeScript](https://www.typescriptlang.org/)** - Static Typing
*   **[Vite](https://vitejs.dev/)** - Next Generation Frontend Tooling
*   **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework for rapid styling

---

## 💻 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
*   Node.js (v16 or higher recommended)
*   npm or yarn

### Installation

1. Clone the repo
   ```bash
   git clone https://github.com/yurakung/Salmon-Allocation.git
2. Navigate to the project directory
   ```bash
   cd salmon-allocation
3. Install NPM packages
   ```bash
   npm install
4. Start the development server
   ```bash
   npm run dev
---

## 🧠 Business Logic Highlights

The allocation logic strictly follows these validations to prevent over-commitment:
1.  **Priority Queuing:** EMERGENCY > OVERDUE > DAILY.
2.  **Stock Validation:** Checks real-time available stock across specified warehouses and suppliers.
3.  **Credit Validation:** Calculates the required cost based on dynamic pricing (including priority multipliers) and ensures it does not exceed the customer's maximum credit limit.
