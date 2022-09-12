import { mkdir } from "fs/promises";
import { join } from "path";
import { npmRunner } from "../npmRunner";

export const create = async (dir: string, packageDirName: string) => {
  const packageDir = join(dir, packageDirName);
  mkdir(packageDir, { recursive: true });

  npmRunner(packageDir, "init", [], true);
};
