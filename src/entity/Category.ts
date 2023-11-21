import { Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Product } from "./Product";
import { Package } from "./Package";

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  name: string;
  @Column({ type: "enum", enum: ["active", "inactive"], default: "active" })
  status: string;
  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];
  @OneToMany(() => Package, (pckg) => pckg.category)
  packages: Package[];
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
