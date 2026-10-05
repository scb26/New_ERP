# 👥 Unidex ERP — Corporate AI Agent Organization & Roster
**System Version:** `v1.4.0` (Offline-First SQLite POS ERP)  
**Governance Model:** Autonomous Engineering & Commercial Organization  
**Maintained by:** Antigravity Executive Board  
**Last Updated:** October 05, 2026  

---

## 🏛️ Executive Leadership & Engineering Roster

| # | Persona / Call-Sign | Subagent ID / Type | Corporate Role | Primary Responsibilities & Key Contributions |
|---|---|---|---|---|
| **1** | **Priya** | `lead_product_manager`<br>`50bfb79a-dff4-4f53-9014-9be49c97d138` | **Chief Product Officer & Lead PM** | • Product vision, feature roadmap, and PRD specifications (`PRD_Sprint_1`, `PRD_Sprint_2`, `PRD_Sprint_3`, `PRD_Sprint_4`).<br>• Business prioritization & trade-off analysis (e.g. Cloud LLM search cost/benefit evaluation).<br>• Commercial alignment with Indian MSME retail workflows. |
| **2** | **Zara** | `software_architect`<br>`d53347d1-9b31-444f-a85d-be0a83b67f6e` | **Chief Software Architect & Tech Lead** | • Core data modeling, system performance, and concurrency boundaries.<br>• Architected embedded native SQLite (`node:sqlite`) in WAL mode (`data/unidex.db`).<br>• Designed multi-table ACID transaction flows for POS billing, stock replenishment, and double-entry Khata ledgers. |
| **3** | **Dev** | `developer`<br>`3d7749d5-b861-47c7-a4b3-cea0c86c5491` | **Senior Full-Stack Developer** | • Hands-on full-stack engineering across Node/Express and React 19 + TypeScript.<br>• Built QuickBill POS, barcode buffer listener, thermal receipt printer integration, and bulk CSV onboarding modal.<br>• Implemented 1-click Windows counter launcher (`START_UNIDEX_ERP.bat`) and database backup/reset endpoints. |
| **4** | **Quinn** | `qa_engineer`<br>`2efc1ac8-b116-4ffd-a19f-f1d7dbd060e4` | **Senior QA & Test Automation Lead** | • Quality gates, regression testing, and CI/CD verification (`npm run lint` & `vite build`).<br>• Validated hardware barcode stream buffering, Section 170 rupee round-off accuracy, and thermal print CSS isolation.<br>• Performed Single-Shop Real-World Pilot Readiness Audit. |
| **5** | **Maya** | `security_engineer`<br>`22638106-4d53-4c08-95d3-4e2e7d98076f` | **Principal Security & Compliance Engineer** | • Application security, zero-trust session management, and Indian statutory compliance.<br>• Engineered 256-bit cryptographic session tokens (`crypto.randomBytes(32)`), eliminating default-admin privilege fallbacks.<br>• Enforced cashier margin protection (cost price redaction), CSV formula injection defenses (CWE-1236), and MCA Section 134(5) immutable audit trail logging. |
| **6** | **Leo** | `ui_ux_designer`<br>`91a9af91-2819-4b25-906e-d18cb0432bf0` | **Lead UI/UX & Design Systems Lead** | • Visual ergonomics, counter cashier velocity, typography, and dark/light theming.<br>• Designed QuickBill POS interface, banking passbook Khata ledger modal with Dr/Cr color coding, and AR aging cards.<br>• Created the agency-grade print-ready Merchant Product Brochure (`docs/UNIDEX_MERCHANT_BROCHURE.html`). |
| **7** | **Rohan** | `business_analyst`<br>`fd8543d1-1fe3-42be-8fd6-486bc7417410` | **Senior Business Analyst & Finance Expert** | • Double-entry accounting principles, Indian GST taxation, and commercial trade compliance.<br>• Designed Bahi-Khata ledger mechanics, AR credit aging buckets (0-30, 31-60, 60+ days), and CGST Section 170 round-off math.<br>• Authored the Cloud LLM Search Unit Economics & Gross Margin Impact Analysis. |
| **8** | **Rex** | `release_manager`<br>`2a0d0888-9bd7-466d-867d-b1b5fc5a473e` | **Release Manager & DevOps Officer** | • Release governance, versioning policies, and build packaging.<br>• Formally tagged and shipped releases: `v1.2.0`, `v1.2.1`, `v1.3.0`, and `v1.4.0`.<br>• Maintains the permanent milestone ledger in `docs/SPRINT_ACHIEVEMENTS_LOG.md` and authors official Release Notes. |
| **9** | **Kabir** | `technical_writer`<br>`c9161419-86c8-468e-87b7-46e8f6b9906e` | **Lead Technical Writer & Documentation Lead** | • User manuals, developer architecture docs, and cashier cheat-sheets.<br>• Authored `docs/SYSTEM_API_ARCHITECTURE.md`, `docs/CASHIER_QUICKSTART_GUIDE.md`, `docs/USER_MANAGEMENT_RBAC_GUIDE.md`, and `docs/MERCHANT_OPERATIONS_KHATA_GUIDE.md`.<br>• Authored the complete step-by-step `docs/UNIDEX_MERCHANT_MANUAL_GUIDE.md`. |
| **10** | **Arjun** | `growth_marketing_lead`<br>`8d63d956-47c6-4b48-95d0-a7c058c1ec69` | **Chief Marketing Officer & Head of Growth** | • 0-to-1 Go-To-Market (GTM) execution, merchant distribution, and market visibility.<br>• Designed the Closed Beta Pilot Strategy (first 20 merchants in high-velocity FMCG, hardware, and retail cohorts).<br>• Formulated the 4-pillar distribution playbook: Feet-on-Street blitz, CA / Tax Consultant referral engine, POS hardware vendor bundles, and vernacular video tutorials (`docs/GTM_PRODUCT_LAUNCH_MASTERPLAN.md`). |
| **11** | **Vikram** | `devops_sre_engineer`<br>`301687dc-6a01-49aa-8a70-5a1ffcd56db5` | **Senior DevOps & Site Reliability Engineer** | • CI/CD pipeline automation (GitHub Actions), test gates, and immutable artifact releases.<br>• SQLite WAL checkpoint monitoring (`PRAGMA wal_checkpoint`), corruption auto-detection, and hot non-blocking backups (`VACUUM INTO`).<br>• Multi-environment deployments (Single Desktop bat, Multi-terminal LAN, Docker/Cloud) & instant zero-downtime rollback hooks. |
| **12** | **Meera** | `legal_counsel`<br>`25af1505-b179-4462-a65b-c221a85bebc8` | **Principal Legal & Indian Statutory Compliance Counsel** | • CGST/SGST/IGST Act statutory compliance, Rule 46 16-field invoice mandates, and Section 170 nearest-rupee round-off.<br>• E-Invoicing (Rule 48(4) IRN & signed QR) and E-Way Bill (Rule 138) threshold tracking.<br>• Place of Supply (POS) rules, Reverse Charge Mechanism (RCM Section 9(3)/9(4) self-invoicing), and Section 36 6-year statutory record retention rules. |

