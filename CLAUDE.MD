# TableFlow — QR Restaurant Ordering SaaS

End-to-end restaurant ordering ecosystem: customer PWA (QR → order → pay → review) + admin system (kitchen display, cashier, owner analytics). Multi-tenant, production-ready, real-time.

---

## ภาษาไทย — หลักการ, Flow และ ขั้นตอนการรัน

### แนวคิดและหลักการของระบบ

TableFlow ถูกออกแบบรอบ **3 หลักการหลัก**:

**1. Zero-friction สำหรับลูกค้า**
ลูกค้าไม่ต้องสมัครสมาชิก ไม่ต้องดาวน์โหลดแอป แค่สแกน QR ที่โต๊ะ ระบบจะรู้ทันทีว่าเป็นโต๊ะไหน และพาเข้าสู่เมนูได้เลย กระบวนการสั่งอาหารทำได้ภายใน 3 ขั้นตอน (เลือก → ยืนยัน → รอ)

**2. Real-time ตลอดทุก touchpoint**
ทุกการกระทำในระบบส่งผ่าน WebSocket (Socket.IO) ทันที — ลูกค้าเห็นสถานะออร์เดอร์แบบสด, ครัวได้รับออร์เดอร์ใหม่ทันที, แคชเชียร์เห็นสถานะโต๊ะเปลี่ยนแปลงแบบ real-time ไม่มีการ refresh หน้า

**3. Multi-tenant SaaS**
ร้านอาหารแต่ละร้านคือ "Tenant" แยกกันโดยสมบูรณ์ ข้อมูลเมนู, โต๊ะ, ออร์เดอร์ และพนักงาน ถูก isolate ด้วย `tenantId` ในทุก query ร้านใหม่เปิดได้โดยสร้าง Tenant row + พนักงาน + โต๊ะ + เมนู

---

### Flow การทำงานของระบบ (ภาพรวม)

```
┌─────────────────────────────────────────────────────────────────┐
│                        ลูกค้า (Customer PWA)                     │
│                                                                   │
│  QR Scan → Landing → เมนู → ตะกร้า → สั่งอาหาร                  │
│              ↓                            ↓                       │
│         เห็นชื่อร้าน              POST /api/public/.../orders    │
│         + เลขโต๊ะ                         ↓                       │
│                                   ติดตามสถานะ (WebSocket)        │
│                                           ↓                       │
│                                   ชำระเงิน PromptPay             │
│                                           ↓                       │
│                                   ให้คะแนนรีวิว                   │
└───────────────────────────┬─────────────────────────────────────┘
                            │ WebSocket Events
            ┌───────────────▼────────────────────┐
            │           NestJS API (port 3001)    │
            │                                     │
            │  REST endpoints + Socket.IO gateway │
            │  JWT auth · RBAC roles · Prisma ORM │
            └───────────────┬────────────────────┘
                            │
            ┌───────────────▼────────────────────┐
            │       PostgreSQL Database           │
            │  Tenant / Table / Order / Payment   │
            └────────────────────────────────────┘
                            │ WebSocket (push)
┌───────────────────────────▼─────────────────────────────────────┐
│                    Admin Dashboard (port 3002)                    │
│                                                                   │
│  ครัว (Kitchen KDS)  │  แคชเชียร์  │  เจ้าของ (Owner)           │
│  • เห็นออร์เดอร์ใหม่  │  • แผนผังโต๊ะ │  • ยอดขายวันนี้            │
│  • กดเปลี่ยนสถานะ    │  • ยืนยันชำระ │  • กราฟแนวโน้ม             │
│    New→Prep→Ready    │  • Staff calls│  • เมนูยอดนิยม             │
└─────────────────────────────────────────────────────────────────┘
```

---

### Flow ฝั่งลูกค้า (Customer Journey)

