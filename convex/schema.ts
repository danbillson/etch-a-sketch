import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  drawings: defineTable({
    name: v.string(),
    twitterHandle: v.optional(v.string()),
    points: v.array(
      v.object({
        x: v.number(),
        y: v.number(),
        timestamp: v.number(),
      })
    ),
    canvasWidth: v.number(),
    canvasHeight: v.number(),
  }),
});
