---
title: KAP Fon Analitiği
summary: KAP'ta PDF olarak yayımlanan fon raporlarını yapılandırılmış, sorgulanabilir zaman serilerine dönüştürür.
year: 2026
stack: [Python, PyMuPDF, FastAPI, SvelteKit, TimescaleDB, Docker]
status: complete
kind: project
order: 1
flow: [KAP PDF raporları, PyMuPDF ayrıştırıcı, Doğrulama ve denetim, TimescaleDB, FastAPI, SvelteKit arayüz]
links: {}
---

## Problem

Türkiye'deki yatırım fonları dönemsel raporlarını Kamuyu Aydınlatma Platformu'nda (KAP) PDF olarak yayımlıyor. Rakamların hepsi orada, ama ihraççıya göre değişen düzenlerin içinde; fonları zaman içinde karşılaştırmak tabloları elle kopyalamak demek.

## Yaklaşım

Bahçeşehir Üniversitesi'ndeki bitirme projem. Güncel sürüm raporları öğrenen bir model yerine deterministik bir PyMuPDF pipeline'ı ile ayrıştırıyor: tablo ve alanları açık kurallar buluyor, çıkarılan her değer doğrulanıyor ve her çalıştırma denetim kaydı bırakıyor. Sonuçlar TimescaleDB'de zaman serisi olarak saklanıyor, FastAPI ile sunuluyor ve SvelteKit arayüzünde inceleniyor. Tüm sistem konteynerlerde çalışıyor.

## Öğrendiklerim

Çıktı finansal analizde kullanılacaksa, her rakamı açıklayabilmek kapsamı birkaç puan artırmaktan daha önemli. Sıkıcı ama deterministik bir pipeline'a güvenmek, onu test etmek ve geliştirmek, akıllı görünen bir çözümden çok daha kolay oldu.
