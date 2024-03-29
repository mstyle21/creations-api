import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { ProductImage } from "./ProductImage";

export const productStatus = ["active", "inactive"];

@Entity()
export class Product {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "decimal", precision: 4, scale: 1 })
  width: number;
  @Column({ type: "decimal", precision: 4, scale: 1 })
  height: number;
  @Column({ type: "decimal", precision: 4, scale: 1 })
  depth: number;
  @Column({ type: "smallint" })
  stock: number;
  @Column({ type: "smallint" })
  price: number;
  @Column({ type: "smallint", default: null })
  oldPrice: number | null;
  @Column({ type: "enum", enum: productStatus, default: "active" })
  status: string;
  @Column()
  slug: string;
  @Column({ type: "smallint", default: null })
  materialWeight: number | null;
  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable()
  categories: Category[];
  @OneToMany(() => ProductImage, (image) => image.product, { cascade: true })
  @JoinTable()
  images: ProductImage[];
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP", select: false })
  created: Date;
  @Column({
    type: "timestamp",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    select: false,
  })
  updated: Date | null;
}
