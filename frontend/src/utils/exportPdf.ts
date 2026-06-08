import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export async function exportElementToPdf(elementId: string, filename: string) {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    // Add a temporary class to optimize for PDF
    element.classList.add("pdf-export-mode");
    
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#080c10", // Match var(--bg)
    });
    
    element.classList.remove("pdf-export-mode");

    const imgData = canvas.toDataURL("image/png");
    
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    // If it's a very long document, we could split pages, but for now we scale it
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Cleanup just in case
    element.classList.remove("pdf-export-mode");
  }
}
