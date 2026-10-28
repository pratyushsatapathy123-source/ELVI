/**
 * ELVI Clinical Health Report PDF Generator
 * 
 * Generates an authentic, beautifully formatted physician-ready PDF document
 * adhering to ELVI design tokens (Cherry #890149, Warm Ink #30232A, Alabaster #F3F3E7)
 * and strict clinical non-diagnostic safeguards.
 */

import { jsPDF } from 'jspdf';
import { GeneratedReportItem, FullReportData } from '../types/elvi';

export function generateHealthReportPdf(
  reportItem: GeneratedReportItem,
  userProfile?: { name: string; email: string }
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const full = reportItem.fullReport;
  const isDemo = Boolean(reportItem.isDemo || full?.isDemo);
  const patientName = userProfile?.name || (isDemo ? 'Demo Patient (Synthetic Fixture)' : 'Elena Vance');
  const patientEmail = userProfile?.email || (isDemo ? 'synthetic.demo@elvi-osfic.test' : 'elena.vance@elvi-osfic.app');

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const cherry = [137, 1, 73]; // #890149
  const warmInk = [48, 35, 42]; // #30232A
  const textMuted = [100, 90, 95];
  const borderLight = [217, 162, 181]; // #D9A2B5
  const bgSoft = [243, 243, 231]; // #F3F3E7

  // Helper for adding new page if needed
  function checkPageBreak(neededMm: number) {
    if (y + neededMm > pageHeight - margin - 15) {
      doc.addPage();
      y = margin;
      drawHeaderWatermark();
    }
  }

  function drawHeaderWatermark() {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text('ELVI Menstrual & Hormonal Health Summary · Private & Consent-Governed (elvi-osfic)', margin, 10);
    doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
    doc.setLineWidth(0.3);
    doc.line(margin, 12, pageWidth - margin, 12);
  }

  // --- Top Header Accent Band ---
  doc.setFillColor(cherry[0], cherry[1], cherry[2]);
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Synthetic Demonstration Notice if applicable
  if (isDemo) {
    doc.setFillColor(234, 220, 224);
    doc.setDrawColor(cherry[0], cherry[1], cherry[2]);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('SYNTHETIC DEMONSTRATION — NOT A REAL PATIENT REPORT', margin + 4, y + 5.5);
    y += 12;
  }

  // Brand Kicker & Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cherry[0], cherry[1], cherry[2]);
  doc.text('ELVI · LONGITUDINAL CLINICAL HEALTH REPORT', margin, y);
  y += 6;

  doc.setFont('times', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
  const titleText = full?.title || reportItem.title || 'ELVI Comprehensive Health Summary';
  doc.text(titleText, margin, y);
  y += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const subText = full?.subtitle || reportItem.subtitle || 'Longitudinal summary synthesized for clinician review';
  doc.text(subText, margin, y);
  y += 8;

  // Metadata Box (Patient info, window, generation date)
  doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
  doc.text(`Patient: ${patientName}`, margin + 4, y + 6);
  doc.text(`Reporting Window: ${full?.dateWindow || reportItem.dateRange || 'Last 60 Days'}`, margin + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`Email: ${patientEmail}`, margin + 90, y + 6);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · Project: elvi-osfic`, margin + 90, y + 12);
  y += 24;

  // 1. Data Coverage & Missing-Data Disclosure
  checkPageBreak(25);
  doc.setFillColor(248, 246, 238);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.roundedRect(margin, y, contentWidth, 16, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(cherry[0], cherry[1], cherry[2]);
  doc.text('DATA COVERAGE & INTEGRITY DISCLOSURE', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
  const coverageNotice =
    full?.dataCoverageNotice ||
    'Observation summaries are calculated strictly from confirmed user logs. Days without logged check-ins are recorded as unmonitored; ELVI never fabricates filler data or assumes patterns.';
  const splitCoverage = doc.splitTextToSize(coverageNotice, contentWidth - 8);
  doc.text(splitCoverage, margin + 4, y + 10.5);
  y += 22;

  // 2. Menstrual Cycle Overview
  if (full?.cycleSummary) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('1. MENSTRUAL CYCLE OVERVIEW', margin, y);
    y += 5;

    doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
    doc.rect(margin, y, contentWidth, 0.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
    doc.text(
      `Recorded Cycles: ${full.cycleSummary.recordedCyclesCount}  |  Average Cycle Length: ${full.cycleSummary.averageLengthDays}`,
      margin,
      y
    );
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
    const splitCycleNotes = doc.splitTextToSize(full.cycleSummary.patternNotes, contentWidth);
    doc.text(splitCycleNotes, margin, y);
    y += splitCycleNotes.length * 4.5 + 4;
  }

  // 3. Symptom & Wellbeing Trends
  if (full?.symptomAndMetabolicTrends && full.symptomAndMetabolicTrends.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('2. SYMPTOM & WELLBEING TRENDS', margin, y);
    y += 5;

    doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
    doc.rect(margin, y, contentWidth, 0.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);

    for (const trend of full.symptomAndMetabolicTrends) {
      checkPageBreak(10);
      const splitTrend = doc.splitTextToSize(`•  ${trend}`, contentWidth - 4);
      doc.text(splitTrend, margin + 2, y);
      y += splitTrend.length * 4.5 + 2;
    }
    y += 4;
  }

  // 4. Nourishment & Hydration Overview
  if (full?.nourishmentAndHydrationOverview) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('3. NOURISHMENT & HYDRATION OVERVIEW', margin, y);
    y += 5;

    doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
    doc.rect(margin, y, contentWidth, 0.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);
    const splitNourish = doc.splitTextToSize(full.nourishmentAndHydrationOverview, contentWidth);
    doc.text(splitNourish, margin, y);
    y += splitNourish.length * 4.5 + 6;
  }

  // 5. Clinical & Laboratory Highlights
  if (full?.labHighlights && full.labHighlights.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('4. CLINICAL & LABORATORY HIGHLIGHTS', margin, y);
    y += 5;

    doc.setFillColor(bgSoft[0], bgSoft[1], bgSoft[2]);
    doc.rect(margin, y, contentWidth, 0.5, 'F');
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);

    for (const lab of full.labHighlights) {
      checkPageBreak(10);
      const splitLab = doc.splitTextToSize(`•  ${lab}`, contentWidth - 4);
      doc.text(splitLab, margin + 2, y);
      y += splitLab.length * 4.5 + 2;
    }
    y += 4;
  }

  // 6. Recommended Questions for Doctor Consultation
  if (full?.questionsForClinician && full.questionsForClinician.length > 0) {
    checkPageBreak(35);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry[0], cherry[1], cherry[2]);
    doc.text('5. RECOMMENDED QUESTIONS FOR DOCTOR CONSULTATION', margin, y);
    y += 5;

    doc.setFillColor(234, 220, 224);
    doc.setDrawColor(cherry[0], cherry[1], cherry[2]);
    doc.roundedRect(margin, y, contentWidth, 4 + full.questionsForClinician.length * 8, 1.5, 1.5, 'FD');

    let qY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk[0], warmInk[1], warmInk[2]);

    full.questionsForClinician.forEach((q, idx) => {
      const splitQ = doc.splitTextToSize(`${idx + 1}.  ${q}`, contentWidth - 8);
      doc.text(splitQ, margin + 4, qY);
      qY += splitQ.length * 4 + 3;
    });

    y = qY + 6;
  }

  // Mandatory Clinical Disclaimer
  checkPageBreak(30);
  doc.setDrawColor(borderLight[0], borderLight[1], borderLight[2]);
  doc.line(margin, y, pageWidth - margin, y);
  y += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cherry[0], cherry[1], cherry[2]);
  doc.text('CLINICAL DISCLAIMER & SAFETY GUARDRAIL:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
  const disclaimer =
    full?.clinicalDisclaimer ||
    'ELVI Health Reports provide longitudinal structured summaries of user-reported data, calculated cycle statistics, and uploaded clinical panels. ELVI does not diagnose PCOS/PCOD, prescribe medication, or replace professional healthcare assessment. Always share these reports directly with your gynaecologist, endocrinologist, or general practitioner for diagnosis and treatment planning.';
  const splitDisclaimer = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(splitDisclaimer, margin, y);

  // Footer on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.text(
      `Page ${i} of ${totalPages}  |  ELVI Health (elvi-osfic)  |  Confidential Medical Record`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return doc;
}

/**
 * Downloads the generated PDF directly in the user's browser.
 */
export function downloadHealthReportPdf(
  reportItem: GeneratedReportItem,
  userProfile?: { name: string; email: string }
) {
  const doc = generateHealthReportPdf(reportItem, userProfile);
  const safeDate = new Date().toISOString().split('T')[0];
  const safePeriod = (reportItem.fullReport?.dateWindow || reportItem.dateRange || 'Summary')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .slice(0, 25);
  const fileName = `ELVI_Health_Summary_${safePeriod}_${safeDate}.pdf`;
  doc.save(fileName);
}
