import React, { useState } from 'react';
import { Save, FolderOpen, Plus } from 'lucide-react';
import { db } from '../db/database';

interface ProjectManagerProps {
  currentProject: { id: number; name: string } | undefined;
  onProjectChange: (projectId: number) => void;
}

export default function ProjectManager({ currentProject, onProjectChange }: ProjectManagerProps) {
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [projects, setProjects] = useState<any[]>([]);

  React.useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const allProjects = await db.projects.toArray();
    setProjects(allProjects);
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        const projectId = await db.createNewProject(newProjectName);
        await loadProjects();
        onProjectChange(projectId);
        setNewProjectName('');
        setShowNewProjectDialog(false);
      } catch (error) {
        console.error('Failed to create project:', error);
        alert('Failed to create project. Please try again.');
      }
    }
  };

  const handleSaveAs = async () => {
    const name = prompt('Enter a name for this project:');
    if (name) {
      try {
        const projectId = await db.createNewProject(name);
        if (currentProject) {
          const currentSales = await db.sales.where('projectId').equals(currentProject.id).toArray();
          await Promise.all(currentSales.map(sale => {
            const { id, ...saleData } = sale;
            return db.sales.add({ ...saleData, projectId });
          }));
        }
        await loadProjects();
        onProjectChange(projectId);
      } catch (error) {
        console.error('Failed to save project:', error);
        alert('Failed to save project. Please try again.');
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={currentProject?.id || ''}
            onChange={(e) => onProjectChange(Number(e.target.value))}
            className="block rounded-md border-gray-300 shadow-sm focus:border-[#002C51] focus:ring-[#002C51] sm:text-sm"
          >
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowNewProjectDialog(true)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51]"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </button>
          <button
            onClick={handleSaveAs}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51]"
          >
            <Save className="h-4 w-4 mr-2" />
            Save As
          </button>
        </div>
        <div className="text-sm text-gray-500">
          Auto-saving enabled
        </div>
      </div>

      {showNewProjectDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Project</h3>
              <div className="mt-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#002C51] focus:ring-[#002C51] sm:text-sm"
                />
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewProjectDialog(false)}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#002C51] border border-transparent rounded-md hover:bg-[#003666] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#002C51]"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}