# JTDOS ORDER EXTRACTION RULES

## 1. Purpose

This document defines how the JTDOS AI Sales Agent extracts structured transportation order information from customer messages.

The goal is to convert natural language inquiries into JTDOS order drafts.

## 2. Extraction Principle

The AI should extract all available order information from the customer message.

If some required information is missing, the AI should:

1. Create a draft order
2. Mark missing fields
3. Ask only the most important missing questions

Do not ask the customer to repeat information that has already been provided.

## 3. Supported Input Languages

The AI should support extraction from:

- Chinese
- English
- Japanese
- Mixed language messages

Examples:

Chinese:

```text
我们4个人明天下午到羽田，去新宿，4个箱子，需要中文司机
```

English:

```text
We are 4 people arriving at Haneda tomorrow afternoon and going to Shinjuku. We have 4 suitcases and prefer a Chinese-speaking driver.
```

Japanese:

```text
明日の午後、4名で羽田空港に到着し、新宿まで行きたいです。スーツケースは4個で、中国語対応のドライバーを希望します。
```

## 4. Service Type Detection

Detect service type based on keywords and context.

### Airport Pickup

Keywords:

- airport pickup
- arrival
- arriving at
- pick up from airport
- 接机
- 到机场
- 到达
- 空港迎え
- 到着
- 空港から

Examples:

Arriving at Haneda and going to Shinjuku

Service type:

```text
airport_pickup
```

### Airport Drop-off

Keywords:

- airport drop-off
- departure
- going to airport
- send to airport
- 送机
- 去机场
- 出发航班
- 空港送り
- 空港まで
- 出発

Service type:

```text
airport_dropoff
```

### Point-to-Point

Keywords:

- transfer
- from hotel to hotel
- from city to city
- 点对点
- 从A到B
- 移動
- 送迎

Service type:

```text
point_to_point
```

### Charter

Keywords:

- charter
- one day tour
- private car for 8 hours
- 包车
- 一日游
- 8小时
- 10小时
- 貸切
- 日帰り

Service type:

```text
charter
```

### Multi-Day Charter

Keywords:

- 3 days
- 5-day tour
- multi-day
- continuous charter
- 连续包车
- 多日包车
- 3天包车
- 複数日
- 連日貸切

Service type:

```text
multi_day_charter
```

## 5. Region Detection

Detect region from city, airport, or destination.

### Tokyo Region

Keywords:

- Tokyo
- Haneda
- Narita
- Shinjuku
- Shibuya
- Ginza
- Ueno
- Ikebukuro
- Roppongi
- Akasaka
- Yokohama
- Hakone
- Fuji
- Kawaguchiko
- Kamakura
- Nikko
- 东京
- 東京
- 羽田
- 成田
- 新宿
- 涩谷
- 渋谷
- 银座
- 銀座

Region:

```text
Tokyo
```

### Osaka / Kansai Region

Keywords:

- Osaka
- Kansai Airport
- KIX
- Kyoto
- Nara
- Kobe
- Wakayama
- USJ
- 大阪
- 关西机场
- 関西空港
- 京都
- 奈良
- 神户
- 神戸

Region:

```text
Osaka
```

### Hokkaido Region

Keywords:

- Hokkaido
- Sapporo
- New Chitose
- CTS
- Niseko
- Otaru
- Furano
- Biei
- Asahikawa
- Noboribetsu
- Lake Toya
- Rusutsu
- Tomamu
- Kiroro
- Hakodate
- 北海道
- 札幌
- 新千岁
- 新千歳
- 二世古
- 小樽
- 富良野
- 美瑛
- 登别
- 洞爷湖
- 洞爺湖
- 留寿都
- トマム
- 函馆
- 函館

Region:

```text
Hokkaido
```

## 6. Airport Normalization

Normalize airport names.

```json
{
  "Haneda Airport": "HND",
  "羽田空港": "HND",
  "羽田机场": "HND",
  "Narita Airport": "NRT",
  "成田空港": "NRT",
  "成田机场": "NRT",
  "Kansai Airport": "KIX",
  "Kansai International Airport": "KIX",
  "関西空港": "KIX",
  "关西机场": "KIX",
  "New Chitose Airport": "CTS",
  "新千歳空港": "CTS",
  "新千岁机场": "CTS"
}
```

## 7. Passenger Count Extraction

Extract passenger count from:

- 4 people
- 4 pax
- 4 passengers
- 4 adults
- 4名
- 4人
- 大人4人

Map to:

```json
{
  "passenger_count": 4
}
```

If children are mentioned, extract separately if possible:

```json
{
  "adult_count": 2,
  "child_count": 2,
  "passenger_count": 4
}
```

## 8. Luggage Count Extraction

Extract luggage from:

- 4 suitcases
- 4 luggage
- 4 large bags
- 4个箱子
- 4件行李
- スーツケース4個

Map to:

```json
{
  "luggage_count": 4
}
```

If not provided, mark as missing:

