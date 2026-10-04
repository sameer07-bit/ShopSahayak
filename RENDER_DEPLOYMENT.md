# 🚀 ShopSahayak - Render Deployment Guide

This guide ensures your application deploys smoothly on [Render](https://render.com/) with zero errors.

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure you have:
1. **MongoDB Atlas Cluster**: Your MongoDB connection URI.
2. **MongoDB Atlas IP Access**:
   > ⚠️ **IMPORTANT**: Go to **MongoDB Atlas** -> **Network Access** -> Click **+ Add IP Address** -> Select **Allow Access From Anywhere (`0.0.0.0/0`)**. Cloud platforms like Render use dynamic IP addresses, so restricting to local IPs will block your app from connecting.
3. **Google Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/).
4. **WATI WhatsApp Credentials** (Optional/if using WhatsApp automated bills): Your `WATI_API_TOKEN` and `WATI_API_URL`.

---

## 🛠️ Step-by-Step Render Deployment

### Option A: 1-Click Blueprint Deploy (Recommended)
1. Push your repository to GitHub or GitLab.
2. Log into [Render Dashboard](https://dashboard.render.com/).
3. Click **New +** -> **Blueprint**.
4. Select your `ShopSahayak` repository.
5. Render will automatically read `render.yaml` with all settings pre-configured!
6. Enter your secret environment variables (`MONGO_URI`, `GEMINI_API_KEY`, `WATI_API_TOKEN`).
7. Click **Apply**.

---

### Option B: Manual Web Service Deploy
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following fields:
   * **Name**: `shopsahayak`
   * **Language / Environment**: `Node`
   * **Branch**: `main`
   * **Build Command**: `npm install`
   * **Start Command**: `npm start`
   * **Instance Type**: `Free`
4. Under **Advanced** -> **Health Check Path**:
   * Set to: `/api/health`
5. Under **Environment Variables**, add:
   | Key | Value / Example | Notes |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production mode |
   | `PORT` | `10000` | Auto-provided by Render |
   | `MONGO_URI` | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/ShopSahayak?retryWrites=true&w=majority` | Your Atlas connection |
   | `GEMINI_API_KEY` | `AIzaSy...` | Your Gemini Vision & AI Key |
   | `JWT_SECRET` | `shopsahayak_production_secret_key_2026` | Random secure string |
   | `WATI_API_TOKEN` | `Bearer ...` | WhatsApp Bot Token (Optional) |
   | `WATI_API_URL` | `https://live-mt-server.wati.io` | WATI Endpoint |

6. Click **Deploy Web Service**!

---

## 🔍 Verifying Deployment Health

Once deployment finishes, open your Render URL (e.g., `https://shopsahayak.onrender.com`):
1. **Health Check**: Visit `https://your-app.onrender.com/api/health` — it should return:
   ```json
   {"status":"online","service":"ShopSahayak AI Retail Engine & Multilingual Handwriting OCR","database":"MongoDB Atlas","apiKeyConfigured":true}
   ```
2. **Logo & Favicon**: The official ShopSahayak logo displays on the login screen, sidebar navigation, and customer PDF receipts.
3. **Customer Persistence**: Add a customer and refresh or re-login — all customer records stay permanently saved in MongoDB Atlas.
4. **Multilingual OCR & Voice Co-pilot**: Upload handwritten grocery receipts in English, Hindi, or Telugu to verify instant digital extraction.
