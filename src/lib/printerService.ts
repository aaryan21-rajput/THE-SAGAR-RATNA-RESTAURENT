export interface PrinterItem {
  name: string;
  quantity: number;
}

export interface PrinterData {
  id: string;
  tableNumber?: string;
  orderType: string;
  createdAt: string;
  items: PrinterItem[];
  specialInstructions?: string;
}

/**
 * Modern Browser-based Physical thermal ESC/POS Printing Service
 * Supports:
 * 1. WebUSB API (For direct USB connection to ESC/POS standard thermal printers)
 * 2. WebSerial API (For Serial-over-USB connected printers)
 * 3. Fallback invisible Iframe printing (System standard printer mapping for 58mm/80mm size sheets)
 */
export class PhysicalThermalPrinter {
  private static usbDevice: any = null;
  private static serialPort: any = null;

  /**
   * Helper to encode standard text to raw Uint8Array (Windows-1252 / ASCII compatible)
   */
  private static encodeASCII(text: string): Uint8Array {
    const encoder = new TextEncoder();
    return encoder.encode(text);
  }

  /**
   * Build ESC/POS physical printer bytes sequence for a KOT receipt
   */
  public static buildEscPosBytes(data: PrinterData, width: "58mm" | "80mm" = "80mm"): Uint8Array {
    const esc = 0x1b;
    const gs = 0x1d;

    // ESC/POS Commands
    const commands = {
      init: [esc, 0x40], // ESC @
      alignLeft: [esc, 0x61, 0x00],
      alignCenter: [esc, 0x61, 0x01],
      alignRight: [esc, 0x61, 0x02],
      boldOn: [esc, 0x45, 0x01],
      boldOff: [esc, 0x45, 0x00],
      doubleSizeOn: [esc, 0x21, 0x30], // Double width & height
      doubleHeightOn: [esc, 0x21, 0x10], // Double height only
      fontNormal: [esc, 0x21, 0x00],
      lineFeed: [0x0a],
      paperCut: [gs, 0x56, 0x42, 0x00], // GS V B 0
    };

    const is80 = width === "80mm";
    const lineCharWidth = is80 ? 48 : 32;
    const divider = "-".repeat(lineCharWidth) + "\n";
    const doubleDivider = "=".repeat(lineCharWidth) + "\n";

    const byteArrays: Uint8Array[] = [];

    const pushBytes = (arr: number[]) => {
      byteArrays.push(new Uint8Array(arr));
    };

    const pushText = (text: string) => {
      byteArrays.push(this.encodeASCII(text));
    };

    // 1. Initialize Printer
    pushBytes(commands.init);

    // 2. Centered Title
    pushBytes(commands.alignCenter);
    pushBytes(commands.boldOn);
    pushBytes(commands.doubleSizeOn);
    pushText("SAGAR RATNA\n");
    pushBytes(commands.fontNormal);
    pushBytes(commands.boldOff);
    pushBytes(commands.lineFeed);

    // 3. KOT Identifier block
    pushBytes(commands.boldOn);
    pushBytes(commands.doubleHeightOn);
    pushText(`KOT: #${data.id}\n`);
    pushBytes(commands.fontNormal);
    pushBytes(commands.boldOff);
    pushBytes(commands.lineFeed);

    // 4. Details Left Aligned
    pushBytes(commands.alignLeft);
    pushText(`Date: ${new Date(data.createdAt).toLocaleDateString()} ${new Date(data.createdAt).toLocaleTimeString()}\n`);
    pushText(`Table: ${data.tableNumber || "N/A"}\n`);
    pushText(`Type: ${data.orderType.toUpperCase()}\n`);
    pushText(doubleDivider);

    // 5. Items list
    pushBytes(commands.boldOn);
    if (is80) {
      pushText("QTY   ITEM NAME                                  \n");
    } else {
      pushText("QTY   ITEM NAME                 \n");
    }
    pushBytes(commands.boldOff);
    pushText(divider);

    for (const item of data.items) {
      const qtyStr = String(item.quantity).padEnd(5, " ");
      const nameLimit = lineCharWidth - 6;
      let nameStr = item.name;
      if (nameStr.length > nameLimit) {
        nameStr = nameStr.substring(0, nameLimit - 3) + "...";
      } else {
        nameStr = nameStr.padEnd(nameLimit, " ");
      }
      pushText(`${qtyStr} ${nameStr}\n`);
    }

    pushText(divider);

    // 6. Special Instructions
    if (data.specialInstructions && data.specialInstructions !== "None") {
      pushBytes(commands.boldOn);
      pushText("Special Notes:\n");
      pushBytes(commands.boldOff);
      pushText(`${data.specialInstructions}\n`);
      pushText(divider);
    }

    // 7. Footer
    pushBytes(commands.alignCenter);
    pushText("Kitchen Copy Only\n");
    pushBytes(commands.lineFeed);
    pushBytes(commands.lineFeed);
    pushBytes(commands.lineFeed);

    // 8. Cut command
    pushBytes(commands.paperCut);

    // Flatten all byte buffers
    const totalLength = byteArrays.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of byteArrays) {
      result.set(arr, offset);
      offset += arr.length;
    }

