import type { FalseExclusionPoint } from "@/lib/types";

// Mock fidelity curves: how often rules wrongly exclude someone as more
// fields go missing in the record. Points every 5% from 0% to 60%.

function curve(base: number, linear: number, quad: number, uncertainSlope: number): FalseExclusionPoint[] {
  return Array.from({ length: 13 }, (_, i) => {
    const m = i * 5;
    return {
      missingPct: m,
      falseExclusionRate: Math.min(1, base + linear * m + quad * m * m),
      uncertainRate: Math.min(1, uncertainSlope * m),
    };
  });
}

export const falseExclusionCurves: Record<string, FalseExclusionPoint[]> = {
  NCT90000001: curve(0.012, 0.0018, 0.00005, 0.011),
  NCT90000002: curve(0.008, 0.0012, 0.00004, 0.009),
};
