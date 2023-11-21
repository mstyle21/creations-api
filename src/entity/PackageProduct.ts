import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Package } from "./Package";
import { Product } from "./Product";

@Entity()
@Index(["package", "product"], { unique: true })
export class PackageProduct {
  @PrimaryGeneratedColumn()
  id: number;
  @JoinColumn()
  @ManyToOne(() => Package, (pckg) => pckg.products)
  package: Package;
  @JoinColumn()
  @ManyToOne(() => Product)
  product: Product;
  @Column({ type: "smallint" })
  quantity: number;
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
