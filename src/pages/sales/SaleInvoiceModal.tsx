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

export const SaleInvoiceModal = ({
  invoice,
  onClose,
}: SaleInvoiceModalProps) => {
  if (!invoice) return null;

  const { sale } = invoice;
  const date = new Date(invoice.issueDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const downloadPdf = () => {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const left = 18;
    let y = 20;
    pdf.setFontSize(20);
    pdf.setTextColor(17, 24, 39);
    pdf.text(invoice.company.name, left, y);
    pdf.setFontSize(11);
    pdf.setTextColor(75, 85, 99);
    pdf.text("SALES INVOICE", left, y + 7);
    pdf.setTextColor(17, 24, 39);
    pdf.text(`Invoice: ${invoice.invoiceNumber}`, 135, y);
    pdf.text(`Date: ${date}`, 135, y + 7);
    y += 25;
    pdf.setFillColor(250, 248, 238);
    pdf.rect(left, y, 174, 20, "F");
    pdf.setFontSize(10);
    pdf.text("BILL TO", left + 5, y + 7);
    pdf.setFontSize(12);
    pdf.text(
      invoice.customer?.name || sale.partyName || "Walk-in Customer",
      left + 5,
      y + 14,
    );
    y += 32;
    pdf.setFillColor(212, 175, 55);
    pdf.rect(left, y, 174, 9, "F");
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(9);
    pdf.text("PRODUCT", left + 4, y + 6);
    pdf.text("VARIANTS", left + 65, y + 6);
    pdf.text("QTY", left + 128, y + 6);
    pdf.text("SALE PRICE", left + 145, y + 6);
    y += 15;
    const variantLines = pdf.splitTextToSize(
      `Brand: ${names(sale.brands)}\nColor: ${names(sale.colors)}\nSize: ${names(sale.sizes)}`,
      58,
    );
    pdf.setFontSize(9);
    pdf.text(`${sale.productName} (${sale.productCode})`, left + 4, y);
    pdf.text(variantLines, left + 65, y);
    pdf.text(`${sale.quantity} ${sale.unit}`, left + 128, y);
    pdf.text(currency(sale.salePrice), left + 145, y);
    y += Math.max(14, variantLines.length * 4 + 5);
    pdf.setDrawColor(229, 231, 235);
    pdf.line(left, y, left + 174, y);
    y += 10;
    pdf.setFontSize(10);
    pdf.text(`Paid Amount: ${currency(sale.paidAmount)}`, left, y);
    pdf.text(`Payment Status: ${sale.paymentStatus}`, left + 90, y);
    y += 12;
    if (sale.remarks) {
      pdf.setFontSize(9);
      pdf.text(`Remarks: ${sale.remarks}`, left, y);
      y += 10;
    }
    pdf.setTextColor(75, 85, 99);
    pdf.setFontSize(9);
    pdf.text("Thank you for your business.", left, 280);
    pdf.save(`${invoice.invoiceNumber}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
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
          <article className="mx-auto max-w-3xl bg-white p-8 shadow-sm">
            <header className="flex items-start justify-between border-b-2 border-primary pb-6">
              <div className="flex items-center gap-4">
                {invoice.company.logoUrl && (
                  <img
                    src={invoice.company.logoUrl}
                    alt="Company logo"
                    className="size-14 rounded-lg object-contain"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-secondary">
                    {invoice.company.name}
                  </h1>
                  <p className="mt-1 text-sm font-semibold tracking-wide text-primary-dark">
                    SALES INVOICE
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-text-secondary">
                <p className="font-bold text-secondary">
                  {invoice.invoiceNumber}
                </p>
                <p className="mt-1">Issued: {date}</p>
              </div>
            </header>
            <section className="mt-6 rounded-lg bg-primary-light/40 p-4">
              <p className="text-xs font-bold tracking-wide text-text-secondary">
                BILL TO
              </p>
              <p className="mt-1 text-lg font-semibold text-secondary">
                {invoice.customer?.name || sale.partyName || "Walk-in Customer"}
              </p>
            </section>
            <section className="mt-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-primary text-secondary">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Color</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3 text-right">Sale Price</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-secondary">
                        {sale.productName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {sale.productCode}
                      </p>
                    </td>
                    <td className="px-4 py-4">{names(sale.brands)}</td>
                    <td className="px-4 py-4">{names(sale.colors)}</td>
                    <td className="px-4 py-4">{names(sale.sizes)}</td>
                    <td className="px-4 py-4">
                      {sale.quantity} {sale.unit}
                    </td>
                    <td className="px-4 py-4 text-right font-semibold">
                      {currency(sale.salePrice)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </section>
            <section className="ml-auto mt-6 max-w-sm space-y-2 border-t border-gray-200 pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Paid Amount</span>
                <span className="font-semibold">
                  {currency(sale.paidAmount)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Payment Status</span>
                <span className="font-semibold">{sale.paymentStatus}</span>
              </div>
            </section>
            {sale.remarks && (
              <section className="mt-6 border-t border-gray-200 pt-4 text-sm">
                <p className="font-semibold text-secondary">Remarks</p>
                <p className="mt-1 text-text-secondary">{sale.remarks}</p>
              </section>
            )}
            <footer className="mt-10 border-t border-gray-200 pt-4 text-center text-xs text-text-secondary">
              Thank you for your business.
            </footer>
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
