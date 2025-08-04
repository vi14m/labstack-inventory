
# Labstack Inventory

## Project Overview
Labstack Inventory is a comprehensive inventory management web application built to help businesses and teams efficiently track, manage, and analyze their inventory. The application is designed for scalability, security, and ease of use, providing a seamless experience across devices. It supports real-time updates, role-based access, and modern UI/UX patterns to ensure users can manage inventory with minimal friction.

## Setup & Running Locally

## Installation & Local Setup

### Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js (v18 or higher):** Required for running the frontend and installing dependencies.
- **npm, yarn, or bun:** Any package manager supported by the project. Bun is optional and supported via `bun.lockb`.
- **Supabase account:** Used for authentication, database, and backend services. Sign up at [supabase.com](https://supabase.com/) and create a new project.

### Step-by-Step Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/vi14m/labstack-inventory.git
   cd labstack-inventory
   ```
2. **Install dependencies**
   Choose your preferred package manager:
   ```bash
   npm install
   ```
3. **Configure Supabase**
   - Go to your Supabase dashboard and copy your project URL and anon/public key.
   - Open `src/integrations/supabase/client.ts` and replace the placeholder credentials with your own.
   - To set up the database schema, run migrations:
     ```bash
     supabase db push
     ```
   - You may need to install the Supabase CLI: https://supabase.com/docs/guides/cli
4. **Start the development server**
   ```bash
   npm run dev
   ```
5. **Open the application**
   Visit [http://localhost:5173](http://localhost:5173) in your browser. The app will automatically reload on code changes.

### Troubleshooting
- If you encounter issues with dependencies, ensure your Node.js version matches the required version.
- For Supabase errors, double-check your credentials and database setup.

## Architecture & Technology Stack

### Frontend
- **React (TypeScript):** The core of the UI, providing a component-based architecture for building interactive interfaces. TypeScript adds type safety and better developer tooling.
- **Vite:** A next-generation build tool that offers fast cold starts, instant hot module replacement, and optimized production builds. Vite is chosen for its speed and simplicity compared to older tools like Webpack.
- **Tailwind CSS:** A utility-first CSS framework that enables rapid UI development with a mobile-first approach. Tailwind ensures the app is highly responsive and easy to customize.
- **shadcn-ui:** A set of accessible, customizable React components used for building consistent UI elements. All reusable UI components are located in `src/components/ui`.

### State Management
- **React Hooks & Context:** State is managed using React's built-in hooks (`useState`, `useEffect`, etc.) and context for global state (such as authentication and notifications). This approach keeps the codebase simple and avoids the overhead of external state libraries.

### Backend & Integrations
- **Supabase:** Acts as the backend-as-a-service, providing authentication, database (PostgreSQL), and real-time subscriptions. Supabase is integrated via the client in `src/integrations/supabase/client.ts` and types in `src/integrations/supabase/types.ts`.
- **Database Migrations:** Managed via Supabase CLI and SQL files in `supabase/migrations/`.

### Build & Tooling
- **Vite:** Handles development server, build process, and optimizations for production.
- **ESLint & Prettier:** Ensures code quality and consistent formatting.

### Folder Structure
- `src/components/ui/`: Reusable UI components (buttons, dialogs, tables, etc.)
- `src/pages/`: Main application pages (Dashboard, Auth, NotFound, etc.)
- `src/hooks/`: Custom React hooks for logic reuse (authentication, mobile detection, toast notifications)
- `src/integrations/supabase/`: Supabase client and types
- `supabase/`: Database config and migrations

## Implemented Features

### Authentication
Users can sign up and log in securely using Supabase's authentication system. Passwords are hashed and stored securely. The app supports session management and can be extended for OAuth providers.

### Dashboard
The dashboard provides a real-time overview of inventory status, recent activity, and system notifications. It is designed for quick insights and easy navigation, with widgets and charts for visual representation.

### Inventory Management
Users can add new items, edit existing ones, delete items, and view detailed information. All changes are synced with the backend in real time. The UI supports bulk actions and search/filtering for large inventories.

### Responsive Design
The application is fully responsive, adapting to mobile, tablet, and desktop screens. Tailwind CSS and custom hooks (`use-mobile.tsx`) ensure optimal layout and usability on all devices.

### Notifications
Toast and alert components provide instant feedback for user actions (e.g., item added, error occurred). Notifications are managed via custom hooks and can be extended for system-wide alerts.

### Role-Based Access
If enabled, the app supports multiple user roles:
- **Admin:** Full access, including user management and settings.
- **Manager:** Can manage inventory and view reports.
- **Staff:** Limited to viewing and updating assigned inventory.
Roles are managed via Supabase and enforced in the frontend. See `src/hooks/useAuth.tsx` for implementation details.

## User Roles & Access

## Accessing Different User Roles
Roles are assigned in the Supabase dashboard or via the app's admin interface (if implemented). To test different roles:
- Update the user's role in Supabase under the `users` table.
- Use demo accounts or modify the role in `src/hooks/useAuth.tsx` for local testing.
Each role sees a different set of features and permissions in the UI.


## Screenshots & GIFs
Below are some visual examples of the application's key features:

![Dashboard Screenshot](public/Screenshot%20from%202025-08-04%2022-15-00.png)

![authentication](public/Screenshot%20from%202025-08-04%2022-16-18.png)

![pic](public/Screenshot%20from%202025-08-04%2022-18-45.png)

![pic](public/Screenshot%20from%202025-08-04%2022-31-46.png)
![pic](public/Screenshot%20from%202025-08-04%2022-39-52.png)
![pic](public/Screenshot%20from%202025-08-04%2022-41-15.png)

## Known Limitations & Future Improvements

### Limitations
- Offline support is not available; the app requires an active internet connection.
- Reporting and analytics features are basic and can be expanded.
- Role management UI is minimal; advanced permission controls are planned.

### Future Improvements
- Add advanced analytics and reporting dashboards.
- Implement offline sync and caching for better reliability.
- Enhance role management with granular permissions and audit logs.
- Integrate barcode/QR code scanning for faster inventory operations.