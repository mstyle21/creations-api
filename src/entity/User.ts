import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UserRole } from "./UserRole";

export const userStatus = ["active", "pending", "inactive", "deleted"];

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;
  @Column()
  email: string;
  @Column()
  password: string;
  @Column({ nullable: true, type: "text" })
  token?: string;
  @ManyToOne(() => UserRole)
  @JoinColumn()
  role: UserRole;
  @Column({ type: "enum", default: "active", enum: userStatus })
  status: string;
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
