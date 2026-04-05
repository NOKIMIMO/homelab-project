import { PhotoDataSource } from "../db/db";
import { Synchro } from "../entities/Synchro";

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
};

const maxDate = (dates: Array<Date | null>): Date | null => {
    const valid = dates.filter((d): d is Date => d !== null);
    if (valid.length === 0) return null;
    return valid.reduce((max, current) => (current > max ? current : max));
};

export const recordSyncCheckpoint = async (): Promise<void> => {
    const repository = PhotoDataSource.getRepository(Synchro);
    await repository.save(repository.create({}));
};

export const getLatestSyncDate = async (): Promise<Date | null> => {
    const synchroRepository = PhotoDataSource.getRepository(Synchro);

    const lastSynchro = await synchroRepository.createQueryBuilder("synchro").orderBy("synchro.date", "DESC").getOne()
    return maxDate([
        lastSynchro?.date ?? null
    ]);
};
