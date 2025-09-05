import { Router } from "express";
import { prisma } from "../prisma.js";
import { requireAuth, AuthedRequest } from "../middleware/auth.js";
import { z } from "zod";

const router = Router();

// Enhanced Zod schema with better validation
const ResponseSchema = z.object({
  financialYear: z.number().int().min(2000).max(2100),
  // Environmental
  totalElectricityConsumption: z.number().min(0).optional(),
  renewableElectricityConsumption: z.number().min(0).optional(),
  totalFuelConsumption: z.number().min(0).optional(),
  carbonEmissions: z.number().min(0).optional(),
  // Social
  totalEmployees: z.number().int().min(0).optional(),
  femaleEmployees: z.number().int().min(0).optional(),
  averageTrainingHoursPerEmployee: z.number().min(0).optional(),
  communityInvestmentSpend: z.number().min(0).optional(),
  // Governance
  percentIndependentBoardMembers: z.number().min(0).max(100).optional(),
  dataPrivacyPolicy: z.boolean().optional(),
  totalRevenue: z.number().min(0).optional(),
});

// Safe division helper
function safeDiv(numerator?: number, denominator?: number): number | undefined {
  if (!numerator || !denominator || denominator === 0) return undefined;
  return numerator / denominator;
}

// Safe percentage calculation
function safePercentage(numerator?: number, denominator?: number): number | undefined {
  if (!numerator || !denominator || denominator === 0) return undefined;
  return (numerator / denominator) * 100;
}

// Remove undefined fields for Prisma
function removeUndefined<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      (result as any)[key] = value;
    }
  }
  return result;
}

// Create or update response for a financial year
router.post("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const parsed = ResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.flatten() 
      });
    }

    const data = parsed.data;

    // Compute auto-calculated metrics
    const carbonIntensity = safeDiv(data.carbonEmissions, data.totalRevenue);
    const renewableElectricityRatio = safePercentage(
      data.renewableElectricityConsumption, 
      data.totalElectricityConsumption
    );
    const diversityRatio = safePercentage(
      data.femaleEmployees, 
      data.totalEmployees
    );
    const communitySpendRatio = safePercentage(
      data.communityInvestmentSpend, 
      data.totalRevenue
    );

    // Prepare data for database
    const basePayload = {
      financialYear: data.financialYear,
      // Environmental
      totalElectricityConsumption: data.totalElectricityConsumption,
      renewableElectricityConsumption: data.renewableElectricityConsumption,
      totalFuelConsumption: data.totalFuelConsumption,
      carbonEmissions: data.carbonEmissions,
      // Social
      totalEmployees: data.totalEmployees,
      femaleEmployees: data.femaleEmployees,
      averageTrainingHoursPerEmployee: data.averageTrainingHoursPerEmployee,
      communityInvestmentSpend: data.communityInvestmentSpend,
      // Governance
      percentIndependentBoardMembers: data.percentIndependentBoardMembers,
      dataPrivacyPolicy: data.dataPrivacyPolicy,
      totalRevenue: data.totalRevenue,
      // Computed metrics
      carbonIntensity,
      renewableElectricityRatio,
      diversityRatio,
      communitySpendRatio,
    };

    // Remove undefined values for Prisma
    const updatePayload = removeUndefined(basePayload);
    const createPayload = removeUndefined({
      ...basePayload,
      userId: req.user!.id,
    });

    // Use correct model name 'response' (Prisma converts to camelCase)
    const upsertedResponse = await prisma.response.upsert({
      where: {
        userId_financialYear: {
          userId: req.user!.id,
          financialYear: data.financialYear,
        },
      },
      update: updatePayload,
      create: createPayload,
    });

    res.status(200).json({
      success: true,
      data: upsertedResponse,
      message: `ESG data for FY${data.financialYear} saved successfully`
    });
  } catch (error) {
    console.error("Error in POST /responses:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to save ESG response" 
    });
  }
});

// Get all responses for the current user
router.get("/", requireAuth, async (req: AuthedRequest, res) => {
  try {
    const responses = await prisma.response.findMany({
      where: { userId: req.user!.id },
      orderBy: { financialYear: "desc" }, // Most recent first
    });

    res.status(200).json({
      success: true,
      data: responses,
      count: responses.length
    });
  } catch (error) {
    console.error("Error in GET /responses:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to fetch ESG responses" 
    });
  }
});

// Get response for a specific financial year
router.get("/:year", requireAuth, async (req: AuthedRequest, res) => {
  try {
  const year = parseInt(req.params.year ?? "");
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        error: "Invalid year parameter",
        message: "Year must be between 2000 and 2100" 
      });
    }

    const response = await prisma.response.findUnique({
      where: {
        userId_financialYear: {
          userId: req.user!.id,
          financialYear: year,
        },
      },
    });

    if (!response) {
      return res.status(404).json({ 
        error: "ESG response not found",
        message: `No data found for financial year ${year}` 
      });
    }

    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error("Error in GET /responses/:year:", error);
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to fetch ESG response" 
    });
  }
});

// Delete a response for a specific financial year
router.delete("/:year", requireAuth, async (req: AuthedRequest, res) => {
  try {
  const year = parseInt(req.params.year ?? "");
    if (isNaN(year)) {
      return res.status(400).json({ 
        error: "Invalid year parameter" 
      });
    }

    await prisma.response.delete({
      where: {
        userId_financialYear: {
          userId: req.user!.id,
          financialYear: year,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: `ESG data for FY${year} deleted successfully`
    });
  } catch (error) {
    console.error("Error in DELETE /responses/:year:", error);
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ 
        error: "ESG response not found" 
      });
    }
    res.status(500).json({ 
      error: "Internal server error",
      message: "Failed to delete ESG response" 
    });
  }
});

export default router;