import { IProject, ISprite } from "./types/project";

const INDEX_KEY = "chip8_projects";
const projectKey = (id: string) => `chip8_project_${id}`;


export function getAllProjectIds(): string[] | null {
  return JSON.parse(localStorage.getItem(INDEX_KEY) ?? "null");
}


export function saveProject(project_id: string, project: IProject) {
  localStorage.setItem(projectKey(project_id), JSON.stringify(project));
}

function doesProjectExist(project_id: string) {
  return getAllProjectIds()?.find(p => p === projectKey(project_id))
}

export function getProject(project_id: string): IProject | undefined {
  if (!doesProjectExist(project_id)) return;
  return JSON.parse(localStorage.getItem(projectKey(project_id)) ?? "{}")
}

export function saveSprite(project_id: string, sprite: ISprite) {
  const projects = getAllProjectIds();
  if (!projects) return;
  if (!doesProjectExist(project_id)) return;
  const project = getProject(project_id);
  if (!project) return;
  project.sprites[sprite.name] = sprite;
  saveProject(project_id, project);
}

export function createNewProject(name: string, id: string = name + Date.now() / 1000): string {
  if (doesProjectExist(id)) {
    return id;
  }
  const date = Date.now();
  const newProject: IProject = {
    id: id,
    name: name,
    code: "",
    sprites: {},
    createdAt: date,
    updatedAt: date
  }

  const all_projects = getAllProjectIds() ?? [];
  localStorage.setItem(INDEX_KEY, JSON.stringify([...all_projects, projectKey(id)]))
  localStorage.setItem(projectKey(id), JSON.stringify(newProject));
  return id;
}