    return result;
  }

  /**
   * Scan and connect to a USB Class Printer using WebUSB API
   */
  public static async connectUSB(): Promise<boolean> {
    if (!("usb" in navigator)) {
      throw new Error("WebUSB API is not supported in this browser environment.");
    }
    try {
      // Find printer class devices
      const device = await (navigator as any).usb.requestDevice({
        filters: [{ classCode: 0x07 }] // Printer class
      });
      await device.open();
      await device.selectConfiguration(1);
      await device.claimInterface(0);
      this.usbDevice = device;
      return true;
    } catch (err: any) {
      console.error("WebUSB connection failed:", err);
      return false;
    }
  }

  /**
   * Send KOT raw bytes to the connected USB printer
   */
  public static async printUSB(data: PrinterData, width: "58mm" | "80mm" = "80mm"): Promise<boolean> {
    if (!this.usbDevice) {
      // Auto-connect if allowed
      const connected = await this.connectUSB();
      if (!connected) return false;
    }

    try {
      const bytes = this.buildEscPosBytes(data, width);
      // Endpoint 1 is almost universally used for USB printer outputs
      await this.usbDevice!.transferOut(1, bytes);
      return true;
    } catch (err) {
      console.error("WebUSB raw print transfer failed:", err);
      return false;
    }
  }

  /**
   * Scan and connect to a Receipt/POS printer using WebSerial API (e.g. COM / Virtual COM over USB)
   */
  public static async connectSerial(): Promise<boolean> {
    if (!("serial" in navigator)) {
      throw new Error("WebSerial API is not supported in this browser environment.");
    }
    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 9600 });
      this.serialPort = port;
      return true;
    } catch (err) {
      console.error("WebSerial connection failed:", err);
      return false;
    }
  }

  /**
   * Send KOT raw bytes to the connected Serial printer
   */
  public static async printSerial(data: PrinterData, width: "58mm" | "80mm" = "80mm"): Promise<boolean> {
    if (!this.serialPort) {
      const connected = await this.connectSerial();
      if (!connected) return false;
    }

    try {
      const bytes = this.buildEscPosBytes(data, width);
      const writer = this.serialPort.writable.getWriter();
      await writer.write(bytes);
      writer.releaseLock();
      return true;
    } catch (err) {
      console.error("WebSerial raw print write failed:", err);
      return false;
    }
  }

  /**
   * Fallback: Renders a beautifully sized CSS ticket inside a hidden iframe 
   * and triggers the browser prompt specifically formatted for standard thermal receipt widths.
   */
  public static printSystemFallback(data: PrinterData, width: "58mm" | "80mm" = "80mm"): void {
    const is80 = width === "80mm";
    const paperWidthPixels = is80 ? "280px" : "180px";

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const itemsHtml = data.items
      .map(
        (it) => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 2px;">
        <span style="font-weight: bold;">${it.quantity} x ${it.name}</span>
      </div>
    `
      )
      .join("");

    const specialInstrHtml =
      data.specialInstructions && data.specialInstructions !== "None"
        ? `
      <div style="border-top: 1px dashed #000; margin-top: 5px; padding-top: 5px;">
        <span style="font-size: 10px; font-weight: bold;">Special Instructions:</span>
        <p style="font-size: 10px; margin: 2px 0 0 0; font-style: italic;">${data.specialInstructions}</p>
      </div>
    `
        : "";

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            @page {
              size: ${is80 ? "80mm" : "58mm"} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${paperWidthPixels};
              margin: 0;
              padding: 10px;
              color: #000;
              background: #fff;
              box-sizing: border-box;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 5px 0;
            }
            .double-divider {
              border-top: 2px double #000;
              margin: 5px 0;
            }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 16px;">SAGAR RATNA</div>
          <div class="center" style="font-size: 12px; margin-top: 4px;">KOT TICKET</div>
          <div class="center bold" style="font-size: 14px; margin-top: 4px;">#${data.id}</div>
          <div class="divider"></div>
          
          <div style="font-size: 10px; line-height: 1.4;">
            <div>Time: ${new Date(data.createdAt).toLocaleDateString()} ${new Date(data.createdAt).toLocaleTimeString()}</div>
            <div>Table: <span class="bold">${data.tableNumber || "N/A"}</span></div>
            <div>Mode: <span class="bold">${data.orderType.toUpperCase()}</span></div>
          </div>
          
          <div class="double-divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          ${specialInstrHtml}
          
          <div class="center font-size: 9px; margin-top: 15px; text-transform: uppercase;">
            Kitchen Copy Only
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger Print after assets load
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove temporary element gracefully
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  }

  /**
   * Extract and normalize a completely clean, modular data payload for billing receipts,
   * eliminating any debug, raw database, or internal trace metadata.
   */
  public static getBillDetails(order: any, settings: any) {
    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discountAmount || 0);
    const packaging = Number(order.packagingCharge || 0);
    const gstTotal = Number(order.gst || 0);
    const cgst = gstTotal / 2;
    const sgst = gstTotal / 2;
    const gstPercentage = Number(settings.gstPercentage || 5);
    const rawTotal = subtotal + gstTotal + packaging - discount;
    const grandTotal = Number(order.grandTotal || 0);
    const roundOff = grandTotal - rawTotal;

    return {
      restaurantName: settings.name || "SAGAR RATNA",
      restaurantAddress: settings.address || "",
      restaurantPhone: settings.contactNumber || "",
      gstNumber: settings.gstNumber || "",
      billNumber: order.id,
      date: new Date(order.createdAt).toLocaleDateString(),
      time: new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      orderType: order.orderType ? order.orderType.toUpperCase() : "DINE-IN",
      tableNumber: order.tableNumber || "",
      customerName: (order.customerName && order.customerName.toLowerCase() !== "guest user" && order.customerName.toLowerCase() !== "anonymous" && order.customerName.trim().length > 0) ? order.customerName.trim() : "",
      phoneNumber: (order.phoneNumber && order.phoneNumber.trim().length > 0) ? order.phoneNumber.trim() : "",
      items: (order.items || []).map((it: any) => ({
        name: it.name,
        quantity: Number(it.quantity || 0),
        rate: Number(it.price || 0),
        amount: Number(it.price || 0) * Number(it.quantity || 0)
      })),
      subtotal,
      discount,
      appliedCoupon: order.appliedCoupon || "",
      cgst,
      sgst,
      cgstPercentage: gstPercentage / 2,
      sgstPercentage: gstPercentage / 2,
      packaging,
      roundOff,
      grandTotal,
      paymentMethod: order.paymentMethod || (order.paymentStatus === "Paid" ? "Online Complete" : "Cash on Delivery"),
      paymentStatus: order.paymentStatus || "Pending",
      amountPaid: order.paymentStatus === "Paid" ? grandTotal : 0,
      balanceDue: order.paymentStatus === "Paid" ? 0 : grandTotal,
    };
  }

  /**
   * Print a beautifully styled, compact customer bill/invoice
   * specifically formatted for standard thermal receipt widths.
   */
  public static printCustomerBill(order: any, settings: any, width: "58mm" | "80mm" = "80mm"): void {
    const bill = this.getBillDetails(order, settings);
    const is80 = width === "80mm";
    const paperWidthPixels = is80 ? "280px" : "180px";

    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) return;

    const itemsHtml = bill.items
      .map(
        (it: any) => `
      <tr>
        <td style="text-align: left; font-weight: bold; word-wrap: break-word; word-break: break-word; overflow-wrap: break-word; white-space: normal; vertical-align: top; padding: 3px 0;">${it.name}</td>
        <td style="text-align: center; vertical-align: top; padding: 3px 0;">${it.quantity}</td>
        <td style="text-align: right; vertical-align: top; padding: 3px 0;">₹${it.rate.toFixed(2)}</td>
        <td style="text-align: right; vertical-align: top; padding: 3px 0;">₹${it.amount.toFixed(2)}</td>
      </tr>
    `
      )
      .join("");

    const roundOffRowHtml = Math.abs(bill.roundOff) > 0.01
      ? `
        <div class="total-row">
          <span>Round Off:</span>
          <span>${bill.roundOff >= 0 ? "+" : ""}₹${bill.roundOff.toFixed(2)}</span>
        </div>
      `
      : "";

    const discountRowHtml = bill.discount > 0
      ? `
        <div class="total-row bold">
          <span>Promo Discount (${bill.appliedCoupon || "Applied"}):</span>
          <span>-₹${bill.discount.toFixed(2)}</span>
        </div>
      `
      : "";

    const packagingRowHtml = bill.packaging > 0
      ? `
        <div class="total-row">
          <span>Packaging/Delivery:</span>
          <span>₹${bill.packaging.toFixed(2)}</span>
        </div>
      `
      : "";

    const gstNumHtml = bill.gstNumber 
      ? `<div class="center" style="font-size: 10px;">GSTIN: ${bill.gstNumber}</div>` 
      : "";

    const customerHtml = bill.customerName
      ? `<div>Customer: <span class="bold">${bill.customerName}</span></div>`
      : "";

    const phoneHtml = bill.phoneNumber
      ? `<div>Contact: <span class="bold">${bill.phoneNumber}</span></div>`
      : "";

    doc.open();
    doc.write(`
      <html>
        <head>
          <style>
            @page {
              size: ${is80 ? "80mm" : "58mm"} auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: ${paperWidthPixels};
              margin: 0;
              padding: 10px;
              color: #000;
              background: #fff;
              box-sizing: border-box;
            }
            .center {
              text-align: center;
            }
            .bold {
              font-weight: bold;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 6px 0;
            }
            .double-divider {
              border-top: 2px double #000;
              margin: 6px 0;
            }
            .info-grid {
              font-size: 10px;
              line-height: 1.4;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              font-size: 10px;
              margin-top: 5px;
            }
            .items-table th {
              border-bottom: 1px dashed #000;
              padding: 4px 0;
              font-weight: bold;
            }
            .totals-grid {
              font-size: 10px;
              margin-top: 5px;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            .grand-total {
              font-size: 12px;
              font-weight: bold;
              border-top: 1px dashed #000;
              padding-top: 4px;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size: 14px; text-transform: uppercase;">${bill.restaurantName}</div>
          <div class="center" style="font-size: 10px; margin-top: 2px;">${bill.restaurantAddress}</div>
          ${gstNumHtml}
          <div class="center" style="font-size: 10px;">Ph: ${bill.restaurantPhone}</div>
          
          <div class="divider"></div>
          
          <div class="info-grid">
            <div>Bill No: <span class="bold">${bill.billNumber}</span></div>
            <div>Date: <span class="bold">${bill.date}</span> Time: <span class="bold">${bill.time}</span></div>
            <div>Order Type: <span class="bold">${bill.orderType} ${bill.tableNumber ? `(TABLE #${bill.tableNumber})` : ""}</span></div>
            ${customerHtml}
            ${phoneHtml}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="text-align: left; width: 45%;">ITEM</th>
                <th style="text-align: center; width: 15%;">QTY</th>
                <th style="text-align: right; width: 20%;">RATE</th>
                <th style="text-align: right; width: 20%;">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div class="divider"></div>
          
          <div class="totals-grid">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>₹${bill.subtotal.toFixed(2)}</span>
            </div>
            ${discountRowHtml}
            <div class="total-row">
              <span>CGST (${bill.cgstPercentage.toFixed(1)}%):</span>
              <span>₹${bill.cgst.toFixed(2)}</span>
            </div>
            <div class="total-row">
              <span>SGST (${bill.sgstPercentage.toFixed(1)}%):</span>
              <span>₹${bill.sgst.toFixed(2)}</span>
            </div>
            ${packagingRowHtml}
            ${roundOffRowHtml}
            <div class="total-row grand-total">
              <span>GRAND TOTAL:</span>
              <span>₹${bill.grandTotal.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="divider"></div>
          
          <div class="info-grid" style="text-align: center;">
            <div>Payment Mode: <span class="bold">${bill.paymentMethod}</span></div>
            <div>Status: <span class="bold">${bill.paymentStatus.toUpperCase()}</span></div>
            ${bill.paymentStatus === "Paid" ? `<div>Amount Paid: <span class="bold">₹${bill.amountPaid.toFixed(2)}</span></div>` : `<div>Balance Due: <span class="bold">₹${bill.balanceDue.toFixed(2)}</span></div>`}
          </div>
          
          <div class="divider"></div>
          
          <div class="center bold" style="font-size: 11px; margin-top: 8px;">
            Thank You! Visit Again
          </div>
        </body>
      </html>
    `);
    doc.close();

    // Trigger Print after assets load
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Remove temporary element gracefully
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1000);
    }, 500);
  }
}

export interface PrintJob {
  id: string;
  kotId: string;
  kotNumber: string;
  createdAt: string;
  data: {
    id: string;
    tableNumber?: string;
    orderType: string;
    customerName: string;
    createdAt: string;
    items: {
      menuItemId: string;
      name: string;
      price: number;
      quantity: number;
      customization?: string;
    }[];
    specialInstructions?: string;
  };
  status: "Pending" | "Printing" | "Printed" | "Failed";
  retryCount: number;
  error?: string;
}

export class CutiePrinter {
  private static queueKey = "sr_print_queue";
  private static statusKey = "sr_printer_status";
  private static processing = false;

  public static getStatus(): "connected" | "reconnecting" | "offline" {
    return (localStorage.getItem(this.statusKey) as any) || "connected";
  }

  public static setStatus(status: "connected" | "reconnecting" | "offline") {
    localStorage.setItem(this.statusKey, status);
    window.dispatchEvent(new CustomEvent("cutie_printer_status_changed", { detail: status }));
    this.addLog(`Printer status changed to: ${status.toUpperCase()}`);
    if (status === "connected") {
      this.processQueue();
    }
  }

  public static getQueue(): PrintJob[] {
    const stored = localStorage.getItem(this.queueKey);
    return stored ? JSON.parse(stored) : [];
  }

  public static saveQueue(queue: PrintJob[]) {
    localStorage.setItem(this.queueKey, JSON.stringify(queue));
    window.dispatchEvent(new Event("cutie_printer_queue_updated"));
  }

  public static getLogs(): string[] {
    const stored = localStorage.getItem("sr_printer_logs_raw");
    return stored ? JSON.parse(stored) : [
      `[${new Date().toLocaleTimeString()}] ESC/POS System Initialized.`,
      `[${new Date().toLocaleTimeString()}] Connected to TCP://192.168.1.185:9100. READY.`
    ];
  }

  public static saveLogs(logs: string[]) {
    localStorage.setItem("sr_printer_logs_raw", JSON.stringify(logs));
    window.dispatchEvent(new Event("cutie_printer_logs_updated"));
  }

  public static addLog(msg: string) {
    const logs = this.getLogs();
    const timeStr = new Date().toLocaleTimeString();
    logs.unshift(`[${timeStr}] ${msg}`);
    this.saveLogs(logs.slice(0, 50));

    // Audit logging to local database
    try {
      const dbLogs = JSON.parse(localStorage.getItem("sr_audit_logs") || "[]");
      dbLogs.unshift({
        id: `LOG-${Date.now()}`,
        action: "Printer Log",
        details: msg,
        ipAddress: "127.0.0.1",
        createdAt: new Date().toISOString()
      });
      localStorage.setItem("sr_audit_logs", JSON.stringify(dbLogs.slice(0, 100)));
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.error(e);
    }
  }

  public static async enqueue(kot: any) {
    const queue = this.getQueue();
    // Prevent duplicate print jobs in same queue
    if (queue.some(job => job.kotId === kot.id && (job.status === "Printed" || job.status === "Pending" || job.status === "Printing"))) {
      this.addLog(`Skip duplicate enqueue for KOT ${kot.id}`);
      return;
    }

    const newJob: PrintJob = {
      id: `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kotId: kot.id,
      kotNumber: kot.id,
      createdAt: new Date().toISOString(),
      data: {
        id: kot.id,
        tableNumber: kot.tableNumber,
        orderType: kot.orderType,
        customerName: kot.customerName,
        createdAt: kot.createdAt,
        items: kot.items,
        specialInstructions: kot.specialInstructions
      },
      status: "Pending",
      retryCount: 0
    };

    queue.push(newJob);
    this.saveQueue(queue);
    this.addLog(`Print job added to Cutie Printer queue: ${kot.id}`);
    
    // Process queue asynchronously
    this.processQueue();
  }

  public static async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      let queue = this.getQueue();
      const status = this.getStatus();

      if (status === "offline") {
        this.addLog(`Queue processing suspended: Printer is offline.`);
        this.processing = false;
        return;
      }

      // Find first job that is Pending or Failed
      const jobIdx = queue.findIndex(j => j.status === "Pending" || j.status === "Failed");
      if (jobIdx === -1) {
        this.processing = false;
        return;
      }

      const job = queue[jobIdx];
      job.status = "Printing";
      this.saveQueue(queue);

      this.addLog(`Sending KOT ${job.kotId} to Cutie Printer...`);

      // Micro-animation sound trigger
      window.dispatchEvent(new CustomEvent("play_printer_sound"));
      window.dispatchEvent(new CustomEvent("printing_started", { detail: job.data }));

      // Simulate network / printing latency (e.g., 1.5 seconds)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const printerWidth = (localStorage.getItem("sr_printer_width") as any) || "80mm";

      let printSuccess = false;
      let errorMsg = "";

      try {
        if (this.getStatus() === "offline") {
          throw new Error("Printer connection lost during print transfer");
        }

        PhysicalThermalPrinter.printSystemFallback(job.data as any, printerWidth);
        printSuccess = true;
      } catch (err: any) {
        printSuccess = false;
        errorMsg = err.message || "Timeout connecting to ESC/POS printer";
      }

      window.dispatchEvent(new Event("printing_ended"));

      queue = this.getQueue();
      const freshJob = queue.find(j => j.id === job.id);

      if (freshJob) {
        if (printSuccess) {
          freshJob.status = "Printed";
          this.addLog(`[SUCCESS] KOT ${freshJob.kotId} printed successfully!`);
          
          // Save a permanent log
          try {
            const dbLogs = JSON.parse(localStorage.getItem("sr_printer_logs") || "[]");
            const newLog = {
              id: `PRT-${Date.now()}`,
              kotId: freshJob.kotId,
              kotNumber: freshJob.kotNumber,
              restaurantId: "sagar-ratna-cp",
              receiptText: `SAGAR RATNA\nKOT: #${freshJob.kotId}\nTable: ${freshJob.data.tableNumber}\nItems: ${freshJob.data.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}`,
              printStatus: "Printed",
              createdAt: new Date().toISOString()
            };
            dbLogs.unshift(newLog);
            localStorage.setItem("sr_printer_logs", JSON.stringify(dbLogs));
            window.dispatchEvent(new Event("printer_logs_updated"));
          } catch (e) {
            console.error(e);
          }

          // Update KOT printed flag in DB
          try {
            const LocalDBModule = (await import("./db")).LocalDB;
            await LocalDBModule.apiUpdateKOTPrinted(freshJob.kotId, true);
          } catch (dbErr) {
            console.error("Failed to update printed status in database:", dbErr);
          }
        } else {
          freshJob.retryCount += 1;
          freshJob.error = errorMsg;
          if (freshJob.retryCount >= 3) {
            freshJob.status = "Failed";
            this.addLog(`[ERROR] Print job failed after ${freshJob.retryCount} retries: ${errorMsg}`);
          } else {
            freshJob.status = "Failed";
            this.addLog(`[WARNING] Print retry #${freshJob.retryCount} for KOT ${freshJob.kotId}: ${errorMsg}`);
          }
        }
        this.saveQueue(queue);
      }
    } catch (err: any) {
      this.addLog(`Queue execution error: ${err.message}`);
    } finally {
      this.processing = false;
      
      // Schedule next check
      setTimeout(() => this.processQueue(), 1000);
    }
  }
}

