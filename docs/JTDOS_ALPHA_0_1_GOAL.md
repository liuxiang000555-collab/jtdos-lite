# JTDOS ALPHA 0.1 GOAL

## 1. Highest Goal

Continuously turn JTDOS Alpha 0.1 into a real demo-ready, deployable, sales-verifiable AI Japan Travel Sales Assistant.

JTDOS is not an internal dispatch system and not a normal order form.

JTDOS is customer-facing for:

- Travelers
- Travel agencies
- Overseas agents
- Potential Pro / Private buyers

When a customer opens `/ai-booking`, they should feel they are talking to a warm AI sales consultant who understands Japan tourism transportation.

## 2. Dual Role Loop

You must work in two roles at the same time.

### 2.1 Actor

As the actor, actively improve code, pages, copy, tests, and documentation.

Actor responsibilities:

- Optimize `/ai-booking` customer experience
- Understand customer travel needs naturally
- Convert natural language into quote-ready and booking-ready data
- Detect service type: airport pickup, airport drop-off, point-to-point transfer, one-day charter, multi-day charter
- Detect region: Tokyo, Osaka / Kansai, Hokkaido
- Detect airports: HND, NRT, KIX, CTS
- Detect destinations, passenger count, luggage, ski equipment, child seats, and language requirements
- Recommend Alphard / Vellfire or HiAce
- Use the real Tokyo, Osaka, and Hokkaido JSON price tables for quote generation
- Create a booking request when customer-facing information is sufficient
- Send the backend flow to mock JTDSS when appropriate
- Keep customer-facing pages in tourism sales language only
- Fix real user inputs that fail recognition
- Add tests for every fix

### 2.2 Critic

As the critic, review every output against the goal.

Continue iterating if:

- `/ai-booking` still feels like an internal order system
- Customer-facing UI exposes JTDSS, webhook, extract-order, raw JSON, debug, or send to JTDSS
- The AI repeats questions for information the customer already gave
- The AI forces the customer to fill a form instead of guiding naturally
- Chinese, English, or Spanish common inputs fail recognition
- Vague needs are not guided warmly
- Standard routes cannot be quoted
- Unknown routes do not go to operator review
- Real business rules are not followed
- The current change has no test coverage

If any item is not good enough, do not stop. Fix and verify.

## 3. Customer Experience Standard

Customers can naturally enter:

### Chinese

```text
我们想去东京，请问接机多少钱？
羽田机场到新宿酒店，2个人，4个行李，12月24号。
```

```text
我想去北海道，接送机多少钱？
新千岁机场到二世谷，4个人，4个箱子，还有滑雪板。
```

### English

```text
We are 4 people arriving at Haneda Airport and going to Shinjuku with 4 suitcases.
```

```text
How much is a transfer from Kansai Airport to Kyoto?
```

```text
We are going from New Chitose Airport to Niseko with ski bags.
```

### Spanish

```text
Llegamos al aeropuerto de Haneda y vamos a Shinjuku. Somos 2 personas con 4 maletas.
```

```text
¿Cuánto cuesta un traslado desde el aeropuerto de Kansai a Kioto?
```

```text
Vamos de New Chitose a Niseko con equipaje de esquí.
```

## 4. Required Understanding

### 4.1 Regions

- Tokyo
- Osaka / Kansai
- Hokkaido

### 4.2 Airports

- HND / Haneda / 羽田 / 羽田空港 / 羽田机场
- NRT / Narita / 成田 / 成田空港 / 成田机场
- KIX / Kansai Airport / Kansai International Airport / 関西空港 / 关西机场
- CTS / New Chitose / 新千岁 / 新千歳 / 新千歳空港

### 4.3 Destinations

Tokyo:

- Tokyo 23 Wards
- Shinjuku
- Shibuya
- Ginza
- Ueno
- Ikebukuro
- Roppongi
- Akasaka
- Yokohama
- Disney / Maihama
- Fuji / Kawaguchiko
- Hakone
- Nikko
- Kamakura

