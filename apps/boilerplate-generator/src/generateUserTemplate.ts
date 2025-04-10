import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';
import {z} from 'zod'


const typeMapToCpp =  {
  "int": "int",
  "float": "float",
  "bool": "bool",
  "string": "string",
  "char": "char",
  "void": "void",
  "array<int>": "vector<int>",
  "array<array<int>>": "vector<vector<int>>",
  "array<string>": "vector<string>",
}

const typeMapToJava = {
  "int": "int",
  "float": "float",
  "bool": "boolean",
  "string": "String",
  "char": "char",
  "void": "void",
  "array<int>": "int[]",
  "array<array<int>>": "int[][]",
  "array<string>": "String[]",
}

const typeMapToPython = {
  "int": "int",
  "float": "float",
  "bool": "bool",
  "string": "str",
  "char": "str",
  "void": "None",
  "array<int>": "List[int]",
  "array<array<int>>": "List[List[int]]",
  "array<string>": "List[str]"
}


const typeMapToC = {
  "int": "int",
  "float": "float",
  "bool": "bool",
  "string": "char*",
  "char": "char",
  "void": "void",
  "array<int>": "int*",
  "array<array<int>>": "int**",
  "array<string>": "char**"
}

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

type UniversalType = z.infer<typeof universalTypeEnum>

const problemStructureSchema = z.object({
  name: z.string(),
  returnType: universalTypeEnum,
  parameters: z.array(z.object({name: z.string(), type: universalTypeEnum}))
}) 

type ProblemStructureType = z.infer<typeof problemStructureSchema>

export class userTemplateBuilder {

  problemSlug: string
  problemPath: string
  userTemplateDir: string
  problemStructure: ProblemStructureType
  
  constructor() {
    this.problemSlug = process.env.ARG || ''
    this.problemPath = path.join(__dirname, '../../problems', this.problemSlug)
    this.userTemplateDir = path.join(this.problemPath, 'user-template')
    
    if(!fs.existsSync(this.problemPath)) {
      throw new Error(
        `Problem directory not found at: ${this.problemPath}\n` +
        `Hint: Make sure the problem slug "${this.problemSlug}" is correct and that the directory exists under /problems.\n\n`
      );
    }
    const problemStructurePath = path.join(this.problemPath, 'Structure.json')
    this.problemStructure = JSON.parse(fs.readFileSync(problemStructurePath, 'utf8')) 
    problemStructureSchema.parse(this.problemStructure)
  }

  mkdir() {
    if(fs.existsSync(this.userTemplateDir)) fs.rmSync(this.userTemplateDir, {recursive: true, force: true})
    fs.mkdirSync(this.userTemplateDir)
  }

  generateCpp() {

    const {name, returnType, parameters}: ProblemStructureType = this.problemStructure

    function getCppFunctionParams(params: ProblemStructureType['parameters']) {
      return '(' + params.map((param) => `${typeMapToCpp[param.type]} ${param.name}`).join(', ') + ')'
    }

    const functionName = name
    const functionReturnType = typeMapToCpp[returnType]
    const functionParameters = getCppFunctionParams(parameters)
    const cppUserTemplate = `class Solution {\npublic:\n    ${functionReturnType} ${functionName}${functionParameters} {\n\n    }\n};`
    return cppUserTemplate
  }

  generateJava() {

    const {name, returnType, parameters}: ProblemStructureType = this.problemStructure
    function getJavaFunctionParams(params: ProblemStructureType['parameters']) {
      return '(' + params.map((param) => `${typeMapToJava[param.type]} ${param.name}`).join(', ') + ')'
    }

    const functionName = name
    const functionReturnType = typeMapToJava[returnType]
    const functionParameters = getJavaFunctionParams(parameters)
    const javaUserTemplate = `import java.util.*;\n\npublic static ${functionReturnType} ${functionName}${functionParameters}{\n\n}`
    return javaUserTemplate
  }

  generatePython() {
    const {name, returnType, parameters}: ProblemStructureType = this.problemStructure
    function getPythonFunctionParams(params: ProblemStructureType['parameters']) {
      return '(' + params.map((param) => `${typeMapToPython[param.type]} ${param.name}`).join(', ') + ')'
    }

    const functionName = name
    const functionReturnType = typeMapToPython[returnType]
    const functionParameters = getPythonFunctionParams(parameters)
    const pythonUserTemplate = `class Solution:\n    def ${functionName}${functionParameters} -> ${functionReturnType}:\n\n    `
    return pythonUserTemplate
  }
}

export default function generateUserTemplate() {
  
  const builder = new userTemplateBuilder()
  
  const generatedUserTemplate = {
    problemSlug: builder.problemSlug,
    lang: {
      cpp: builder.generateCpp(),
      java: builder.generateJava(),
      python: builder.generatePython()
    }
  }

  try {
    builder.mkdir()
    fs.writeFileSync(path.join(builder.userTemplateDir, 'userTemplate.json'), JSON.stringify(generatedUserTemplate, null, 2))
  }

  catch(err) {
    if(fs.existsSync(builder.userTemplateDir)) fs.rmSync(builder.userTemplateDir, {recursive: true, force: true})
    throw err
  } 
  
}
