import { CommonOptions, taskRunner, Command } from "nodejs-cli-runner";
import {
  addPackageFiltersOption,
  PackageFiltersOption
} from "../commandCommonOptions";
import { doesVersionsMatch } from "../tasks/doesVersionsMatch";
import { list } from "../tasks/list";
import { getPackagesDir, readRootPackageJson } from "../utils";

type ValidateOptions = CommonOptions &
  PackageFiltersOption & {
    versionMatch: boolean;
    skip?: string[];
  };

const validateAction = async (options: ValidateOptions) => {
  const dir = process.cwd();

  const rootPackageJson = await readRootPackageJson(dir);

  const packagesDir = await getPackagesDir(dir, rootPackageJson);

  const packages = await taskRunner(
    `load local packages`,
    list,
    options.verbose,
    packagesDir
  );

  if (options.versionMatch) {
    await taskRunner(
      "verify dependencies have same version across packages",
      doesVersionsMatch,
      options.verbose,
      packages,
      options.packages || [],
      options.skip || []
    );
  }
};

const validateCommand = new Command("validate");
addPackageFiltersOption(validateCommand);
validateCommand.action(validateAction);
validateCommand.option(
  "--version-match",
  "Match dependecy versions across packages"
);
validateCommand.option(
  "--skip <dependencies...>",
  "Skip dependencies for validation"
);

export default validateCommand;
