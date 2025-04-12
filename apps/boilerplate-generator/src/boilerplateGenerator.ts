import process from 'node:process';
import path from 'node:path';
import fs from 'node:fs';

import {typeMapToCpp, typeMapToJava, typeMapToPython} from './utils/typeMaps'
import {ParamType, problemStructureSchema, ProblemStructureType} from './utils/schema'


export default class BoilerplateGenerator {
  problemSlug: string;
  problemPath: string
  userTemplateDir: string
  fullBoilerplateDir: string
  problemStructure: ProblemStructureType

  constructor() {
    this.problemSlug = process.env.ARG || ''
    this.problemPath = path.join(__dirname, '../../problems', this.problemSlug)
    this.userTemplateDir = path.join(this.problemPath, 'user-template')
    this.fullBoilerplateDir = path.join(this.problemPath, 'full-boilerplate')
    this.problemStructure = this.parse()
  }

  private parse() {
    if(!fs.existsSync(this.problemPath)) {
      throw new Error(
        `\n\n❌ Problem directory not found at: ${this.problemPath}\n` +
        `💡 Hint: Check if the slug "${this.problemSlug}" is correct and if the folder exists under '/problems'.\n\n`
      );
    }
    const problemStructurePath = path.join(this.problemPath, 'Structure.json')
    const structure = JSON.parse(fs.readFileSync(problemStructurePath, 'utf8')) 
    return problemStructureSchema.parse(structure)
    
  }

  generateUserTemplate() {
      const {name, returnType, parameters}: ProblemStructureType = this.problemStructure
      const functionName = name
    
      const cppFunctionParameters = '(' + parameters.map((param) => `${typeMapToCpp[param.type]} ${param.name}`).join(', ') + ')'
      const javaFunctionParameters = '(' + parameters.map((param) => `${typeMapToJava[param.type]} ${param.name}`).join(', ') + ')'
      const pythonFunctionParameters = '(' + parameters.map((param) => `${typeMapToPython[param.type]} ${param.name}`).join(', ') + ')'
    
      const cppUserTemplate = `class Solution {\npublic:\n    ${typeMapToCpp[returnType]} ${functionName}${cppFunctionParameters} {\n\n    }\n};` 
      const javaUserTemplate = `class Solution {\n    public static ${typeMapToJava[returnType]} ${functionName}${javaFunctionParameters} {\n\n    }\n}`;
      const pythonUserTemplate = `class Solution:\n    def ${functionName}${pythonFunctionParameters} -> ${typeMapToPython[returnType]}:\n\n    `
      
      const generatedUserTemplate =  {
        problemSlug: this.problemSlug,
        lang: {
          cpp: cppUserTemplate,
          java: javaUserTemplate,
          python: pythonUserTemplate
        }
      }
    
      try {
        if(fs.existsSync(this.userTemplateDir)) fs.rmSync(this.userTemplateDir, {recursive: true, force: true})
        fs.mkdirSync(this.userTemplateDir)
        fs.writeFileSync(path.join(this.userTemplateDir, 'userTemplate.json'), JSON.stringify(generatedUserTemplate, null, 2))
      }
    
      catch(err) {
        if(fs.existsSync(this.userTemplateDir)) fs.rmSync(this.userTemplateDir, {recursive: true, force: true})
        throw err
      } 
  }

