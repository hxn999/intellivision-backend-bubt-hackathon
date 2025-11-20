import mongoose, { Document, Schema } from "mongoose";

export type ResourceType = "article" | "video";

export interface IResource extends Document {
  title: string;
  tags: string[];
  content: string;
  video_url?: string;
  type: ResourceType;
  created_by: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema: Schema<IResource> = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    video_url: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["article", "video"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
ResourceSchema.index({ title: "text", tags: "text", content: "text" });
ResourceSchema.index({ type: 1 });
ResourceSchema.index({ created_by: 1 });

export const Resource = mongoose.model<IResource>("Resource", ResourceSchema);
