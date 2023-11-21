import { Column, Entity, JoinTable, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Category } from "./Category";
import { PackageProduct } from "./PackageProduct";

@Entity()
export class Package {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @ManyToOne(() => Category, (category) => category.packages)
  @JoinTable()
  category: Category;
  @OneToMany(() => PackageProduct, (packageProduct) => packageProduct.package)
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
