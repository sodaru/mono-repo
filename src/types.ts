export type Dependencies = Record<string, string>;

export type DependencyType = "dep" | "dev" | "peer";

export type PackageJson = {
  name: string;
  version: string;
  description?: string;
  main?: string;
  scripts?: Record<string, string>;
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  peerDependencies?: Dependencies;
  private?: boolean;
  repository?: string | Record<string, string>;
  author?: string;
  license?: string;
  bugs?: { url: string };
  homepage?: string;
};

export type RootPackageJson = PackageJson & {
  packagesDir?: string;
};

export type Package = {
  name: string;
  dirName: string;
  dependencies: {
    local: {
      [d in DependencyType]?: Dependencies;
    };
    external: {
      [d in DependencyType]?: Dependencies;
    };
  };
};

export type NpmPackageJob = {
  name: string;
  cmd: string;
  args: string[];
};

export type InstallSaveType = "save" | "save-dev" | "save-peer";
