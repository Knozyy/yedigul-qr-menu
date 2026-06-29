# Yedigül Restaurant QR Menu Project

This project is a mobile-only QR Menu system designed for Yedigül Restaurant in Anadolukavağı, Istanbul.

## Build and Development Commands
*   **Install Dependencies:** `npm install`
*   **Run Development Server:** `npm run dev`
*   **Build Production Bundle:** `npm run build`
*   **Lint Code:** `npm run lint`

## Core Project Rules

> [!IMPORTANT]
> **1. Mobile and Tablet Only (Strict Rule)**
> *   This project is designed **exclusively** for mobile phones and tablets. Desktop responsiveness is out of scope.
> *   Every single feature or UI component **MUST** be verified and tested on mobile dimensions before being marked as done. No desktop styling is required.

> [!IMPORTANT]
> **2. Technology Stack**
> *   **Frontend:** React (Vite-powered, client-side rendering)
> *   **Styling:** TailwindCSS (Custom Marin/Bosphorus palette: dark blue, white, gold accent)
> *   **Backend & DB:** Firebase (Authentication, Firestore NoSQL DB, Firebase Hosting)

> [!IMPORTANT]
> **3. Multi-language (i18n)**
> *   All public menus must support Turkish (TR) and English (EN) dynamically.
> *   Ensure translations cover category names, item names, descriptions, and dynamic badges (e.g., "Market Price" / "Piyasa Fiyatı").

> [!IMPORTANT]
> **4. Dynamic QR & Routing**
> *   URLs must accept table identifiers (e.g., `/masa/:id` or query params `?masa=X`) so that future waiter calling or ordering services can be mapped directly to the table.

## Pricing System
*   Items in Firestore must support both numeric price values and a boolean flag `is_market_price` (Piyasa Fiyatı). When `is_market_price` is active, display the localization for "Piyasa Fiyatı / Market Price" instead of a currency figure.

## Guidelines & Architecture
*   Refer to `.planning/implementation_plan.md` for the database schema, folder structure, and detailed phases.
*   Follow clean atomic design principles for UI components under `src/components/ui/`.
*   Maintain clean state separation using React Context for Auth and Menu details.
