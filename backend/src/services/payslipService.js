import PDFDocument from 'pdfkit';
import { config } from '../config.js';
import { getEmployee } from './employeeService.js';
import { notFound, badRequest } from '../lib/errors.js';

function money(amount, currency) {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency || ''} ${Math.round(Number(amount) || 0).toLocaleString()}`;
  }
}

function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Build a monthly payslip PDF for an employee.
 * @returns {Promise<{ buffer: Buffer, filename: string, meta: object }>}
 */
export function buildPayslipPdf(db, employeeId, period) {
  const emp = getEmployee(db, employeeId);
  if (!emp) throw notFound('Employee not found');
  if (!emp.compensation) throw badRequest('Employee has no salary structure');

  const ym =
    period && /^\d{4}-\d{2}$/.test(period)
      ? period
      : new Date().toISOString().slice(0, 7);

  const comp = emp.compensation;
  const currency = comp.currency || emp.currency;
  const earnings = [
    ['Basic', comp.earnings.basic],
    ['HRA', comp.earnings.hra],
    ['Special allowance', comp.earnings.specialAllowance],
    ['Conveyance', comp.earnings.conveyance],
    ['Medical', comp.earnings.medical],
    ['Other allowances', comp.earnings.otherAllowances],
  ];
  const employeeDeds = (comp.deductions || []).filter((d) => d.borneBy === 'employee');
  const employerDeds = (comp.deductions || []).filter((d) => d.borneBy === 'employer');

  const doc = new PDFDocument({ margin: 48, size: 'A4' });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => {
      resolve({
        buffer: Buffer.concat(chunks),
        filename: `payslip-${emp.employeeCode}-${ym}.pdf`,
        meta: {
          employeeCode: emp.employeeCode,
          period: ym,
          net: comp.net,
          currency,
        },
      });
    });
    doc.on('error', reject);
  });

  // Header
  doc
    .fillColor('#115e59')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text(config.appName, 48, 48, { continued: false });
  doc
    .fillColor('#64748b')
    .fontSize(10)
    .font('Helvetica')
    .text(`${config.orgName} · Confidential payslip`, 48, 74);

  doc
    .fillColor('#0f172a')
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Payslip', 400, 48, { align: 'right', width: 150 });
  doc
    .fillColor('#334155')
    .fontSize(11)
    .font('Helvetica')
    .text(monthLabel(ym), 400, 70, { align: 'right', width: 150 });

  doc.moveTo(48, 100).lineTo(547, 100).strokeColor('#e2e8f0').stroke();

  // Employee block
  let y = 118;
  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Employee details', 48, y);
  y += 20;
  doc.font('Helvetica').fontSize(10).fillColor('#334155');
  const leftInfo = [
    [`Name`, `${emp.firstName} ${emp.lastName}`],
    [`Employee code`, emp.employeeCode],
    [`Designation`, emp.jobTitle],
    [`Department`, emp.department],
  ];
  const rightInfo = [
    [`Country`, emp.country],
    [`Currency`, currency],
    [`Status`, emp.status],
    [`Pay period`, monthLabel(ym)],
  ];
  leftInfo.forEach(([k, v], i) => {
    doc.fillColor('#64748b').text(k, 48, y + i * 16, { width: 100 });
    doc.fillColor('#0f172a').text(v, 150, y + i * 16, { width: 160 });
  });
  rightInfo.forEach(([k, v], i) => {
    doc.fillColor('#64748b').text(k, 330, y + i * 16, { width: 90 });
    doc.fillColor('#0f172a').text(v, 420, y + i * 16, { width: 130 });
  });

  y += 90;
  doc.moveTo(48, y).lineTo(547, y).strokeColor('#e2e8f0').stroke();
  y += 16;

  // Two columns: Earnings / Deductions
  const col1X = 48;
  const col2X = 310;
  const colW = 230;

  doc.fillColor('#0f172a').fontSize(12).font('Helvetica-Bold').text('Earnings', col1X, y);
  doc.text('Deductions (employee)', col2X, y);
  y += 18;

  const row = (x, label, value, yy, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
    doc.fillColor('#334155').text(label, x, yy, { width: colW - 90 });
    doc.fillColor('#0f172a').text(value, x, yy, { width: colW, align: 'right' });
  };

  let y1 = y;
  earnings.forEach(([label, amt]) => {
    row(col1X, label, money(amt, currency), y1);
    y1 += 16;
  });
  row(col1X, 'Gross pay', money(comp.gross, currency), y1 + 4, true);

  let y2 = y;
  if (employeeDeds.length === 0) {
    row(col2X, 'None', money(0, currency), y2);
    y2 += 16;
  } else {
    employeeDeds.forEach((d) => {
      row(col2X, d.label, money(d.amount, currency), y2);
      y2 += 16;
    });
  }
  row(col2X, 'Total deductions', money(comp.employeeDeductionsTotal, currency), y2 + 4, true);

  y = Math.max(y1, y2) + 36;
  doc.roundedRect(48, y, 499, 52, 8).fill('#115e59');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica').text('Net pay (take-home)', 64, y + 12);
  doc.fontSize(18).font('Helvetica-Bold').text(money(comp.net, currency), 64, y + 28);
  doc
    .fontSize(10)
    .font('Helvetica')
    .text(`CTC (incl. employer): ${money(comp.ctc, currency)}`, 300, y + 28, {
      width: 230,
      align: 'right',
    });

  y += 70;

  if (employerDeds.length) {
    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('Employer contributions', 48, y);
    y += 16;
    employerDeds.forEach((d) => {
      row(48, d.label, money(d.amount, currency), y);
      y += 15;
    });
    y += 10;
  }

  doc
    .fillColor('#94a3b8')
    .fontSize(8)
    .font('Helvetica')
    .text(
      `This is a system-generated illustrative payslip for ${config.orgName}. Deduction amounts use simplified country models and are not statutory advice.`,
      48,
      760,
      { width: 499, align: 'left' }
    );

  doc.end();
  return done;
}
