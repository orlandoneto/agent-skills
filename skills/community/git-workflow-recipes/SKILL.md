---
license: MIT
name: git-workflow-recipes
description: Ready-to-use git recipes for the operations people actually run every day — undoing mistakes, safe rebasing, resolving conflicts, rescuing lost work, and PR-friendly history cleanup. Use when a user asks how to undo a git operation, clean up a branch before merging, recover from a bad push, or make a branch PR-ready.
---

# Git Workflow Recipes

Recipes for the git operations that come up daily and are easy to get wrong. Not a git reference — a collection of "what do I type when X happens" answers with the safety rails intact.

## When to use

- Someone asks "how do I undo the last commit / the last push / `git reset --hard`".
- A branch needs to be cleaned up (squash, rebase, reorder) before a PR merge.
- A merge or rebase has conflicts and the flow has stalled.
- A commit or branch was "lost" and needs recovery.
- You're about to run a destructive operation (`reset --hard`, `push --force`, `rebase -i`) and want the least-destructive path.

## Before you start

Know these:

1. **Is this shared or local?** Rewriting history you've already pushed to a shared branch is a different conversation than rewriting unshared local history. The recipes flag which is which.
2. **Is the working tree clean?** Most recovery recipes want a clean tree. Run `git status` first; `git stash` if needed.
3. **Backup the branch before anything destructive.** `git branch backup-<name>` before a rebase or reset costs nothing and saves hours.
4. **`reflog` exists.** Almost every "I lost it" can be recovered via `git reflog`. Don't panic; check reflog first.

## Workflow

1. Identify the situation. Match it to a recipe in the references.
2. If the recipe involves rewriting history, back up the branch first.
3. Execute the recipe exactly — don't improvise on destructive commands.
4. Verify with `git log`, `git status`, and a quick diff against the expected state.
5. If it's a shared branch, communicate the force-push to anyone else tracking it.

## Non-negotiable rules

- **Never `git push --force` to `main` or a shared branch.** Use `--force-with-lease` for your own feature branch only. On protected `main` branches, force push is usually blocked server-side — good.
- **Never `git reset --hard` without confirming there's nothing uncommitted.** It's irreversible. Stash or commit first if in doubt.
- **Never rewrite history someone else has based work on.** If a colleague has pulled your branch and built commits on top, rebasing it will leave them stranded.
- **`git reflog` is the safety net.** Anything you accidentally "deleted" in the last ~90 days is recoverable unless you've also run `git gc --prune=now`. Learn reflog before you learn the scary commands.
- **Commit before risky operations.** Even a WIP commit gives you a reflog entry. An uncommitted change is the only truly lost state.

## References

- [Undo and recover](./references/undo-and-recover.md) — the `reset` / `revert` / `restore` / `reflog` matrix. The single most-asked set of recipes.
- [Rebase and merge](./references/rebase-and-merge.md) — interactive rebase, conflict resolution, the rebase-vs-merge call, `--force-with-lease`.
- [Staging and committing](./references/staging-and-committing.md) — partial adds, hunks, amending, splitting one commit into many, fixup + autosquash.
- [Branching workflow](./references/branching-workflow.md) — feature branches, naming, cleanup before PR, rescuing commits made on the wrong branch.
- [History surgery](./references/history-surgery.md) — `cherry-pick`, `bisect`, `filter-repo` for removing sensitive data, squashing a whole branch.
