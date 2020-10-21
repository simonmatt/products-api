import { PaginatedProductsResultDto } from './../dto/paginated-products-result.dto';
import { PaginationDto } from './../dto/pagination.dto';
import { CreateProductDTO } from './../dto/create-product.dto';
import { Product } from './../entities/product';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productsRepository: Repository<Product>
    ) { }

    async findAll(paginationDto: PaginationDto):
        Promise<PaginatedProductsResultDto> {

        const skippedItems = (paginationDto.page - 1) * paginationDto.limit;
        const totalCount = await this.productsRepository.count();
        const products = await this.productsRepository.createQueryBuilder()
            .orderBy('price', 'DESC')
            .offset(skippedItems)
            .limit(paginationDto.limit)
            .getMany();

        return {
            totalCount,
            page: paginationDto.page,
            limit: paginationDto.limit,
            data: products
        };
    }

    create(productDto: CreateProductDTO): Promise<Product> {
        return this.productsRepository.save(productDto);
    }
}
