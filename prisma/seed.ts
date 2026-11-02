/**
 * Phase 7 demo seed — idempotent.
 *
 * SAFETY RULE (project rule): every deleteMany in this file is filtered by the
 * demo organization's organizationId. The seed never touches any other
 * organization's rows. All dates are relative to now (UTC) so the demo stays
 * fresh on every run.
 *
 * Run: npx prisma db seed
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { PrismaClient, type LeadSource, type LeadStatus, type Priority } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@leadflow.ai";
const DEMO_PASSWORD = "Demo1234!";
const DEMO_USER_NAME = "Demo User";
const DEMO_ORG_NAME = "Bright Pixel Studio";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const now = new Date();
const startTodayUtc = Date.UTC(
  now.getUTCFullYear(),
  now.getUTCMonth(),
  now.getUTCDate(),
);

/** UTC midnight n days ago + hour (matches the app's UTC day bucketing). */
function daysAgo(n: number, hour = 10): Date {
  return new Date(startTodayUtc - n * DAY_MS + hour * HOUR_MS);
}

/** UTC midnight n days ahead + hour (for upcoming follow-ups). */
function daysAhead(n: number, hour = 10): Date {
  return new Date(startTodayUtc + n * DAY_MS + hour * HOUR_MS);
}

/** Loads .env when the seed is run outside the Prisma CLI (tsx prisma/seed.ts). */
function loadEnv(): void {
  if (process.env.DATABASE_URL) return;
  const envPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}

type SeedAi = {
  summary: string;
  service: string | null;
  budget: string | null;
  timeline: string | null;
  priority: Priority;
  reason: string | null;
  analyzedDaysAgo: number;
  draft?: string;
  approvedDaysAgo?: number;
};

type SeedLead = {
  key: string;
  name: string;
  email: string;
  company: string | null;
  serviceNeeded?: string;
  budget: number | null;
  source: LeadSource;
  status: LeadStatus;
  priority: Priority;
  notes?: string;
  inquiry?: string;
  createdDaysAgo: number;
  wonDaysAgo?: number;
  lostDaysAgo?: number;
  ai?: SeedAi;
};

const RICH_INQUIRY =
  "Hi! My name is Sarah Miller from Bloom Cafe. We're opening our second location and need a website with online ordering and a booking system. Our budget is around $4,000 and we'd love to launch before the end of March. Can you help?";