Osaka / Kansai:

- Osaka City
- Umeda
- Namba
- Shinsaibashi
- Dotonbori
- Kyoto
- Nara
- Kobe
- USJ
- Wakayama
- Shirahama

Hokkaido:

- Sapporo
- Niseko
- Otaru
- Furano
- Biei
- Asahikawa
- Lake Toya
- Noboribetsu
- Rusutsu
- Hoshino / Tomamu
- Kiroro
- Hakodate

### 4.4 Passengers and Luggage

Understand examples including:

- 2个人
- 4人
- 2个大人1个孩子
- 4 suitcases
- 4 luggage
- 4 maletas
- 4 maletas grandes
- 4个大箱
- 4件行李
- 滑雪板
- 雪具
- ski bags
- snowboard
- equipaje de esquí

### 4.5 Vehicle Recommendation

- 1–4 passengers with normal luggage: recommend Alphard / Vellfire
- 5–9 passengers or large luggage: recommend HiAce
- Ski equipment: prioritize HiAce
- 4 passengers + 4 large suitcases + ski/snowboard equipment: HiAce is required
- If luggage space is uncertain, explain that vehicle space needs confirmation

## 5. Quote Logic

- Standard route exists in real price table: return `fixed_price`
- Unknown route, luxury vehicle, multi-day charter, complex route, large ski luggage, English-speaking driver, female driver, more than 9 passengers, or multiple vehicles: return `operator_review_required`
- Flight number is not required for quote generation
- Service time is not a hard blocker for quote generation
- If service time is missing, provide daytime base price and explain that 21:00–07:00 night service adds 20%
- JPY is the main customer-facing price
- USD is reference only
- CNY must not be shown to customers
- Standard airport transfer / point-to-point price includes Driver, Vehicle, Fuel, Highway toll, Parking fee

## 6. Booking Request Logic

- Show "Submit Booking Request" only when customer-facing information is sufficient
- Booking request is not final confirmation
- `fixed_price` does not mean a driver has accepted the order
- Customer-facing UI should say "submitted to Japan operations team for confirmation"
- Backend may automatically enter mock JTDSS
- Customer-facing UI must never show JTDSS, webhook, raw JSON, extract-order, or send to JTDSS

## 7. Sales Conversation Standard

The AI must sound like a real travel sales consultant.

Wrong style:

```text
已生成订单草稿。缺失字段：用车日期、接送时间、航班号。
```

Correct style:

```text
我已经大概理解您的需求了。为了帮您给出更准确的价格，还需要确认几个信息：用车日期、目的地、人数和行李数量。如果只是先估价，没有航班号也可以。
```

Vague Hokkaido inquiry example:

Customer:

```text
我想去北海道，接送机多少钱？
```

AI should reply like:

```text
可以的。北海道接送机价格主要取决于机场、目的地、人数、行李和季节。
如果是新千岁机场到札幌市区，价格会比较低；如果到二世谷、富良野、洞爷湖、星野、登别等地区，价格会更高。
为了帮您估算价格，请先告诉我：

1. 您是从新千岁机场出发吗？
2. 目的地是哪里？
3. 几位客人、几个大行李？
```

Do not say:

```text
已生成订单草稿。
```

## 8. Page Rules

The `/ai-booking` customer frontend must hide:

- JTDSS
- webhook
- extract-order
- raw JSON
- debug
- send to JTDSS
- internal API
- backend order status

The customer frontend may show:

- AI Japan Travel Assistant
- Estimate price
- Continue information
- Submit booking request
- Your request summary
- Recommended vehicle
- Estimated price
- Whether Japan operations team review is needed

Internal debug information may be shown only when `?debug=1`.

## 9. Real Business Rules

Must follow:

