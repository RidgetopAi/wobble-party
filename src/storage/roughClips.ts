import type { RoughCueClip, RoughCueClipRecord } from '../audio/types';

const databaseName = 'wobble-party-cue-lab';
const databaseVersion = 1;
const clipStoreName = 'rough-clips';

export async function saveRoughCueClip(record: RoughCueClipRecord): Promise<void> {
  const database = await openRoughClipDatabase();
  await runTransaction(database, 'readwrite', (store) => {
    store.put(record);
  });
  database.close();
}

export async function listRoughCueClips(): Promise<RoughCueClip[]> {
  const records = await listRoughCueClipRecords();

  return records
    .map((record) => ({
      id: record.id,
      name: record.name,
      sourceName: record.sourceName,
      startTime: record.startTime,
      endTime: record.endTime,
      duration: record.duration,
      createdAt: record.createdAt,
      status: record.status,
      label: record.label,
      notes: record.notes,
    }))
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function listRoughCueClipRecords(): Promise<RoughCueClipRecord[]> {
  const database = await openRoughClipDatabase();
  const records = await runRequest<RoughCueClipRecord[]>(
    database.transaction(clipStoreName, 'readonly').objectStore(clipStoreName).getAll(),
  );
  database.close();

  return records.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getRoughCueClip(id: string): Promise<RoughCueClipRecord | null> {
  const database = await openRoughClipDatabase();
  const record = await runRequest<RoughCueClipRecord | undefined>(
    database.transaction(clipStoreName, 'readonly').objectStore(clipStoreName).get(id),
  );
  database.close();
  return record ?? null;
}

export async function deleteRoughCueClip(id: string): Promise<void> {
  const database = await openRoughClipDatabase();
  await runTransaction(database, 'readwrite', (store) => {
    store.delete(id);
  });
  database.close();
}

export async function updateRoughCueClip(
  id: string,
  updates: Partial<Pick<RoughCueClip, 'label' | 'name' | 'notes' | 'status'>>,
): Promise<void> {
  const record = await getRoughCueClip(id);
  if (!record) return;
  await saveRoughCueClip({ ...record, ...updates });
}

function openRoughClipDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, databaseVersion);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(clipStoreName)) {
        database.createObjectStore(clipStoreName, { keyPath: 'id' });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function runTransaction(
  database: IDBDatabase,
  mode: IDBTransactionMode,
  mutate: (store: IDBObjectStore) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(clipStoreName, mode);
    mutate(transaction.objectStore(clipStoreName));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}
