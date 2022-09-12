import {
  readJsonFileStore,
  saveJsonFileStore,
  updateJsonFileStore
} from "nodejs-file-utils";
import { join } from "path";
import { RootPackageJson } from "../types";

export const init = async (dir: string): Promise<void> => {
  const rootPackageJsonPath = join(dir, "package.json");
  const rootPackageJson = (await readJsonFileStore(
    rootPackageJsonPath
  )) as RootPackageJson;

  if (!rootPackageJson.scripts) {
    rootPackageJson.scripts = {};
  }

  rootPackageJson.scripts = {
    ...rootPackageJson.scripts,
    postinstall: "npx mono-repo install -v && npx mono-repo run build -v",
    test: "npx mono-repo run test -v",
    version: "npx mono-repo version -v && git add -A",
    postversion: "git push --follow-tags"
  };

  updateJsonFileStore(rootPackageJsonPath, rootPackageJson);
  await saveJsonFileStore(rootPackageJsonPath);
};
