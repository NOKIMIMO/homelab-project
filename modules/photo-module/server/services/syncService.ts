import { PhotoDataSource } from "../db/db";
import { Asset } from "../entities/Asset";
import { Board } from "../entities/Board";
import { BoardAsset } from "../entities/BoardAsset";
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
    const assetRepository = PhotoDataSource.getRepository(Asset);
    const boardRepository = PhotoDataSource.getRepository(Board);
    const boardAssetRepository = PhotoDataSource.getRepository(BoardAsset);

    const [lastSynchro, maxAssetUpload, maxBoardUpdate, maxBoardAssetUpdate] = await Promise.all([
        synchroRepository.createQueryBuilder("synchro").orderBy("synchro.date", "DESC").getOne(),
        assetRepository.createQueryBuilder("asset").select("MAX(asset.date_upload)", "max").getRawOne(),
        boardRepository.createQueryBuilder("board").select("MAX(board.last_update)", "max").getRawOne(),
        boardAssetRepository.createQueryBuilder("boardAsset").select("MAX(boardAsset.last_update)", "max").getRawOne(),
    ]);

    return maxDate([
        lastSynchro?.date ?? null,
        toDate(maxAssetUpload?.max),
        toDate(maxBoardUpdate?.max),
        toDate(maxBoardAssetUpdate?.max),
    ]);
};
