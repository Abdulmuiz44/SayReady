export interface KeyValueStorage {
  getBoolean(key: string): Promise<boolean | null>;
  setBoolean(key: string, value: boolean): Promise<void>;
}

export class MemoryStorage implements KeyValueStorage {
  private store = new Map<string, boolean>();

  async getBoolean(key: string): Promise<boolean | null> {
    return this.store.get(key) ?? null;
  }

  async setBoolean(key: string, value: boolean): Promise<void> {
    this.store.set(key, value);
  }
}
