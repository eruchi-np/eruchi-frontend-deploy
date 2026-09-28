import { z } from "zod";
import { getMaxWards } from "./municipalityData";

const required = (message) =>
  z.preprocess(
    (value) => (value == null ? "" : value),
    z.string({ invalid_type_error: message }).trim().min(1, message)
  );

// null is a valid firstLanguage value ("Other" in the UI / backend enum).
const requiredLanguage = z.preprocess(
  (value) => (value === undefined || value === "" ? undefined : value),
  z.union([
    z.null(),
    z.string({ invalid_type_error: "Please select your first language" }).trim().min(1, "Please select your first language"),
  ], { errorMap: () => ({ message: "Please select your first language" }) })
);

export const aboutYouSchema = z.object({
  firstLanguage: requiredLanguage,
  education: required("Please select your education level"),
  maritalStatus: required("Please select your marital status"),
  occupation: required("Please select your occupation"),
});

export const addressSchema = z
  .object({
    municipality: required("Municipality is required"),
    wardNumber: required("Ward number is required"),
  })
  .superRefine((data, ctx) => {
    const wardNum = Number.parseInt(data.wardNumber, 10);
    if (Number.isNaN(wardNum) || wardNum < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wardNumber"],
        message: "Ward number must be a positive number",
      });
      return;
    }

    const maxWards = getMaxWards(data.municipality);
    if (maxWards > 0 && wardNum > maxWards) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["wardNumber"],
        message: `This municipality only has ${maxWards} wards`,
      });
    }
  });

export const householdSchema = z
  .object({
    durableGoods: z.preprocess(
      (value) => (Array.isArray(value) ? value : []),
      z.array(z.string()).min(1, "Select at least one household item")
    ),
    mainHouseholdEarner: required("Please specify the main household earner"),
    earnerEducation: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.mainHouseholdEarner && data.mainHouseholdEarner !== "Me" && !data.earnerEducation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["earnerEducation"],
        message: "Please specify the education level of the main earner",
      });
    }
  });

export const additionalProfileSchema = z.object({
  livingSituation: required("Select your living situation"),
  householdSize: required("Select your household size"),
  hasChildrenUnder12: required("Please answer this question"),
  ownsPets: required("Please answer this question"),
  transportation: z.preprocess(
    (value) => (Array.isArray(value) ? value : []),
    z.array(z.string()).min(1, "Select at least one option")
  ),
  dailySchedule: required("Select your typical daily schedule"),
});

export const demographicsStepSchema = {
  1: aboutYouSchema,
  2: addressSchema,
  3: householdSchema,
};

export function zodFieldErrors(error) {
  const next = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key != null && next[key] == null) next[key] = issue.message;
  }
  return next;
}

export function parseStep(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return {};
  return zodFieldErrors(result.error);
}
