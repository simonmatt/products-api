import { Product } from './../entities/product';
export class PaginatedProductsResultDto {
    data: Product[];
    page: number;
    limit: number;
    totalCount: number;
}