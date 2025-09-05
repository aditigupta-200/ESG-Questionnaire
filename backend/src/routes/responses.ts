import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// Zod schema helpers
const numeric = z.number().optional();   // no .nullable()
const integer = z.number().int().optional();
const boolish = z.boolean().optional();

const ResponseSchema = z.object({
  financialYear: z.string().min(2),
  totalElectricityConsumption: numeric,
  renewableElectricityConsumption: numeric,
  totalFuelConsumption: numeric,
  carbonEmissions: numeric,
  totalEmployees: integer,
  femaleEmployees: integer,
  averageTrainingHoursPerEmployee: numeric,
  communityInvestmentSpend: numeric,
  percentIndependentBoardMembers: numeric,
  dataPrivacyPolicy: boolish,
  totalRevenue: numeric,
});

// Safe division helper
function safeDiv(n?: number, d?: number) {
  const nn = typeof n === "number" ? n : 0;
  const dd = typeof d === "number" ? d : 0;
  if (!dd) return 0;
  return nn / dd;
}

// Remove all undefined fields before sending to Prisma
function removeUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v !== undefined)
  ) as T;
}

// Create or update response for a given financial year
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = ResponseSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const data = parsed.data;

  // Compute metrics
  const carbonIntensity = safeDiv(data.carbonEmissions ?? 0, data.totalRevenue ?? 0);
  const renewableElectricityRatio =
    100 * safeDiv(data.renewableElectricityConsumption ?? 0, data.totalElectricityConsumption ?? 0);
  const diversityRatio =
    100 * safeDiv(data.femaleEmployees ?? 0, data.totalEmployees ?? 0);
  const communitySpendRatio =
    100 * safeDiv(data.communityInvestmentSpend ?? 0, data.totalRevenue ?? 0);

  // Payload with metrics, cleaned of undefineds
  const payload = removeUndefined({
    ...data,
    carbonIntensity,
    renewableElectricityRatio,
    diversityRatio,
    communitySpendRatio,
  });

  const upsert = await prisma.response.upsert({
    where: {
      userId_financialYear: {
        userId: req.user!.id,
        financialYear: data.financialYear,
      },
    },
    update: removeUndefined(payload),
    create: removeUndefined({
      userId: req.user!.id,
      ...payload,
    }),
  });

  res.json(upsert);
});

// Get all responses for the current user
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const items = await prisma.response.findMany({
    where: { userId: req.user!.id },
    orderBy: { financialYear: "asc" },
  });
  res.json(items);
});

// Get response for a specific financial year
router.get("/:year", requireAuth, async (req: AuthedRequest, res) => {
  const year = req.params.year ?? "";
  const item = await prisma.response.findUnique({
    where: {
      userId_financialYear: {
        userId: req.user!.id,
        financialYear: String(year),
      },
    },
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

export default router;