---

## 🔄 Autonomous Operating Loop & Sequence

Every software milestone and sprint follows an uninterrupted, sequential chain of custody:

```
[ 1. Priya (PM) + Rohan (Finance) ] ──> PRD & Commercial Rules Specification
              │
              ▼
[ 2. Zara (Architect) + Leo (UX) ] ───> Relational Data Schema & UI/UX Blueprints
              │
              ▼
[ 3. Dev (Developer) ] ───────────────> Full-Stack Code Implementation & Build
              │
              ▼
[ 4. Quinn (QA) + Maya (Security) ] ──> Joint Functional, Concurrency & Security Audits
              │
              ▼
[ 5. Vikram (DevOps & SRE) ] ─────────> CI/CD Gates, WAL Verification, Backups & Rollback Plans
              │
              ▼
[ 6. Rex (Release) + Kabir (Docs) ] ──> Version Bump, Release Notes & User Documentation
              │
              ▼
[ 7. Arjun (Growth / CMO) ] ──────────> GTM Pilot Onboarding, Merchant Feedback & Market Rollout
```

---

## 📁 Key Documentation & Artifact References

- **Sprint Achievements Ledger:** [`docs/SPRINT_ACHIEVEMENTS_LOG.md`](file:///d:/New_ERP-main/docs/SPRINT_ACHIEVEMENTS_LOG.md)
- **GTM Launch Masterplan:** [`docs/GTM_PRODUCT_LAUNCH_MASTERPLAN.md`](file:///d:/New_ERP-main/docs/GTM_PRODUCT_LAUNCH_MASTERPLAN.md)
- **System & API Architecture:** [`docs/SYSTEM_API_ARCHITECTURE.md`](file:///d:/New_ERP-main/docs/SYSTEM_API_ARCHITECTURE.md)
- **Merchant Product Brochure:** [`docs/UNIDEX_MERCHANT_BROCHURE.html`](file:///d:/New_ERP-main/docs/UNIDEX_MERCHANT_BROCHURE.html)
- **Cashier Counter Manual:** [`docs/UNIDEX_MERCHANT_MANUAL_GUIDE.md`](file:///d:/New_ERP-main/docs/UNIDEX_MERCHANT_MANUAL_GUIDE.md)
- **Store Launcher Script:** [`START_UNIDEX_ERP.bat`](file:///d:/New_ERP-main/START_UNIDEX_ERP.bat)
