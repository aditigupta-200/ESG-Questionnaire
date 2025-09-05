import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// Zod schema helpers
const numeric = z.number().optional();
const integer = z.number().int().optional();
const boolish = z.boolean().optional();

const ResponseSchema = z.object({
  financialYear: z.number().int().min(2000).max(2100), // Changed to number
  totalElectricityConsumption: numeric,
  renewableElectricityConsumption: numeric,
  totalFuelConsumption: numeric,
  carbonEmissions: numeric,
  totalEmployees: integer,
  femaleEmployees: integer,
  avgTrainingHoursPerEmployee: numeric, // Fixed field name
  communityInvestmentSpend: numeric,
  independentBoardMembersPercent: numeric, // Fixed field name
  hasDataPrivacyPolicy: boolish, // Fixed field name
  totalRevenue: numeric,
});

// Safe division helper that returns number | undefined
function safeDiv(n?: number, d?: number): number | undefined {
  const nn = typeof n === "number" ? n : 0;
  const dd = typeof d === "number" ? d : 0;
  if (!dd) return undefined; // Return undefined instead of 0 for division by zero
  return nn / dd;
}

// Remove all undefined fields before sending to Prisma
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  return result;
}

// Create or update response for a given financial year
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const parsed = ResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const data = parsed.data;

    // Compute metrics - these can be undefined
    const carbonIntensity = safeDiv(data.carbonEmissions, data.totalRevenue);
    const renewableElectricityRatio = data.totalElectricityConsumption 
      ? (data.renewableElectricityConsumption ?? 0) / data.totalElectricityConsumption * 100 
      : undefined;
    const diversityRatio = data.totalEmployees 
      ? (data.femaleEmployees ?? 0) / data.totalEmployees * 100 
      : undefined;
    const communitySpendRatio = safeDiv(data.communityInvestmentSpend, data.totalRevenue);

    // Create payload for database
    const basePayload = {
      financialYear: data.financialYear,
      totalElectricityConsumption: data.totalElectricityConsumption,
      renewableElectricityConsumption: data.renewableElectricityConsumption,
      totalFuelConsumption: data.totalFuelConsumption,
      carbonEmissions: data.carbonEmissions,
      totalEmployees: data.totalEmployees,
      femaleEmployees: data.femaleEmployees,
      avgTrainingHoursPerEmployee: data.avgTrainingHoursPerEmployee,
      communityInvestmentSpend: data.communityInvestmentSpend,
      independentBoardMembersPercent: data.independentBoardMembersPercent,
      hasDataPrivacyPolicy: data.hasDataPrivacyPolicy,
      totalRevenue: data.totalRevenue,
      // Computed metrics
      carbonIntensity,
      renewableElectricityRatio,
      diversityRatio,
      communitySpendRatio,
    };

    // Remove undefined values for Prisma operations
    const updatePayload = removeUndefined(basePayload);
    const createPayload = removeUndefined({
      ...basePayload,
      userId: req.user!.id,
    });

    const upsert = await prisma.eSGResponse.upsert({
      where: {
        userId_financialYear: {
          userId: req.user!.id,
          financialYear: data.financialYear,
        },
      },
      update: updatePayload,
      create: createPayload,
    });

    res.json(upsert);
  } catch (error) {
    console.error("Error in POST /responses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all responses for the current user
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const items = await prisma.eSGResponse.findMany({
      where: { userId: req.user!.id },
      orderBy: { financialYear: "asc" },
    });
    res.json(items);
  } catch (error) {
    console.error("Error in GET /responses:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get response for a specific financial year
router.get("/:year", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const year = parseInt(req.params.year as string);
    if (isNaN(year)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    const item = await prisma.eSGResponse.findUnique({
      where: {
        userId_financialYear: {
          userId: req.user!.id,
          financialYear: year,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json(item);
  } catch (error) {
    console.error("Error in GET /responses/:year:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;