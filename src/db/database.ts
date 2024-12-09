import Dexie, { Table } from 'dexie';
import type { Sale, CommissionLevel } from '../types/sales';

export const DEFAULT_COMMISSION_LEVELS: CommissionLevel[] = [
  { level: 1, minAmount: 162500, maxAmount: 243749, additionalCommission: 1 },
  { level: 2, minAmount: 243750, maxAmount: 324999, additionalCommission: 2 },
  { level: 3, minAmount: 325000, maxAmount: 406249, additionalCommission: 3 },
  { level: 4, minAmount: 406250, maxAmount: 487499, additionalCommission: 3.5 },
  { level: 5, minAmount: 487500, maxAmount: 584999, additionalCommission: 4 },
  { level: 6, minAmount: 585000, maxAmount: 682499, additionalCommission: 5 },
  { level: 7, minAmount: 682500, maxAmount: 893749, additionalCommission: 5.5 },
  { level: 8, minAmount: 893750, maxAmount: 999999999, additionalCommission: 6 }
];

export interface Project {
  id?: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  commissionLevels: CommissionLevel[];
}

class HiltonDatabase extends Dexie {
  sales!: Table<Sale>;
  projects!: Table<Project>;
  private isInitialized = false;

  constructor() {
    super('HiltonSalesDB');
    
    // Delete the existing database if version mismatch
    this.on('blocked', () => {
      this.delete().then(() => {
        console.log('Database deleted due to version mismatch');
        window.location.reload();
      });
    });

    // Increment the version number to 61 (higher than existing 60)
    this.version(61).stores({
      sales: '++id, projectId, date, clientLastName, saleType, isCancelled',
      projects: '++id'
    }).upgrade(tx => {
      return tx.projects.toCollection().modify(project => {
        if (!project.commissionLevels) {
          project.commissionLevels = [...DEFAULT_COMMISSION_LEVELS];
        }
      });
    });

    // Ensure database is open before any operations
    this.open().catch(err => {
      console.error("Failed to open database:", err);
      // If version error, delete database and reload
      if (err.name === 'VersionError') {
        this.delete().then(() => {
          console.log('Database deleted due to version error');
          window.location.reload();
        });
      }
    });
  }

  private async ensureInitialized() {
    if (!this.isInitialized) {
      try {
        await this.initialize();
        this.isInitialized = true;
      } catch (error) {
        console.error('Failed to initialize database:', error);
        if (error instanceof Dexie.VersionError) {
          await this.delete();
          window.location.reload();
        }
      }
    }
  }

  async initialize() {
    try {
      await this.transaction('rw', this.projects, async () => {
        const projectCount = await this.projects.count();
        if (projectCount === 0) {
          const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
          const project: Omit<Project, 'id'> = {
            name: currentMonth,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            commissionLevels: [...DEFAULT_COMMISSION_LEVELS]
          };
          await this.projects.add(project);
        }
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      if (error instanceof Dexie.VersionError) {
        await this.delete();
        window.location.reload();
      } else {
        throw error;
      }
    }
  }

  async getCurrentProject(): Promise<Project | undefined> {
    await this.ensureInitialized();
    try {
      return await this.transaction('rw', this.projects, async () => {
        const projects = await this.projects.toArray();
        if (projects.length === 0) {
          const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
          const project: Omit<Project, 'id'> = {
            name: currentMonth,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            commissionLevels: [...DEFAULT_COMMISSION_LEVELS]
          };
          const id = await this.projects.add(project);
          return await this.projects.get(id);
        }
        return projects[0];
      });
    } catch (error) {
      console.error('Failed to get current project:', error);
      if (error instanceof Dexie.VersionError) {
        await this.delete();
        window.location.reload();
      }
      throw error;
    }
  }

  async clearAllData() {
    await this.ensureInitialized();
    try {
      await this.transaction('rw', this.sales, this.projects, async () => {
        await this.sales.clear();
        await this.projects.clear();
        const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
        const project: Omit<Project, 'id'> = {
          name: currentMonth,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          commissionLevels: [...DEFAULT_COMMISSION_LEVELS]
        };
        await this.projects.add(project);
      });
      return true;
    } catch (error) {
      console.error('Failed to clear database:', error);
      if (error instanceof Dexie.VersionError) {
        await this.delete();
        window.location.reload();
      }
      throw error;
    }
  }

  async createNewProject(name: string) {
    await this.ensureInitialized();
    try {
      const project: Omit<Project, 'id'> = {
        name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commissionLevels: [...DEFAULT_COMMISSION_LEVELS]
      };
      return await this.projects.add(project);
    } catch (error) {
      console.error('Failed to create new project:', error);
      if (error instanceof Dexie.VersionError) {
        await this.delete();
        window.location.reload();
      }
      throw error;
    }
  }

  async updateCommissionLevels(projectId: number, levels: CommissionLevel[]) {
    await this.ensureInitialized();
    try {
      const project = await this.projects.get(projectId);
      if (!project) throw new Error('Project not found');

      await this.projects.update(projectId, {
        ...project,
        commissionLevels: levels,
        updatedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Failed to update commission levels:', error);
      if (error instanceof Dexie.VersionError) {
        await this.delete();
        window.location.reload();
      }
      throw error;
    }
  }
}

export const db = new HiltonDatabase();

// Initialize database when module is loaded
db.initialize().catch(error => {
  console.error('Failed to initialize database:', error);
  if (error instanceof Dexie.VersionError) {
    db.delete().then(() => {
      window.location.reload();
    });
  }
});

export const updateCommissionLevels = async (projectId: number, levels: CommissionLevel[]) => {
  return await db.updateCommissionLevels(projectId, levels);
};