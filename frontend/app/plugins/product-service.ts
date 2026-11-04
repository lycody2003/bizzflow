import createProductApiRepository from "../repositories/api/product.repository";
import { ProductService } from "../services/products/product.service";

export default defineNuxtPlugin(() => {
  const repository = createProductApiRepository();
  const productService = new ProductService(repository);

  return {
    provide: {
      productService,
    },
  };
});
