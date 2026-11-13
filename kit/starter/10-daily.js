/* ===== [10-daily.js] Group: Everyday work ===== */
window.NCS.push({
  id: 'save', code: 'SAVE', name: 'Saving changes',
  blurb: 'A commit is a snapshot of what you staged. You choose what goes in with `git add`, then record it with `git commit`.',
  short: [                                   // exactly three takeaways
    'Stage first, then commit: only staged changes go into the commit.',
    '`git status` tells you which of the three places each change is in.',
    'Small commits with one purpose are easy to review and easy to undo.'
  ],
  blocks: [
    // a diagram: nodes sit on a grid (x = column, y = row), edges join them by id
    { k: 'dg', id: 'save-areas', t: 'Where a change lives',
      cap: '**Three places:** you edit in the working tree, `git add` copies to the staging area, `git commit` records a snapshot. `git push` shares it.',
      d: { type: 'flow', w: 680, cols: 4, rows: 1, minw: 540,
        nodes: [
          { id: 'wt', x: 0, y: 0, l: 'Working tree', sub: 'files you edit', s: 'doc' },
          { id: 'ix', x: 1, y: 0, l: 'Staging area', sub: 'the next commit', k: 'w' },
          { id: 'repo', x: 2, y: 0, l: 'Local repository', sub: 'your commits', s: 'db', k: 'g' },
          { id: 'rem', x: 3, y: 0, l: 'Remote', sub: 'origin', s: 'ext', k: 's' }
        ],
        edges: [{ f: 'wt', t: 'ix', l: 'add' }, { f: 'ix', t: 'repo', l: 'commit' }, { f: 'repo', t: 'rem', l: 'push' }] } },
    // a snippet with a note, and a tip strip that belongs to this card. half: true cards come in pairs.
    { k: 'snip', id: 'save-stage', half: true, t: 'Stage and commit', code: `
git status           # what changed, and where
git add src/app.ts   # stage one file
git add -p           # stage part of a file
git commit -m "Fix total rounding"`,
      note: 'Use `git diff --staged` to read exactly what the commit will contain.',
      call: { kind: 'tip', text: '`git add -p` is how you split one messy afternoon into clean commits.' } },
    { k: 'snip', id: 'save-restore', half: true, v: 'Git 2.23', t: 'Take a change back before committing', code: `
git restore src/app.ts    # drop the edit
git restore --staged .    # unstage, keep edits
git stash                 # park everything
git stash pop             # bring it back`,
      call: { kind: 'trap', text: '`git restore <file>` throws the edit away for good. There is no undo for uncommitted work.' } },
    // a table: the first column is the row label. first: 'mono' sets it in the code font.
    { k: 'table', id: 'save-status', t: 'Reading git status', first: 'mono',
      cols: ['Says', 'Means', 'Next step'],
      rows: [
        ['Untracked files', 'Git has never seen the file', '`git add` it, or list it in `.gitignore`'],
        ['Changes not staged', 'Edited, but not in the next commit', '`git add`, or `git restore` to drop it'],
        ['Changes to be committed', 'Staged', '`git commit`'],
        ['Your branch is ahead by 2', 'Two local commits are not on the remote', '`git push`']
      ] }
  ]
});