const LEADS: SeedLead[] = [
  // --- Star leads (spec-defined) ---
  {
    key: "bloom",
    name: "Sarah Miller",
    email: "sarah.miller@bloomcafe.com",
    company: "Bloom Cafe",
    serviceNeeded: "Website with online ordering",
    budget: 4000,
    source: "WEBSITE",
    status: "QUALIFIED",
    priority: "HIGH",
    notes: "Primary decision maker is Sarah — wants to launch before the end of March.",
    inquiry: RICH_INQUIRY,
    createdDaysAgo: 20,
    ai: {
      summary:
        "Sarah Miller from Bloom Cafe is opening a second location and needs a website with online ordering and a booking system, targeting a budget around $4,000 and a launch before the end of March.",
      service: "Website with online ordering and booking system",
      budget: "around $4,000",
      timeline: "before the end of March",
      priority: "HIGH",
      reason: "Fixed launch deadline before the end of March.",
      analyzedDaysAgo: 2,
      draft:
        "Hi Sarah,\r\n\r\nThank you for the details about Bloom Cafe's second location. A website with online ordering and a booking system is very doable within your $4,000 budget. To confirm scope and timing, could we schedule a short call on [preferred day this week] to walk through your menu and booking flow?\r\n\r\nBest regards,\r\nBright Pixel Studio",
      approvedDaysAgo: 1,
    },
  },
  {
    key: "sparse",
    name: "Jake Turner",
    email: "jake.turner@maildrop.com",
    company: null,
    budget: null,
    source: "COLD_OUTREACH",
    status: "NEW",
    priority: "MEDIUM",
    inquiry: "hello what do you charge",
    createdDaysAgo: 5,
  },
  {
    key: "gym",
    name: "Marcus Delgado",
    email: "marcus@ironpeakgym.com",
    company: "Iron Peak Gym",
    serviceNeeded: "Membership website",
    budget: null,
    source: "REFERRAL",
    status: "QUALIFIED",
    priority: "MEDIUM",
    inquiry:
      "Hi, I run Iron Peak Gym and we want a membership website where people can sign up and manage their plan. Our budget is a few thousand — no timeline yet, just exploring options.",
    createdDaysAgo: 14,
    ai: {
      summary:
        "The owner of Iron Peak Gym wants a membership website where members can sign up and manage their plan. Budget is vague ('a few thousand') and no timeline was given.",
      service: "Membership website with plan signup",
      budget: "a few thousand (vague)",
      timeline: null,
      priority: "MEDIUM",
      reason: "Clear scope but no stated budget figure or deadline.",
      analyzedDaysAgo: 3,
    },
  },
  {
    key: "noinq",
    name: "Daniel Vega",
    email: "daniel.vega@vegainc.com",
    company: "Vega Insurance Group",
    budget: 5000,
    source: "EMAIL",
    status: "CONTACTED",
    priority: "LOW",
    createdDaysAgo: 45,
  },
  // --- Status distribution: WON ---
  {
    key: "sunrise",
    name: "Dr. Priya Raman",
    email: "priya@sunrisedental.com",
    company: "Sunrise Dental",
    serviceNeeded: "Appointment booking",
    budget: 8500,
    source: "WEBSITE",
    status: "WON",
    priority: "HIGH",
    inquiry:
      "We run Sunrise Dental and want online appointment booking plus patient intake forms. Budget is around $8,500 and we want to go live this quarter.",
    createdDaysAgo: 12,
    wonDaysAgo: 9,
    ai: {
      summary:
        "Sunrise Dental needs online appointment booking and digital patient intake forms, with a budget near $8,500 and a target of going live this quarter.",
      service: "Appointment booking and patient intake forms",
      budget: "around $8,500",
      timeline: "this quarter",
      priority: "HIGH",
      reason: "Clear budget and a firm go-live target this quarter.",
      analyzedDaysAgo: 6,
    },
  },
  {
    key: "verde",
    name: "Marcus Lee",
    email: "marcus@verdelandscape.com",
    company: "Verde Landscaping",
    serviceNeeded: "Portfolio website",
    budget: 6000,
    source: "REFERRAL",
    status: "WON",
    priority: "MEDIUM",
    notes: "Repeat client — referred Cedar Ridge Realty.",
    inquiry:
      "Hi team — referred by Cedar Ridge. We need a portfolio site for our landscaping work with a quote request form. Budget around $6,000.",
    createdDaysAgo: 30,
    wonDaysAgo: 25,
    ai: {
      summary:
        "Verde Landscaping wants a portfolio website with a quote request form, referred by an existing client. Budget around $6,000, no timeline stated.",
      service: "Portfolio website with quote form",
      budget: "around $6,000",
      timeline: null,
      priority: "MEDIUM",
      reason: "Referral with a clear scope but no stated deadline.",
      analyzedDaysAgo: 20,
    },
  },
  {
    key: "bakery",
    name: "Hannah Ford",
    email: "hannah@harborbackbakery.com",
    company: "Harborback Bakery",
    budget: 4500,
    source: "COLD_OUTREACH",
    status: "WON",
    priority: "MEDIUM",
    inquiry:
      "Could you build a site for our bakery with our menu online and a catering request form? We'd like to launch before the holidays.",
    createdDaysAgo: 65,
    wonDaysAgo: 40,
  },
  // --- Status distribution: LOST ---
  {
    key: "pulse",
    name: "Owen Castillo",
    email: "owen@pulseelectronics.io",
    company: "Pulse Electronics",
    budget: 3200,
    source: "EMAIL",
    status: "LOST",
    priority: "LOW",
    notes: "Lost on price — chose a cheaper freelancer.",
    inquiry:
      "Do you build small online stores? We sell refurbished electronics. Budget is tight — around $3,200.",
    createdDaysAgo: 55,
    lostDaysAgo: 20,
    ai: {
      summary:
        "Pulse Electronics asks about a small online store for refurbished electronics, with a tight budget around $3,200 and no timeline.",
      service: "Small online store",
      budget: "around $3,200",
      timeline: null,
      priority: "LOW",
      reason: "Tight budget with no stated timeline.",
      analyzedDaysAgo: 45,
    },
  },
  {
    key: "atlas",
    name: "Rebecca Nguyen",
    email: "rebecca@atlasconsulting.co",
    company: "Atlas Consulting",
    budget: null,
    source: "OTHER",
    status: "LOST",
    priority: "MEDIUM",
    inquiry:
      "We need a clean consulting website with services, case studies and a contact form — what would that involve?",
    createdDaysAgo: 75,
    lostDaysAgo: 30,
  },
  // --- Status distribution: PROPOSAL_SENT ---
  {
    key: "kite",
    name: "Elena Rossi",
    email: "elena@kiteandco.travel",
    company: "Kite & Co. Travel",
    serviceNeeded: "Trip enquiry site",
    budget: 7200,
    source: "WEBSITE",
    status: "PROPOSAL_SENT",
    priority: "HIGH",
    notes: "Proposal sent — waiting on their board approval.",
    inquiry:
      "We're Kite & Co. Travel, a boutique travel agency. We need a trip enquiry site with destination pages and a call-booking flow. Budget around $7,200, launching before the summer season.",
    createdDaysAgo: 7,
    ai: {
      summary:
        "Kite & Co. Travel needs a trip enquiry site with destination pages and a call-booking flow, budget around $7,200, aiming to launch before the summer season.",
      service: "Trip enquiry site with destination pages",
      budget: "around $7,200",
      timeline: "before the summer season",
      priority: "HIGH",
      reason: "Seasonal launch deadline before summer.",
      analyzedDaysAgo: 5,
    },
  },
  {
    key: "marlow",
    name: "Tom Ashby",
    email: "tom@marlowbookshop.com",
    company: "Marlow Bookshop",
    budget: 5400,
    source: "SOCIAL_MEDIA",
    status: "PROPOSAL_SENT",
    priority: "MEDIUM",
    inquiry:
      "Our independent bookshop wants an online store so customers can order titles for pickup. How much would something like that cost?",
    createdDaysAgo: 18,
  },
  {
    key: "cedar",
    name: "Grace Whitfield",
    email: "grace@cedarridge-realty.com",
    company: "Cedar Ridge Realty",
    budget: null,
    source: "REFERRAL",
    status: "PROPOSAL_SENT",
    priority: "HIGH",
    inquiry:
      "We need a site for our real estate team with property listings and a mortgage calculator — is that something you do?",
    createdDaysAgo: 33,
  },
  {
    key: "fern",
    name: "Diego Alvarez",
    email: "diego@fernandfig.com",
    company: "Fern & Fig Catering",
    budget: 2800,
    source: "EMAIL",
    status: "PROPOSAL_SENT",
    priority: "LOW",
    inquiry:
      "We need a catering website with menus, galleries and an enquiry form for events.",
    createdDaysAgo: 50,
  },
  // --- Status distribution: NEW ---
  {
    key: "oasis",
    name: "Liam Brooks",
    email: "liam@oasiswash.com",
    company: "Oasis Car Wash",
    budget: 400,
    source: "WEBSITE",
    status: "NEW",
    priority: "LOW",
    inquiry:
      "Just a simple one-page site with our prices and an online booking widget for wash slots.",
    createdDaysAgo: 3,
  },
  {
    key: "sunny",
    name: "Angela Ferris",
    email: "angela@sunnysidepreschool.org",
    company: "Sunny Side Preschool",
    budget: 9000,
    source: "SOCIAL_MEDIA",
    status: "NEW",
    priority: "HIGH",
    notes: "Wants everything ready before the new school year.",
    inquiry:
      "We want a parent portal-style site with announcements, calendar and enrolment forms. Budget around $9,000.",
    createdDaysAgo: 8,
  },
  {
    key: "driftwood",
    name: "Noah Kim",
    email: "noah@driftwoodsurf.com",
    company: "Driftwood Surf Shop",
    budget: null,
    source: "OTHER",
    status: "NEW",
    priority: "MEDIUM",
    inquiry:
      "We'd like an online store for surfboards and accessories with size guides.",
    createdDaysAgo: 26,
  },
  {
    key: "bolt",
    name: "Ray Coleman",
    email: "ray@boltelectricians.com",
    company: "Bolt Electricians",
    budget: 12000,
    source: "COLD_OUTREACH",
    status: "NEW",
    priority: "LOW",
    inquiry:
      "A landing page for our electrical services with a quote request form — we get most leads from Google.",
    createdDaysAgo: 60,
  },
  // --- Status distribution: CONTACTED ---
  {
    key: "harmony",
    name: "Yuki Tanaka",
    email: "yuki@harmonymusicschool.com",
    company: "Harmony Music School",
    serviceNeeded: "Class booking website",
    budget: 3500,
    source: "WEBSITE",
    status: "CONTACTED",
    priority: "MEDIUM",
    inquiry:
      "Our music school needs a website where parents can browse classes and book trial lessons. We don't have a firm budget yet — thinking around $3,500.",
    createdDaysAgo: 16,
    ai: {
      summary:
        "Harmony Music School wants a website where parents can browse classes and book trial lessons; budget mentioned around $3,500, no timeline given.",
      service: "Class browsing and trial-lesson booking site",
      budget: "around $3,500",
      timeline: null,
      priority: "MEDIUM",
      reason: "Clear scope with no stated deadline.",
      analyzedDaysAgo: 12,
      draft:
        "Hi! Thank you for the details on the Harmony Music School site. I would start with the class browser and trial-lesson booking flow, and we can add parent accounts later if needed. Would a short call this week work to confirm [preferred days for the trial lessons]?\r\n\r\nBest regards,\r\nBright Pixel Studio",
    },
  },
  {
    key: "copper",
    name: "Fiona Doyle",
    email: "fiona@copperkettlepub.com",
    company: "Copper Kettle Pub",
    budget: 600,
    source: "EMAIL",
    status: "CONTACTED",
    priority: "LOW",
    inquiry: "We need our menu and weekly events online, ideally easy to update ourselves.",
    createdDaysAgo: 28,
  },
  {
    key: "greenleaf",
    name: "Samir Haddad",
    email: "samir@greenleafpharmacy.com",
    company: "GreenLeaf Pharmacy",
    budget: null,
    source: "REFERRAL",
    status: "CONTACTED",
    priority: "MEDIUM",
    inquiry:
      "We'd like a site with our services, opening hours and an FAQ about prescription refills.",
    createdDaysAgo: 42,
  },
  {
    key: "summit",
    name: "Rachel Owens",
    email: "rachel@summitlawgroup.com",
    company: "Summit Law Group",
    budget: 11000,
    source: "SOCIAL_MEDIA",
    status: "CONTACTED",
    priority: "HIGH",
    inquiry:
      "We need a professional website with attorney profiles, practice areas and a consultation request form.",
    createdDaysAgo: 85,
  },
  // --- Status distribution: QUALIFIED (remaining) ---
  {
    key: "trailhead",
    name: "Ben Carter",
    email: "ben@trailheadoutfitters.com",
    company: "Trailhead Outfitters",
    serviceNeeded: "E-commerce store",
    budget: 1500,
    source: "WEBSITE",
    status: "QUALIFIED",
    priority: "MEDIUM",
    notes: "Starter version — upsell ecommerce features later.",
    inquiry:
      "We sell hiking gear online and want a proper store with product pages, cart and Stripe checkout. Hoping to keep it near $1,500 for a starter version — what's realistic?",
    createdDaysAgo: 11,
    ai: {
      summary:
        "Trailhead Outfitters wants an online store with product pages, cart and Stripe checkout; they hope for a starter version near $1,500.",
      service: "E-commerce store with Stripe checkout",
      budget: "around $1,500 for a starter version",
      timeline: null,
      priority: "MEDIUM",
      reason: "Startup budget with a clear feature list and no deadline.",
      analyzedDaysAgo: 9,
    },
  },
  {
    key: "pixel",
    name: "Olive Hart",
    email: "olive@pixelprintstudio.com",
    company: "Pixel Print Studio",
    budget: 7800,
    source: "OTHER",
    status: "QUALIFIED",
    priority: "MEDIUM",
    inquiry:
      "Can you build a site for our print shop with a product catalogue and quote request flow?",
    createdDaysAgo: 24,
  },
  {
    key: "bluebird",
    name: "Chloe Bennett",
    email: "chloe@bluebirdchildcare.com",
    company: "Bluebird Childcare",
    budget: 2200,
    source: "COLD_OUTREACH",
    status: "QUALIFIED",
    priority: "MEDIUM",
    inquiry:
      "We need an enrolment enquiry page with our programs, opening hours and a tour request form.",
    createdDaysAgo: 38,
  },
];

