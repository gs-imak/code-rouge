---
name: Bug report
about: Report a defect in Code Rouge — server, kiosk, persistence, build, etc.
title: "[bug] "
labels: ["bug"]
---

## Summary

<!-- One sentence: what is broken. -->

## Component

<!-- Which surface is affected? -->

- [ ] `apps/attaque-de-bots` (Android tablet)
- [ ] `apps/assaut` (Windows PC mallette)
- [ ] `apps/debriefing` (Android smartphone)
- [ ] `apps/server-nuc` (NUC server)
- [ ] CI / build pipeline
- [ ] Documentation
- [ ] Other (specify): _____

## Environment

- **Device / OS:** <!-- e.g. Samsung Galaxy Tab A8 / Android 13 ; Intel NUC / Ubuntu 22.04 -->
- **App version:** <!-- e.g. v0.1.0 — check the About screen or filename of the APK/.exe -->
- **NUC server version (if applicable):** <!-- run `cat /opt/code-rouge/package.json` -->
- **Network context:** <!-- venue Wi-Fi mesh? home Wi-Fi? same subnet as NUC? -->

## Steps to reproduce

1.
2.
3.

## Observed behaviour

<!-- What happened. Include error messages, log snippets if available. -->

## Expected behaviour

<!-- What should have happened. -->

## Validation report (NUC issues)

<!-- If reporting a NUC server issue, paste the output of
     `bash tools/scripts/validate-m1.sh` here, or attach
     `/tmp/m1-validation-*.txt`. -->

## Screenshots / recordings

<!-- Drop images or short clips here. -->

## Severity (your subjective assessment)

- [ ] **Critical** — game session can't proceed
- [ ] **High** — a major feature is broken, but the session can continue
- [ ] **Medium** — visible defect, low operational impact
- [ ] **Low** — cosmetic