window.NCS.push({
  id: 'branch', code: 'BR', name: 'Branches and sharing',
  blurb: 'A branch is a movable name for a commit. You work on your own branch, bring in what others did, and push.',
  short: [
    'Rebase rewrites your commits on top of main; merge joins the two lines with a merge commit.',
    'Never rebase commits that other people have already pulled.',
    'After a rebase, push with `--force-with-lease`, never plain `--force`.'
  ],
  blocks: [
    { k: 'sub', t: 'Staying up to date' },   // a sub-heading: use them once a section has about eight cards
    // a two-state diagram: seg names the two states, b and f are the two specs, capB and capF their captions
    { k: 'dg', id: 'branch-shape', t: 'Merge or rebase', seg: ['Merge', 'Rebase'],
      capB: '**Merge:** history keeps both lines and adds a merge commit **M**. Nothing is rewritten, so it is always safe.',
      capF: '**Rebase:** your commits are replayed on top of main as new commits **C′** and **D′**. History is a straight line, but the old commits are gone.',
      b: { type: 'flow', w: 680, cols: 5, rows: 2, ch: 70, minw: 520,
        nodes: [
          { id: 'a', x: 0, y: 0, l: 'A', s: 'pill' }, { id: 'b', x: 1, y: 0, l: 'B', s: 'pill' }, { id: 'e', x: 2, y: 0, l: 'E', sub: 'main moved', s: 'pill', k: 's' },
          { id: 'c', x: 2, y: 1, l: 'C', s: 'pill', k: 'a' }, { id: 'd', x: 3, y: 1, l: 'D', sub: 'feature', s: 'pill', k: 'a' },
          { id: 'm', x: 4, y: 0, l: 'M', sub: 'merge commit', s: 'pill', k: 'g' }
        ],
        edges: [{ f: 'a', t: 'b' }, { f: 'b', t: 'e' }, { f: 'b', t: 'c' }, { f: 'c', t: 'd' }, { f: 'e', t: 'm' }, { f: 'd', t: 'm' }] },
      f: { type: 'flow', w: 680, cols: 5, rows: 2, ch: 70, minw: 520,
        nodes: [
          { id: 'a', x: 0, y: 0, l: 'A', s: 'pill' }, { id: 'b', x: 1, y: 0, l: 'B', s: 'pill' }, { id: 'e', x: 2, y: 0, l: 'E', sub: 'main', s: 'pill', k: 's' },
          { id: 'c2', x: 3, y: 0, l: 'C′', s: 'pill', k: 'g' }, { id: 'd2', x: 4, y: 0, l: 'D′', sub: 'feature', s: 'pill', k: 'g' },
          { id: 'c', x: 2, y: 1, l: 'C', sub: 'abandoned', s: 'ext', k: 'm' }, { id: 'd', x: 3, y: 1, l: 'D', sub: 'abandoned', s: 'ext', k: 'm' }
        ],
        edges: [{ f: 'a', t: 'b' }, { f: 'b', t: 'e' }, { f: 'e', t: 'c2' }, { f: 'c2', t: 'd2' }, { f: 'b', t: 'c', d: true, k: 'm' }, { f: 'c', t: 'd', d: true, k: 'm' }] } },
    { k: 'snip', id: 'branch-update', v: 'Git 2.23', t: 'Bring main into your branch', code: `
git switch -c feature/rounding    # new branch from where you are
git fetch origin                  # download, change nothing
git rebase origin/main            # replay your commits on top
# on a conflict: fix the file, then
git add src/app.ts
git rebase --continue             # or: git rebase --abort`,
      note: 'Prefer `fetch` + `rebase` over `pull`: you see what arrived before anything moves.' },
    { k: 'sub', t: 'Sharing' },
    // good vs bad: two columns with a verdict. A ✗ or ✓ anywhere in a line tints it as the culprit or the cure.
    { k: 'gb', id: 'branch-force', t: 'Pushing after a rebase',
      bad: `
git rebase origin/main
git push --force              # ✗`,
      badNote: 'Overwrites the remote branch with yours, including commits a teammate pushed a minute ago.',
      good: `
git rebase origin/main
git push --force-with-lease   # ✓`,
      goodNote: 'Refuses if the remote moved since your last fetch, so nobody else’s work is lost.',
      call: { kind: 'key', text: 'Rewriting is fine on a branch only you use. On a shared branch, merge instead.' } },
    // a sequence diagram: actors across the top, steps down the page. d: true = dashed reply.
    { k: 'dg', id: 'branch-pr', t: 'A pull request, end to end',
      cap: '**Push, review, merge:** the branch travels to the remote, the review happens there, and you fetch the result.',
      d: { type: 'seq', w: 680, minw: 520, actors: [{ l: 'You', k: 'a' }, 'origin', 'Reviewer'],
        steps: [
          { f: 0, t: 1, l: 'git push -u origin feature' },
          { f: 1, t: 2, l: 'pull request opened' },
          { f: 2, t: 1, l: 'approve', d: true, k: 'g' },
          { self: 1, l: 'merge into main' },
          { f: 1, t: 0, l: 'git fetch, git switch main', d: true },
          { note: 'Delete the branch after the merge: locally with git branch -d, remotely from the pull request page.', at: [0, 2], k: 'w' }
        ] } }
  ]
});
