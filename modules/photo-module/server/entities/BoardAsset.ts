import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Board } from "./Board";

@Entity()
export class BoardAsset {
    @PrimaryColumn("uuid")
    board_id!: string;

    @PrimaryColumn("text")
    asset_name!: string;

    @Column("real", { default: 1.0 })
    scale!: number;

    @Column("real", { default: 0.0 })
    rotation!: number;

    @Column("real", { default: 0.0 })
    x_position!: number;

    @Column("real", { default: 0.0 })
    y_position!: number;

    @Column("text")
    src!: string;

    @UpdateDateColumn({ type: "timestamptz" })
    last_update!: Date;

    @ManyToOne(() => Board, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "board_id" })
    board!: Board;
}
