import {join, relative, } from "jsr:@std/path"

const __dirname = new URL('.', import.meta.url).pathname;
const projectBase = join(__dirname, '../sample-project')

type FileData = {
    relativePath: string
    content: string
}
type ProjectData = {
    files: FileData[]
}

export const readProject = async (): Promise<ProjectData> => {
    const files: FileData[] = [];
  
    async function readDirRecursive(dirPath: string) {
      for await (const entry of Deno.readDir(dirPath)) {
        const fullPath =  join(dirPath, entry.name);
        if (entry.isFile) {
          const content = await Deno.readTextFile(fullPath);
          files.push({ 
            relativePath: relative(projectBase, fullPath),
            content 
          });
        } else if (entry.isDirectory) {
          await readDirRecursive(fullPath);
        }
      }
    }
  
    await readDirRecursive(projectBase);
    return { files };
  }