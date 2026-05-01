# JummaBaba Frontend

India's Largest B2B Marketplace - Industrial Sourcing Platform.

## 🚀 Overview
A high-performance React application built for industrial procurement, featuring:
- **Verified Supplier Directory**: Connect with top-tier industrial vendors.
- **Product Discovery**: Search across thousands of industrial listings and pricing tiers.
- **RFQ Management**: Streamlined workflow for posting and tracking volume requirements.
- **Role-Based Portals**: Dedicated experiences for Buyers, Sellers, and Administrators.

## 📁 Architecture
- **`src/components/`**: Reusable UI components (Atomic design).
- **`src/pages/`**: Page-level components organized by user role.
- **`src/lib/`**: Core API utilities, helpers, and constant definitions.
- **`src/hooks/`**: Custom React hooks for shared logic.
- **`src/contexts/`**: Global state management (Authentication, Notifications).

## 🛠️ Tech Stack
- **Core**: React 18 + Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Icons**: Lucide React
- **Logic**: TypeScript

## 💻 Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment:
   Create a `.env` file based on `.env.example` and set your `VITE_API_URL`.
3. Start development server:
   ```bash
   npm run dev
   ```
