import { db } from './database';
import type { Sale } from '../types/sales';
import { saveAs } from 'file-saver';

interface HiltonMediaFolder {
  id: string;
  name: string;
  path: string;
  type: 'folder' | 'file';
  children?: HiltonMediaFolder[];
  content?: any;
  createdAt: string;
  updatedAt: string;
  metadata: {
    version?: string;
    projectId?: string;
    fileType?: string;
    size?: number;
    tags?: string[];
  };
}

class HiltonMediaStorage {
  private static instance: HiltonMediaStorage;
  private baseFolder: string = 'Hilton Media';
  private storageKey: string = 'hilton-media-storage';

  private constructor() {
    this.initializeStorage();
  }

  static getInstance(): HiltonMediaStorage {
    if (!HiltonMediaStorage.instance) {
      HiltonMediaStorage.instance = new HiltonMediaStorage();
    }
    return HiltonMediaStorage.instance;
  }

  private async initializeStorage() {
    const structure = await this.getStorageStructure();
    if (!structure) {
      const initialStructure: HiltonMediaFolder = {
        id: 'root',
        name: this.baseFolder,
        path: '/',
        type: 'folder',
        children: [
          {
            id: 'reports',
            name: 'Reports',
            path: '/reports',
            type: 'folder',
            children: [
              {
                id: 'commission-levels',
                name: 'Commission Levels',
                path: '/reports/commission-levels',
                type: 'folder',
                children: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                metadata: {}
              }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {}
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {}
      };
      await this.saveStorageStructure(initialStructure);
    } else {
      // Ensure commission-levels folder exists
      const reportsFolder = this.findFolderByPath(structure, '/reports');
      if (reportsFolder && !this.findFolderByPath(structure, '/reports/commission-levels')) {
        reportsFolder.children = reportsFolder.children || [];
        reportsFolder.children.push({
          id: 'commission-levels',
          name: 'Commission Levels',
          path: '/reports/commission-levels',
          type: 'folder',
          children: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          metadata: {}
        });
        await this.saveStorageStructure(structure);
      }
    }
  }

  private async getStorageStructure(): Promise<HiltonMediaFolder | null> {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get storage structure:', error);
      return null;
    }
  }

  private async saveStorageStructure(structure: HiltonMediaFolder): Promise<void> {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(structure));
    } catch (error) {
      console.error('Failed to save storage structure:', error);
      throw new Error('Failed to save storage structure');
    }
  }

  async saveFile(path: string, content: any, metadata: any = {}): Promise<void> {
    try {
      const structure = await this.getStorageStructure();
      if (!structure) throw new Error('Storage not initialized');

      // Create directories in path if they don't exist
      const pathParts = path.split('/').filter(Boolean);
      const fileName = pathParts.pop() || '';
      let currentPath = '';
      let currentFolder = structure;

      for (const part of pathParts) {
        currentPath += '/' + part;
        let folder = this.findFolderByPath(structure, currentPath);
        
        if (!folder) {
          folder = {
            id: Date.now().toString(),
            name: part,
            path: currentPath,
            type: 'folder',
            children: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {}
          };
          
          if (!currentFolder.children) currentFolder.children = [];
          currentFolder.children.push(folder);
        }
        
        currentFolder = folder;
      }

      // Add or update file
      const file: HiltonMediaFolder = {
        id: Date.now().toString(),
        name: fileName,
        path: path,
        type: 'file',
        content,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          ...metadata,
          size: JSON.stringify(content).length
        }
      };

      if (!currentFolder.children) currentFolder.children = [];
      const existingFileIndex = currentFolder.children.findIndex(
        child => child.type === 'file' && child.name === fileName
      );

      if (existingFileIndex >= 0) {
        currentFolder.children[existingFileIndex] = file;
      } else {
        currentFolder.children.push(file);
      }

      await this.saveStorageStructure(structure);
    } catch (error) {
      console.error('Failed to save file:', error);
      throw new Error('Failed to save file: ' + (error as Error).message);
    }
  }

  private findFolderByPath(structure: HiltonMediaFolder, path: string): HiltonMediaFolder | null {
    if (structure.path === path) return structure;
    if (!structure.children) return null;

    for (const child of structure.children) {
      if (child.type === 'folder') {
        const found = this.findFolderByPath(child, path);
        if (found) return found;
      }
    }

    return null;
  }

  async getFile(path: string): Promise<HiltonMediaFolder | null> {
    try {
      const structure = await this.getStorageStructure();
      if (!structure) return null;

      const pathParts = path.split('/').filter(Boolean);
      const fileName = pathParts.pop() || '';
      let currentFolder = structure;

      for (const part of pathParts) {
        const folder = this.findFolderByPath(currentFolder, '/' + part);
        if (!folder) return null;
        currentFolder = folder;
      }

      return currentFolder.children?.find(
        child => child.type === 'file' && child.name === fileName
      ) || null;
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  }

  async listFiles(path: string): Promise<HiltonMediaFolder[]> {
    try {
      const structure = await this.getStorageStructure();
      if (!structure) return [];

      const folder = this.findFolderByPath(structure, path);
      return folder?.children || [];
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }
}

export const hiltonMediaStorage = HiltonMediaStorage.getInstance();