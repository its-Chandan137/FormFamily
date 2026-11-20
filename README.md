# FormFamily

Multi-tenant web platform where companies create dynamic forms with a drag-and-drop builder and connect them to GoHighLevel (GHL), a CRM.

## Project Structure

This project is Part 1 of a 3-part development process:

- **Part 1**: Project setup, types, configuration, stubs, and documentation
- **Part 2**: Frontend with static data and mock API responses
- **Part 3**: Real backend, authentication, and GHL integration

## Current Status

**Part 1 Complete**: Project bootstrapped with all required packages, full folder structure, typed stubs, Prisma schema, and documentation.

## Technologies

- Next.js (App Router) with React and TypeScript
- Tailwind CSS with shadcn/ui
- @reduxjs/toolkit for state management
- @dnd-kit for drag-and-drop
- @xyflow/react for family graph
- Prisma with PostgreSQL

## Scripts

- `pnpm dev` - Development server
- `pnpm build` - Build for production
- `pnpm start` - Production server
- `pnpm lint` - ESLint
- `pnpm lint:fix` - ESLint with fixes
- `pnpm typecheck` - TypeScript check
- `pnpm format` - Prettier format
- `pnpm test` - Vitest tests
- `pnpm test:watch` - Vitest watch mode
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run Prisma migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Run seed script

## TODO (Part 2)

- Implement real drag-and-drop builder
- Build family graph visualization
- Create form public page
- Implement dashboard with all forms
- Add field library
- Build GHL connection and mapping screens
- Implement submission management

## TODO (Part 3)

- Implement Redux state wiring
- Add API routes for real backend
- Implement authentication
- Add queue library and storage SDK
- Integrate with real GHL API
