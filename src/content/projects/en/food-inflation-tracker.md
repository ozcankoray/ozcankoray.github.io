---
title: Food Inflation Tracker
summary: Measures food inflation from regularly collected supermarket prices, with an approach similar to TÜİK's.
year: 2026
stack: [Python, marketfiyati.org.tr API, Scheduled jobs]
status: complete
order: 3
flow: [marketfiyati.org.tr API, Scheduled collection, Price history, Basket & weights, Food inflation index]
links: {}
---

## Problem

Official food inflation is published once a month, as a single number. I wanted to see how prices actually move between releases, product by product.

## Approach

A Python job collects prices from the public marketfiyati.org.tr API on a regular schedule and builds a price history. From that history it calculates food inflation with an approach similar to TÜİK's: products are grouped into a basket, weighted, and compared with a base period.

## What I learned

Collecting the data is the easy part. The method — matching products, handling missing prices, choosing weights — decides whether the final number means anything.