- Night time: 21:00–07:00
- Night surcharge: +20%
- Peak season booking at least 25 days early: use `normal_price`; night still +20%
- Peak season booking less than 25 days early: use `peak_price`; night still +20%
- Standard airport pickup waiting: 90 minutes
- Peak season airport pickup waiting: 60 minutes
- Airport drop-off / city pickup waiting: 30 minutes
- Extra waiting fee: JPY 3,000 / 30 minutes
- Signage / placard: JPY 2,000
- Child seat: JPY 1,000 / seat
- Standard airport transfer includes Driver, Vehicle, Fuel, Highway toll, Parking fee
- 20% deposit through PayPal
- Free cancellation 7 days or more before service date
- Cancellation within 7 days: 10% of total order amount
- Booking request is not final confirmation
- `fixed_price` only means price does not require manual confirmation; it does not mean driver assignment is confirmed

## 10. Continuous Improvement Workflow

Every round must read:

1. `docs/JTDOS_ALPHA_0_1_GOAL.md`
2. `docs/TASK_QUEUE.md`
3. `docs/DO_NOT_TOUCH.md`
4. `agent/system_prompt.md`
5. `docs/REAL_BUSINESS_RULES_V1.md`
6. `docs/REAL_PRICING_AND_CHARTER_RULES_V1.md`
7. `tests/ai_booking_e2e_alpha_0_1.test.js`
8. `tests/quote_matrix_alpha_0_1.test.js`
9. `tests/staging_smoke_alpha_0_1.test.js`

### Step 1: Critic Review

Do not rush into code. First identify the highest-priority current issue.

### Step 2: Actor Fix

Fix at most 1–3 highest-priority issues per round.

### Step 3: Add Tests

- Chinese recognition fix: add Chinese test
- English recognition fix: add English test
- Spanish recognition fix: add Spanish test
- UI fix: add customer frontend internal-word exposure test
- Quote fix: add quote matrix test

### Step 4: Run Required Tests

```bash
node tests/ai_booking_e2e_alpha_0_1.test.js
node tests/quote_matrix_alpha_0_1.test.js
node tests/staging_smoke_alpha_0_1.test.js
```

If the change affects early booking rules, also run:

```bash
node tests/early_booking_rule.test.js
```

### Step 5: Failure Policy

If tests fail:

- Explain the failure
- Fix it
- Rerun tests
- Do not skip tests
- Do not delete tests to pass

### Step 6: Fixed Report Format

Every round must end with:

```text
完成状态：

- 是否完成本轮目标
- 本轮 Critic 发现的问题
- 本轮 Actor 修复的问题
- 修改了哪些文件
- 新增/更新了哪些测试
- 测试通过情况
- /ai-booking 是否更像真实 AI 旅游销售顾问
- 是否需要浏览器强制刷新
- 下一轮最值得优化的地方
```

## 11. Forbidden Without Explicit Approval

Do not:

- Modify real price table JSON
- Delete real price tables
- Modify `.env`, API keys, or tokens
- Hardcode PayPal links
- Expose the JTDSS production connector
- Expose real customer data
- Put Private logic into the public Lite version
- Delete core tests
- Skip tests
- Lower business standards just to pass tests
- Turn customer frontend back into an internal order system
- Show JTDSS / webhook / raw JSON / extract-order on customer pages

## 12. Current Priority

P0:

- P0-001 Frontend de-engineering
- P0-002 Vague request sales guidance
- P0-003 Do not repeat questions
- P0-004 Flight number is not required for quote
- P0-005 Service time is not a hard quote blocker

After P0:

- P1 Sales ability
- P2 Commercial pages
- P3 Deployment and security

## 13. Final Product Standard

JTDOS Alpha 0.1 must become a real demo-ready, deployable, sales-verifiable AI Japan Travel Sales Assistant.

When a customer opens:

```text
http://127.0.0.1:3000/ai-booking
```

They should feel they are talking to a professional, warm AI sales consultant who understands Japan tourism transportation, not filling out an internal dispatch system.
