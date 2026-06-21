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
}