type SeedFollowUp = {
  leadKey: string;
  title: string | null;
  message: string | null;
  dueDate: Date;
  status: "OPEN" | "COMPLETED";
  completedAt: Date | null;
};

const FOLLOW_UPS: SeedFollowUp[] = [
  // 3 overdue (1–6 days ago)
  {
    leadKey: "bloom",
    title: "Send proposal outline",
    message: "Send the proposal follow-up — she asked about timeline.",
    dueDate: daysAgo(6),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "kite",
    title: "Nudge on proposal",
    message: "Their team was reviewing on Monday — check whether they have questions.",
    dueDate: daysAgo(3),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "gym",
    title: "Call gym owner back",
    message: null,
    dueDate: daysAgo(1),
    status: "OPEN",
    completedAt: null,
  },
  // 2 due today
  {
    leadKey: "trailhead",
    title: "Confirm discovery call time",
    message: null,
    dueDate: new Date(startTodayUtc + 11 * HOUR_MS),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "harmony",
    title: "Send demo link",
    message: "Send the class-booking demo link before the call.",
    dueDate: new Date(startTodayUtc + 15 * HOUR_MS),
    status: "OPEN",
    completedAt: null,
  },
  // 5 upcoming (1–14 days out)
  {
    leadKey: "sunrise",
    title: "Schedule kickoff",
    message: null,
    dueDate: daysAhead(2),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "sparse",
    title: "Answer pricing question",
    message: null,
    dueDate: daysAhead(5),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "marlow",
    title: "Check in on decision",
    message: "They asked for a week — follow up on whether the bookshop budget was approved.",
    dueDate: daysAhead(7),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "pixel",
    title: null,
    message: "Share the two print-shop case studies we discussed.",
    dueDate: daysAhead(10),
    status: "OPEN",
    completedAt: null,
  },
  {
    leadKey: "oasis",
    title: "First outreach call",
    message: null,
    dueDate: daysAhead(14),
    status: "OPEN",
    completedAt: null,
  },
  // 2 completed (3–10 days ago), on WON leads
  {
    leadKey: "sunrise",
    title: "Send contract",
    message: null,
    dueDate: daysAgo(10),
    status: "COMPLETED",
    completedAt: daysAgo(8),
  },
  {
    leadKey: "verde",
    title: "File signed contract",
    message: "Contract signed and countersigned — filed in the shared drive.",
    dueDate: daysAgo(12),
    status: "COMPLETED",
    completedAt: daysAgo(4),
  },
];

