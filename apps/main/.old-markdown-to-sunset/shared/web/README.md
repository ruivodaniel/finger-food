# 🌐 Client Application

[`React`](https://react.dev/) frontend application with [`TanStack Router`](https://tanstack.com/router) for file-based routing and modern UI components.

## 📁 Structure

### 🎨 Public Assets ([`public/`](public/))

Public static resources

### 📦 Source Code ([`src/`](src/))

- **🎨 Assets** ([`src/assets/`](src/assets/)): Bundled static resources
- **🧩 Components** ([`src/components/`](src/components/)): Reusable UI components
  - **[`app-sidebar/`](src/components/app-sidebar/)**: Application sidebar navigation
  - **[`layouts/`](src/components/layouts/)**: Page layout components
  - **[`ui/`](src/components/ui/)**: [`Shadcn UI`](https://ui.shadcn.com/) component library
- **⚙️ Configuration** ([`src/config/`](src/config/)): Application configuration
- **🎣 Hooks** ([`src/hooks/`](src/hooks/)): Custom React hooks
- **🌍 Internationalization** ([`src/i18n/`](src/i18n/)): Translation and localization
- **📚 Libraries** ([`src/lib/`](src/lib/)): Core utilities and API integration
  - **[`api/`](src/lib/api/)**: API client and queries
- **🛣️ Routes** ([`src/routes/`](src/routes/)): File-based routing structure
  - **[`_auth/`](src/routes/_auth/)**: Authentication routes
  - **[`_protected/`](src/routes/_protected/)**: Protected routes
  - **[`legal/`](src/routes/legal/)**: Legal routes
- **🗄️ Stores** ([`src/stores/`](src/stores/)): [`Zustand's`](https://zustand-demo.pmnd.rs/) global state management
- **🔧 Utils** ([`src/utils/`](src/utils/)): Utility functions

### 🐳 Docker

- **[`Dockerfile`](Dockerfile)**: Container configuration for deployment
- **[`nginx.conf`](nginx.conf)**: Nginx server configuration

## 🏃‍♂️ Running the Project

### Development Server

_**Note:** Ensure you follow the setup steps from the root [README.md](../../../README.md) before running the development server._

```bash
# Start the client in development mode
pnpm run dev
```

## 🚀 Deployment

The client application is built and deployed through GitHub Actions CI/CD pipelines. For detailed deployment workflows and configuration, refer to [.github/README_CICD.md](../../../.github/README_CICD.md).
