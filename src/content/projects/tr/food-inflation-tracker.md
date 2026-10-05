---
title: Gıda Enflasyonu Takibi
summary: Düzenli toplanan market fiyatlarından, TÜİK yöntemine benzer şekilde gıda enflasyonu hesaplar.
year: 2026
stack: [Python, marketfiyati.org.tr API, Zamanlanmış görevler]
status: complete
kind: project
order: 3
flow: [marketfiyati.org.tr API, Düzenli veri toplama, Fiyat geçmişi, Sepet ve ağırlıklar, Gıda enflasyonu endeksi]
links: {}
---

## Problem

Resmi gıda enflasyonu ayda bir kez ve tek bir sayı olarak açıklanıyor. Fiyatların açıklamalar arasında, ürün ürün nasıl hareket ettiğini görmek istedim.

## Yaklaşım

Bir Python görevi, herkese açık marketfiyati.org.tr API'sinden fiyatları düzenli aralıklarla topluyor ve bir fiyat geçmişi oluşturuyor. Bu geçmişten TÜİK'in yöntemine benzer şekilde gıda enflasyonu hesaplanıyor: ürünler bir sepette gruplanıyor, ağırlıklandırılıyor ve bir baz dönemle karşılaştırılıyor.

## Öğrendiklerim

Veriyi toplamak işin kolay kısmı. Ürün eşleştirme, eksik fiyatlar ve ağırlık seçimi gibi yöntem kararları, ortaya çıkan sayının bir anlam taşıyıp taşımadığını belirliyor.
