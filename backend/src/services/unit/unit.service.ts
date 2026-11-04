import type { FilterQuery } from "mongoose";
import Unit, { type UnitDocument } from "@models/unit.model";
import AppError from "@shared-errors/app.error";

interface CreateUnitInput {
  name: string;
  symbol: string;
}

interface UpdateUnitInput {
  name?: string;
  symbol?: string;
  isActive?: boolean;
}

class UnitService {
  private handleDatabaseError(error: unknown): never {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      const keyPattern =
        "keyPattern" in error &&
        typeof error.keyPattern === "object" &&
        error.keyPattern !== null
          ? error.keyPattern
          : {};

      if ("symbol" in keyPattern) {
        throw new AppError(
          "A unit with this symbol already exists in your business.",
          409,
        );
      }

      throw new AppError(
        "A unit with this name already exists in your business.",
        409,
      );
    }

    throw error;
  }

  async create(businessId: string, input: CreateUnitInput) {
    try {
      return await Unit.create({
        name: input.name.trim(),
        symbol: input.symbol.trim(),
        businessId,
      });
    } catch (error) {
      return this.handleDatabaseError(error);
    }
  }

  async getAll(
    businessId: string,
    filters: {
      status: "all" | "active" | "inactive";
      search: string;
      page: number;
      limit: number;
    } = {
      status: "active",
      search: "",
      page: 1,
      limit: 10,
    },
  ) {
    const query: FilterQuery<UnitDocument> = {
      businessId,
    };

    if (filters.status === "active") {
      query.isActive = true;
    } else if (filters.status === "inactive") {
      query.isActive = false;
    }

    const search = filters.search.trim();

    if (search) {
      const escapedSearch = search.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
      const searchRegex = new RegExp(escapedSearch, "i");

      query.$or = [
        { name: searchRegex },
        { symbol: searchRegex },
      ];
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, totalItems] = await Promise.all([
      Unit.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(filters.limit),
      Unit.countDocuments(query),
    ]);

    return {
      items,
      pagination: {
        currentPage: filters.page,
        limit: filters.limit,
        totalItems,
        totalPages: Math.ceil(totalItems / filters.limit),
      },
    };
  }

  async update(
    businessId: string,
    unitId: string,
    input: UpdateUnitInput,
  ) {
    try {
      const unit = await Unit.findOneAndUpdate(
        {
          _id: unitId,
          businessId,
        },
        {
          $set: input,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!unit) {
        throw new AppError("Unit not found.", 404);
      }

      return unit;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return this.handleDatabaseError(error);
    }
  }

  async deactivate(businessId: string, unitId: string) {
    const unit = await Unit.findOneAndUpdate(
      {
        _id: unitId,
        businessId,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
        },
      },
      {
        new: true,
      },
    );

    if (!unit) {
      throw new AppError("Unit not found.", 404);
    }

    return unit;
  }
}

export default new UnitService();
