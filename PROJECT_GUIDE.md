# Hostinvo

## Project Overview

Hostinvo is a SaaS web hosting automation platform designed to help
hosting providers manage their infrastructure, clients, billing, and
support operations from a single centralized system.

The platform aims to provide functionality similar to WHMCS while
focusing on automation, scalability, and modular architecture suitable
for modern SaaS environments.

Hostinvo will automate common hosting business workflows including:

-   Client management
-   Service provisioning
-   Recurring billing
-   Domain management
-   Customer support
-   Infrastructure automation

The system will be designed as a **multi‑tenant SaaS platform** allowing
multiple hosting providers to operate their business using the same
platform securely.

------------------------------------------------------------------------

# Core Objectives

-   Automate hosting business operations
-   Provide centralized management for clients and services
-   Automate recurring billing and invoicing
-   Provision hosting services automatically
-   Provide a customer self‑service portal
-   Integrate with hosting control panels
-   Offer a modern administrative dashboard

------------------------------------------------------------------------

# Supported Hosting Platforms

Hostinvo must support integration with the following hosting control
panels:

-   **cPanel / WHM**
-   **Plesk**

The system should include a **provisioning engine** capable of:

-   Creating hosting accounts
-   Suspending accounts for unpaid invoices
-   Unsuspending accounts after payment
-   Terminating services
-   Managing packages and quotas

The provisioning system should be designed as a **modular driver
system** so additional integrations can be added later (for example
DirectAdmin, cloud VPS APIs, or custom infrastructure).

------------------------------------------------------------------------

# Core Platform Modules

## 1. Authentication & Users

-   User registration and login
-   Roles and permissions
-   Multi‑tenant account management

## 2. Client Management

-   Customer profiles
-   Contact management
-   Account activity logs

## 3. Products & Services

-   Hosting plans
-   Service configuration
-   Resource limits

## 4. Orders & Checkout

-   Product ordering
-   Checkout workflow
-   Order processing

## 5. Billing & Invoices

-   Recurring invoices
-   Payment tracking
-   Subscription billing

## 6. Payment Gateways

-   Stripe
-   PayPal
-   Manual payments

## 7. Hosting Provisioning Engine

-   cPanel API integration
-   Plesk API integration
-   Service lifecycle management

## 8. Domain Management

-   Domain registration
-   Domain renewals
-   Registrar integrations

## 9. Support System

-   Ticketing system
-   Knowledge base
-   Email notifications

## 10. Admin Dashboard

-   Client management
-   Financial analytics
-   System monitoring

------------------------------------------------------------------------

# Technical Architecture

Backend: - Laravel (PHP)

Frontend: - Next.js / React or Laravel Blade

Database: - PostgreSQL

Cache & Queue: - Redis

Containerization: - Docker

Development Environment: - Docker Desktop

API: - REST API / GraphQL

Authentication: - JWT / OAuth

------------------------------------------------------------------------

# Automation System

Hostinvo will use background workers and scheduled tasks to automate
operations.

Examples:

-   Invoice generation
-   Payment reminders
-   Hosting provisioning
-   Account suspension
-   Renewal notifications

Automation should be implemented using:

-   Laravel Queue Workers
-   Redis Queues
-   Scheduled Cron Jobs

------------------------------------------------------------------------

# AI‑Driven Development Workflow

Hostinvo will be developed using AI‑assisted development with:

-   **OpenAI Codex** for code generation
-   **Claude AI** for architecture planning and code review

This hybrid workflow ensures better architectural decisions while
maintaining rapid development speed.

Recommended workflow:

1.  Claude designs system architecture
2.  Codex generates implementation code
3.  Claude reviews architecture and security
4.  Codex implements improvements

------------------------------------------------------------------------

# AI Prompt Development Workflow (Recommended)

### Prompt 1

Design the system architecture for Hostinvo.

### Prompt 2

Design the PostgreSQL database schema.

### Prompt 3

Create the Laravel project structure.

### Prompt 4

Generate Docker development environment.

### Prompt 5

Implement authentication system.

### Prompt 6

Create client management module.

### Prompt 7

Create products and services module.

### Prompt 8

Implement order system.

### Prompt 9

Implement billing and invoices.

### Prompt 10

Integrate Stripe payment gateway.

### Prompt 11

Integrate PayPal payment gateway.

### Prompt 12

Create provisioning engine.

### Prompt 13

Implement cPanel API integration.

### Prompt 14

Implement Plesk API integration.

### Prompt 15

Create support ticket system.

### Prompt 16

Build client portal interface.

### Prompt 17

Build admin dashboard.

### Prompt 18

Add automation cron jobs.

### Prompt 19

Add system notifications and emails.

### Prompt 20

Perform security and scalability review.

------------------------------------------------------------------------

# Long‑Term Vision

Hostinvo will evolve into a modular hosting automation ecosystem capable
of managing:

-   Shared hosting
-   VPS hosting
-   Cloud infrastructure
-   Domain services
-   SaaS hosting platforms

The platform will be built with extensibility in mind so new
integrations, billing systems, and infrastructure providers can be added
easily.
