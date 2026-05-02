import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class Board {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column("text")
    name!: string;

    @Column("integer", { default: 0 })
    height!: number;

    @Column("integer", { default: 0 })
    width!: number;

    @Column("text", { nullable: true })
    previewsrc?: string;

    @UpdateDateColumn({ type: "timestamptz" })
    last_update!: Date;

    @CreateDateColumn({ type: "timestamptz" })
    created_at!: Date;
}
