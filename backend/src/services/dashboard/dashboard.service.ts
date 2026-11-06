import mongoose from "mongoose";

import Product from "@models/product.model";
import ProductVariant from "@models/product-variant.model";
import InventoryBalance from "@models/inventory-balance.model";

interface CurrencyStockStats {
  _id: "USD" | "KHR";
  lowStockProducts: number;
  outOfStockProducts: number;
  inventoryCostValue: number;
  potentialSalesValue: number;
}

interface DashboardCurrencyTotals {
  inventoryCostValue: number;
  potentialSalesValue: number;
}

class DashboardService {
  private buildStockPipeline(
    businessObjectId: mongoose.Types.ObjectId,
    includeVariants: boolean,
  ) {
    const pipeline: mongoose.PipelineStage[] = [
      {
        $match: {
          businessId: businessObjectId,
          ...(includeVariants
            ? { variantId: { $exists: true } }
            : { variantId: { $exists: false } }),
        },
      },
    ];

    if (includeVariants) {
      pipeline.push(
        {
          $lookup: {
            from: ProductVariant.collection.name,
            let: {
              variantId: "$variantId",
              productId: "$productId",
              businessId: "$businessId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$variantId"] },
                      { $eq: ["$productId", "$$productId"] },
                      { $eq: ["$businessId", "$$businessId"] },
                      { $eq: ["$status", "active"] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: Product.collection.name,
                  let: {
                    parentId: "$productId",
                    businessId: "$businessId",
                  },
                  pipeline: [
                    {
                      $match: {
                        $expr: {
                          $and: [
                            { $eq: ["$_id", "$$parentId"] },
                            { $eq: ["$businessId", "$$businessId"] },
                            { $eq: ["$type", "variant"] },
                            { $eq: ["$status", "active"] },
                          ],
                        },
                      },
                    },
                    { $project: { _id: 1 } },
                  ],
                  as: "activeParent",
                },
              },
              { $match: { "activeParent.0": { $exists: true } } },
              {
                $project: {
                  currency: 1,
                  costPrice: 1,
                  sellingPrice: 1,
                  minimumStock: 1,
                },
              },
            ],
            as: "stockItem",
          },
        },
        { $unwind: "$stockItem" },
      );
    } else {
      pipeline.push(
        {
          $lookup: {
            from: Product.collection.name,
            let: {
              productId: "$productId",
              businessId: "$businessId",
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$_id", "$$productId"] },
                      { $eq: ["$businessId", "$$businessId"] },
                      { $eq: ["$type", "standard"] },
                      { $eq: ["$status", "active"] },
                    ],
                  },
                },
              },
              {
                $project: {
                  currency: 1,
                  costPrice: 1,
                  sellingPrice: 1,
                  minimumStock: 1,
                },
              },
            ],
            as: "stockItem",
          },
        },
        { $unwind: "$stockItem" },
      );
    }

    pipeline.push(
      {
        $project: {
          quantityOnHand: 1,
          currency: { $ifNull: ["$stockItem.currency", "USD"] },
          minimumStock: { $ifNull: ["$stockItem.minimumStock", 0] },
          costPrice: { $ifNull: ["$stockItem.costPrice", 0] },
          sellingPrice: { $ifNull: ["$stockItem.sellingPrice", 0] },
        },
      },
      {
        $group: {
          _id: "$currency",
          lowStockProducts: {
            $sum: {
              $cond: [{ $lte: ["$quantityOnHand", "$minimumStock"] }, 1, 0],
            },
          },
          outOfStockProducts: {
            $sum: { $cond: [{ $eq: ["$quantityOnHand", 0] }, 1, 0] },
          },
          inventoryCostValue: {
            $sum: { $multiply: ["$costPrice", "$quantityOnHand"] },
          },
          potentialSalesValue: {
            $sum: { $multiply: ["$sellingPrice", "$quantityOnHand"] },
          },
        },
      },
    );

    return pipeline;
  }

  async getOverview(businessId: string) {
    const businessObjectId = new mongoose.Types.ObjectId(businessId);

    const [totalProducts, totalVariants, standardStats, variantStats] =
      await Promise.all([
        Product.countDocuments({
          businessId: businessObjectId,
          status: "active",
        }),
        ProductVariant.aggregate([
          {
            $match: {
              businessId: businessObjectId,
              status: "active",
            },
          },
          {
            $lookup: {
              from: Product.collection.name,
              let: {
                parentId: "$productId",
                businessId: "$businessId",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $eq: ["$_id", "$$parentId"] },
                        { $eq: ["$businessId", "$$businessId"] },
                        { $eq: ["$type", "variant"] },
                        { $eq: ["$status", "active"] },
                      ],
                    },
                  },
                },
                { $project: { _id: 1 } },
              ],
              as: "activeParent",
            },
          },
          { $match: { "activeParent.0": { $exists: true } } },
          { $count: "total" },
        ]).then((result) => result[0]?.total ?? 0),
        InventoryBalance.aggregate<CurrencyStockStats>(
          this.buildStockPipeline(businessObjectId, false),
        ),
        InventoryBalance.aggregate<CurrencyStockStats>(
          this.buildStockPipeline(businessObjectId, true),
        ),
      ]);

    const currencyValues: Record<"USD" | "KHR", DashboardCurrencyTotals> = {
      USD: { inventoryCostValue: 0, potentialSalesValue: 0 },
      KHR: { inventoryCostValue: 0, potentialSalesValue: 0 },
    };

    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const stats of [...standardStats, ...variantStats]) {
      lowStockProducts += stats.lowStockProducts;
      outOfStockProducts += stats.outOfStockProducts;

      if (stats._id === "USD" || stats._id === "KHR") {
        currencyValues[stats._id].inventoryCostValue +=
          stats.inventoryCostValue;

        currencyValues[stats._id].potentialSalesValue +=
          stats.potentialSalesValue;
      }
    }

    return {
      totalProducts,
      activeProducts: totalProducts,
      totalVariants,
      lowStockProducts,
      outOfStockProducts,
      inventoryCostValue: {
        USD: currencyValues.USD.inventoryCostValue,
        KHR: currencyValues.KHR.inventoryCostValue,
      },
      potentialSalesValue: {
        USD: currencyValues.USD.potentialSalesValue,
        KHR: currencyValues.KHR.potentialSalesValue,
      },
    };
  }
}

export default new DashboardService();
