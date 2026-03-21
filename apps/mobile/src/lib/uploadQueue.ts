import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';

const QUEUE_KEY = 'pending_upload_queue_v1';
const METADATA_FILE = `${FileSystem.documentDirectory ?? ''}pending-upload-metadata.json`;

export type PendingUploadIntent = {
  id: string;
  durationSeconds: number;
  createdAt: string;
  reason: string;
};

async function readQueue(): Promise<PendingUploadIntent[]> {
  const raw = await SecureStore.getItemAsync(QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const queue = JSON.parse(raw) as PendingUploadIntent[];
    return Array.isArray(queue) ? queue : [];
  } catch {
    return [];
  }
}

async function persistQueue(queue: PendingUploadIntent[]) {
  await SecureStore.setItemAsync(QUEUE_KEY, JSON.stringify(queue));

  await FileSystem.writeAsStringAsync(
    METADATA_FILE,
    JSON.stringify(
      {
        pendingCount: queue.length,
        lastUpdatedAt: new Date().toISOString(),
        ids: queue.map((item) => item.id),
      },
      null,
      2,
    ),
  );
}

export async function getPendingUploads() {
  return readQueue();
}

export async function queueFailedUploadIntent(intent: Omit<PendingUploadIntent, 'id' | 'createdAt'>) {
  const queue = await readQueue();
  const nextIntent: PendingUploadIntent = {
    id: `intent-${Date.now()}`,
    createdAt: new Date().toISOString(),
    ...intent,
  };

  const updated = [nextIntent, ...queue];
  await persistQueue(updated);
  return nextIntent;
}

export async function removePendingUpload(id: string) {
  const queue = await readQueue();
  const updated = queue.filter((item) => item.id !== id);
  await persistQueue(updated);
}
