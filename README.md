# Turistei

Turistei is a tourism marketplace platform designed to connect service providers and travelers through a secure, automated and scalable data-driven architecture.

The project prioritizes strong database governance, financial automation and business rules enforced directly at the PostgreSQL (Supabase) layer before application development.

---

## Product Vision

The platform is built to:

- Organize tourism services in a structured marketplace
- Empower service providers with autonomy and control
- Ensure transparent financial operations
- Prevent data loss through immutable history
- Scale without losing governance or security

All critical data follows activation and visibility rules rather than deletions.

---

## Current Project Status

✅ Core database fully modeled  
✅ Financial automation implemented  
✅ Marketplace multi-provider architecture validated  
✅ Row Level Security enforced on all tables  
✅ Automatic payment handling and status updates  
✅ Production-level data integrity and auditing  

🚧 Frontend not started yet  
🚧 External integrations planned  

---

## Technical Architecture (Summary)

- Database: PostgreSQL (Supabase)  
- Security: RLS + FORCE RLS  
- Authentication: Supabase Auth  
- Business logic: Database-driven  
- Public catalog: Read-only search view  
- Automation: Triggers, RPCs and scheduled jobs  

Critical business rules do not depend on the application layer.

---

## Documentation Structure

Full database architecture and SQL implementation:

docs/database/README.md
