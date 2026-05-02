import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class Asset {
    @PrimaryGeneratedColumn("identity", { generatedIdentity: "ALWAYS" })
    id!: number;

    @Column("text", { unique: true })
    name!: string;

    @Column("jsonb", { nullable: true })
    metadata!: Record<string, any>;

    @Column("timestamptz", { nullable: true })
    date_photo!: Date;

    @CreateDateColumn({ type: "timestamptz" })
    date_upload!: Date;

    @Column("text", { nullable: true })
    origin!: string;
}
