/**
 * ELVI Client-Side Clinical Report PDF Generator
 * 
 * Generates an authentic, structured, downloadable PDF report using jsPDF.
 * Implements strict clinical boundaries:
 * 1. Clearly separates user-reported observations, deterministic calculations, and AI interpretations.
 * 2. Documents missing data gaps and unmonitored days.
 * 3. Never states clinical diagnoses.
 * 4. Includes prominent non-diagnostic medical disclaimer.
 */

import { jsPDF } from 'jspdf';
import { GeneratedReportItem } from '../types/elvi';

export function buildPdfDocument(
  reportItem: GeneratedReportItem,
  userName?: string
): jsPDF {
  const full = reportItem.fullReport;
  const isDemo = Boolean(reportItem.isDemo || full?.isDemo);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Colors
  const cherry = { r: 137, g: 1, b: 73 }; // #890149
  const warmInk = { r: 48, g: 35, b: 42 }; // #30232A
  const mutedInk = { r: 100, g: 90, b: 96 };
  const cardBg = { r: 247, g: 246, b: 238 }; // #F7F6EE
  const borderRose = { r: 217, g: 162, b: 181 }; // #D9A2B5

  function checkPageBreak(requiredHeight: number) {
    if (y + requiredHeight > pageHeight - 20) {
      doc.addPage();
      y = margin;
      drawHeaderBand();
    }
  }

  function drawHeaderBand() {
    doc.setFillColor(cherry.r, cherry.g, cherry.b);
    doc.rect(margin, y, contentWidth, 2, 'F');
    y += 6;
  }

  // --- HEADER ---
  drawHeaderBand();

  // Top Kicker & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cherry.r, cherry.g, cherry.b);
  doc.text('ELVI HEALTH COMPANION', margin, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  doc.text('CLINICIAN CONSULTATION SUMMARY', pageWidth - margin, y, { align: 'right' });
  y += 7;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
  const title = full?.title || reportItem.title || 'ELVI Health Summary';
  doc.text(title, margin, y);
  y += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  const subtitle = full?.subtitle || reportItem.subtitle || 'Longitudinal summary synthesized for clinician review';
  doc.text(subtitle, margin, y);
  y += 8;

  // Demo Badge if synthetic
  if (isDemo) {
    doc.setFillColor(234, 220, 224); // #EADCE0
    doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('SYNTHETIC DEMONSTRATION FIXTURE — NOT A REAL PATIENT RECORD', margin + 4, y + 4.8);
    y += 11;
  }

  // Metadata Panel Box
  doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
  doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  doc.text('MEMBER / PATIENT:', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
  doc.text(userName || 'Registered Member', margin + 38, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  doc.text('REPORTING WINDOW:', margin + 4, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
  doc.text(reportItem.dateRange || full?.dateWindow || 'Last 60 Days', margin + 42, y + 13);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  doc.text('GENERATION DATE:', margin + 105, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
  doc.text(reportItem.subDate || new Date().toLocaleDateString(), margin + 140, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  doc.text('PROVENANCE:', margin + 105, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
  doc.text('Verified User Records + Server AI', margin + 132, y + 13);

  y += 24;

  // --- DATA COVERAGE & MISSING DATA GAPS ---
  if (full?.dataCoverageNotice) {
    checkPageBreak(22);
    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('DATA COVERAGE & MISSING DAYS DISCLOSURE:', margin + 4, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    const splitCoverage = doc.splitTextToSize(full.dataCoverageNotice, contentWidth - 8);
    doc.text(splitCoverage, margin + 4, y + 10.5);
    y += 21;
  }

  // --- SECTION 1: MENSTRUAL CYCLE OVERVIEW (CALCULATED METRICS) ---
  if (full?.cycleSummary) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('1. MENSTRUAL CYCLE OVERVIEW (CALCULATED METRICS)', margin, y);
    y += 5;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);
    
    const notesText = full.cycleSummary.patternNotes || 'Cycle rhythm monitored over consecutive confirmed periods.';
    const splitNotes = doc.splitTextToSize(notesText, contentWidth - 8);
    const boxHeight = 12 + splitNotes.length * 4.5;
    
    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    doc.text(
      `${full.cycleSummary.recordedCyclesCount} Cycles Tracked · Average Length: ${full.cycleSummary.averageLengthDays}`,
      margin + 4,
      y + 6
    );

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
    doc.text(splitNotes, margin + 4, y + 11.5);

    y += boxHeight + 6;
  }

  // --- SECTION 2: SYMPTOM & WELLBEING TRENDS ---
  if (full?.symptomAndMetabolicTrends && full.symptomAndMetabolicTrends.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('2. SYMPTOM & WELLBEING PATTERNS (USER-REPORTED)', margin, y);
    y += 5;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);

    const items = full.symptomAndMetabolicTrends;
    let listHeight = 6;
    const splitItems: string[][] = [];
    for (const item of items) {
      const split = doc.splitTextToSize(`• ${item}`, contentWidth - 10);
      splitItems.push(split);
      listHeight += split.length * 4.5;
    }

    doc.roundedRect(margin, y, contentWidth, listHeight, 2, 2, 'FD');

    let itemY = y + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    for (const split of splitItems) {
      doc.text(split, margin + 4, itemY);
      itemY += split.length * 4.5;
    }

    y += listHeight + 6;
  }

  // --- SECTION 3: NOURISHMENT & HYDRATION OVERVIEW ---
  if (full?.nourishmentAndHydrationOverview) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('3. NOURISHMENT & HYDRATION SUMMARY', margin, y);
    y += 5;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);

    const splitNourish = doc.splitTextToSize(full.nourishmentAndHydrationOverview, contentWidth - 8);
    const boxHeight = 7 + splitNourish.length * 4.5;

    doc.roundedRect(margin, y, contentWidth, boxHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    doc.text(splitNourish, margin + 4, y + 5.5);

    y += boxHeight + 6;
  }

  // --- SECTION 4: CLINICAL LAB HIGHLIGHTS (IF ANY) ---
  if (full?.labHighlights && full.labHighlights.length > 0) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('4. CLINICAL & LABORATORY HIGHLIGHTS', margin, y);
    y += 5;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);

    let labHeight = 6;
    const splitLabs: string[][] = [];
    for (const lab of full.labHighlights) {
      const split = doc.splitTextToSize(`• ${lab}`, contentWidth - 10);
      splitLabs.push(split);
      labHeight += split.length * 4.5;
    }

    doc.roundedRect(margin, y, contentWidth, labHeight, 2, 2, 'FD');

    let labY = y + 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    for (const split of splitLabs) {
      doc.text(split, margin + 4, labY);
      labY += split.length * 4.5;
    }

    y += labHeight + 6;
  }

  // --- SECTION 5: RECOMMENDED QUESTIONS FOR CLINICIAN ---
  if (full?.questionsForClinician && full.questionsForClinician.length > 0) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(cherry.r, cherry.g, cherry.b);
    doc.text('5. RECOMMENDED QUESTIONS FOR YOUR DOCTOR CONSULTATION', margin, y);
    y += 5;

    doc.setFillColor(cardBg.r, cardBg.g, cardBg.b);
    doc.setDrawColor(borderRose.r, borderRose.g, borderRose.b);

    let qHeight = 6;
    const splitQs: string[][] = [];
    full.questionsForClinician.forEach((q, idx) => {
      const split = doc.splitTextToSize(`${idx + 1}. ${q}`, contentWidth - 10);
      splitQs.push(split);
      qHeight += split.length * 4.5;
    });

    doc.roundedRect(margin, y, contentWidth, qHeight, 2, 2, 'FD');

    let qY = y + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(warmInk.r, warmInk.g, warmInk.b);
    for (const split of splitQs) {
      doc.text(split, margin + 4, qY);
      qY += split.length * 4.5;
    }

    y += qHeight + 8;
  }

  // --- MANDATORY CLINICAL DISCLAIMER ---
  checkPageBreak(25);
  doc.setDrawColor(cherry.r, cherry.g, cherry.b);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(cherry.r, cherry.g, cherry.b);
  doc.text('CLINICAL ASSESSMENT DISCLAIMER & BOUNDARIES:', margin, y);
  y += 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedInk.r, mutedInk.g, mutedInk.b);
  const disclaimerText =
    full?.clinicalDisclaimer ||
    'ELVI Health Reports provide longitudinal structured summaries of user-reported data, calculated cycle statistics, and uploaded clinical panels. ELVI does not diagnose PCOS/PCOD, prescribe medication, or replace professional healthcare assessment. Always consult your qualified healthcare provider for clinical evaluation, diagnosis, and treatment planning.';

  const splitDisclaimer = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(splitDisclaimer, margin, y);

  return doc;
}

export function generateReportPdfBlob(
  reportItem: GeneratedReportItem,
  userName?: string
): Blob {
  const doc = buildPdfDocument(reportItem, userName);
  return doc.output('blob');
}

export function downloadReportAsPdf(
  reportItem: GeneratedReportItem,
  userName?: string
): boolean {
  const doc = buildPdfDocument(reportItem, userName);
  const cleanPeriod = (reportItem.dateRange || 'report').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `ELVI_Health_Summary_${cleanPeriod}.pdf`;
  doc.save(filename);
  return true;
}
