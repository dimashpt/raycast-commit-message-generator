import {
  Action,
  ActionPanel,
  Alert,
  Icon,
  Keyboard,
  List,
  Toast,
  confirmAlert,
  showToast,
  useNavigation,
} from "@raycast/api";
import { usePromise } from "@raycast/utils";
import { useMemo, useState } from "react";
import { AddRepositoriesForm } from "./add-repositories";
import { SelectAgentView } from "./select-agent";
import { getRepoActivityMap } from "./lib/activity";
import { agentLabel, type AgentId } from "./lib/agents";
import { getDefaultAgent } from "./lib/preferences";
import { runGenerate } from "./lib/run-generate";
import { loadRepos, removeRepo, type RepoEntry } from "./lib/repos";
import { REPOS_FILE } from "./lib/paths";
import { formatAbsoluteTime, formatRelativeTime } from "./lib/time";

/** Raycast does not show shortcut badges on actions inside ActionPanel.Section. */
const SHORTCUT_SELECT_AGENT: Keyboard.Shortcut = { modifiers: ["ctrl"], key: "a" };
const SHORTCUT_COPY_PATH: Keyboard.Shortcut = { modifiers: ["cmd"], key: "c" };

function settingsActions(
  push: ReturnType<typeof useNavigation>["push"],
  onReposChanged: () => void,
  onAgentChanged: () => void,
) {
  return (
    <>
      <Action
        title="Add Repositories…"
        icon={Icon.Plus}
        onAction={() => push(<AddRepositoriesForm onAdded={onReposChanged} />)}
      />
      <Action
        title="Select Default Agent…"
        icon={Icon.Stars}
        shortcut={SHORTCUT_SELECT_AGENT}
        onAction={() => push(<SelectAgentView onChanged={onAgentChanged} />)}
      />
      <Action.Open title="Open Repos Config" target={REPOS_FILE} icon={Icon.Document} />
    </>
  );
}

function sortRepos(repos: RepoEntry[], activity: Record<string, number>, query: string): RepoEntry[] {
  const q = query.toLowerCase();
  const filtered = repos.filter((r) => r.label.toLowerCase().includes(q) || r.path.toLowerCase().includes(q));

  return filtered.sort((a, b) => {
    const ta = activity[a.path] ?? 0;
    const tb = activity[b.path] ?? 0;
    if (tb !== ta) return tb - ta;
    return a.label.localeCompare(b.label);
  });
}

export default function Command() {
  const { push } = useNavigation();
  const [searchText, setSearchText] = useState("");

  const {
    data: repos,
    isLoading: reposLoading,
    revalidate: reloadRepos,
  } = usePromise(async () => loadRepos(), [], { execute: true });

  const {
    data: activity,
    isLoading: activityLoading,
    revalidate: reloadActivity,
  } = usePromise(async () => getRepoActivityMap(), [], { execute: true });

  const {
    data: defaultAgent,
    isLoading: agentLoading,
    revalidate: reloadAgent,
  } = usePromise(async () => getDefaultAgent(), [], { execute: true });

  const isLoading = reposLoading || agentLoading || activityLoading;
  const agent: AgentId = defaultAgent ?? "agy";
  const activityMap = activity ?? {};

  const sortedRepos = useMemo(() => sortRepos(repos ?? [], activityMap, searchText), [repos, activityMap, searchText]);

  const onReposChanged = () => {
    reloadRepos();
  };

  const onAgentChanged = () => {
    reloadAgent();
  };

  const onGenerate = async (repo: RepoEntry) => {
    await runGenerate(repo, agent);
    reloadActivity();
  };

  const removeRepository = async (repo: RepoEntry) => {
    const confirmed = await confirmAlert({
      title: `Remove “${repo.label}”?`,
      message: repo.path,
      primaryAction: { title: "Remove", style: Alert.ActionStyle.Destructive },
    });
    if (!confirmed) return;

    try {
      removeRepo(repo.label);
      await showToast({ style: Toast.Style.Success, title: "Repository removed", message: repo.label });
      onReposChanged();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await showToast({ style: Toast.Style.Failure, title: "Could not remove repository", message });
    }
  };

  const generateTitle = `Generate with ${agentLabel(agent)}`;

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search repositories…"
      onSearchTextChange={setSearchText}
      throttle
      navigationTitle="Commit Message Generator"
      actions={<ActionPanel>{settingsActions(push, onReposChanged, onAgentChanged)}</ActionPanel>}
    >
      <List.Section
        title={`Default agent · ${agentLabel(agent)}`}
        subtitle="Enter on a repo to generate · sorted by recent activity"
      >
        {(repos ?? []).length === 0 && !isLoading ? (
          <List.EmptyView
            icon={Icon.Folder}
            title="No repositories yet"
            description="⌘K → Add Repositories to pick git folders"
            actions={
              <ActionPanel>
                <Action
                  title="Add Repositories…"
                  icon={Icon.Plus}
                  onAction={() => push(<AddRepositoriesForm onAdded={onReposChanged} />)}
                />
              </ActionPanel>
            }
          />
        ) : sortedRepos.length === 0 ? (
          <List.Item title="No matching repositories" icon={Icon.MagnifyingGlass} />
        ) : (
          sortedRepos.map((repo) => {
            const lastUsed = activityMap[repo.path];
            return (
              <List.Item
                key={repo.path}
                title={repo.label}
                subtitle={repo.path}
                icon={Icon.Folder}
                accessories={
                  lastUsed
                    ? [
                        {
                          text: formatRelativeTime(lastUsed),
                          tooltip: formatAbsoluteTime(lastUsed),
                        },
                      ]
                    : [{ text: "Never", tooltip: "No commit message generated yet" }]
                }
                actions={
                  <ActionPanel>
                    <Action title={generateTitle} icon={Icon.Wand} onAction={() => onGenerate(repo)} />
                    {settingsActions(push, onReposChanged, onAgentChanged)}
                    <Action.CopyToClipboard
                      title="Copy Repository Path"
                      content={repo.path}
                      icon={Icon.Folder}
                      shortcut={SHORTCUT_COPY_PATH}
                    />
                    <Action
                      title="Remove Repository"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      shortcut={Keyboard.Shortcut.Common.Remove}
                      onAction={() => removeRepository(repo)}
                    />
                  </ActionPanel>
                }
              />
            );
          })
        )}
      </List.Section>
    </List>
  );
}
