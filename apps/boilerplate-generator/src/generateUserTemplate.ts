import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';

import {typeMapToCpp, typeMapToJava, typeMapToPython} from './utils/typeMaps'
import {problemStructureSchema, ProblemStructureType} from './utils/schema'


export default function generateUserTemplate() {
  const problemSlug = process.env.ARG || ''
  const problemPath = path.join(__dirname, '../../problems', problemSlug)
  const userTemplateDir = path.join(problemPath, 'user-template')
  
  if(!fs.existsSync(problemPath)) {
    throw new Error(
      `\n\n❌ Problem directory not found at: ${problemPath}\n` +
      `💡 Hint: Check if the slug "${problemSlug}" is correct and if the folder exists under '/problems'.\n\n`
    );
  }
  const problemStructurePath = path.join(problemPath, 'Structure.json')
  const problemStructure = JSON.parse(fs.readFileSync(problemStructurePath, 'utf8')) 
  problemStructureSchema.parse(problemStructure)


  const {name, returnType, parameters}: ProblemStructureType = problemStructure
  const functionName = name
  const functionReturnType = typeMapToCpp[returnType]

  const cppFunctionParameters = '(' + parameters.map((param) => `${typeMapToCpp[param.type]} ${param.name}`).join(', ') + ')'
  const javaFunctionParameters = '(' + parameters.map((param) => `${typeMapToJava[param.type]} ${param.name}`).join(', ') + ')'
  const pythonFunctionParameters = '(' + parameters.map((param) => `${typeMapToPython[param.type]} ${param.name}`).join(', ') + ')'

  const cppUserTemplate = `class Solution {\npublic:\n    ${functionReturnType} ${functionName}${cppFunctionParameters} {\n\n    }\n};`
  const javaUserTemplate = `import java.util.*;\n\npublic static ${functionReturnType} ${functionName}${javaFunctionParameters}{\n\n}`
  const pythonUserTemplate = `class Solution:\n    def ${functionName}${pythonFunctionParameters} -> ${functionReturnType}:\n\n    `
  
  const generatedUserTemplate =  {
    problemSlug: problemSlug,
    lang: {
      cpp: cppUserTemplate,
      java: javaUserTemplate,
      python: pythonUserTemplate
    }
  }

  try {
    if(fs.existsSync(userTemplateDir)) fs.rmSync(userTemplateDir, {recursive: true, force: true})
    fs.mkdirSync(userTemplateDir)
    fs.writeFileSync(path.join(userTemplateDir, 'userTemplate.json'), JSON.stringify(generatedUserTemplate, null, 2))
  }

  catch(err) {
    if(fs.existsSync(userTemplateDir)) fs.rmSync(userTemplateDir, {recursive: true, force: true})
    throw err
  } 
}