```
1. สแกน QR ที่โต๊ะ
   └─ URL: /demo-bistro/A1
   └─ ระบบดึงข้อมูลร้านและโต๊ะ แสดง Landing Page

2. กด "เริ่มสั่งอาหาร"
   └─ URL: /demo-bistro/A1/menu
   └─ โหลดเมนูทั้งหมดจาก API (GET /public/{slug}/menu)
   └─ สร้าง sessionCode ใหม่ บันทึกลง localStorage

3. เลือกอาหาร
   └─ กดการ์ด → เปิด Bottom Sheet
   └─ เลือก option (เผ็ด/ท็อปปิ้ง) + จำนวน + หมายเหตุ
   └─ กด "เพิ่มลงตะกร้า" → Zustand cart store อัปเดต

4. ยืนยันออร์เดอร์
   └─ URL: /demo-bistro/A1/cart
   └─ ดูรายการ แก้ไขได้, ใส่หมายเหตุรวม
   └─ กด "ยืนยัน" → POST /public/{slug}/orders
   └─ API สร้าง Order + อัปเดตสถานะโต๊ะเป็น OCCUPIED
   └─ WebSocket emit "order:new" ไปหาครัวและแคชเชียร์

5. ติดตามออร์เดอร์
   └─ URL: /demo-bistro/A1/order/{orderId}
   └─ แสดง Stepper: Received → Confirmed → Preparing → Ready → Served
   └─ รับ WebSocket event "order:updated" อัปเดต UI แบบสด
   └─ มีปุ่ม "เรียกพนักงาน" (ขอน้ำ / ขอบิล / ขอความช่วยเหลือ)

6. ชำระเงิน
   └─ URL: /demo-bistro/A1/payment/{orderId}
   └─ GET /public/{slug}/payments/{orderId} → สร้าง PromptPay QR
   └─ Poll ทุก 3 วิ รอแคชเชียร์กด "ยืนยัน"
   └─ รับ event "payment:confirmed" → redirect ไปหน้า Review

7. ให้คะแนน
   └─ URL: /demo-bistro/A1/review/{orderId}
   └─ เลือก emoji + ดาว 1-5 + ความคิดเห็น
   └─ POST /public/{slug}/reviews/{orderId}
   └─ ถ้า rating ≥ 4 → redirect ไป Google Maps (ให้รีวิวต่อ)
```

---

### Flow ฝั่งครัว (Kitchen Display System)

```
1. เข้าสู่ระบบ → /login (email: kitchen@demo.com / password123)
2. ไปที่ /kitchen
3. WebSocket connect → emit "join:restaurant" เข้า room ของร้าน
4. รับ event "order:new" → การ์ดออร์เดอร์ใหม่โผล่ขึ้น (สีแดง + ping)
5. กด "Accept" → PATCH /admin/orders/{id}/status { status: "CONFIRMED" }
6. กด "Start Cooking" → status เปลี่ยนเป็น PREPARING (สีเหลือง)
7. กด "Mark Ready" → status เปลี่ยนเป็น READY (สีเขียว)
   └─ WebSocket แจ้งแคชเชียร์และลูกค้าทันที
```

---

### Flow ฝั่งแคชเชียร์ (Cashier)

```
1. เข้าสู่ระบบ → /login (email: cashier@demo.com / password123)
2. ไปที่ /cashier
3. เห็น Table Grid แสดงสถานะโต๊ะทุกโต๊ะแบบ real-time
   └─ สีเขียว = ว่าง, ส้ม = มีลูกค้า, แดง = รอชำระเงิน
4. รับ alert "Staff Call" เมื่อลูกค้ากดเรียกพนักงาน
5. คลิกโต๊ะ → เปิด Side Panel แสดงรายการอาหารและยอดรวม
6. กด "Confirm Payment" → POST /admin/payments/{orderId}/confirm
   └─ API อัปเดตสถานะโต๊ะเป็น AVAILABLE
   └─ WebSocket แจ้งลูกค้า → redirect ไปหน้า Review
```

---

### Flow ฝั่งเจ้าของ (Owner Dashboard)

```
1. เข้าสู่ระบบ → /login (email: owner@demo.com / password123)
2. Dashboard (/) → KPI วันนี้: ยอดขาย, จำนวนออร์เดอร์, โต๊ะ active, ออร์เดอร์รอ
3. Analytics (/analytics) → กราฟยอดขาย 7/14/30 วัน, เมนูขายดี, Revenue Pie Chart
4. Menu (/menu) → เพิ่ม/แก้ไข/ลบเมนู, toggle เปิด-ปิดรายการ
5. Tables (/tables) → จัดการสถานะโต๊ะ, เพิ่มโต๊ะใหม่
6. Staff (/staff) → จัดการพนักงาน, กำหนด role
```

---

### ขั้นตอนการรันระบบ (Step-by-step)

> **ความต้องการ:** Node.js ≥ 20, pnpm ≥ 9, Docker Desktop

#### Step 1 — ติดตั้ง Dependencies

