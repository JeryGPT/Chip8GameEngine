
import { getProject } from "../projects_manager/manageEnv";


export function getFromProject(str: string, project_id: string) {
  const project = getProject(project_id);
  if (!project) return;
  let splittedStr = str.split(".").slice(1)
  let objPath = "project"
  let currentObj = project
  for (let i = 0; i < splittedStr.length; i++) {
    console.log(splittedStr, splittedStr[i])
    if (!Object.keys(currentObj).includes(splittedStr[i])) return {
      success: -1,
      error: `Couldn't find element named ${splittedStr[i]} in ${objPath}`
    }
    objPath += `.${splittedStr[i]}`
    currentObj = currentObj[splittedStr[i]];

  }
  console.log(currentObj)
  return {
    success: 1,
    data: 'data' in currentObj ? currentObj.data : currentObj
  }
} 
