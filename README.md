# NestJS TypeORM Pagination - Demo
When working on an API, sometimes, we have to paginate our data in order to provide a good user experience. In this tutorial, we will be doing a NestJS TypeORM Pagination example. The example will be a products API.

## Setting up a NestJS Project

```powershell
> npm install -g @nestjs/cli

> nest new products-api
```

## Adding TypeORM

If we're doing pagination, we most probably have a lot of data. And when having a lot of data, we also most probably are storing that data inside a database. To interact with our database we will use [TypeORM](https://typeorm.io/).

Let's install and setup the module:

```powershell
> yarn add @nestjs/typeorm typeorm mysql
```

I am using MySQL for this example, you can use whichever database you want, you just have to install the correct driver.

Next, let's import the module in our root module, `app.module.ts`:

```typescript
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { TypeOrmModule } from '@nestjs/typeorm'

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'password',
      database: 'products',
      entities: [],
      synchronize: true,
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

## Creating the Products Module

For this module, we will create a small products module. In order to make thing simple, a product will have on an `id`, `name`, `price`, `createdAt` field.

```typescript
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    price: number;
}
```

Then, we will add it to the `entities` array in our TypeORM configuration to sync our database and create the corresponding table:

```typescript
// ...imports
import { Product } from './products/products.entity'

@Module({
  imports: [
    // ...code
    TypeOrmModule.forRoot({
      // ...code,
      entities: [Product],
    }),
  ],
  // ...code
})
export class AppModule {}
```

In order to consume this entity, we will create a ProductsService, with a `create` and `findAll` methods:

```typescript
import { Injectable } from "@nestjs/common";
import { Product } from "./product.entity";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateProductDto } from "./dto/CreateProduct.dto";

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRespository: Repository<Product>
  ) {}

  findAll(): Promise<Product[]> {
    return this.productsRespository.find()
  }

  create(productDto: CreateProductDto): Promise<Product> {
    return this.productsRespository.save(productDto)
  }
}
```

We have injected the `ProductRepository` and we're finding or saving new products, pretty simple so far:

Furthermore, we're using a DTO as the request body type, `CreateProductDto`. Let's add it to the project:

```typescript
export class CreateProductDto {
  name: string
  price: number
}
```

Next, we need to create a controller that will use this service to handle the requests:

```typescript
import { Product } from "./product.entity";
import { ProductsService } from "./products.service";
import { Post, Get, Controller, Body } from "@nestjs/common";
import { CreateProductDto } from "./dto/CreateProduct.dto";

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService
  ) {}

  @Get()
  findAll(): Promise<Product[]> {
    return this.productsService.findAll()
  }

  @Post()
  create(@Body() productDto: CreateProductDto): Promise<Product> {
    return this.productsService.create(productDto)
  }
}
```

Now we will bring everything together inside a products module:

```typescript
import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Product } from "./product.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Product])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
```

Finally, we'll import the module in our root module:

```typescript
// ...imports
import { ProductsModule } from './products/products.module'

@Module({
  imports: [
    // ...code
    ProductsModule,
  ],
  // ...code
})
export class AppModule {}
```

If we start the server using `npm run start:dev`, we should ba able to create a new product and fetch all the products:

## NestJS TypeORM Pagination

There are multiple ways to implement pagination, in this tutorial, we'll implement pagination using `SQL offset and limit`.

The limit is the amount of items we'll get back.

The offset is the amount of data we will skip, so for the first page we will skip 0, and for the second page, we will skip the limit, etc...

```typescript
// dto/pagination.dto.ts
export class PaginationDto {
  page: number
  limit: number
}
```

```typescript
// dto/paginated-products-result.dto.ts
import { Product } from "../product.entity";

export class PaginatedProductsResultDto {
  data: Product[]
  page: number
  limit: number
  totalCount: number
}
```

First of all, we add the `PaginationDto` as the type of our request params object. And pass the data of the `findAll` service methods. Our method return type should change to `Promise<PaginatedProductsResultDto>`

```typescript
// ... imports
import { /* ...named imports */ Query } from "@nestjs/common";
import { PaginationDto } from "./dto/Pagination.dto";

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService
  ) {}

  @Get()
  findAll(@Query() paginationDto: PaginationDto): Promise<PaginatedProductsResultDto> {
    paginationDto.page = Number(paginationDto.page)
    paginationDto.limit = Number(paginationDto.limit)

    return this.productsService.findAll({
      ...paginationDto,
      limit: paginationDto.limit > 10 ? 10 : paginationDto.limit
    })
  }
  // ... code
}
```

Even though our DTO specifies that the page and limit properties are numbers, the query params will be strings. Therefore we need to explicitly convert these values. In addition, we’re also handling negative numbers using `Math.abs`.

When passing the pagination data to the service method, we’re overriding the limit to force it to be bellow 10. This number depends on your use case.

Next, we will implement the pagination in the service layer using the TypeORM query builder:

```typescript
// ...imports
import { PaginationDto } from "./dto/Pagination.dto";
import { PaginatedProductsResultDto } from "./dto/PaginatedProductsResult.dto";

@Injectable()
export class ProductsService {
  // ...code

  async findAll(paginationDto: PaginationDto): Promise<PaginatedProductsResultDto> {
    const skippedItems = (paginationDto.page - 1) * paginationDto.limit;

    const totalCount = await this.productsRespository.count()
    const products = await this.productsRespository.createQueryBuilder()
      .orderBy('createdAt', "DESC")
      .offset(skippedItems)
      .limit(paginationDto.limit)
      .getMany()

    return {
      totalCount,
      page: paginationDto.page,
      limit: paginationDto.limit,
      data: products,
    }
  }
  // ...code
}
```

## Conclusion

We did basic pagination, there are a few improvements that can be done. We need to validate the products data when creating new items, we can do that in the `CreateProductDto` using the [classvalidator](https://docs.nestjs.com/techniques/validation). Likewise, we can also validate the pagination data in the `PaginationDto` and remove the custom validation from the controller method.