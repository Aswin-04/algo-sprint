export const typeMapToCpp =  {
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

export const typeMapToJava = {
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

export const typeMapToPython = {
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
