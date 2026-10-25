import { describe, expect, it } from "vitest";
import { sentenceCase } from "../format";

describe("sentenceCase", () => {
  it("fixes registry casing but keeps acronyms and codes", () => {
    expect(
      sentenceCase("Placebo-controlled, Proof-of-concept Study to Evaluate the Safety and Efficacy of Lanifibranor Alone and in Combination With SGLT2 Inhibitor EmpaGliflozin in patiEnts With NASH and Type 2 Diabetes Mellitus"),
    ).toBe(
      "Placebo-controlled, proof-of-concept study to evaluate the safety and efficacy of lanifibranor alone and in combination with SGLT2 inhibitor empagliflozin in patients with NASH and type 2 diabetes mellitus",
    );
  });
});
