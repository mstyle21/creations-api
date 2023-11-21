import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Package } from "./Package";

@Entity()
@Index(["order", "package"], { unique: true })
export class PackageImage {
  @PrimaryGeneratedColumn()
  id: number;
  @JoinColumn()
  @ManyToOne(() => Package)
  package: Package;
  @Column({ length: 150 })
  filename: string;
  @Column({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  @Column({ type: "tinyint" })
  order: number;
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