```json
{
  "missing_fields": ["luggage_count"]
}
```

## 9. Ski Equipment Extraction

For Hokkaido winter or ski destinations, detect:

- ski
- snowboard
- ski bags
- 滑雪板
- 雪板
- スキー
- スノーボード

Map to:

```json
{
  "ski_equipment_count": 1
}
```

If ski trip is mentioned but count is unclear, ask:

How many ski bags or snowboards will you bring?

## 10. Date and Time Extraction

Extract:

- exact date
- relative date
- pickup time
- arrival time
- departure time

Examples:

- May 20 at 14:30
- 明天下午2点半
- 2026年6月1日 14:30

If date or time is relative, convert if system date is available.

If not certain, ask confirmation.

Required fields:

```json
{
  "pickup_date": "",
  "pickup_time": ""
}
```

If time is vague:

```text
afternoon
```

Then ask:

Could you please provide the exact pickup or arrival time?

## 11. Flight Number Extraction

Extract flight number from patterns such as:

- JL000
- NH123
- CA169
- MU523
- KE123
- SQ638

If airport pickup is detected and flight number is missing, ask for flight number.

```json
{
  "missing_fields": ["flight_number"]
}
```

## 12. Vehicle Preference Extraction

Detect:

- Alphard
- Vellfire
- HiAce
- Lexus LM550
- Mercedes S400
- Mercedes S500
- Rolls-Royce Ghost
- 阿尔法
- 埃尔法
- 威尔法
- 海狮
- レクサス
- ベンツ
- ロールスロイス

Map to:

```json
{
  "vehicle_type": "Alphard/Vellfire"
}
```

If no vehicle is specified, recommend based on passenger and luggage count.

## 13. Language Preference Extraction

Detect:

- Chinese-speaking driver
- English-speaking driver
- Japanese-speaking driver
- 中文司机
- 英文司机
- 日文司机
- 中国語対応
- 英語対応
- 日本語対応

Map to:

```json
{
  "preferred_language": "Chinese"
}
```

## 14. Contact Method Extraction

Detect:

- WhatsApp number
- email
- LINE
- Telegram, only if used for internal or special handling
- WeChat, not a primary channel for this project
- phone number

If no contact is provided and customer wants booking, ask for preferred contact method.

Do not ask for contact method too early if the customer is only asking general price.

Primary customer contact channels for JTDOS are WhatsApp, Email, and LINE.

## 15. Missing Field Rules

Required missing fields by service type:

### Airport Pickup

Required:

- arrival_airport
- pickup_date
- pickup_time
- flight_number
- dropoff_location
- passenger_count
- luggage_count
- preferred_language
- customer_contact, only before final booking

### Airport Drop-off

Required:

- pickup_location
- departure_airport
- pickup_date
- pickup_time
- passenger_count
- luggage_count
- preferred_language
- customer_contact, only before final booking

### Point-to-Point

Required:

- pickup_location
- dropoff_location
- pickup_date
- pickup_time
- passenger_count
- luggage_count
- preferred_language
- customer_contact, only before final booking

### Charter

Required:

- region
- pickup_date
- pickup_time
- pickup_location
- charter_hours_per_day
- itinerary_text
- passenger_count
- preferred_language
- customer_contact, only before final booking

### Multi-Day Charter

Required:

- region
- start_date
- end_date
- charter_days
- pickup_location
- itinerary_text
- passenger_count
- preferred_language
- customer_contact, only before final booking

## 16. Question Asking Rule

Ask no more than 3 missing questions at once.

Priority:

1. Date and time
2. Pickup and drop-off location
3. Passenger and luggage count
4. Flight number for airport pickup
5. Vehicle or language preference
6. Contact method before final booking

Example:

Sure, I can help arrange this airport pickup. May I confirm your arrival date, arrival time, and flight number?

## 17. Draft Order Output Example

Input:

```text
我们4个人明天下午到羽田，去新宿，4个箱子，需要中文司机
```

Output:

```json
{
  "source": "ai_agent",
  "service_type": "airport_pickup",
  "region": "Tokyo",
  "arrival_airport": "HND",
  "dropoff_location": "Shinjuku, Tokyo",
  "pickup_date": "",
  "pickup_time": "",
  "flight_number": "",
  "passenger_count": 4,
  "luggage_count": 4,
  "ski_equipment_count": 0,
  "child_seat_required": false,
  "child_seat_count": 0,
  "preferred_language": "Chinese",
  "vehicle_type": "Alphard/Vellfire",
  "order_status": "draft",
  "missing_fields": [
    "pickup_date",
    "pickup_time",
    "flight_number"
  ]
}
```

AI follow-up:

可以安排。您这单适合 Alphard / Vellfire。请再确认一下：到达日期、具体到达时间、航班号是多少？

## 18. Alpha 0.1 Principle

The extraction system does not need to be perfect.

It must reliably handle common transportation inquiries and create usable draft orders for operator review.
