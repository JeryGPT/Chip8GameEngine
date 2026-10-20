export interface ISprite {
  name: string,
  description?: string,
  data: string,
  length: number,
  id: string
}

export type ISpriteData = Omit<ISprite, "length" | "id">;
export interface IProject {
  id: string,
  name: string,
  code: string,
  sprites: Record<string, ISprite>,
  createdAt: number,
  updatedAt: number
}