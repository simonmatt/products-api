import { PaginatedProductsResultDto } from './../dto/paginated-products-result.dto';
import { PaginationDto } from './../dto/pagination.dto';
import { CreateProductDTO } from './../dto/create-product.dto';
import { Product } from './../entities/product';
import { ProductsService } from './products.service';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';

@Controller('products')
export class ProductsController {
    constructor(
        private readonly productsService: ProductsService
    ) { }

    @Get()
    findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedProductsResultDto> {
        paginationDto.page = Number(paginationDto.page);
        paginationDto.limit = Number(paginationDto.limit);

        return this.productsService.findAll({
            ...paginationDto,
            limit: paginationDto.limit
        });
    }

    @Post()
    create(@Body() productDto: CreateProductDTO): Promise<Product> {
        return this.productsService.create(productDto);
    }
}
