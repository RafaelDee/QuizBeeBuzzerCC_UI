import { Injectable } from '@angular/core';
import { openDB, IDBPDatabase } from 'idb';

@Injectable({
  providedIn: 'root',
})
export class IndexedDbService {
  private dbName = 'appStorage';
  private storeName = 'keyValueStore';
  private db!: IDBPDatabase;

  constructor() {
    this.initDB();
  }

  async initDB() {
    this.db = await openDB(this.dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('keyValueStore')) {
          db.createObjectStore('keyValueStore');
        }
      },
    });
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (!this.db) {
        console.warn('Database not initialized yet, retrying...');
        await this.initDB();
      }
      const result = await this.db?.get(this.storeName, key);
      return result ?? null;
    } catch (error) {
      return null;
    }
  }
  // Store a string value
  async setItem(key: string, value: any): Promise<void> {
    try {
      if (!this.db) await this.initDB();
      await this.db.put(this.storeName, value, key);
    } catch (e) {
      console.error(e);
    }
  }
  // Remove an item
  async removeItem(key: string): Promise<void> {
    await this.db.delete(this.storeName, key);
  }

  // Clear all stored data
  async clear(): Promise<void> {
    await this.db.clear(this.storeName);
  }
}