```bash
# ติดตั้ง pnpm ก่อน (ถ้ายังไม่มี)
npm install -g pnpm@9

# ติดตั้ง dependencies ทุก workspace
pnpm install
```

#### Step 2 — เริ่ม Database (ต้องมี Docker)

```bash
# รัน PostgreSQL + Redis ใน background
docker-compose up postgres redis -d

# รอ ~10 วิ แล้วตรวจสอบว่า healthy
docker-compose ps
```

#### Step 3 — ตั้งค่า Environment Variables

```bash
# Windows (PowerShell)
Copy-Item apps\api\.env.example apps\api\.env

# Mac/Linux
cp apps/api/.env.example apps/api/.env
```

ไฟล์ `apps/api/.env` มีค่า default ที่ใช้กับ Docker ได้เลย ไม่ต้องแก้ไขอะไร

#### Step 4 — สร้าง Database Schema + ข้อมูลตัวอย่าง

```bash
# สร้าง Prisma client จาก schema
pnpm db:generate

# รัน migration (สร้าง tables ทั้งหมด)
pnpm db:migrate:dev

# เติมข้อมูลตัวอย่าง (ร้าน demo-bistro + เมนู + โต๊ะ + พนักงาน)
pnpm db:seed
```

> ถ้าต้องการดู database ด้วย GUI: `pnpm db:studio` → เปิดที่ http://localhost:5555

#### Step 5 — รันระบบทั้งหมดพร้อมกัน

```bash
pnpm install

pnpm dev
```

Turborepo จะรัน 3 services พร้อมกัน:
- `apps/api` → http://localhost:3001
- `apps/customer` → http://localhost:3000
- `apps/admin` → http://localhost:3002

#### Step 6 — ทดสอบระบบ

| บทบาท | URL | ข้อมูล login |
|---|---|---|
| ลูกค้า (สแกน QR) | http://localhost:3000/demo-bistro/A1 | ไม่ต้อง login |
| เจ้าของร้าน | http://localhost:3002 | owner@demo.com / password123 |
| ครัว | http://localhost:3002 | kitchen@demo.com / password123 |
| แคชเชียร์ | http://localhost:3002 | cashier@demo.com / password123 |

**ทดสอบ flow เต็ม:**
1. เปิด http://localhost:3000/demo-bistro/A1 บนมือถือ (หรือ DevTools mobile view)
2. เปิด http://localhost:3002 แล้วล็อกอินเป็น kitchen@demo.com
3. สั่งอาหารจากฝั่งลูกค้า → ดูออร์เดอร์โผล่ในหน้าครัวแบบ real-time

#### คำสั่งอื่นที่มีประโยชน์

```bash
# รัน docker ทั้งหมด (รวม app) แทน pnpm dev
docker-compose up

# รีเซ็ต database และ seed ใหม่
pnpm db:migrate:dev --name reset
pnpm db:seed

# Build เพื่อ production
pnpm build

# ตรวจ TypeScript errors
pnpm type-check
```

---

## Architecture

```
tableflow/
├── apps/
│   ├── api/          NestJS REST API + WebSocket (port 3001)
│   ├── customer/     Next.js PWA — customer-facing mobile app (port 3000)
│   └── admin/        Next.js dashboard — kitchen, cashier, owner (port 3002)
├── packages/
│   ├── database/     Prisma schema + client + seed
│   └── types/        Shared TypeScript types + WebSocket event constants
├── docker-compose.yml  Local dev (postgres + redis + all apps)
└── turbo.json
```

**Stack:** pnpm workspaces + Turborepo · Next.js 14 App Router · NestJS 10 · PostgreSQL 16 + Prisma 5 · Socket.IO · JWT RBAC · Tailwind CSS · Zustand · Recharts

---

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start Postgres + Redis
docker-compose up postgres redis -d

# 3. Copy env files
cp apps/api/.env.example apps/api/.env
cp apps/customer/.env.example apps/customer/.env     # optional
cp apps/admin/.env.example apps/admin/.env           # optional

# 4. Run DB migrations + seed
pnpm db:migrate:dev
pnpm db:seed

# 5. Start everything
pnpm dev

