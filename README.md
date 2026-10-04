# ShopSahayak (షాప్‌సహాయక్ / शॉपसहायक)
## Production-Quality AI Business Assistant for Local Retail Stores

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Design System](https://img.shields.io/badge/Design%20System-Bharat%20Mercantile%20Precision-0f172a.svg)](#design-philosophy)
[![Languages](https://img.shields.io/badge/Languages-English%20%7C%20Telugu%20%7C%20Hindi-2563eb.svg)](#multilingual-code-mixed-engine)

Built for the official Hackathon Problem Statement:  
> **"AI Business Assistant for Local Retail Stores"**  
> *"Instead of learning complicated business software, a shop owner can simply ask their business assistant what is happening and what needs attention."*

---

## 📸 Screenshots & Visual Walkthrough

### 1. Store Executive Dashboard
*Real-time KPIs, interactive 7D/30D/3M SVG Revenue chart, stacked Inventory Health progress bar, and AI Business Insights.*
![ShopSahayak Dashboard](docs/screenshots/dashboard_view_1790969143162.png)

### 2. AI Command Center with Agentic Execution
*Natural language code-mixed conversation (`"Anna, rice stock entha undi?"`), live tool activity timeline, formula calculations, and one-click purchase orders.*
![AI Assistant Command Center](docs/screenshots/ai_agentic_tool_execution_1790969212107.png)

### 3. Customer Khata (Credit Ledger) Profile Drawer
*Customer purchase history, outstanding Udhar balances, order frequency, and predictive AI purchase pattern insights.*
![Customer Khata Drawer](docs/screenshots/customer_khata_drawer_1790969334165.png)

---

## 🌟 Core Features

- **Store & Profile Management:** Configured for local Indian retail (Sharma Kirana Store, GSTIN, Address, UPI ID, Opening hours).
- **Product Catalogue Management:** Complete SKU codes, categories (*Grains, Flours, Oils, Dal, Dairy, Spices, Home Care*), wholesale buy prices, retail sell prices, and quick Add Product modal.
- **Inventory & Stock Tracking:** Real-time stock counts, safety minimums, daily sales velocity (e.g. `9.3 kg/day`), and instant AI Restock Recommendations.
- **AI Business Command Center:** Autonomous agentic tool execution timeline showing step-by-step progress (*Checking inventory... ✓*, *Analyzing sales... ✓*, *Calculating demand... ✓*, *Generating PO... ✓*).
- **Voice AI (LiveKit Integration Ready):** Interactive voice mode with central microphone button, audio waveform visualizer, states (*Tap to speak*, *Listening...*, *Understanding...*, *Responding...*), and audio interrupt.
- **Beyond Presence Avatar Panel:** Professional, calm retail business assistant avatar with speaking glow animation and synchronized speech captions.
- **Multilingual & Code-Mixed Speech:** Global language switcher supporting **English**, **Telugu (తెలుగు)**, and **Hindi (हिंदी)**, with automated detection of mixed dialects (e.g., *"Anna, rice stock entha undi?"*).
- **Sales & Transaction Management:** Daily transactions ledger, payment mode breakdown (*UPI PhonePe/GPay, Cash, Khata*), and POS quick billing modal.
- **Customer Information & Khata:** Track regular customers, ledger balances, lifetime spend, and automated WhatsApp reminder hooks.
- **Supplier & Distributor Management:** Supplier directories (*ABC Distributors, Balaji Trading Co, Sri Lakshmi Wholesalers, Amul Co-op Depot*), pending purchase orders, and direct reorder triggers.
- **Analytics & Executive Reports:** 6 specialized analytics modules, daily/weekly AI business summaries, and 1-click **Export to CSV, Excel, and Printable PDF**.
- **Role-Based Access Control (RBAC):** Switchable permission matrix (*Owner, Manager, Staff, Viewer*) protecting sensitive financial metrics and settings.
- **Security UX:** 2-step verification dialog for high-impact financial actions (*"Create purchase order for ₹5,400?"*).

---

## 🎯 The 13-Step Hackathon Demo Flow (Built-in)

An interactive walkthrough banner at the top of the interface allows evaluators to execute or auto-play the complete 13-step demonstration:

1. **Owner logs in:** Ravi Sharma (Owner) session activates.
2. **Dashboard overview:** Displays revenue (₹18,450), orders (47), estimated profit (₹2,723 • 14.8%), and low stock (7).
3. **AI insight triggers:** Flags *"7 products are below minimum stock level. Rice demand increased +21%"*.
4. **Owner opens AI Assistant:** Launches the dedicated ShopSahayak Command Center.
5. **Owner speaks via Voice:** Asks: *"Anna, rice stock entha undi?"*.
6. **LiveKit handles stream:** Voice waveform animates, language detected as *"Telugu + English"*.
7. **AI responds:** *"You currently have 18 kg of rice. Current stock may run low in 48 hours."*
8. **Agentic tool execution:** Visual execution timeline checks inventory, audits 30-day velocity (9.3 kg/day), and projects stockout.
9. **Recommendation generated:** Recommends ordering 100 kg from ABC Distributors for ₹5,400.
10. **Owner approves order:** Approves order via 2-step security confirmation dialog.
11. **Order confirmed:** Purchase order PO-8831 transmitted to ABC Distributors.
12. **Inventory updates live:** Rice stock automatically increases from 18 kg to 118 kg across the store.
13. **Updated business insights:** Low stock alert count drops from 7 to 6, rice status becomes Healthy, and updated executive report is compiled.

---

## 💻 Tech Stack & Architecture

- **Backend Architecture:** Node.js, Express, MongoDB Atlas Mongoose ORM, Sharp image optimization.
- **Frontend Architecture:** Modular Vanilla JavaScript MVC, Pub/Sub reactive store state, WebRTC Camera & Face Detection.
- **AI Models & Vision OCR:** Google Gemini 2.5 Flash & 3.8 Flash Vision APIs for South Asian curved handwriting scripts (Telugu, Hindi, English).
- **Styling:** Custom Vanilla CSS Design System (**Bharat Mercantile Precision**) adhering to modern B2B SaaS principles.
- **Audio & Voice:** Natasha AI Voice Assistant powered by Gemini NLP and Web Speech API.
- **Cloud & Deployment:** Render Blueprint (`render.yaml`), Docker containerization (`Dockerfile`).

---

## 📁 Clean Project Architecture

```
ShopSahayak/
├── 📁 config/                 # Database connection & MongoDB Atlas cluster pool
│   └── db.js                  # Resilient Atlas connector with auto-seeding
├── 📁 controllers/            # Express Business Logic Controllers
│   ├── aiController.js        # Natasha AI retail reasoning & inventory copilot
│   ├── authController.js      # Biometric face verification & auth tokens
│   ├── customerController.js  # Customer khata balances & ledger persistence
│   ├── notificationController.js
│   ├── ocrController.js       # Multilingual handwriting processing
│   ├── productController.js   # Stock inventory & catalogue CRUD
│   ├── salesController.js     # POS billing & sale transactions
│   ├── storeController.js     # Store profile, GSTIN & business settings
│   ├── supplierController.js  # Supplier network & PO generation
│   ├── voiceController.js     # Natasha Voice Session handling
│   └── whatsappController.js # WATI WhatsApp billing dispatch
├── 📁 models/                 # Mongoose Data Models & MongoDB Schemas
│   ├── Customer.js            # Customer accounts & khata balances
│   ├── Product.js             # SKUs, stock levels & pricing
│   ├── Transaction.js         # POS sales transactions & payment modes
│   ├── PurchaseOrder.js       # Supplier restock orders
│   ├── Supplier.js            # Wholesale distributor accounts
│   ├── User.js                # Store owner/staff credentials & face data
│   ├── Notification.js        # Real-time retail alerts
│   ├── Message.js             # AI chat conversation logs
│   ├── OcrScan.js             # Vision OCR scan history & results
│   ├── StoreProfile.js        # Store branding, GSTIN, UPI details
│   └── VoiceSession.js        # Natasha Voice agent interaction state
├── 📁 routes/                 # Express API Endpoint Routers
│   ├── aiRoutes.js            # /api/ai
│   ├── authRoutes.js          # /api/auth
│   ├── customerRoutes.js      # /api/customers
│   ├── notificationRoutes.js  # /api/notifications
│   ├── ocrRoutes.js           # /api/ocr
│   ├── productRoutes.js       # /api/products
│   ├── salesRoutes.js         # /api/sales
│   ├── storeRoutes.js         # /api/store
│   ├── supplierRoutes.js      # /api/suppliers
│   ├── voiceRoutes.js         # /api/voice
│   └── whatsappRoutes.js      # /api/whatsapp
├── 📁 services/               # External Integration Services
│   ├── geminiOcrService.js    # Google Gemini Vision OCR (Telugu/Hindi/English)
│   └── watiService.js         # WATI WhatsApp Business API integration
├── 📁 middleware/             # Middlewares (Auth token check, error handler)
├── 📁 utils/                  # Business utilities (SMS, Gemini client, seed data)
├── 📁 js/                     # Frontend Client Architecture (MVC)
│   ├── app.js                 # App bootstrapper & table renderers
│   ├── state.js               # Reactive centralized store state
│   ├── auth.js                # 2-step credentials & facial recognition
│   ├── api-service.js         # Dynamic backend API client
│   ├── ui-controllers.js      # Modals, drawers, sales & PDF generator
│   ├── ai-engine.js           # Autonomous retail agent chat engine
│   ├── voice-agent.js         # Voice copilot with live microphone audio
│   ├── ocr-scanner.js         # Handwriting scanner & bounding-box UI
│   ├── camera.js              # WebRTC camera capture & facial detection
│   └── translations.js        # Tri-lingual dictionary (English, Telugu, Hindi)
├── 📁 css/                    # Modular Design System Stylesheets
├── 📁 public/                 # Static Assets & Public Samples
│   ├── logo.png               # Official ShopSahayak logo
│   └── samples/               # Telugu, Hindi & English handwriting samples
├── 📁 scripts/                # Database Seeding & Maintenance Scripts
│   ├── seed.js                # MongoDB Atlas initial database seeder
│   └── migrate_user_email.js  # User partition database migration
├── 📁 tests/                  # Verification & Integration Test Suite
│   ├── test-ocr.js            # English handwriting OCR test
│   ├── test-telugu-ocr.js     # Telugu handwriting OCR test
│   ├── test-voice.js          # Natasha Voice agent synthesis test
│   ├── test-db.js             # MongoDB Atlas connection test
│   └── test-atlas-auth.js     # User authentication test
├── 📁 docs/                   # Architectural & Deployment Documentation
│   ├── ARCHITECTURE.md        # Comprehensive system architectural blueprint
│   ├── INTEGRATION.md         # API integration specifications
│   └── screenshots/           # UI walkthrough visual captures
├── index.html                 # Main Single Page Application shell
├── server.js                  # Production Node.js / Express server entrypoint
├── logo.png                   # Official ShopSahayak logo
├── render.yaml                # Render Blueprint deployment configuration
├── Dockerfile                 # Production container specification
├── package.json               # Node.js project manifest & dependencies
└── RENDER_DEPLOYMENT.md       # Step-by-step cloud deployment instructions
```

---

## 🚀 Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sameer07-bit/ShopSahayak.git
   cd ShopSahayak
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file based on `.env.example`:
   ```bash
   PORT=5000
   MONGO_URI=your_mongodb_atlas_uri
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Start the application:**
   ```bash
   npm start
   ```
   Open [http://localhost:5000](http://localhost:5000) in your browser.

---

## 🧪 Running Tests

```bash
npm run test           # Test MongoDB Atlas connection
npm run test:ocr       # Test English Handwriting Vision OCR
npm run test:telugu    # Test Telugu Handwriting Vision OCR
npm run test:voice     # Test Natasha AI Voice Agent
```

---

## 📄 License

This project is licensed under the MIT License.
