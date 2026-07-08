# AQAFRIKA — Data-protection compliance checklist

> Action items for the operator of AQAFRIKA. The platform stores third-party
> personal data (fish farmers' names, phones, GPS, gender, revenue ranges)
> collected by field agents, which brings it under national data-protection law
> in each pilot country. **Have a local lawyer/DPO review before scaling.**
> This file is guidance, not legal advice.

## What the platform already does (built-in)

- **Consent capture** — every operator registration requires the agent to attest
  informed consent; `operators.consent_given` + `consent_date` are stored.
- **Privacy policy & terms** — bilingual, at `/privacy` and `/terms`, linked from
  the footer, login and the registration consent line.
- **Access control** — RLS scopes operator PII to the owning organization; the
  public map shows only country-level institutional data, never individual farmers.
- **Anonymized aggregates** — the FAO/AfDB-facing statistics (`community_overview()`)
  expose counts and sums only, never row-level data.
- **Right to erasure (mechanism)** — operators (and their logs/events) can be
  deleted from the UI; account/data reassignment exists for offboarding.
- **Encryption in transit** — Supabase + Vercel (HTTPS/TLS), HSTS enabled.

## Country obligations — YOUR action items

### 🇸🇳 Senegal — CDP (Commission de protection des données personnelles)
- **Law:** Loi n° 2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel.
- **Action:** File a declaration (*déclaration*) of the processing with the **CDP**
  before collecting real farmer data at scale. Some processing may need prior
  authorization. Portal: <https://www.cdp.sn>.
- Appoint a contact/representative for data-subject requests.

### 🇨🇮 Côte d'Ivoire — ARTCI (Autorité de régulation des télécommunications/TIC)
- **Law:** Loi n° 2013-450 du 19 juin 2013 relative à la protection des données à caractère personnel.
- **Action:** Declare the processing to **ARTCI** (data protection is handled by
  ARTCI). Cross-border transfer of data (hosting is outside CI) generally requires
  notification/authorization. Portal: <https://www.artci.ci>.

### 🇨🇲 Cameroon
- **Law:** Loi n° 2024/017 du 23 décembre 2024 régissant la protection des données à caractère personnel.
- **Note:** The compliance deadline in the 2024 law has passed — confirm the
  current registration/authority requirements with local counsel, as implementing
  decrees and the supervisory authority were still being set up.

## Cross-cutting to-dos before public scale-up

- [ ] Register/declare processing with each country's authority (above).
- [ ] Confirm the lawful basis for cross-border hosting (Supabase `us-east-1`,
      Vercel) — consider EU/Africa region hosting if a country requires local storage.
- [ ] Sign Data Processing Agreements (DPAs) with sub-processors: Supabase,
      Vercel, Resend. (All offer standard DPAs.)
- [ ] Define and document a retention period (the privacy policy states delete/
      anonymize within 12 months of collaboration end — implement the deletion job).
- [ ] Prepare a data-subject request procedure (access / rectification / erasure)
      and name a contact (`contact@aqafrica.com` is published).
- [ ] Agent onboarding: distribute the verbal consent script (see `/guide`) and
      require agents to obtain consent before every registration.
- [ ] Data-breach response plan (who is notified, within what deadline).

## Minimization opportunities (reduce legal surface)

- Consider making **precise GPS** and **phone** optional, or coarsening GPS to a
  locality centroid where farm-level precision isn't needed for the use case.
- Avoid collecting revenue at household-identifiable granularity if ranges suffice
  (already implemented as ranges).