# Or with Docker (all services)
docker-compose up
```

| Service   | URL                                   |
|-----------|---------------------------------------|
| Customer  | http://localhost:3000/demo-bistro/A1  |
| Admin     | http://localhost:3002                 |
| API       | http://localhost:3001/api             |
| DB Studio | `pnpm db:studio`                      |

**Demo credentials:**
- Owner: `owner@demo.com` / `password123`
- Kitchen: `kitchen@demo.com` / `password123`
- Cashier: `cashier@demo.com` / `password123`

---

## Customer Flow (QR → Pay)

```
QR Scan  →  /{tenant}/{table}  (Landing)
             ↓
         /{tenant}/{table}/menu  (Browse + add to cart)
             ↓
         /{tenant}/{table}/cart  (Review + place order)
             ↓
         /{tenant}/{table}/order/{orderId}  (Live tracking)
             ↓
         /{tenant}/{table}/payment/{orderId}  (PromptPay QR)
             ↓
         /{tenant}/{table}/review/{orderId}  (Rating → Google Maps if ≥4★)
```

State: Zustand cart store persisted to localStorage (key: `tableflow-cart`). Session code generated once per table visit.

---

## Admin System

| Route            | Role access                | Purpose                          |
|------------------|---------------------------|----------------------------------|
| /login           | All                       | Email or PIN login               |
| /                | OWNER, ADMIN              | KPI dashboard + sales charts     |
| /kitchen         | OWNER, ADMIN, KITCHEN     | Real-time KDS order cards        |
| /cashier         | OWNER, ADMIN, CASHIER     | Table map + order panel + pay    |
| /menu            | OWNER, ADMIN              | CRUD menu items + availability   |
| /tables          | OWNER, ADMIN, CASHIER     | Table status management          |
| /staff           | OWNER, ADMIN              | Staff CRUD + role assignment     |
| /analytics       | OWNER, ADMIN              | Sales trend + popular items      |

---

## API Reference

### Public (no auth — customer-facing)

| Method | Endpoint                                          | Description          |
|--------|---------------------------------------------------|----------------------|
| GET    | /api/public/:slug/menu                            | Full menu + tenant   |
| GET    | /api/public/:slug/tables/:code                    | Table info           |
| POST   | /api/public/:slug/orders                          | Place order          |
| GET    | /api/public/:slug/orders/:id                      | Order status         |
| POST   | /api/public/:slug/orders/:id/staff-call           | Call staff           |
| GET    | /api/public/:slug/payments/:orderId               | Get/create payment   |
| POST   | /api/public/:slug/reviews/:orderId                | Submit review        |

### Admin (JWT Bearer token required)

| Method | Endpoint                              | Roles                     |
|--------|---------------------------------------|---------------------------|
| POST   | /api/auth/login                       | —                         |
| POST   | /api/auth/login/pin                   | —                         |
| GET    | /api/auth/me                          | Any                       |
| GET    | /api/admin/orders                     | All staff                 |
| PATCH  | /api/admin/orders/:id/status          | All staff                 |
| PATCH  | /api/admin/orders/:id/items/:id/status| OWNER, ADMIN, KITCHEN     |
| GET    | /api/admin/tables                     | All staff                 |
| PATCH  | /api/admin/tables/:id/status          | OWNER, ADMIN, CASHIER     |
| PATCH  | /api/admin/tables/:id/clear           | OWNER, ADMIN, CASHIER     |
| GET    | /api/admin/menu/categories            | OWNER, ADMIN              |
| POST   | /api/admin/menu/categories            | OWNER, ADMIN              |
| GET    | /api/admin/menu/items                 | OWNER, ADMIN, KITCHEN     |
| POST   | /api/admin/menu/items                 | OWNER, ADMIN              |
| PATCH  | /api/admin/menu/items/:id             | OWNER, ADMIN              |
| PATCH  | /api/admin/menu/items/:id/toggle-availability | OWNER, ADMIN, KITCHEN |
| POST   | /api/admin/payments/:orderId/confirm  | OWNER, ADMIN, CASHIER     |
| GET    | /api/admin/analytics/summary          | OWNER, ADMIN              |
| GET    | /api/admin/analytics/sales            | OWNER, ADMIN              |
| GET    | /api/admin/analytics/popular-items    | OWNER, ADMIN              |

---

## WebSocket Events

Socket.IO, namespace `/`.

### Joining rooms

```js
// Admin staff — joins restaurant room (all order/table events)
socket.emit('join:restaurant', { tenantId })

