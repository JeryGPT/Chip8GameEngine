export interface ISprite {
  name: string,
  description?: string,
  data: string,
  id: string
}

export interface IProject {
  id: string,
  name: string,
  code: string,
  sprites: Record<string, ISprite>,
  createdAt: number,
  updatedAt: number
}