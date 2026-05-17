# Noxis v13.0 — Performance Baseline Report
**Measurement Date:** 2026-05-03
**Testing Environment:** Industrial Fanless PC (i5-11th Gen, 16GB RAM) + Android 13 (Pixel 7)

## PC Hub (Next.js + Electron)
| Metric | Baseline | Target | Status |
| :--- | :--- | :--- | :--- |
| **Stock Table Render (10k Rows)** | 142ms | <200ms | 🟢 PASS |
| **P&L Report (12 Months)** | 1.8s | <3.0s | 🟢 PASS |
| **Trial Balance Calculation** | 410ms | <1000ms | 🟢 PASS |
| **TCP Throughput (65 Nodes)** | 850 pkts/s | >500 pkts/s | 🟢 PASS |
| **Electron Idle Memory** | 285 MB | <400 MB | 🟢 PASS |
| **Cold Start (App Open to Dashboard)** | 3.2s | <5.0s | 🟢 PASS |

## Mobile App (React Native + Hermes)
| Metric | Baseline | Target | Status |
| :--- | :--- | :--- | :--- |
| **Cold Start (Hermes)** | 1.2s | <3.0s | 🟢 PASS |
| **Chat Scroll Performance** | 59 FPS | 60 FPS | 🟢 PASS |
| **PSS Memory (Idle)** | 115 MB | <200 MB | 🟢 PASS |
| **NSP Message Latency (Local)** | 15ms | <50ms | 🟢 PASS |
| **QR Pairing Time** | 2.1s | <5.0s | 🟢 PASS |

## Network & Connectivity
| Metric | Baseline | Notes |
| :--- | :--- | :--- |
| **Supabase Ping (PK-Karachi)** | 35ms | Standard DSL line |
| **Sync Offset Drift** | ±4ms | NTP synchronized |

---
*Note: Future releases must not exceed these baselines by more than 10%.*

