---
title: KAP Fund Analytics
summary: Turns fund reports published on KAP as PDFs into structured, queryable time series.
year: 2026
stack: [Python, PyMuPDF, FastAPI, SvelteKit, TimescaleDB, Docker]
status: complete
kind: project
order: 1
flow: [KAP PDF reports, PyMuPDF parser, Validation & audit, TimescaleDB, FastAPI, SvelteKit UI]
links: {}
---

## Problem

Investment funds in Türkiye publish their periodic reports on KAP, the Public Disclosure Platform, as PDF files. The numbers are all there, but they sit in layouts that differ between issuers, so comparing funds over time means copying tables by hand.

## Approach

This was my capstone project at Bahçeşehir University. The current version parses the reports with a deterministic PyMuPDF pipeline instead of a learned model: explicit rules locate the tables and fields, every extracted value is validated, and each run is audited. The results are stored as time series in TimescaleDB, served by a FastAPI backend and explored through a SvelteKit interface. The whole stack runs in containers.

## What I learned

When the output feeds financial analysis, being able to explain every number matters more than squeezing out coverage. A boring, deterministic pipeline turned out to be easier to trust, test and extend than a clever one.
