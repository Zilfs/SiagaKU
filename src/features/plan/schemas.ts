import { z } from "zod";

export const HousingTypeSchema = z.enum([
  "single_story",
  "multi_story",
  "rented_room",
  "apartment",
]);

export const DisabilityTypeSchema = z.enum([
  "wheelchair_user",
  "blind",
  "deaf",
  "intellectual",
  "other",
]);

export const VehicleSchema = z.enum(["none", "motorcycle", "car", "both"]);

export const RiverDistanceSchema = z.enum([
  "close",
  "medium",
  "far",
  "unknown",
]);

export const ReadinessLevelSchema = z.enum(["advisory", "watch", "warning"]);

export const PrioritySchema = z.enum(["required", "important", "optional"]);

/** Household counts: 0-10 per group, 1-15 in total (docs/07 API Spec). */
const count = z.number().int().min(0).max(10);

export const PlanRequestSchema = z
  .object({
    district_id: z.number().int().positive(),
    housing: z
      .object({
        type: HousingTypeSchema,
        floor: z.number().int().min(0).max(60),
      })
      .strict(),
    members: z
      .object({
        adults: count,
        children: count,
        infants: count,
        elderly: count,
        pregnant: count,
        disabilities: z
          .array(z.object({ type: DisabilityTypeSchema }).strict())
          .max(10),
        routineMedicine: count,
        pets: z.array(z.string().trim().min(1).max(30)).max(10),
      })
      .strict(),
    conditions: z
      .object({
        vehicle: VehicleSchema,
        riverDistance: RiverDistanceSchema,
        floodedBefore: z.boolean(),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const m = value.members;
    const total = m.adults + m.children + m.infants + m.elderly + m.pregnant;
    if (total < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Total anggota keluarga minimal 1.",
      });
    }
    if (total > 15) {
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Total anggota keluarga maksimal 15.",
      });
    }
  });

export const GoKitItemSchema = z.object({
  item: z.string().min(1).max(80),
  quantity: z.string().min(1).max(60),
  /** "semua", "bayi", "lansia", "pengguna kursi roda", ... */
  audience: z.string().min(1).max(40),
  priority: PrioritySchema,
  reason: z.string().min(1).max(140),
});

export const VulnerableGroupSchema = z.object({
  group: z.string().min(1).max(40),
  notes: z.array(z.string().min(1).max(160)).min(1).max(5),
});

/** Plan output from the model, validated before it is stored (docs/05 §2.2). */
export const PreparednessPlanSchema = z.object({
  summary: z.string().min(1).max(400),
  recommendedReadinessLevel: ReadinessLevelSchema,
  goKit: z.array(GoKitItemSchema).min(10).max(30),
  before: z.array(z.string().min(1).max(200)).min(4).max(10),
  during: z.array(z.string().min(1).max(200)).min(4).max(10),
  after: z.array(z.string().min(1).max(200)).min(3).max(8),
  vulnerableGroups: z.array(VulnerableGroupSchema).max(6),
  /** Must be a subset of the safe points that were offered to the model. */
  safePointIds: z.array(z.number().int().positive()).max(3),
  safePointReason: z.string().min(1).max(200),
});

export type PlanRequest = z.output<typeof PlanRequestSchema>;
export type PreparednessPlan = z.output<typeof PreparednessPlanSchema>;
export type GoKitItem = z.output<typeof GoKitItemSchema>;
export type HousingType = z.output<typeof HousingTypeSchema>;
export type DisabilityType = z.output<typeof DisabilityTypeSchema>;
export type ReadinessLevel = z.output<typeof ReadinessLevelSchema>;
export type Priority = z.output<typeof PrioritySchema>;

/** One stored plan row plus its district, as returned by the repository. */
export type StoredPlan = {
  slug: string;
  createdAt: string;
  districtId: number;
  district: {
    id: number;
    slug: string;
    name: string;
    city: string;
  };
  profile: PlanRequest;
  plan: PreparednessPlan;
  provider: string;
  model: string;
};

export type EmergencyContact = {
  name: string;
  phone: string;
  scope: string;
};
