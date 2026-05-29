# JTDOS TASK QUEUE

## P0 - 必须优先完成

### P0-001 前台去工程化
目标：
客户页面不能出现 JTDSS、webhook、extract-order、raw JSON、debug、send to JTDSS。

验收：
/ai-booking 前台只显示客户能理解的旅游销售语言。

### P0-002 模糊需求销售引导
目标：
客户输入“我想去北海道，接送机多少钱？”时，AI 不应要求立刻填完整订单，而应自然解释价格影响因素，并询问目的地、人数、行李、日期。

验收：
AI 像销售顾问，不像表单机器人。

### P0-003 不重复追问
目标：
客户已经说了机场、目的地、人数、行李时，AI 不再重复问这些字段。

验收：
测试中文、英文、西班牙语各 3 条。

### P0-004 航班号不是估价必填
目标：
估价阶段不要因为缺航班号就无法报价。
航班号只在提交预约请求前提醒补充。

验收：
“HND to Shinjuku, 2 people, 4 luggage” 可以估价。

### P0-005 时间不是估价硬门槛
目标：
客户没给具体时间时，可以给白天基础价，并提示夜间 21:00–07:00 加 20%。

验收：
无时间输入也能给估价说明。

## P1 - 提升销售能力

### P1-001 北海道销售话术
目标：
客户问北海道时，AI 主动区分札幌、二世谷、富良野、洞爷湖、登别、星野、留寿都、Kiroro、函馆等目的地。

### P1-002 东京销售话术
目标：
客户问东京接机时，AI 能解释羽田、成田、东京23区、横滨、迪士尼、富士、箱根、镰仓、日光的差异。

### P1-003 大阪销售话术
目标：
客户问大阪/关西时，AI 能解释 KIX、Osaka City、Kyoto、Nara、Kobe、USJ、Wakayama、Shirahama 的差异。

### P1-004 车型推荐更像真人
目标：
AI 不只说 Alphard/HiAce，而要解释为什么推荐这个车。

### P1-005 滑雪行李识别
目标：
中文“雪板/滑雪板/雪具”、英文 ski bag/snowboard、Spanish esquí/snowboard 都能识别。

## P2 - 商业化页面

### P2-001 Landing Page
目标：
首页展示 JTDOS 是 AI Japan Travel Sales Assistant，不是普通派单系统。

### P2-002 Pricing Page
目标：
清楚展示 Lite / Pro / Private。

### P2-003 Contact Lead Form
目标：
收集潜在客户 Name / Company / Country / Email / WhatsApp / LINE / Interested Plan / Message。

### P2-004 GitHub Lite README
目标：
公开仓库说明 Lite 版只用于演示，Pro / Private 需要联系。

## P3 - 部署和安全

### P3-001 Vercel Lite Release
目标：
Lite 版本可以部署到 Vercel。

### P3-002 不泄露私有数据
目标：
Lite 版不包含真实价格表、真实 JTDSS API、真实 PayPal、真实内部规则。

### P3-003 Demo 数据隔离
目标：
mock 数据与 private 数据清晰分离。
