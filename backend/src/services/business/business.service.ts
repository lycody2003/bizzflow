import Business from "@models/business.model";
import AppError from "@shared-errors/app.error";

interface UpdateBusinessInput {
  name: string;
}

class BusinessService {
  async getMyBusiness(
    userId: string,
    businessId: string,
  ): Promise<Record<string, unknown>> {
    const business = await Business.findOne({
      _id: businessId,
      ownerId: userId,
    });

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return {
      id: business._id.toString(),
      name: business.name,
      logoUrl: business.logoUrl,
      ownerId: business.ownerId.toString(),
      status: business.status,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };
  }

  async updateMyBusiness(
    userId: string,
    businessId: string,
    input: UpdateBusinessInput,
  ): Promise<Record<string, unknown>> {
    const business = await Business.findOneAndUpdate(
      {
        _id: businessId,
        ownerId: userId,
      },
      {
        $set: {
          name: input.name,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!business) {
      throw new AppError("Business not found", 404);
    }

    return {
      id: business._id.toString(),
      name: business.name,
      logoUrl: business.logoUrl,
      ownerId: business.ownerId.toString(),
      status: business.status,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
    };
  }
}

export default new BusinessService();
