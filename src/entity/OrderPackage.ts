import { Column, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./Order";
import { Package } from "./Package";

@Entity()
export class OrderPackage {
  @PrimaryGeneratedColumn()
  id: number;
  @ManyToOne(() => Order)
  @JoinTable()
  order: Order;
  @ManyToOne(() => Package)
  @JoinTable()
  package: Package;
  @Column({ type: "smallint" })
  quantity: number;
  @Column({ type: "smallint" })
  price: number;
  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP",
    select: false,
  })
  created: Date;
  @Column({
    type: "timestamp",
    default: null,
    onUpdate: "CURRENT_TIMESTAMP",
    select: false,
  })
  updated: Date | null;
}
