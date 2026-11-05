import { LocalStorage } from "@raycast/api";

const STORAGE_KEY = "commit-message-generator.repo-activity";

export type RepoActivityMap = Record<string, number>;

export async function getRepoActivityMap(): Promise<RepoActivityMap> {
  const raw = await LocalStorage.getItem<string>(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as RepoActivityMap;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

export async function recordRepoGenerate(repoPath: string): Promise<void> {
  const map = await getRepoActivityMap();
  map[repoPath] = Date.now();
  await LocalStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
