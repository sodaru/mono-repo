import { Command } from "commander";

export const addPackageFiltersOption = (command: Command) => {
  command.option("-p, --packages <packages...>", "Packages to filter");
};

export type PackageFiltersOption = {
  packages?: string[];
};
