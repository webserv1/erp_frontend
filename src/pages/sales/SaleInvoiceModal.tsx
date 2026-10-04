import { jsPDF } from "jspdf";
import { Download, X } from "lucide-react";
import { Button } from "../../components/ui";
import type { SaleInvoice } from "../../services/sale.api";

interface SaleInvoiceModalProps {
  invoice: SaleInvoice | null;
  onClose: () => void;
}

const names = (items: { name: string }[]) =>
  items.map((item) => item.name).join(", ") || "-";
const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
const unitMultiplier = (unit: "PIECES" | "DOZEN") => (unit === "DOZEN" ? 12 : 1);
const compactLine = (...parts: Array<string | null | undefined>) =>
  parts.filter((part) => part && String(part).trim()).join(", ");
const isSqarsCompany = (name?: string | null) =>
  String(name || "").trim().toLowerCase() === "sqars garments";
const getInvoiceLogoSrc = (invoice: SaleInvoice) =>
  invoice.company.logoUrl || (isSqarsCompany(invoice.company.name) ? "/sqars-logo.png.jpeg" : null);
const pdfCurrency = (value: number) =>
  `INR ${(Number(value) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const readImageDataUrl = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const SaleInvoiceModal = ({
  invoice,
  onClose,
}: SaleInvoiceModalProps) => {
  if (!invoice) return null;

  const { sale } = invoice;
  const saleItems =
    sale.items?.length > 0
      ? sale.items
      : [
          {
            id: sale.id,
            productCode: sale.productCode,
            productName: sale.productName,
            quantity: sale.quantity,
            unit: sale.unit,
            salePrice: sale.salePrice,
            totalSalePrice:
              sale.totalSalePrice ||
              sale.quantity * unitMultiplier(sale.unit) * sale.salePrice,
            brands: sale.brands,
            colors: sale.colors,
            sizes: sale.sizes,
          },
        ];
  const netTotalSalePrice =
    sale.netTotalSalePrice ||
    saleItems.reduce((sum, item) => sum + item.totalSalePrice, 0);
  const discount = Number(sale.discount) || 0;
  const transport = Number(sale.transport) || 0;
  const totalWithTransport = netTotalSalePrice + transport;
  const remainingAmount = Number(sale.remainingAmount) || 0;
  const logoSrc = getInvoiceLogoSrc(invoice);
  const date = new Date(invoice.issueDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const downloadPdf = async () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const left = 15;
    const right = 195;
    const lineGap = 4;
    const writeRight = (text: string, x: number, yAxis: number) =>
      pdf.text(text, x - pdf.getTextWidth(text), yAxis);
    const logoDataUrl = logoSrc ? await readImageDataUrl(logoSrc) : null;
    let y = 18;
    const logoSize = 12;
    const companyTextX = left + (logoDataUrl ? logoSize + 3 : 0);

    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, "JPEG", left, y - 3, logoSize, logoSize);
      } catch {
        // Ignore logo rendering errors and continue generating invoice.
      }
    }

    pdf.setFontSize(12);
    pdf.setTextColor(17, 24, 39);
    pdf.text(invoice.company.name, companyTextX, y);
    pdf.setFontSize(8.5);
    pdf.setTextColor(75, 85, 99);
    pdf.text("Sales Invoice", companyTextX, y + 5);
    let companyBottomY = y + 5;

    const companyAddress = compactLine(
      invoice.company.address,
      invoice.company.mobile ? `Mob: ${invoice.company.mobile}` : null,
      invoice.company.email ? `Email: ${invoice.company.email}` : null,
    );
    if (companyAddress) {
      const lines = pdf.splitTextToSize(companyAddress, 90);
      pdf.text(lines, companyTextX, y + 9);
      companyBottomY = y + 9 + (lines.length - 1) * 3.8;
    }

    const invoiceBoxX = 125;
    const invoiceBoxW = 70;
    const invoiceBoxTop = y + 8;
    const invoiceBoxBottom = invoiceBoxTop + 24;
    pdf.setFontSize(22);
    pdf.setTextColor(107, 114, 128);
    pdf.text("INVOICE", 146, y + 2);
    pdf.setDrawColor(156, 163, 175);
    pdf.rect(invoiceBoxX, invoiceBoxTop, invoiceBoxW, 24);
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text("INVOICE #", invoiceBoxX + 4, y + 14);
    pdf.text(String(invoice.invoiceNumber), invoiceBoxX + 28, y + 14);
    pdf.line(invoiceBoxX, y + 17, invoiceBoxX + invoiceBoxW, y + 17);
    pdf.text("DATE", invoiceBoxX + 4, y + 22);
    pdf.text(date, invoiceBoxX + 28, y + 22);
    y = Math.max(companyBottomY, invoiceBoxBottom) + 12;

    pdf.setFillColor(229, 231, 235);
    pdf.rect(left, y, 88, 8, "F");
    pdf.setFontSize(9);
    pdf.setTextColor(17, 24, 39);
    pdf.text("BILL TO", left + 3, y + 5.5);
    y += 11;
    pdf.setFontSize(10);
    pdf.text(invoice.customer?.name || sale.partyName || "Walk-in Customer", left, y);
    y += 5;
    if (invoice.customer?.shopName) {
      pdf.text(invoice.customer.shopName, left, y);
      y += 4;
    }
    if (invoice.customer?.address) {
      pdf.text(invoice.customer.address, left, y);
      y += 4;
    }
    if (invoice.customer) {
      const cityLine = compactLine(
        invoice.customer.city,
        invoice.customer.state,
        invoice.customer.country,
        invoice.customer.pincode,
      );
      if (cityLine) {
        pdf.text(cityLine, left, y);
        y += 4;
      }
      const contactLine = compactLine(
        invoice.customer.mobile ? `Mob: ${invoice.customer.mobile}` : null,
        invoice.customer.email ? `Email: ${invoice.customer.email}` : null,
      );
      if (contactLine) {
        pdf.text(contactLine, left, y);
        y += 4;
      }
    }
    y += 11;

    const tableTop = y;
    const col1 = left;
    const col2 = 130;
    const col3 = 148;
    const col4 = 173;
    const col5 = right;
    pdf.setFillColor(229, 231, 235);
    pdf.rect(col1, y, col5 - col1, 8, "F");
    pdf.setFontSize(9);
    pdf.text("DESCRIPTION", col1 + 3, y + 5.5);
    pdf.text("QTY", col2 + 2, y + 5.5);
    pdf.text("UNIT PRICE", col3 + 2, y + 5.5);
    pdf.text("AMOUNT", col4 + 2, y + 5.5);
    y += 11;
    pdf.setFontSize(8.5);

    saleItems.forEach((item) => {
      const description = `${item.productName} (${item.productCode})\nBrand: ${names(item.brands)} | Color: ${names(item.colors)} | Size: ${names(item.sizes)}`;
      const lines = pdf.splitTextToSize(description, col2 - col1 - 6);
      const rowHeight = Math.max(12, lines.length * 4 + 2);
      pdf.text(lines, col1 + 3, y);
      pdf.text(`${item.quantity} ${item.unit}`, col2 + 2, y);
      writeRight(pdfCurrency(item.salePrice), col4 - 2, y);
      writeRight(pdfCurrency(item.totalSalePrice), col5 - 2, y);
      y += rowHeight;
      pdf.setDrawColor(229, 231, 235);
      pdf.line(col1, y, col5, y);
      y += 3;
    });

    const tableBottom = y - 3;
    pdf.setDrawColor(209, 213, 219);
    pdf.rect(col1, tableTop, col5 - col1, tableBottom - tableTop);
    pdf.line(col2, tableTop, col2, tableBottom);
    pdf.line(col3, tableTop, col3, tableBottom);
    pdf.line(col4, tableTop, col4, tableBottom);

    y += 3;
    pdf.setFontSize(10);
    pdf.setTextColor(17, 24, 39);
    const summaryLabelX = 130;
    const summaryValueX = right - 2;
    pdf.text("Grand Total Amount:", summaryLabelX, y);
    writeRight(pdfCurrency(netTotalSalePrice), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Transport:", summaryLabelX, y);
    writeRight(pdfCurrency(transport), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Total With Transport:", summaryLabelX, y);
    writeRight(pdfCurrency(totalWithTransport), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Paid Amount:", summaryLabelX, y);
    writeRight(pdfCurrency(sale.paidAmount), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Discount:", summaryLabelX, y);
    writeRight(pdfCurrency(discount), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Remaining Amount:", summaryLabelX, y);
    writeRight(pdfCurrency(remainingAmount), summaryValueX, y);
    y += lineGap + 1;
    pdf.text("Payment Status:", summaryLabelX, y);
    writeRight(String(sale.paymentStatus || "-"), summaryValueX, y);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h3 className="text-lg font-bold text-secondary">Invoice Preview</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto bg-gray-100 p-6">
          <article className="mx-auto max-w-4xl bg-white p-8 shadow-sm">
            <header className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {logoSrc && (
                  <img
                    src={logoSrc}
                    alt={invoice.company.name}
                    className="size-12 rounded-full border border-primary/30 object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-secondary">
                    {invoice.company.name}
                  </h1>
                  <p className="mt-1 text-sm text-text-secondary">Sales Invoice</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold tracking-wide text-gray-500">
                  INVOICE
                </p>
                <div className="mt-3 border border-gray-300 text-sm">
                  <div className="grid grid-cols-2 border-b border-gray-300 bg-gray-100">
                    <span className="px-3 py-1 font-semibold">INVOICE #</span>
                    <span className="px-3 py-1">{invoice.invoiceNumber}</span>
                  </div>
                  <div className="grid grid-cols-2">
                    <span className="px-3 py-1 font-semibold">DATE</span>
                    <span className="px-3 py-1">{date}</span>
                  </div>
                </div>
              </div>
            </header>

            <section className="mt-6 grid gap-4 md:grid-cols-2">
              <div>
                <p className="bg-gray-100 px-3 py-1 text-sm font-semibold text-secondary">
                  FROM
                </p>
                <div className="mt-2 space-y-1 text-sm text-secondary">
                  <p className="font-semibold">{invoice.company.name}</p>
                  {invoice.company.address && <p>{invoice.company.address}</p>}
                  {invoice.company.contactName && (
                    <p>Contact: {invoice.company.contactName}</p>
                  )}
                  {invoice.company.mobile && <p>Mob: {invoice.company.mobile}</p>}
                  {invoice.company.email && <p>Email: {invoice.company.email}</p>}
                </div>
              </div>
              <div>
              <p className="bg-gray-100 px-3 py-1 text-sm font-semibold text-secondary">
                BILL TO
              </p>
                <div className="mt-2 space-y-1 text-sm text-secondary">
                  <p className="font-semibold">
                    {invoice.customer?.name || sale.partyName || "Walk-in Customer"}
                  </p>
                  {invoice.customer?.shopName && <p>{invoice.customer.shopName}</p>}
                  {invoice.customer?.address && <p>{invoice.customer.address}</p>}
                  {(invoice.customer?.city ||
                    invoice.customer?.state ||
                    invoice.customer?.country ||
                    invoice.customer?.pincode) && (
                    <p>
                      {compactLine(
                        invoice.customer?.city,
                        invoice.customer?.state,
                        invoice.customer?.country,
                        invoice.customer?.pincode,
                      )}
                    </p>
                  )}
                  {invoice.customer?.mobile && <p>Mob: {invoice.customer.mobile}</p>}
                  {invoice.customer?.email && <p>Email: {invoice.customer.email}</p>}
                </div>
              </div>
            </section>

            <section className="mt-8 overflow-x-auto">
              <table className="w-full border border-gray-300 text-left text-sm">
                <thead className="bg-gray-100 text-secondary">
                  <tr>
                    <th className="w-[58%] border-r border-gray-300 px-3 py-2">DESCRIPTION</th>
                    <th className="w-[12%] border-r border-gray-300 px-3 py-2">QTY</th>
                    <th className="w-[15%] border-r border-gray-300 px-3 py-2 text-right">UNIT PRICE</th>
                    <th className="w-[15%] px-3 py-2 text-right">AMOUNT</th>
                  </tr>
                </thead>
                <tbody>
                  {saleItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-200 align-top">
                      <td className="border-r border-gray-200 px-3 py-3">
                        <p className="font-semibold text-secondary">
                          {item.productName} ({item.productCode})
                        </p>
                        <p className="text-xs text-text-secondary">
                          Brand: {names(item.brands)} | Color: {names(item.colors)} | Size: {names(item.sizes)}
                        </p>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 text-right font-semibold">
                        {currency(item.salePrice)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold">
                        {currency(item.totalSalePrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="ml-auto mt-6 max-w-sm space-y-2 text-sm">
              <div className="flex justify-between border-b border-gray-200 pb-1">
                <span className="text-text-secondary">Grand Total Amount</span>
                <span className="font-semibold">{currency(netTotalSalePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Paid Amount</span>
                <span className="font-semibold">{currency(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Transport</span>
                <span className="font-semibold">{currency(transport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total With Transport</span>
                <span className="font-semibold">{currency(totalWithTransport)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Discount</span>
                <span className="font-semibold">{currency(discount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Remaining Amount</span>
                <span className="font-semibold">{currency(remainingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status</span>
                <span className="font-semibold">{sale.paymentStatus}</span>
              </div>
            </section>

          </article>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={downloadPdf}>
            <Download size={16} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
};
