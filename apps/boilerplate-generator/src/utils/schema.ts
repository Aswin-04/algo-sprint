import {z} from 'zod'

const universalTypeEnum = z.enum([
  "int",
  "float",
  "bool",
  "string",
  "char",
  "void",
  "array<int>",
  "array<array<int>>",
  "array<string>"
])


export const problemStructureSchema = z.object({
  name: z.string(),
  returnType: universalTypeEnum,
  parameters: z.array(z.object({name: z.string(), type: universalTypeEnum}))
}) 

export type ProblemStructureType = z.infer<typeof problemStructureSchema>
export type ParamType = ProblemStructureType['parameters'][number]