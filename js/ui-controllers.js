/* ==========================================================================
   ShopSahayak - UI Controllers, Modals, Drawers & Security UX
   Role-Based Permissions, Confirmation Dialogs, Exports, Toasts
   ========================================================================== */

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

class UIController {
  constructor(store, aiEngine) {
    this.store = store;
    this.aiEngine = aiEngine;
    this.initEventListeners();
  }

  initEventListeners() {
    // Top bar language selector
    document.querySelectorAll(".lang-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const lang = e.target.getAttribute("data-lang");
        this.store.setLanguage(lang);
      });
    });

    // Sidebar navigation clicks
    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const view = item.getAttribute("data-view");
        if (view) {
          this.switchView(view);
        }
      });
    });

    // Quick AI button in topbar
    const topbarAiBtn = document.getElementById("topbarAiBtn");
    if (topbarAiBtn) {
      topbarAiBtn.addEventListener("click", () => {
        this.switchView("ai-assistant");
      });
    }

    // Global keyboard shortcut Ctrl+K or Cmd+K
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const search = document.getElementById("globalSearchInput");
        if (search) search.focus();
      }
    });
  }

  switchView(viewName) {
    // Check role permission
    if (this.store.currentUserRole === "viewer" && (viewName === "settings")) {
      this.showToast("Viewer role does not have permission to modify store settings", "alert");
      return;
    }

    // Update active nav items
    document.querySelectorAll(".nav-item, .mobile-nav-item").forEach(item => {
      if (item.getAttribute("data-view") === viewName) {
        item.classList.add("active");
      } else {
        item.classList.remove("active");
      }
    });

    // Update view panels
    document.querySelectorAll(".page-view").forEach(panel => {
      if (panel.id === `view-${viewName}`) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    });

    this.store.setView(viewName);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toastContainer");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    
    let icon = "✦";
    if (type === "success") icon = "✓";
    if (type === "alert") icon = "⚠";
    if (type === "ai") icon = "✦";

    const iconSpan = document.createElement("span");
    iconSpan.style.fontWeight = "700";
    iconSpan.textContent = icon;

    const msgSpan = document.createElement("span");
    msgSpan.style.flex = "1";
    msgSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 200ms ease";
      setTimeout(() => toast.remove(), 250);
    }, 3500);
  }

  // ------------------------------------------------------------------------
  // SECURITY CONFIRMATION DIALOG (High-Impact Financial Actions)
  // ------------------------------------------------------------------------
  showSecurityConfirmDialog({ title, message, amount, details, onConfirm }) {
    const modalBackdrop = document.getElementById("securityConfirmModal");
    if (!modalBackdrop) return;

    document.getElementById("secConfirmTitle").textContent = title;
    document.getElementById("secConfirmMsg").textContent = message;
    document.getElementById("secConfirmAmount").textContent = `₹${Number(amount).toLocaleString('en-IN')}`;
    document.getElementById("secConfirmDetails").textContent = details || "";

    const confirmBtn = document.getElementById("secConfirmBtn");
    const cancelBtn = document.getElementById("secCancelBtn");

    const handleConfirm = () => {
      modalBackdrop.classList.remove("active");
      confirmBtn.onclick = null;
      if (onConfirm) onConfirm();
    };

    confirmBtn.onclick = handleConfirm;
    cancelBtn.onclick = () => {
      modalBackdrop.classList.remove("active");
    };

    modalBackdrop.classList.add("active");
  }

  // ------------------------------------------------------------------------
  // UNIFIED PURCHASE ORDER APPROVAL PIPELINE
  // ------------------------------------------------------------------------
  requestPurchaseOrderApproval({ productId, quantity, supplierName, actionCardId, autoConfirmDelayMs, onConfirmed }) {
    if (this.store.currentUserRole === "viewer" || this.store.currentUserRole === "staff") {
      this.showToast("Only Store Owner or Manager can approve purchase orders.", "alert");
      return;
    }

    const prod = this.store.products.find(p => p.id === productId);
    if (!prod) return;

    const numQty = Number(quantity) || (prod.id === "PROD-001" ? 100 : Math.max(20, (prod.minStock * 2) - prod.stock));
    const finalCost = numQty * prod.purchasePrice;
    const finalSupplier = supplierName || prod.supplierName;

    this.showSecurityConfirmDialog({
      title: "Confirm Purchase Order",
      message: `Are you sure you want to approve purchase order for ${prod.name} from ${finalSupplier}?`,
      amount: finalCost,
      details: `Quantity: ${numQty} ${prod.unit} • Terms: Net 7 Days Credit`,
      onConfirm: () => {
        const poNumber = this.store.getNextPONumber();
        this.store.restockProduct(prod.id, numQty, finalSupplier, poNumber);
        if (window.shopApi) {
          window.shopApi.restockProduct(prod.id, numQty, finalSupplier).catch(e => console.warn(e));
        }

        if (actionCardId && this.aiEngine) {
          this.aiEngine.finalizeActionCardApproval(actionCardId, poNumber, numQty, finalCost);
        }

        this.showToast(`Purchase order ${poNumber} approved! Added ${numQty} ${prod.unit} of ${prod.name}.`, "success");
        if (onConfirmed) onConfirmed(poNumber);
      }
    });

    if (autoConfirmDelayMs) {
      setTimeout(() => {
        const confirmBtn = document.getElementById("secConfirmBtn");
        if (confirmBtn) confirmBtn.click();
      }, autoConfirmDelayMs);
    }
  }

  // ------------------------------------------------------------------------
  // ADD PRODUCT MODAL
  // ------------------------------------------------------------------------
  openAddProductModal() {
    // Role check
    if (this.store.currentUserRole === "viewer" || this.store.currentUserRole === "staff") {
      this.showToast("Only Store Owner or Manager can add new product catalogue entries.", "alert");
      return;
    }

    const modal = document.getElementById("addProductModal");
    if (modal) modal.classList.add("active");
  }

  closeAddProductModal() {
    const modal = document.getElementById("addProductModal");
    if (modal) modal.classList.remove("active");
  }

  handleSaveProduct() {
    const name = document.getElementById("prodNameInput")?.value.trim();
    const category = document.getElementById("prodCategorySelect")?.value;
    const purchasePrice = document.getElementById("prodPurchasePrice")?.value;
    const sellingPrice = document.getElementById("prodSellingPrice")?.value;
    const stock = document.getElementById("prodStockInput")?.value;
    const minStock = document.getElementById("prodMinStockInput")?.value;
    const unit = document.getElementById("prodUnitInput")?.value;
    const supplierName = document.getElementById("prodSupplierSelect")?.value;

    if (!name) {
      this.showToast("Please enter a valid product name", "alert");
      return;
    }

    const item = this.store.addProduct({
      name,
      category,
      purchasePrice,
      sellingPrice,
      stock,
      minStock,
      unit,
      supplierName
    });

    if (window.shopApi) {
      window.shopApi.addProduct({
        name,
        category,
        purchasePrice,
        sellingPrice,
        stock,
        minStock,
        unit,
        supplierName
      }).catch(e => console.warn(e));
    }

    this.closeAddProductModal();
    this.showToast(`Product "${item.name}" successfully added to catalogue!`, "success");
    
    // Clear fields
    if (document.getElementById("prodNameInput")) document.getElementById("prodNameInput").value = "";
  }

  // ------------------------------------------------------------------------
  // RESTOCK RECOMMENDATION MODAL
  // ------------------------------------------------------------------------
  openRestockModal(productId) {
    const prod = this.store.products.find(p => p.id === productId);
    if (!prod) return;

    const modal = document.getElementById("restockModal");
    if (!modal) return;

    document.getElementById("restockProdName").innerText = prod.name;
    document.getElementById("restockProdSku").innerText = prod.sku;
    document.getElementById("restockCurrentStock").innerText = `${prod.stock} ${prod.unit}`;
    document.getElementById("restockMinStock").innerText = `${prod.minStock} ${prod.unit}`;
    document.getElementById("restockVelocity").innerText = `${prod.velocityDaily} ${prod.unit}/day`;
    
    // Recommended quantity calculation: (minStock * 2) - currentStock or standard 100 for rice
    const recQty = prod.id === "PROD-001" ? 100 : Math.max(20, (prod.minStock * 2) - prod.stock);
    const estCost = recQty * prod.purchasePrice;

    const qtyInput = document.getElementById("restockRecommendedQty");
    const costDisplay = document.getElementById("restockEstCost");
    
    qtyInput.value = recQty;
    document.getElementById("restockSupplier").innerText = prod.supplierName;
    costDisplay.innerText = `₹${estCost.toLocaleString('en-IN')}`;

    qtyInput.oninput = () => {
      const q = Number(qtyInput.value) || 0;
      costDisplay.innerText = `₹${(q * prod.purchasePrice).toLocaleString('en-IN')}`;
    };

    const approveBtn = document.getElementById("restockApproveBtn");
    approveBtn.onclick = () => {
      const finalQty = Number(qtyInput.value) || recQty;
      modal.classList.remove("active");
      this.requestPurchaseOrderApproval({
        productId: prod.id,
        quantity: finalQty,
        supplierName: prod.supplierName
      });
    };

    modal.classList.add("active");
  }

  closeRestockModal() {
    const modal = document.getElementById("restockModal");
    if (modal) modal.classList.remove("active");
  }

  // ------------------------------------------------------------------------
  // CUSTOMER PROFILE DRAWER
  // ------------------------------------------------------------------------
  openCustomerDrawer(customerId) {
    const cust = this.store.customers.find(c => c.id === customerId);
    if (!cust) return;

    this.activeCustomer = cust;

    const drawer = document.getElementById("customerDrawer");
    if (!drawer) return;

    document.getElementById("custDrawerInitials").innerText = cust.name.slice(0, 2).toUpperCase();
    document.getElementById("custDrawerName").innerText = cust.name;
    document.getElementById("custDrawerPhone").innerText = cust.phone;
    document.getElementById("custDrawerType").innerText = cust.type;
    document.getElementById("custDrawerOrders").innerText = cust.ordersCount;
    document.getElementById("custDrawerSpend").innerText = `₹${cust.totalSpend.toLocaleString('en-IN')}`;
    document.getElementById("custDrawerKhata").innerText = `₹${(cust.khataBalance || 0).toLocaleString('en-IN')}`;
    document.getElementById("custDrawerLastPurchase").innerText = cust.lastPurchase;
    document.getElementById("custDrawerInsight").innerText = cust.aiInsight;

    // Pre-compute WhatsApp Statement link directly on the drawer button
    const rawPhone = cust.phone || "7330789032";
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const intlPhone = cleanDigits.length === 10 ? ('91' + cleanDigits) : cleanDigits;
    const amt = (cust.khataBalance || 0) > 0 ? cust.khataBalance : (cust.totalSpend || 1450);
    const storeName = 'Sharma Kirana Store';
    const quickStatement = `🧾 *${storeName.toUpperCase()} — KHATA STATEMENT*\n----------------------------------------\n*Customer:* ${cust.name}\n*Khata Balance (Udhar):* ₹${Number(amt).toLocaleString('en-IN')}\n*Status:* Pending Settlement\n----------------------------------------\nPlease clear your outstanding balance at your convenience.\nThank you for shopping at *${storeName}*!\n_Powered by ShopSahayak AI_`;
    const waBtn = document.getElementById("custDrawerWhatsAppBtn");
    if (waBtn) {
      waBtn.href = `https://wa.me/${intlPhone}?text=${encodeURIComponent(quickStatement)}`;
    }

    drawer.classList.add("active");
  }

  closeCustomerDrawer() {
    const drawer = document.getElementById("customerDrawer");
    if (drawer) drawer.classList.remove("active");
  }

  handleSendCustomerWhatsAppStatement(e) {
    let cust = this.activeCustomer;
    if (!cust) {
      const drawerName = document.getElementById("custDrawerName")?.innerText.trim();
      const drawerKhataText = document.getElementById("custDrawerKhata")?.innerText.replace(/[^\d]/g, '');
      const drawerPhone = document.getElementById("custDrawerPhone")?.innerText.trim();
      if (drawerName) {
        cust = {
          name: drawerName,
          khataBalance: Number(drawerKhataText) || 0,
          phone: drawerPhone || "7330789032"
        };
      }
    }

    const targetCust = cust || { name: "Valued Customer", khataBalance: 1450, phone: "7330789032" };
    const statementAmount = targetCust.khataBalance > 0 ? targetCust.khataBalance : (targetCust.totalSpend || 1450);
    const rawPhone = targetCust.phone || "7330789032";
    const cleanDigits = rawPhone.replace(/\D/g, '');
    const intlPhone = cleanDigits.length === 10 ? ('91' + cleanDigits) : cleanDigits;
    const stmtId = `STMT-${Date.now().toString().slice(-6)}`;
    const storeName = 'Sharma Kirana Store';

    const statementText = `🧾 *${storeName.toUpperCase()} — KHATA STATEMENT*\n----------------------------------------\n*Statement No:* \`${stmtId}\`\n*Customer:* ${targetCust.name}\n*Khata Balance (Udhar):* ₹${Number(statementAmount).toLocaleString('en-IN')}\n*Status:* Pending Settlement\n----------------------------------------\nPlease clear your outstanding balance at your convenience.\nThank you for shopping at *${storeName}*!\n_Powered by ShopSahayak AI_`;
    const waDirectUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(statementText)}`;

    // Set href directly on clicked <a> tag so native browser opens WhatsApp in a new tab without popup blocker!
    const targetLink = e?.currentTarget || document.getElementById("custDrawerWhatsAppBtn");
    if (targetLink) {
      targetLink.href = waDirectUrl;
    }

    this.showToast(`Opening WhatsApp Statement for ${targetCust.name} (+${intlPhone})...`, "success");

    // Also trigger backend WATI dispatch & MongoDB Atlas logging
    fetch("/api/whatsapp/send-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: stmtId,
        phone: intlPhone,
        customer: targetCust.name,
        amount: statementAmount,
        itemsSummary: "Khata Statement Balance"
      })
    }).catch(err => console.warn("Backend sync notice:", err));

    return true;
  }

  async handleSendAllKhataReminders() {
    const khataCusts = (this.store.customers || []).filter(c => (c.khataBalance || 0) > 0);
    if (khataCusts.length === 0) {
      this.showToast("No customers currently have outstanding Khata balances.", "info");
      return;
    }

    this.showToast(`Dispatching WATI WhatsApp Khata reminders to ${khataCusts.length} customers...`, "info");

    let countSent = 0;
    for (const cust of khataCusts) {
      if (cust.phone) {
        try {
          await fetch("/api/whatsapp/send-bill", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              billId: `KHATA-${Date.now().toString().slice(-6)}`,
              phone: cust.phone,
              customer: cust.name,
              amount: cust.khataBalance,
              itemsSummary: `Khata Ledger Outstanding Balance`
            })
          });
          countSent++;
        } catch (e) {
          console.warn("Khata reminder error:", e.message);
        }
      }
    }

    this.showToast(`WATI WhatsApp Khata reminders dispatched to ${countSent} customer accounts!`, "success");
  }

  // ------------------------------------------------------------------------
  // RECORD SALE / POS QUICK BILLING MODAL
  // ------------------------------------------------------------------------
  openNewSaleModal() {
    const modal = document.getElementById("newSaleModal");
    if (modal) modal.classList.add("active");
  }

  closeNewSaleModal() {
    const modal = document.getElementById("newSaleModal");
    if (modal) modal.classList.remove("active");
  }

  handleSaveSale() {
    const custName = document.getElementById("saleCustomerInput")?.value.trim() || "Walk-in Customer";
    const amount = Number(document.getElementById("saleAmountInput")?.value);
    const summary = document.getElementById("saleItemsSummary")?.value.trim() || "Groceries & Provisions";
    const method = document.getElementById("salePaymentSelect")?.value || "UPI (PhonePe)";

    if (!amount || amount <= 0) {
      this.showToast("Please enter a valid sale amount in ₹", "alert");
      return;
    }

    const tx = this.store.addSaleTransaction({
      customer: custName,
      amount: amount,
      itemsSummary: summary,
      paymentMethod: method,
      itemsCount: 2
    });

    if (window.shopApi) {
      window.shopApi.createSale({
        customer: custName,
        amount: amount,
        itemsSummary: summary,
        paymentMethod: method,
        itemsCount: 2
      }).catch(e => console.warn(e));
    }

    this.closeNewSaleModal();
    this.showToast(`Sale of ₹${amount} recorded successfully! Order #${tx.id}`, "success");
  }

  // ------------------------------------------------------------------------
  // WATI WHATSAPP BILL DISPATCH MODAL
  // ------------------------------------------------------------------------
  openSendWhatsAppBillModal(billId, customerName, amount, customerPhone) {
    this.currentWaBillId = billId;
    this.currentWaCustomerName = customerName || "Valued Customer";
    this.currentWaAmount = amount || 0;

    const modal = document.getElementById("sendWhatsAppBillModal");
    const invEl = document.getElementById("waModalInvoiceId");
    const custEl = document.getElementById("waModalCustomerName");
    const amtEl = document.getElementById("waModalBillAmount");
    const phoneInput = document.getElementById("waBillPhoneInput");
    const alertEl = document.getElementById("waModalStatusAlert");

    if (invEl) invEl.textContent = billId || "ORD-000000";
    if (custEl) custEl.textContent = customerName || "Valued Customer";
    if (amtEl) amtEl.textContent = `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    if (alertEl) {
      alertEl.style.display = "none";
      alertEl.innerHTML = "";
    }

    // Auto-fill phone
    if (phoneInput) {
      phoneInput.value = "";
      let foundPhone = customerPhone;
      if (!foundPhone) {
        const custObj = this.store.customers.find(c => c.name === customerName || c.id === customerName);
        if (custObj && custObj.phone) foundPhone = custObj.phone;
        else if (this.activeCustomer && this.activeCustomer.phone) foundPhone = this.activeCustomer.phone;
      }
      if (foundPhone) {
        let clean = String(foundPhone).trim().replace(/^\+91/, '').replace(/^91/, '').replace(/\s+/g, '');
        phoneInput.value = clean || foundPhone;
      } else {
        phoneInput.value = "7330789032";
      }

      // Live link updater: Ensures submit button always has pre-computed href for zero-popup-blocker click
      const updateBtnHref = () => {
        const raw = phoneInput.value.trim();
        const digs = raw.replace(/\D/g, '');
        const ip = digs.length === 10 ? ('91' + digs) : digs;
        const btn = document.getElementById("sendWaBillSubmitBtn");
        const quickText = `🧾 *SHARMA KIRANA STORE — TAX INVOICE*\n----------------------------------------\n*Customer:* ${this.currentWaCustomerName}\n*Amount:* ₹${Number(this.currentWaAmount || 0).toLocaleString('en-IN')}\n*Status:* Completed\n----------------------------------------\nThank you for shopping with us!\n_Powered by ShopSahayak AI_`;
        if (btn && ip) {
          btn.href = `https://wa.me/${ip}?text=${encodeURIComponent(quickText)}`;
        }
      };
      phoneInput.oninput = updateBtnHref;
      updateBtnHref();
    }

    if (modal) {
      modal.style.display = "flex";
      modal.classList.add("active");
    }
  }

  closeSendWhatsAppBillModal() {
    const modal = document.getElementById("sendWhatsAppBillModal");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("active");
    }
  }

  handleDispatchWhatsAppLink(e) {
    const phoneInput = document.getElementById("waBillPhoneInput");
    const phone = phoneInput ? phoneInput.value.trim() : "";
    const alertEl = document.getElementById("waModalStatusAlert");
    const submitBtn = document.getElementById("sendWaBillSubmitBtn");

    if (!phone) {
      if (e) e.preventDefault();
      this.showToast("Please enter a valid WhatsApp mobile number", "alert");
      return false;
    }

    const cleanDigits = phone.replace(/\D/g, '');
    const intlPhone = cleanDigits.length === 10 ? ('91' + cleanDigits) : cleanDigits;
    const invId = this.currentWaBillId || ('ORD-' + Date.now().toString().slice(-6));
    const amtFormatted = Number(this.currentWaAmount || 0).toLocaleString('en-IN');
    const storeName = 'Sharma Kirana Store';
    const quickBillText = `🧾 *${storeName.toUpperCase()} — TAX INVOICE*\n----------------------------------------\n*Invoice No:* \`${invId}\`\n*Customer:* ${this.currentWaCustomerName}\n*Amount:* ₹${amtFormatted}\n*Status:* Completed\n----------------------------------------\nThank you for shopping at *${storeName}*!\n_Powered by ShopSahayak AI_`;
    const waUrl = `https://wa.me/${intlPhone}?text=${encodeURIComponent(quickBillText)}`;

    // Set href directly on clicked <a> tag so native browser navigation opens it in new tab without popup blocker!
    const targetLink = e?.currentTarget || submitBtn;
    if (targetLink) {
      targetLink.href = waUrl;
    }

    if (alertEl) {
      alertEl.style.display = "block";
      alertEl.style.background = "rgba(37, 211, 102, 0.12)";
      alertEl.style.border = "1px solid rgba(37, 211, 102, 0.4)";
      alertEl.style.color = "#15803d";
      alertEl.innerHTML = `
        <div style="font-weight: 700; margin-bottom: 6px; display:flex; align-items:center; gap:6px;">
          <i class="fa-solid fa-circle-check" style="color:#25D366; font-size:16px;"></i> WhatsApp Chat Opened!
        </div>
        <div style="font-size: 12px; margin-bottom: 8px; color: #374151;">
          Bill statement for <strong>+${intlPhone}</strong> is opening. Click below if it didn't open:
        </div>
        <a id="waDirectClickLink" href="${waUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; background:#25D366; color:#ffffff; padding:8px 16px; border-radius:6px; font-weight:700; font-size:13px; text-decoration:none;">
          <i class="fa-brands fa-whatsapp" style="font-size:16px;"></i> 📲 Open in WhatsApp Web / App
        </a>
      `;
    }

    this.showToast(`Opening WhatsApp for +${intlPhone}...`, "success");

    // Also trigger backend WATI sync & MongoDB Atlas logging
    fetch("/api/whatsapp/send-bill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billId: this.currentWaBillId,
        phone: phone,
        customer: this.currentWaCustomerName,
        amount: this.currentWaAmount
      })
    }).then(r => r.json()).then(data => {
      if (data.data?.whatsappDirectUrl) {
        const linkEl = document.getElementById("waDirectClickLink");
        if (linkEl) linkEl.href = data.data.whatsappDirectUrl;
      }
    }).catch(err => console.warn("Backend sync notice:", err));

    return true;
  }

  handleDispatchWhatsAppBill() {
    return this.handleDispatchWhatsAppLink();
  }

  // ------------------------------------------------------------------------
  // EXPORT REPORTS (CSV, EXCEL, PRINTABLE PDF)
  // ------------------------------------------------------------------------
  exportReport(format) {
    const BOM = "\uFEFF";
    if (format === "csv") {
      let csv = BOM + "Product Name,SKU,Category,Current Stock,Minimum Stock,Unit Price,Supplier,Status\n";
      this.store.products.forEach(p => {
        csv += `"${p.name}","${p.sku}","${p.category}",${p.stock},${p.minStock},${p.sellingPrice},"${p.supplierName}","${p.status}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ShopSahayak_Inventory_Report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast("Inventory CSV report downloaded (opens in Excel)!", "success");
    } else if (format === "excel" || format === "sales_csv") {
      let csv = BOM + "Order ID,Time,Customer,Items,Amount,Payment Method,Status\n";
      this.store.transactions.forEach(t => {
        csv += `"${t.id}","${t.time}","${t.customer}","${t.itemsSummary}",${t.amount},"${t.paymentMethod}","${t.status}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `ShopSahayak_Sales_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.showToast("Sales CSV report downloaded (opens in Excel)!", "success");
    } else if (format === "pdf") {
      this.showToast("Preparing printable report...", "info");
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }

  // ------------------------------------------------------------------------
  // CUSTOMER MODAL
  // ------------------------------------------------------------------------
  openAddCustomerModal() {
    const modal = document.getElementById("addCustomerModal");
    if (modal) modal.classList.add("active");
  }

  closeAddCustomerModal() {
    const modal = document.getElementById("addCustomerModal");
    if (modal) modal.classList.remove("active");
  }

  async handleSaveCustomer() {
    const name = document.getElementById("custNameInput")?.value.trim();
    const phone = document.getElementById("custPhoneInput")?.value.trim() || "";
    const type = document.getElementById("custTypeSelect")?.value || "Regular";
    const khata = Number(document.getElementById("custInitialKhata")?.value) || 0;

    if (!name) {
      this.showToast("Please enter customer name", "alert");
      return;
    }

    const uniqueId = `CUST-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 900 + 100)}`;
    const userEmail = (window.shopApi && window.shopApi.getUserEmail()) || "ravi.sharma@kiranaos.in";

    const newCust = {
      id: uniqueId,
      name,
      phone,
      type,
      khataBalance: khata,
      ordersCount: khata > 0 ? 1 : 0,
      totalSpend: khata,
      lastPurchase: "Just now",
      favoriteCategory: "General",
      aiInsight: "New customer added to store ledger.",
      userEmail
    };

    // 1. Add to reactive store
    this.store.addCustomer(newCust);

    // 2. Persist directly to MongoDB Atlas
    if (window.shopApi) {
      try {
        await window.shopApi.createCustomer(newCust);
      } catch (e) {
        console.warn("MongoDB Atlas customer save notice:", e.message);
      }
    }

    // 3. Persist to localStorage buffer so it never disappears on logout
    try {
      const stored = JSON.parse(localStorage.getItem('shopsahayak_persisted_customers') || '[]');
      const updated = [newCust, ...stored.filter(c => c.id !== uniqueId && c.name !== name)];
      localStorage.setItem('shopsahayak_persisted_customers', JSON.stringify(updated));
    } catch (e) {}

    this.closeAddCustomerModal();
    this.showToast(`Customer "${name}" saved permanently to MongoDB Atlas!`, "success");

    if (window.renderAllViews) {
      window.renderAllViews();
    } else if (window.renderCustomersTable) {
      window.renderCustomersTable();
    }

    if (document.getElementById("custNameInput")) document.getElementById("custNameInput").value = "";
    if (document.getElementById("custPhoneInput")) document.getElementById("custPhoneInput").value = "";
    if (document.getElementById("custInitialKhata")) document.getElementById("custInitialKhata").value = "";
  }

  // ------------------------------------------------------------------------
  // SUPPLIER MODAL
  // ------------------------------------------------------------------------
  openAddSupplierModal() {
    const modal = document.getElementById("addSupplierModal");
    if (modal) modal.classList.add("active");
  }

  closeAddSupplierModal() {
    const modal = document.getElementById("addSupplierModal");
    if (modal) modal.classList.remove("active");
  }

  async handleSaveSupplier() {
    const name = document.getElementById("suppNameInput")?.value.trim();
    const category = document.getElementById("suppCategoryInput")?.value.trim() || "General Wholesale";
    const contact = document.getElementById("suppContactInput")?.value.trim() || "";
    const phone = document.getElementById("suppPhoneInput")?.value.trim() || "";

    if (!name) {
      this.showToast("Please enter supplier or agency name", "alert");
      return;
    }

    const newSupp = this.store.addSupplier({
      name,
      category,
      contactPerson: contact,
      phone,
      status: "Active"
    });

    if (window.shopApi) {
      await window.shopApi.createSupplier({
        name,
        category,
        contactPerson: contact,
        phone,
        status: "Active"
      }).catch(e => console.warn(e));
    }

    this.closeAddSupplierModal();
    this.showToast(`Wholesale supplier "${name}" added successfully!`, "success");

    if (document.getElementById("suppNameInput")) document.getElementById("suppNameInput").value = "";
    if (document.getElementById("suppCategoryInput")) document.getElementById("suppCategoryInput").value = "";
    if (document.getElementById("suppContactInput")) document.getElementById("suppContactInput").value = "";
    if (document.getElementById("suppPhoneInput")) document.getElementById("suppPhoneInput").value = "";
  }

  // ------------------------------------------------------------------------
  // PURCHASE ORDER MODAL
  // ------------------------------------------------------------------------
  openNewPurchaseOrderModal(supplierId) {
    const modal = document.getElementById("newPurchaseOrderModal");
    if (!modal) return;
    const suppSelect = document.getElementById("poSupplierSelect");
    if (suppSelect) {
      if (this.store.suppliers && this.store.suppliers.length > 0) {
        suppSelect.innerHTML = this.store.suppliers.map(s => 
          `<option value="${s.id}" ${s.id === supplierId ? 'selected' : ''}>${escapeHtml(s.name)} (${escapeHtml(s.category)})</option>`
        ).join("");
      } else {
        suppSelect.innerHTML = `<option value="SUP-001">Direct Wholesale</option>`;
      }
    }
    modal.classList.add("active");
  }

  closeNewPurchaseOrderModal() {
    const modal = document.getElementById("newPurchaseOrderModal");
    if (modal) modal.classList.remove("active");
  }

  async handleSavePurchaseOrder() {
    const prodName = document.getElementById("poProductNameInput")?.value.trim();
    const suppSelect = document.getElementById("poSupplierSelect");
    const suppId = suppSelect?.value;
    const suppObj = this.store.suppliers.find(s => s.id === suppId);
    const suppName = suppObj ? suppObj.name : (suppSelect?.options[suppSelect?.selectedIndex]?.text || "Direct Wholesale");
    const qty = Number(document.getElementById("poQuantityInput")?.value) || 1;
    const unit = document.getElementById("poUnitInput")?.value || "units";
    const unitPrice = Number(document.getElementById("poUnitPriceInput")?.value) || 0;
    const totalAmount = qty * unitPrice;

    if (!prodName) {
      this.showToast("Please enter an item or product name", "alert");
      return;
    }

    const poNumber = this.store.getNextPONumber();

    if (suppObj) {
      suppObj.pendingOrders += 1;
      suppObj.totalPurchased += totalAmount;
      suppObj.lastOrderDate = "Today";
      this.store.notify("supplier_updated", suppObj);
    }

    if (window.shopApi) {
      await window.shopApi.createPurchaseOrder({
        poNumber,
        productName: prodName,
        supplierId: suppId || "SUP-001",
        supplierName: suppName,
        quantity: qty,
        unit,
        unitPrice,
        totalAmount
      }).catch(e => console.warn(e));
    }

    this.closeNewPurchaseOrderModal();
    this.showToast(`Purchase order ${poNumber} for ${prodName} approved and created!`, "success");

    this.store.notifications.unshift({
      id: "NOTIF-" + Date.now(),
      category: "Orders",
      severity: "success",
      title: `PO Dispatched (${poNumber})`,
      message: `Ordered ${qty} ${unit} of ${prodName} from ${suppName} (₹${totalAmount.toLocaleString('en-IN')}).`,
      time: "Just now",
      read: false
    });
    this.store.notify("supplier_added");
  }

  // ------------------------------------------------------------------------
  // SAVE STORE PROFILE SETTINGS
  // ------------------------------------------------------------------------
  async saveStoreProfileSettings() {
    const tradeName = document.getElementById("settingsTradeName")?.value.trim() || this.store.profile.storeName;
    const gstin = document.getElementById("settingsGstin")?.value.trim() || "";
    const ownerName = document.getElementById("settingsOwnerName")?.value.trim() || this.store.profile.ownerName;
    const phone = document.getElementById("settingsPhone")?.value.trim() || this.store.profile.phone;
    const address = document.getElementById("settingsAddress")?.value.trim() || this.store.profile.address;

    this.store.profile = {
      ...this.store.profile,
      storeName: tradeName,
      gstin: gstin,
      ownerName: ownerName,
      phone: phone,
      address: address
    };

    // Update Topbar and Sidebar
    const storeNameEls = document.querySelectorAll(".brand-subtitle, .topbar-store-name");
    storeNameEls.forEach(el => el.textContent = tradeName);
    const ownerNameEl = document.querySelector(".user-name");
    if (ownerNameEl) ownerNameEl.textContent = ownerName;

    if (window.shopApi) {
      try {
        await window.shopApi.updateStoreProfile(this.store.profile);
      } catch (e) {
        console.warn('Profile save sync error:', e);
      }
    }

    this.showToast("Store profile details saved & synced to MongoDB!", "success");
  }

  // ------------------------------------------------------------------------
  // CUSTOMER INVOICE & STATEMENT PDF GENERATOR
  // ------------------------------------------------------------------------
  generateCustomerInvoicePdf(customerId) {
    let cust = null;
    if (customerId) {
      cust = this.store.customers.find(c => c.id === customerId);
    }
    if (!cust) cust = this.activeCustomer;
    if (!cust) {
      const drawerName = document.getElementById("custDrawerName")?.innerText.trim();
      const drawerKhataText = document.getElementById("custDrawerKhata")?.innerText.replace(/[^\d]/g, '');
      const drawerPhone = document.getElementById("custDrawerPhone")?.innerText.trim();
      if (drawerName) {
        cust = {
          name: drawerName,
          khataBalance: Number(drawerKhataText) || 0,
          phone: drawerPhone || "7330789032",
          type: "Regular"
        };
      }
    }
    if (!cust) cust = { name: "Valued Customer", phone: "7330789032", khataBalance: 1450, totalSpend: 1450, type: "Regular" };

    const storeProfile = this.store.profile || {};
    const storeName = storeProfile.storeName || "Sharma Kirana Store";
    const storeAddress = storeProfile.address || "Shop No. 4, Main Bazaar, Hyderabad, TG";
    const storePhone = storeProfile.phone || "+91 98490 23145";
    const storeGstin = storeProfile.gstin || "36AAAAA0000A1Z5";

    const invoiceNo = `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;
    const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const balance = Number(cust.khataBalance || cust.totalSpend || 1450);

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #fff;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <img src="logo.png" alt="ShopSahayak" style="height: 48px; object-fit: contain;">
            <div>
              <h2 style="margin: 0 0 4px 0; color: #4338ca; font-size: 19px; font-weight: 800; text-transform: uppercase;">${storeName}</h2>
              <div style="font-size: 11.5px; color: #64748b;">${storeAddress}</div>
              <div style="font-size: 11.5px; color: #64748b;">Phone: ${storePhone} | GSTIN: <strong>${storeGstin}</strong></div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 4px; display: inline-block;">TAX INVOICE & STATEMENT</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Invoice No: <strong style="color: #0f172a;">${invoiceNo}</strong></div>
            <div style="font-size: 12px; color: #64748b;">Date: <strong>${invoiceDate}</strong></div>
          </div>
        </div>

        <!-- Billed To -->
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Billed To / Customer Account:</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${cust.name}</div>
          <div style="font-size: 12px; color: #475569;">Mobile: <strong>${cust.phone || 'N/A'}</strong> • Account Type: <strong>${cust.type || 'Regular'}</strong></div>
        </div>

        <!-- Items Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600; color: #475569;">#</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600; color: #475569;">Description / Particulars</th>
              <th style="padding: 8px 10px; text-align: center; font-weight: 600; color: #475569;">Qty</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 600; color: #475569;">Rate (₹)</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 600; color: #475569;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">1</td>
              <td style="padding: 10px;">
                <strong>Kirana Provisions & Store Ledger Balance</strong>
                <div style="font-size: 11px; color: #64748b;">Daily grocery staples, grains, spices & provisions</div>
              </td>
              <td style="padding: 10px; text-align: center;">1</td>
              <td style="padding: 10px; text-align: right;">₹${balance.toLocaleString('en-IN')}</td>
              <td style="padding: 10px; text-align: right; font-weight: 600;">₹${balance.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <!-- Totals & Summary -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
          <div style="max-width: 260px; font-size: 11px; color: #64748b;">
            <div><strong>Payment Mode:</strong> Cash / UPI</div>
            <div style="margin-top: 4px;"><strong>Payment Status:</strong> <span style="color: ${cust.khataBalance > 0 ? '#b45309' : '#15803d'}; font-weight: 700;">${cust.khataBalance > 0 ? 'PENDING (KHATA / UDHAR)' : 'SETTLED / PAID'}</span></div>
            <div style="margin-top: 4px;">Thank you for your business! Please visit again.</div>
          </div>
          <div style="width: 220px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>Subtotal:</span>
              <span>₹${balance.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>CGST (2.5%):</span>
              <span>₹${Math.round(balance * 0.025).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>SGST (2.5%):</span>
              <span>₹${Math.round(balance * 0.025).toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; margin-top: 6px; font-size: 14px; font-weight: 800; color: #0f172a;">
              <span>Total Payable:</span>
              <span style="color: #4338ca;">₹${balance.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <!-- Footer Signatory -->
        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px;">
          <div style="font-size: 10.5px; color: #94a3b8;">
            Computer-generated Tax Invoice generated via ShopSahayak AI Retail System.
          </div>
          <div style="text-align: center; width: 140px;">
            <div style="height: 36px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
            <div style="font-size: 10.5px; color: #475569; font-weight: 600;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    const area = document.getElementById("invoicePrintArea");
    if (area) area.innerHTML = html;

    const modal = document.getElementById("customerInvoiceModal");
    if (modal) modal.style.display = "flex";
  }

  generateInvoicePdf(transactionId) {
    const tx = this.store.transactions.find(t => t.id === transactionId || t._id === transactionId);
    const storeProfile = this.store.profile || {};
    const storeName = storeProfile.storeName || "Sharma Kirana Store";
    const storeAddress = storeProfile.address || "Shop No. 4, Main Bazaar, Hyderabad, TG";
    const storePhone = storeProfile.phone || "+91 98490 23145";
    const storeGstin = storeProfile.gstin || "36AAAAA0000A1Z5";

    const invId = tx ? tx.id : `INV-${Date.now().toString().slice(-6)}`;
    const custName = tx ? tx.customer : "Valued Customer";
    const amount = tx ? tx.amount : 500;
    const payment = tx ? tx.paymentMethod : "Cash / UPI";
    const summary = tx ? (tx.itemsSummary || "Provisions & Groceries") : "Provisions & Groceries";
    const invDate = tx?.createdAt ? new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; max-width: 620px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; background: #fff;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #6366f1; padding-bottom: 16px; margin-bottom: 16px;">
          <div style="display: flex; gap: 14px; align-items: center;">
            <img src="logo.png" alt="ShopSahayak" style="height: 48px; object-fit: contain;">
            <div>
              <h2 style="margin: 0 0 4px 0; color: #4338ca; font-size: 19px; font-weight: 800; text-transform: uppercase;">${storeName}</h2>
              <div style="font-size: 11.5px; color: #64748b;">${storeAddress}</div>
              <div style="font-size: 11.5px; color: #64748b;">Phone: ${storePhone} | GSTIN: <strong>${storeGstin}</strong></div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #eef2ff; color: #4338ca; font-weight: 700; font-size: 12px; padding: 4px 10px; border-radius: 4px; display: inline-block;">POS SALE TAX INVOICE</div>
            <div style="font-size: 12px; color: #64748b; margin-top: 6px;">Invoice No: <strong style="color: #0f172a;">${invId}</strong></div>
            <div style="font-size: 12px; color: #64748b;">Date: <strong>${invDate}</strong></div>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; margin-bottom: 20px;">
          <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; font-weight: 700; margin-bottom: 4px;">Customer Details:</div>
          <div style="font-size: 14px; font-weight: 700; color: #0f172a;">${custName}</div>
          <div style="font-size: 12px; color: #475569;">Payment Mode: <strong>${payment}</strong> • Status: <strong style="color: #15803d;">COMPLETED</strong></div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12.5px;">
          <thead>
            <tr style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
              <th style="padding: 8px 10px; text-align: left; font-weight: 600; color: #475569;">#</th>
              <th style="padding: 8px 10px; text-align: left; font-weight: 600; color: #475569;">Item Summary / Details</th>
              <th style="padding: 8px 10px; text-align: center; font-weight: 600; color: #475569;">Qty</th>
              <th style="padding: 8px 10px; text-align: right; font-weight: 600; color: #475569;">Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px;">1</td>
              <td style="padding: 10px;"><strong>${summary}</strong></td>
              <td style="padding: 10px; text-align: center;">1</td>
              <td style="padding: 10px; text-align: right; font-weight: 600;">₹${amount.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
          <div style="max-width: 260px; font-size: 11px; color: #64748b;">
            <div>Thank you for shopping at <strong>${storeName}</strong>!</div>
            <div style="margin-top: 4px;">Goods once sold can be exchanged within 48 hours with invoice.</div>
          </div>
          <div style="width: 200px; font-size: 12px;">
            <div style="display: flex; justify-content: space-between; padding: 4px 0; color: #64748b;">
              <span>Gross Total:</span>
              <span>₹${amount.toLocaleString('en-IN')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 8px 0; border-top: 2px solid #0f172a; margin-top: 6px; font-size: 14px; font-weight: 800; color: #0f172a;">
              <span>Net Paid:</span>
              <span style="color: #4338ca;">₹${amount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px dashed #cbd5e1; padding-top: 16px;">
          <div style="font-size: 10.5px; color: #94a3b8;">
            Generated via ShopSahayak AI Retail Operating System.
          </div>
          <div style="text-align: center; width: 140px;">
            <div style="height: 36px; border-bottom: 1px solid #94a3b8; margin-bottom: 4px;"></div>
            <div style="font-size: 10.5px; color: #475569; font-weight: 600;">Authorized Signatory</div>
          </div>
        </div>
      </div>
    `;

    const area = document.getElementById("invoicePrintArea");
    if (area) area.innerHTML = html;

    const modal = document.getElementById("customerInvoiceModal");
    if (modal) modal.style.display = "flex";
  }

  closeCustomerInvoiceModal() {
    const modal = document.getElementById("customerInvoiceModal");
    if (modal) modal.style.display = "none";
  }

  printInvoicePdf() {
    const printContent = document.getElementById("invoicePrintArea")?.innerHTML;
    if (!printContent) return;

    const printWin = window.open('', '_blank', 'width=800,height=900');
    if (printWin) {
      printWin.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Customer Tax Invoice - ShopSahayak</title>
          <style>
            body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1e293b; line-height: 1.5; background: #fff; margin: 0; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 12mm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
        </html>
      `);
      printWin.document.close();
    } else {
      window.print();
    }
  }
}

window.shopUI = new UIController(window.shopStore, window.shopAiEngine);
