import { Column, Entity, JoinTable, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OrderProduct } from "./OrderProduct";
import { OrderPackage } from "./OrderPackage";

export const orderStatus = ["pending", "working", "finished"];

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  date: string;
  @Column({
    type: "enum",
    enum: orderStatus,
    default: "pending",
  })
  status: string;
  @OneToMany(() => OrderProduct, (orderProduct) => orderProduct.order)
  @JoinTable()
  products: OrderProduct[];
  @OneToMany(() => OrderPackage, (orderPackage) => orderPackage.order)
  @JoinTable()
  packages: OrderPackage[];
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