// Customer — joins table room (their order tracking)
socket.emit('join:table', { tenantId, tableId })
```

### Server → Client events

| Event                | Room       | Payload                                      |
|----------------------|------------|----------------------------------------------|
| `order:new`          | restaurant | `{ order: OrderDto, tenantId }`              |
| `order:updated`      | restaurant + table | `{ orderId, status, tenantId }`    |
| `table:updated`      | restaurant | `{ tableId, code, status, tenantId }`        |
| `staff:call`         | restaurant | `{ callId, orderId, tableCode, type, ... }`  |
| `payment:requested`  | restaurant | `{ orderId, tableCode, amount, tenantId }`   |
| `payment:confirmed`  | restaurant + table | `{ orderId, tenantId }`            |

---

## Database Schema (key models)

```
Tenant          — SaaS tenant (restaurant)
  └─ User       — Staff with role (OWNER/ADMIN/CASHIER/KITCHEN)
  └─ Table      — Physical tables with zone + status
  └─ Category   — Menu categories with sort order
  └─ MenuItem   — Menu items with options
     └─ OptionGroup  — e.g. "Spice Level", "Toppings"
        └─ Option    — individual option with price adjustment
  └─ Order      — Per-table session order
     └─ OrderItem    — Line item with quantity + selected options
     └─ Payment      — Payment record (PromptPay/Cash/etc)
     └─ Review       — Customer review (1-5 stars)
     └─ StaffCall    — Assistance/water/payment calls
```

All tenant data is isolated by `tenantId`. The seed creates `demo-bistro` with 10 tables and a full Thai menu.

---

## Environment Variables

### apps/api
```
DATABASE_URL        postgresql://...
REDIS_URL           redis://...
JWT_SECRET          min 32 chars random string
JWT_EXPIRES_IN      7d
PORT                3001
CORS_ORIGINS        http://localhost:3000,http://localhost:3002
```

### apps/customer / apps/admin
```
NEXT_PUBLIC_API_URL   http://localhost:3001
NEXT_PUBLIC_WS_URL    http://localhost:3001
```

---

## Multi-tenant SaaS

Every resource is scoped to a `tenantId`. The customer URL encodes `tenantSlug` (`/{slug}/{tableCode}`). Staff log in with `{ tenantSlug, email, password }`. JWT payload carries `{ sub, tenantId, role }` — all admin API handlers enforce tenant ownership before operating on data.

To onboard a new restaurant:
1. Create a `Tenant` row
2. Create staff `User` rows with hashed passwords
3. Create `Table` rows
4. Create `Category` + `MenuItem` rows (or use admin UI)

---

## Design System

| Token           | Value                          |
|-----------------|-------------------------------|
| Primary         | `#F97316` (orange-500)        |
| Background      | `#FFFFFF`                     |
| Surface         | `#FFF7ED` (orange-50)         |
| Text primary    | `#1C1917` (stone-900)         |
| Text muted      | `#78716C` (stone-500)         |
| Border          | `#E7E5E4` (stone-200)         |
| Success         | `#22C55E` (green-500)         |
| Admin sidebar   | `#111827` (gray-900)          |
| Border radius   | 12–24px                       |
| Shadow          | soft multi-layer               |
| Typography      | Inter (Latin) + Prompt/Sarabun (Thai) |
| Grid            | 8pt spacing system             |

---

## Production Deployment

1. Build all images: `docker-compose -f docker-compose.prod.yml build`
2. Deploy Postgres to managed DB (AWS RDS / Supabase / PlanetScale)
3. Deploy API to AWS ECS / Railway / Render
4. Deploy customer + admin to Vercel (set env vars)
5. Configure load balancer + SSL
6. Set `CORS_ORIGINS` to production domains
7. Run `pnpm db:migrate:deploy` against prod DB

Horizontal scaling: API is stateless. Socket.IO requires sticky sessions or Redis adapter for multi-instance.



เปลี่ยนแค่ reference_id เป็น order ใหม่:


curl -X POST http://localhost:3001/api/webhooks/xendit \
  -H "Content-Type: application/json" \
  -d '{
    "event": "qr.payment",
    "business_id": "test",
    "created": "2026-05-07T00:00:00Z",
    "data": {
      "id": "qr_test_123",
      "reference_id": "cmovnko120005a6qfhu1h6wz2",
      "status": "SUCCEEDED",
      "currency": "THB",
      "amount": 100,
      "qr_string": "test",
      "channel_code": "PROMPTPAY"
    }
  }'
