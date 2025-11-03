import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const saveDrawing = mutation({
  args: {
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
  },
  returns: v.id("drawings"),
  handler: async (ctx, args) => {
    const drawingId = await ctx.db.insert("drawings", {
      name: args.name,
      twitterHandle: args.twitterHandle,
      points: args.points,
      canvasWidth: args.canvasWidth,
      canvasHeight: args.canvasHeight,
    });
    return drawingId;
  },
});

export const getDrawing = query({
  args: {
    id: v.id("drawings"),
  },
  returns: v.union(
    v.object({
      _id: v.id("drawings"),
      _creationTime: v.number(),
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
    v.null()
  ),
  handler: async (ctx, args) => {
    const drawing = await ctx.db.get(args.id);
    return drawing;
  },
});

export const listDrawings = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  returns: v.object({
    page: v.array(
      v.object({
        _id: v.id("drawings"),
        _creationTime: v.number(),
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
      })
    ),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("drawings")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

