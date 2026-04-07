import { db, clientsTable, vatRecordsTable, corporateTaxTable, usersTable } from "@workspace/db";
import { count, eq, inArray } from "drizzle-orm";
import { createHash } from "crypto";

function hashPassword(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

const CLIENTS = [
  { name: "ADVENTURE HUB - FZCO", country: "UAE", vatNumber: "104859676900003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "ADVERTICA International FZE", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "AGS General Trading and Project Management Services FZCO", country: "UAE", vatNumber: "104588140400003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Afrimed Medical Supplies FZ- LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "BULLS EYE INVESTMENT LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Comdivision Middle East IT Consultants LLC", country: "UAE", vatNumber: "104619290000003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Cyber House FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "ETT SOLUTIONS DMCC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Fashion Accessories International FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "GRAND SUCCESS AVIATION FZCO", country: "UAE", vatNumber: null, corporateTaxStatus: "Filed", status: "Active", assignedTo: "Unassigned" },
  { name: "ILON L.L.C-FZ", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "In The City FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "JP INVESTMENTS Limited", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "JP Trade FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "LEMAN PARTNERS DWC-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "LEMAN PARTNERS LIMITED", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "LMA Steel Management FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Materia Prima General Trading FZE", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Oxtorea FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "PADBROOK FINANCE FZCO", country: "UAE", vatNumber: "104886490200003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "ProWater Trading FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "PublishU Global FZCO", country: "UAE", vatNumber: "105016552900003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "RC HOLDING FZ-LLC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "ROYAL TRADE ALLIANCE FZC", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "WILMA - FZCO", country: "UAE", vatNumber: "104198396400003", corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" },
  { name: "Yambana International FZE", country: "UAE", vatNumber: null, corporateTaxStatus: "Pending", status: "Active", assignedTo: "Unassigned" }
];

  const VAT_RECORDS = [
  { clientName: "ADVENTURE HUB - FZCO", vatPeriod: "Nov 2025 - Jan 2026", dueDate: "2026-05-07T00:00:00.000+00:00", status: "Filed", assignedTo: "Unassigned" },
  { clientName: "ADVENTURE HUB - FZCO", vatPeriod: "Feb 2026 - Apr 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVENTURE HUB - FZCO", vatPeriod: "May 2026 - Jul 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVENTURE HUB - FZCO", vatPeriod: "Aug 2026 - Oct 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVERTICA International FZE", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07T00:00:00.000+00:00", status: "Filed", assignedTo: "Unassigned" },
  { clientName: "ADVERTICA International FZE", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVERTICA International FZE", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVERTICA International FZE", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "AGS General Trading and Project Management Services FZCO", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07T00:00:00.000+00:00", status: "Filed", assignedTo: "Unassigned" },
  { clientName: "AGS General Trading and Project Management Services FZCO", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "AGS General Trading and Project Management Services FZCO", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "AGS General Trading and Project Management Services FZCO", vatPeriod: "Oct - Dec 2027", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Afrimed Medical Supplies FZ- LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Afrimed Medical Supplies FZ- LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Afrimed Medical Supplies FZ- LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Afrimed Medical Supplies FZ- LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "BULLS EYE INVESTMENT LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "BULLS EYE INVESTMENT LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "BULLS EYE INVESTMENT LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "BULLS EYE INVESTMENT LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Comdivision Middle East IT Consultants LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Comdivision Middle East IT Consultants LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Comdivision Middle East IT Consultants LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Comdivision Middle East IT Consultants LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Cyber House FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Cyber House FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Cyber House FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Cyber House FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ETT SOLUTIONS DMCC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ETT SOLUTIONS DMCC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ETT SOLUTIONS DMCC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ETT SOLUTIONS DMCC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Fashion Accessories International FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Fashion Accessories International FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Fashion Accessories International FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Fashion Accessories International FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "GRAND SUCCESS AVIATION FZCO", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "GRAND SUCCESS AVIATION FZCO", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "GRAND SUCCESS AVIATION FZCO", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "GRAND SUCCESS AVIATION FZCO", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ILON L.L.C-FZ", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ILON L.L.C-FZ", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ILON L.L.C-FZ", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ILON L.L.C-FZ", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "In The City FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "In The City FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "In The City FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "In The City FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP INVESTMENTS Limited", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP INVESTMENTS Limited", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP INVESTMENTS Limited", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP INVESTMENTS Limited", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP Trade FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP Trade FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP Trade FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP Trade FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS DWC-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS DWC-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS DWC-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS DWC-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS LIMITED", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS LIMITED", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS LIMITED", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS LIMITED", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LMA Steel Management FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LMA Steel Management FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LMA Steel Management FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LMA Steel Management FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Materia Prima General Trading FZE", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07T00:00:00.000+00:00", status: "Filed", assignedTo: "Unassigned" },
  { clientName: "Materia Prima General Trading FZE", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Materia Prima General Trading FZE", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Materia Prima General Trading FZE", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Oxtorea FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Oxtorea FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Oxtorea FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Oxtorea FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PADBROOK FINANCE FZCO", vatPeriod: "Nov 2025 - Jan 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PADBROOK FINANCE FZCO", vatPeriod: "Feb 2026 - Apr 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PADBROOK FINANCE FZCO", vatPeriod: "May 2026 - Jul 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PADBROOK FINANCE FZCO", vatPeriod: "Aug 2026 - Oct 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ProWater Trading FZ-LLC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ProWater Trading FZ-LLC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ProWater Trading FZ-LLC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ProWater Trading FZ-LLC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PublishU Global FZCO", vatPeriod: "Mar 2026 - May 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PublishU Global FZCO", vatPeriod: "Jun 2026 - Aug 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PublishU Global FZCO", vatPeriod: "Sep 2026 - Nov 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PublishU Global FZCO", vatPeriod: "Dec 2026 - Feb 2027", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "RC HOLDING FZ-LLC", vatPeriod: "Mar 2026 - May 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "RC HOLDING FZ-LLC", vatPeriod: "Apr 2026 - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "RC HOLDING FZ-LLC", vatPeriod: "Jul 2026 - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "RC HOLDING FZ-LLC", vatPeriod: "Oct 2026 - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ROYAL TRADE ALLIANCE FZC", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ROYAL TRADE ALLIANCE FZC", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ROYAL TRADE ALLIANCE FZC", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ROYAL TRADE ALLIANCE FZC", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "WILMA - FZCO", vatPeriod: "Dec 2025 - Feb 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "WILMA - FZCO", vatPeriod: "Mar 2026 - May 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "WILMA - FZCO", vatPeriod: "Jun 2026 - Aug 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "WILMA - FZCO", vatPeriod: "Sep 2026 - Nov 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Yambana International FZE", vatPeriod: "Jan - Mar 2026", dueDate: "2026-05-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Yambana International FZE", vatPeriod: "Apr - Jun 2026", dueDate: "2026-08-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Yambana International FZE", vatPeriod: "Jul - Sep 2026", dueDate: "2026-11-07", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Yambana International FZE", vatPeriod: "Oct - Dec 2026", dueDate: "2027-02-07", status: "Pending", assignedTo: "Unassigned" }
];

  const CT_RECORDS = [
  { clientName: "ADVENTURE HUB - FZCO", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ADVERTICA International FZE", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "AGS General Trading and Project Management Services FZCO", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Afrimed Medical Supplies FZ- LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "BULLS EYE INVESTMENT LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Comdivision Middle East IT Consultants LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Cyber House FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ETT SOLUTIONS DMCC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Fashion Accessories International FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "GRAND SUCCESS AVIATION FZCO", financialYear: "Jun 2025 - May 2026", deadline: "2026-02-28", status: "Filed", assignedTo: "Unassigned" },
  { clientName: "ILON L.L.C-FZ", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "In The City FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP INVESTMENTS Limited", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "JP Trade FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS DWC-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LEMAN PARTNERS LIMITED", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "LMA Steel Management FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Materia Prima General Trading FZE", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Oxtorea FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PADBROOK FINANCE FZCO", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ProWater Trading FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "PublishU Global FZCO", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "RC HOLDING FZ-LLC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "ROYAL TRADE ALLIANCE FZC", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "WILMA - FZCO", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" },
  { clientName: "Yambana International FZE", financialYear: "Jan - Dec 2025", deadline: "2026-09-30", status: "Pending", assignedTo: "Unassigned" }
];

const SEED_USERS = [
  { name: "Shaukin Phaterpekar", email: "shaukin@alliancestreet.ae", username: "shaukin", role: "SuperAdmin", status: "Active", defaultPassword: "sapna@123" },
];

// Users to remove from the database (cleanup old seed accounts)
const REMOVE_USERS_BY_USERNAME = ["uruj"];

// Old email → new email migrations (run once)
const EMAIL_MIGRATIONS: Array<{ from: string; to: { name: string; email: string } }> = [
  { from: "sarah@taxfirm.co.uk", to: { name: "Shaukin Phaterpekar", email: "Shaukin@alliancestreet.ae" } },
];

// One-time password migrations: if user has oldHash, update to newHash
const PASSWORD_MIGRATIONS: Array<{ username: string; oldHash: string; newHash: string }> = [
  {
    username: "shaukin",
    oldHash: "39f3028175592b07612f341354c97f6be146cddd51ea83567af760ae15e5ef92", // Sapna@12345$$
    newHash: "15a0495a832c5aae95a887f105abda086e184efdf42a9414fd3b06c2218fe7ac", // sapna@123
  },
];

export async function seedIfEmpty() {
  // Remove any old seed accounts that should no longer exist
  if (REMOVE_USERS_BY_USERNAME.length > 0) {
    const removed = await db
      .delete(usersTable)
      .where(inArray(usersTable.username, REMOVE_USERS_BY_USERNAME))
      .returning();
    if (removed.length > 0) {
      console.log(`[seed] Removed old users: ${removed.map(u => u.username).join(", ")}`);
    }
  }

  // Remove inactive clients and their associated records
  const inactiveClients = await db.select({ id: clientsTable.id, name: clientsTable.name })
    .from(clientsTable)
    .where(eq(clientsTable.status, "Inactive"));
  if (inactiveClients.length > 0) {
    const inactiveIds = inactiveClients.map(c => c.id);
    await db.delete(vatRecordsTable).where(inArray(vatRecordsTable.clientId, inactiveIds));
    await db.delete(corporateTaxTable).where(inArray(corporateTaxTable.clientId, inactiveIds));
    await db.delete(clientsTable).where(inArray(clientsTable.id, inactiveIds));
    console.log(`[seed] Removed ${inactiveClients.length} inactive clients and their records`);
  }

  // Run any email/name migrations first
  for (const migration of EMAIL_MIGRATIONS) {
    const [old] = await db.select().from(usersTable).where(eq(usersTable.email, migration.from));
    if (old) {
      await db.update(usersTable).set({ name: migration.to.name, email: migration.to.email }).where(eq(usersTable.id, old.id));
      console.log(`[seed] Migrated user: ${migration.from} → ${migration.to.email}`);
    }
  }

  // Run one-time password migrations (only updates if user still has the old hash)
  for (const pm of PASSWORD_MIGRATIONS) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.username, pm.username));
    if (user && user.password === pm.oldHash) {
      await db.update(usersTable).set({ password: pm.newHash }).where(eq(usersTable.id, user.id));
      console.log(`[seed] Updated password for: ${pm.username}`);
    }
  }

  // Always sync users — add any missing ones regardless of other data, and ensure passwords are set
  const existingUsers = await db.select().from(usersTable);
  const existingByEmail = new Map(existingUsers.map(u => [u.email.toLowerCase(), u]));
  for (const user of SEED_USERS) {
    const existing = existingByEmail.get(user.email.toLowerCase());
    if (!existing) {
      await db.insert(usersTable).values({ ...user, password: hashPassword(user.defaultPassword) });
      console.log(`[seed] Added user: ${user.name}`);
    } else {
      // Always sync seed user credentials so dev and production stay identical
      await db.update(usersTable).set({
        password: hashPassword(user.defaultPassword),
        name: user.name,
        role: user.role,
        status: user.status,
        ...(user.username && !existing.username ? { username: user.username } : {}),
      }).where(eq(usersTable.id, existing.id));
      console.log(`[seed] Synced user: ${user.name}`);
    }
  }

  const [{ value: clientCount }] = await db.select({ value: count() }).from(clientsTable);
  if (Number(clientCount) > 0) return;

  console.log("[seed] Database is empty, seeding...");

  const nameToId: Record<string, number> = {};
  for (const client of CLIENTS) {
    const [inserted] = await db.insert(clientsTable).values({
      name: client.name,
      country: client.country as "UK" | "UAE",
      vatNumber: client.vatNumber,
      corporateTaxStatus: client.corporateTaxStatus as "Active" | "Inactive" | "Pending" | "Filed" | "Overdue" | "InProgress" | null,
      status: client.status as "Active" | "Inactive",
      assignedTo: client.assignedTo,
    }).returning();
    nameToId[client.name] = inserted.id;
  }

  const vatToInsert = VAT_RECORDS.map(v => ({
    clientId: nameToId[v.clientName],
    vatPeriod: v.vatPeriod,
    dueDate: v.dueDate,
    status: v.status,
    assignedTo: v.assignedTo,
  })).filter(v => v.clientId);
  for (let i = 0; i < vatToInsert.length; i += 100) {
    await db.insert(vatRecordsTable).values(vatToInsert.slice(i, i + 100));
  }

  const ctToInsert = CT_RECORDS.map(c => ({
    clientId: nameToId[c.clientName],
    financialYear: c.financialYear,
    deadline: c.deadline,
    status: c.status,
    assignedTo: c.assignedTo,
  })).filter(c => c.clientId);
  if (ctToInsert.length > 0) {
    await db.insert(corporateTaxTable).values(ctToInsert);
  }

  console.log(`[seed] Done: ${CLIENTS.length} clients, ${vatToInsert.length} VAT, ${ctToInsert.length} CT records`);
}
