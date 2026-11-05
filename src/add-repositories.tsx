import { Action, ActionPanel, Form, Icon, Toast, getSelectedFinderItems, showToast, useNavigation } from "@raycast/api";
import { appendReposFromFolders } from "./lib/repos";

type AddRepositoriesFormProps = {
  onAdded: () => void;
};

export function AddRepositoriesForm({ onAdded }: AddRepositoriesFormProps) {
  const { pop } = useNavigation();

  async function addPaths(folderPaths: string[]) {
    if (folderPaths.length === 0) {
      await showToast({ style: Toast.Style.Failure, title: "No folders selected" });
      return;
    }

    const { added, errors } = await appendReposFromFolders(folderPaths);

    if (added.length > 0) {
      onAdded();
      await showToast({
        style: Toast.Style.Success,
        title: `Added ${added.length} repo${added.length === 1 ? "" : "s"}`,
        message: added.join(", "),
      });
    }

    if (errors.length > 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: errors.length === folderPaths.length ? "Could not add repos" : "Some folders skipped",
        message: errors.slice(0, 2).join("\n"),
      });
    }

    if (added.length > 0) {
      pop();
    }
  }

  async function handleSubmit(values: { folders: string[] }) {
    await addPaths(values.folders ?? []);
  }

  async function addFromFinderSelection() {
    const items = await getSelectedFinderItems();
    if (items.length === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Nothing selected in Finder",
        message: "Select one or more folders in Finder first.",
      });
      return;
    }
    await addPaths(items.map((i) => i.path));
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add Selected Folders" onSubmit={handleSubmit} />
          <Action title="Add Finder Selection" icon={Icon.Finder} onAction={addFromFinderSelection} />
        </ActionPanel>
      }
    >
      <Form.FilePicker
        id="folders"
        title="Git repositories"
        canChooseFiles={false}
        canChooseDirectories
        allowMultipleSelection
      />
      <Form.Description text="Pick one or more folders (git repo root or any folder inside the repo)." />
    </Form>
  );
}
