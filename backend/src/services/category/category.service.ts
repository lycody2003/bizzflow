import Category from "@models/category.model";
import AppError from "@shared-errors/app.error";

interface CreateCategoryInput {
  name: string;
  icon?: string | null;
}

interface UpdateCategoryInput {
  name?: string;
  icon?: string | null;
  isActive?: boolean;
}

class CategoryService {
  private handleDatabaseError(error: unknown): never {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      throw new AppError(
        "A category with this name already exists in your business.",
        409,
      );
    }

    throw error;
  }

  async create(
    businessId: string,
    input: CreateCategoryInput,
  ) {
    try {
      return await Category.create({
        name: input.name.trim(),
        icon: input.icon?.trim() || null,
        businessId,
      });
    } catch (error) {
      return this.handleDatabaseError(error);
    }
  }

  async getAll(
    businessId: string,
    filters: { status: "all" | "active" | "inactive" } = {
      status: "active",
    },
  ) {
    const query: { businessId: string; isActive?: boolean } = {
      businessId,
    };

    if (filters.status === "active") {
      query.isActive = true;
    } else if (filters.status === "inactive") {
      query.isActive = false;
    }

    return Category.find(query).sort({ name: 1 });
  }

  async update(
    businessId: string,
    categoryId: string,
    input: UpdateCategoryInput,
  ) {
    try {
      const updateData: UpdateCategoryInput = { ...input };

      if (input.icon !== undefined) {
        updateData.icon = input.icon?.trim() || null;
      }

      const category = await Category.findOneAndUpdate(
        {
          _id: categoryId,
          businessId,
        },
        {
          $set: updateData,
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!category) {
        throw new AppError("Category not found.", 404);
      }

      return category;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      return this.handleDatabaseError(error);
    }
  }

  async deactivate(
    businessId: string,
    categoryId: string,
  ) {
    const category = await Category.findOneAndUpdate(
      {
        _id: categoryId,
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

    if (!category) {
      throw new AppError("Category not found.", 404);
    }

    return category;
  }
}

export default new CategoryService();
