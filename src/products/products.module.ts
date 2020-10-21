import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './../entities/product';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    controllers: [ProductsController],
    providers: [ProductsService]
})
export class ProductsModule { }
