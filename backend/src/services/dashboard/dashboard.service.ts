import mongoose from "mongoose";

import Product from "@models/product.model";

class DashboardService {
  async getOverview(businessId: string) {
    const productStats = await Product.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
          status: "active",
        },
      },
      {
        $group: {
          _id: {
            $ifNull: ["$currency", "USD"],
          },
          totalProducts: { $sum: 1 },
          lowStockProducts: {
            $sum: {
              $cond: [
                { $lte: ["$stockQuantity", "$minimumStock"] },
                1,
                0,
              ],
            },
          },
          outOfStockProducts: {
            $sum: {
              $cond: [{ $eq: ["$stockQuantity", 0] }, 1, 0],
            },
          },
          inventoryCostValue: {
            $sum: {
              $multiply: ["$costPrice", "$stockQuantity"],
            },
          },
          potentialSalesValue: {
            $sum: {
              $multiply: ["$sellingPrice", "$stockQuantity"],
            },
          },
        },
      },
    ]);

    const currencyValues = {
      USD: {
        inventoryCostValue: 0,
        potentialSalesValue: 0,
      },
      KHR: {
        inventoryCostValue: 0,
        potentialSalesValue: 0,
      },
    };

    let totalProducts = 0;
    let lowStockProducts = 0;
    let outOfStockProducts = 0;

    for (const stats of productStats) {
      totalProducts += stats.totalProducts;
      lowStockProducts += stats.lowStockProducts;
      outOfStockProducts += stats.outOfStockProducts;

      if (stats._id === "USD") {
        currencyValues.USD.inventoryCostValue =
          stats.inventoryCostValue;

        currencyValues.USD.potentialSalesValue =
          stats.potentialSalesValue;
      } else if (stats._id === "KHR") {
        currencyValues.KHR.inventoryCostValue =
          stats.inventoryCostValue;

        currencyValues.KHR.potentialSalesValue =
          stats.potentialSalesValue;
      }
    }

    return {
      totalProducts,
      activeProducts: totalProducts,
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
