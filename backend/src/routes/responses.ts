import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

const numeric = z.number().optional().nullable();
const integer = z.number().int().optional().nullable();
const boolish = z.boolean().optional().nullable();

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
  totalRevenue: numeric
});

function safeDiv(n?: number | null, d?: number | null) {
  const nn = typeof n === "number" ? n : 0;
  const dd = typeof d === "number" ? d : 0;
  if (!dd) return 0;
  return nn / dd;
}

// Utility to convert all nulls in an object to undefined (for Prisma exactOptionalPropertyTypes)
function nullsToUndefined<T extends Record<string, any>>(obj: T): T {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, v === null ? undefined : v])
  ) as T;
}

router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = ResponseSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = nullsToUndefined(parsed.data);

  const carbonIntensity = safeDiv(data.carbonEmissions ?? 0, data.totalRevenue ?? 0);
  const renewableElectricityRatio = 100 * safeDiv(data.renewableElectricityConsumption ?? 0, data.totalElectricityConsumption ?? 0);
  const diversityRatio = 100 * safeDiv((data.femaleEmployees ?? 0), (data.totalEmployees ?? 0));
  const communitySpendRatio = 100 * safeDiv((data.communityInvestmentSpend ?? 0), (data.totalRevenue ?? 0));

  const upsert = await prisma.response.upsert({
    where: {
      userId_financialYear: { userId: req.user!.id, financialYear: data.financialYear }
    },
    update: {
      ...data,
      carbonIntensity,
      renewableElectricityRatio,
      diversityRatio,
      communitySpendRatio
    },
    create: {
      userId: req.user!.id,
      ...data,
      carbonIntensity,
      renewableElectricityRatio,
      diversityRatio,
      communitySpendRatio
    }
  });

  res.json(upsert);
});

router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const items = await prisma.response.findMany({
    where: { userId: req.user!.id },
    orderBy: { financialYear: "asc" }
  });
  res.json(items);
});

router.get(":/year", requireAuth, async (req: AuthedRequest, res) => {
  const year = req.params.year ?? "";
  const item = await prisma.response.findUnique({
    where: { userId_financialYear: { userId: req.user!.id, financialYear: String(year) } }
  });
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(item);
});

export default router;
