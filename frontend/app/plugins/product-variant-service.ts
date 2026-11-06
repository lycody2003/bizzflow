import createProductVariantApiRepository from "../repositories/api/product-variant.repository";
import { ProductVariantService } from "../services/products/product-variant.service";

export default defineNuxtPlugin(() => {
  const repository = createProductVariantApiRepository();
  const productVariantService = new ProductVariantService(repository);

  return {
    provide: {
      productVariantService,
    },
  };
});
