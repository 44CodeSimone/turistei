# Turistei

Turistei is a tourism marketplace platform designed to connect service providers and travelers through a secure, automated and scalable data-driven architecture.

The project prioritizes strong database governance, financial automation and business rules enforced directly at the PostgreSQL (Supabase) layer before application development.

---

## Quick Links

- 📘 Architecture: [docs/arquitetura.md](docs/arquitetura.md)
- 🗄 Database Overview: [docs/database/README.md](docs/database/README.md)
- 🧱 Tables (schema): [docs/database/tabelas.sql](docs/database/tabelas.sql)
- 🔐 RLS (security policies): [docs/database/rls.sql](docs/database/rls.sql)
- 🧩 Functions & RPCs: [docs/database/funcoes.sql](docs/database/funcoes.sql)
- ⚙ Triggers & Automations: [docs/database/triggers.sql](docs/database/triggers.sql)
- ✅ Audits (PASS checks): [docs/database/auditorias.sql](docs/database/auditorias.sql)

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
✅ Marketplace multi-provider architecture validated  
✅ Financial automation structure documented  
✅ Row Level Security documented (RLS + FORCE RLS)  
✅ Database-driven business rules

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
