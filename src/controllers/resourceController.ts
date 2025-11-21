import { Request, Response } from "express";
import { Resource } from "../models/Resource";
import { User } from "../models/User";
import { IFoodItem } from "../models/FoodItem";
import {
  CreateResourceInput,
  UpdateResourceInput,
  GetResourcesQueryInput,
} from "../validation/resourceSchemas";

// GET /resources - List all resources with filtering and pagination
export const listResources = async (req: Request, res: Response) => {
  try {
  

    const query = req.query as unknown as GetResourcesQueryInput;
    const { type, tag, search, page = 1, limit = 10 } = query;

    // Build filter object
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (tag) {
      filter.tags = tag;
    }

    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [resources, total] = await Promise.all([
      Resource.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Resource.countDocuments(filter),
    ]);

    console.log({
        resources,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    })

    return res.status(200).json({
      resources,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /resources/:id - Get a single resource by ID
export const getResource = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const resource = await Resource.findById(id).populate(
      "created_by",
      "fullName email image_url"
    );

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    return res.status(200).json({ resource });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /resources - Create a new resource
export const createResource = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const body = req.body as CreateResourceInput;

    // Validate video_url is provided when type is video
    if (body.type === "video" && !body.video_url) {
      return res
        .status(400)
        .json({ message: "Video URL is required for video type resources" });
    }

    const resource = await Resource.create({
      ...body,
      created_by: userId,
    });

    const populatedResource = await Resource.findById(resource._id).populate(
      "created_by",
      "fullName email image_url"
    );

    return res.status(201).json({ resource: populatedResource });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PATCH /resources/:id - Update a resource
export const updateResource = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const body = req.body as UpdateResourceInput;

    const resource = await Resource.findOne({ _id: id, created_by: userId });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    // If updating to video type, ensure video_url is present
    if (body.type === "video" && !body.video_url && !resource.video_url) {
      return res
        .status(400)
        .json({ message: "Video URL is required for video type resources" });
    }

    // Update fields
    Object.assign(resource, body);
    await resource.save();

    const populatedResource = await Resource.findById(resource._id).populate(
      "created_by",
      "fullName email image_url"
    );

    return res.status(200).json({ resource: populatedResource });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /resources/:id - Delete a resource
export const deleteResource = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { id } = req.params;

    const resource = await Resource.findOneAndDelete({
      _id: id,
      created_by: userId,
    });

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    return res.status(200).json({
      message: "Resource deleted successfully",
      resource,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /resources/recommendations - Get personalized resource recommendations
export const getResourceRecommendations = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Find user with food logs and inventory populated
    const user = await User.findById(userId).populate([
      {
        path: "foodLogs.foodItem",
        model: "FoodItem",
      },
      {
        path: "inventory",
        populate: {
          path: "foodItems",
          model: "FoodItem",
        },
      },
    ]);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const tagsSet = new Set<string>();

    // Collect tags from recent food logs (last 10 logs)
    if (user.foodLogs && user.foodLogs.length > 0) {
      const recentLogs = user.foodLogs.slice(-10);
      recentLogs.forEach((log) => {
        const foodItem = log.foodItem as unknown as IFoodItem;
        if (foodItem && foodItem.tags) {
          foodItem.tags.forEach((tag) => tagsSet.add(tag));
        }
      });
    }

    // Collect tags from inventory items
    if (user.inventory && typeof user.inventory === "object") {
      const inventory = user.inventory as any;
      if (inventory.foodItems && Array.isArray(inventory.foodItems)) {
        inventory.foodItems.forEach((foodItem: IFoodItem) => {
          if (foodItem.tags) {
            foodItem.tags.forEach((tag) => tagsSet.add(tag));
          }
        });
      }
    }

    const tags = Array.from(tagsSet);

    // If no tags found, return empty recommendations
    if (tags.length === 0) {
      return res.status(200).json({
        message:
          "No recommendations available. Add food items to get personalized recommendations.",
        recommendations: [],
        basedOnTags: [],
      });
    }

    // Find resources that match any of the collected tags
    const recommendations = await Resource.find({
      tags: { $in: tags },
    })
      .populate("created_by", "fullName email image_url")
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({
      recommendations,
      basedOnTags: tags,
      count: recommendations.length,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
