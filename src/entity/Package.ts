import { Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { PackageProduct } from "./PackageProduct";
import { PackageImage } from "./PackageImage";

export const packageStatus = ["active", "inactive"];

@Entity()
export class Package {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "smallint" })
  stock: number;
  @Column({ type: "smallint" })
  price: number;
  @Column({ type: "smallint", default: null })
  oldPrice: number | null;
  @Column({ type: "enum", enum: packageStatus, default: "active" })
  status: string;
  @Column()
  slug: string;
  @OneToMany(() => PackageImage, (image) => image.package, { cascade: true })
  @JoinTable()
  images: PackageImage[];
  @ManyToOne(() => Category, (category) => category.packages)
  @JoinTable()
  category: Category;
  @OneToMany(() => PackageProduct, (packageProduct) => packageProduct.package, { cascade: true })
  products: PackageProduct[];
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