/**
 * Finds the demo user by email. If missing, creates org + user (fresh rows only —
 * never an existing organization). If present, reuses its organization and keeps
 * the documented credentials in sync.
 */
async function ensureDemoAccount(): Promise<{ userId: string; organizationId: string }> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });

  if (existing) {
    const updated = await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: DEMO_USER_NAME },
      select: { id: true, organizationId: true },
    });
    return { userId: updated.id, organizationId: updated.organizationId };
  }

  const organization = await prisma.organization.create({
    data: { name: DEMO_ORG_NAME },
  });
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: DEMO_USER_NAME,
      passwordHash,
      role: "OWNER",
      organizationId: organization.id,
    },
    select: { id: true, organizationId: true },
  });
  return { userId: user.id, organizationId: user.organizationId };
}

async function main(): Promise<void> {
  loadEnv();

  const { userId, organizationId } = await ensureDemoAccount();

  // SAFETY: both deleteMany calls below are filtered by the demo org's id.
  await prisma.followUp.deleteMany({ where: { organizationId } });
  await prisma.lead.deleteMany({ where: { organizationId } });

  const leadIds = new Map<string, string>();
  let analyzed = 0;

  for (const [index, lead] of LEADS.entries()) {
    const created = await prisma.lead.create({
      data: {
        organizationId,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        serviceNeeded: lead.serviceNeeded ?? null,
        budget: lead.budget,
        source: lead.source,
        status: lead.status,
        priority: lead.priority,
        notes: lead.notes ?? null,
        inquiry: lead.inquiry ?? null,
        createdAt: daysAgo(lead.createdDaysAgo, 8 + (index % 8)),
        wonAt:
          lead.status === "WON" && lead.wonDaysAgo !== undefined
            ? daysAgo(lead.wonDaysAgo, 12)
            : null,
        lostAt:
          lead.status === "LOST" && lead.lostDaysAgo !== undefined
            ? daysAgo(lead.lostDaysAgo, 12)
            : null,
        aiSummary: lead.ai?.summary ?? null,
        aiService: lead.ai?.service ?? null,
        aiBudget: lead.ai?.budget ?? null,
        aiTimeline: lead.ai?.timeline ?? null,
        aiPriority: lead.ai?.priority ?? null,
        aiPriorityReason: lead.ai?.reason ?? null,
        aiAnalyzedAt: lead.ai ? daysAgo(lead.ai.analyzedDaysAgo, 14) : null,
        aiDraftReply: lead.ai?.draft ?? null,
        aiReplyApprovedAt:
          lead.ai?.approvedDaysAgo !== undefined
            ? daysAgo(lead.ai.approvedDaysAgo, 16)
            : null,
      },
    });
    leadIds.set(lead.key, created.id);
    if (lead.ai) analyzed += 1;
  }

  for (const followUp of FOLLOW_UPS) {
    const leadId = leadIds.get(followUp.leadKey);
    if (!leadId) throw new Error(`Unknown lead key: ${followUp.leadKey}`);
    await prisma.followUp.create({
      data: {
        organizationId,
        leadId,
        createdById: userId,
        title: followUp.title,
        message: followUp.message,
        dueDate: followUp.dueDate,
        status: followUp.status,
        completedAt: followUp.completedAt,
      },
    });
  }

  const leadCount = await prisma.lead.count({ where: { organizationId } });
  const followUpCount = await prisma.followUp.count({ where: { organizationId } });
  console.log(
    `Demo seed complete: ${leadCount} leads (${analyzed} pre-analyzed), ${followUpCount} follow-ups for ${DEMO_EMAIL}.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
