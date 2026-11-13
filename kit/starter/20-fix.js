/* ===== [20-fix.js] Group: Fixing mistakes ===== */
window.NCS.push({
  id: 'undo', code: 'UNDO', name: 'Undoing things',
  blurb: 'Almost everything committed can be recovered. What matters is whether the commit was already shared.',
  short: [
    'Not pushed yet: `git reset` or `git commit --amend` rewrites it.',
    'Already pushed: `git revert` adds a new commit that cancels the old one.',
    '`git reflog` remembers where HEAD has been, so a "lost" commit is rarely lost.'
  ],
  blocks: [
    // built-in "picker" widget: need on the left, the answer with code and a warning on the right
    { k: 'widget', id: 'undo-pick', w: 'picker', t: 'Pick the right undo', prompt: 'I want to',
      items: [
        { need: 'Fix the last commit message', use: 'git commit --amend', hint: 'not pushed', code: 'git commit --amend -m "Fix total rounding"', why: 'It replaces the commit, so do it before pushing.' },
        { need: 'Undo the last commit, keep the changes', use: 'git reset --soft HEAD~1', hint: 'not pushed', code: `
git reset --soft HEAD~1
git status      # the changes are staged again`, why: 'Only for commits nobody else has.' },
        { need: 'Undo a commit that is already pushed', use: 'git revert', hint: 'safe on shared branches', code: `
git revert a1b2c3d
git push`, why: 'It adds a commit; it does not remove the old one from history.' },
        { need: 'Throw away all local changes', use: 'git reset --hard', hint: 'destructive', code: 'git reset --hard origin/main', why: 'Uncommitted work is gone for good. Stash first if unsure.' }
      ] },
    { k: 'table', id: 'undo-reset', t: 'What each reset mode keeps', first: 'mono',
      cols: ['Mode', 'Commits', 'Staging area', 'Working tree'],
      rows: [
        ['--soft', 'moved back', 'kept', 'kept'],
        ['--mixed (default)', 'moved back', 'cleared', 'kept'],
        ['--hard', 'moved back', 'cleared', 'cleared']
      ],
      call: { kind: 'trap', text: '`--hard` is the only one that deletes work you have not committed.' } },
    // built-in "steps" widget: an ordered list; give "bad" as well to let the reader flip to the broken version
    { k: 'widget', id: 'undo-reflog', w: 'steps', t: 'Recover a commit after a bad reset', label: 'Version', modes: ['Recover', 'What goes wrong'],
      good: [
        ['git reflog', 'Lists every position HEAD had, newest first. Find the line from before the reset.'],
        ['git switch -c rescue HEAD@{1}', 'Puts a branch on that commit so it has a name again.'],
        ['git log --oneline rescue', 'Check that the commits are the ones you wanted.', 'term']
      ],
      bad: [
        ['git reset --hard HEAD~3', 'Three commits disappear from the branch.'],
        ['git gc --prune=now', 'Deletes unreachable commits: now they really are gone.', 'bad']
      ],
      note: 'Git keeps unreachable commits for weeks by default, so do the recovery before any clean-up.' },
    // a call on its own (not on a card) is only for a note about the whole section
    { k: 'call', kind: 'key', text: 'Before any risky command, `git branch backup` costs nothing and makes the old state one name away.' }
  ]
});