  generateCpp() {
    const { name, returnType, parameters }: ProblemStructureType = this.problemStructure;

    const generateInput = (param: ParamType) => {
        const varName = param.name;
        const cppType = typeMapToCpp[param.type];

        if (param.type === 'array<int>' || param.type === 'array<string>') {
            return `    int size_${varName};
    cin >> size_${varName};
    ${cppType} ${varName}(size_${varName});
    for (int i = 0; i < size_${varName}; i++) {
      cin >> ${varName}[i];
    }`;
        }

        if (param.type === 'array<array<int>>') {
            return `    int size_${varName}_n, size_${varName}_m;
    cin >> size_${varName}_n >> size_${varName}_m;
    ${cppType} ${varName}(size_${varName}_n, vector<int>(size_${varName}_m));
    for (int i = 0; i < size_${varName}_n; i++) {
        for (int j = 0; j < size_${varName}_m; j++) {
            cin >> ${varName}[i][j];
        }
    }`;
        }

        return `    ${param.type} ${varName};
    cin >> ${varName};`;
    };

    const inputBlock = parameters.map(generateInput).join('\n\n');

    const argsList = parameters.map((p) => p.name).join(', ');
    const resultDeclaration = returnType === 'void' 
    ? `    Solution sol;\n    sol.${name}(${argsList});`  
    : `    Solution sol;\n    ${typeMapToCpp[returnType]} result = sol.${name}(${argsList});`; 

    let resultPrinter;
    if (returnType === 'array<array<int>>') {
        resultPrinter = `    for (int i = 0; i < result.size(); i++) {
        for (int j = 0; j < result[i].size(); j++) {
            cout << result[i][j] << ' ';
        }
        cout << endl;
    }`;
    } 
    
    else if (returnType === 'array<int>' || returnType === 'array<string>') {
        resultPrinter = `    for (int i = 0; i < result.size(); i++) {
        cout << result[i] << ' ';
    }
    cout << endl;`;
    }
    else if(returnType === 'void') resultPrinter = ``;
    else resultPrinter = `    cout << result << endl;`;

    const fullBoilerplateCpp = `#include <bits/stdc++.h>
using namespace std;

## USER CODE

int main() {
    freopen("input.txt", "r", stdin);

${inputBlock}

${resultDeclaration}
${resultPrinter}
}
`;

    return fullBoilerplateCpp;
}
  

generateJava() {
  const { name, returnType, parameters }: ProblemStructureType = this.problemStructure;

  const generateInput = (param: ParamType) => {
      const varName = param.name;
      const javaType = typeMapToJava[param.type];

      if (param.type === 'array<int>' || param.type === 'array<string>') {
          return `    int size_${varName} = scanner.nextInt();
    ${javaType} ${varName} = new ${javaType.replace('[]', '')}[size_${varName}];
    for (int i = 0; i < size_${varName}; i++) {
        ${varName}[i] = scanner.next${param.type === 'array<string>' ? '' : 'Int'}();
    }`;
      }

      if (param.type === 'array<array<int>>') {
          return `    int size_${varName}_n = scanner.nextInt();
    int size_${varName}_m = scanner.nextInt();
    ${javaType} ${varName} = new int[size_${varName}_n][size_${varName}_m];
    for (int i = 0; i < size_${varName}_n; i++) {
      for (int j = 0; j < size_${varName}_m; j++) {
        ${varName}[i][j] = scanner.nextInt();
      }
    }`;
      }

      return `    ${javaType} ${varName} = scanner.next${javaType === 'String' ? '' : javaType.charAt(0).toUpperCase() + javaType.slice(1)}();`;
  };

  const inputBlock = parameters.map(generateInput).join('\n\n');

  const argsList = parameters.map((p) => p.name).join(', ');
  const resultDeclaration = returnType === 'void' 
  ?`    Solution.${name}(${argsList});`
  :`    ${typeMapToJava[returnType]} result = Solution.${name}(${argsList});`;

  let resultPrinter
  if (returnType === 'array<array<int>>') {
      resultPrinter = `    for (int i = 0; i < result.length; i++) {
      for (int j = 0; j < result[i].length; j++) {
        System.out.print(result[i][j] + " ");
      }
      System.out.println();
    }`;
  } 
  else if (returnType === 'array<int>' || returnType === 'array<string>') {
      resultPrinter = `    for (int i = 0; i < result.length; i++) {
      System.out.print(result[i] + " ");
    }
    System.out.println();`;
  }

  else if(returnType === 'void') resultPrinter = ``;
  else resultPrinter = `    System.out.println(result);`;

  const fullBoilerplateJava = `import java.util.*;

## USER CODE

public class Main {
  public static void main(String[] args) {
    Scanner scanner = new Scanner(System.in);

${inputBlock}

${resultDeclaration}
${resultPrinter}

    scanner.close();
  }
}
`;

  return fullBoilerplateJava;
}


generatePython() {
  const { name, returnType, parameters }: ProblemStructureType = this.problemStructure;

  const generateInput = (param: ParamType) => {
      const varName = param.name;

      if (param.type === 'array<int>') {
          return `    size_${varName} = int(input())
    ${varName} = list(map(int, input().split()))`;
      }

      if (param.type === 'array<string>') {
          return `    size_${varName} = int(input())
    ${varName} = input().split()`;
      }

      if (param.type === 'array<array<int>>') {
          return `    size_${varName}_n, size_${varName}_m = map(int, input().split())
    ${varName} = [list(map(int, input().split())) for _ in range(size_${varName}_n)]`;
      }

      return `    ${varName} = ${param.type === 'int' ? 'int(input())' : param.type === 'float' ? 'float(input())' : param.type === 'bool' ? 'input().lower() == "true"' : 'input()'}`;
  };

  const inputBlock = parameters.map(generateInput).join('\n\n');

  const argsList = parameters.map((p) => p.name).join(', ');
  const resultDeclaration = returnType === 'void' 
      ? `    solution.${name}(${argsList})` 
      : `    result = solution.${name}(${argsList})`;

  let resultPrinter
  if (returnType === 'array<array<int>>') {
      resultPrinter = `    for row in result:
      print(*row)`;
  } 
  else if (returnType === 'array<int>' || returnType === 'array<string>') {
      resultPrinter = `    print(*result)`;
  }

  else if(returnType === 'void') resultPrinter = ``;
  else resultPrinter = `    print(result)`;

  const fullBoilerplatePython = `from typing import List

## USER CODE

if __name__ == "__main__":
    solution = Solution()

${inputBlock}

${resultDeclaration}
${resultPrinter}
`;

  return fullBoilerplatePython;
}

  run() {
    this.generateUserTemplate()
    const fullBoilerplateCpp = this.generateCpp()
    const fullBoilerplateJava = this.generateJava()
    const fullBoilerplatePython = this.generatePython()

    try {
      if(fs.existsSync(this.fullBoilerplateDir)) fs.rmSync(this.fullBoilerplateDir, {recursive: true, force: true})
      fs.mkdirSync(this.fullBoilerplateDir)
    fs.writeFileSync(path.join(this.fullBoilerplateDir, 'main.cpp'), fullBoilerplateCpp)
    fs.writeFileSync(path.join(this.fullBoilerplateDir, 'main.java'), fullBoilerplateJava)
      fs.writeFileSync(path.join(this.fullBoilerplateDir, 'main.py'), fullBoilerplatePython)
    }
    catch (err) {
      if(fs.existsSync(this.fullBoilerplateDir)) fs.rmSync(this.fullBoilerplateDir, {recursive: true, force: true})
      throw err
    }
  }

}


