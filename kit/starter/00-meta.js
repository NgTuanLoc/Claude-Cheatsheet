/* ===== [00-meta.js] The sheet itself: title, texts, groups and tasks. Copy this folder and replace the content. ===== */
window.NCS_META = {
  title: 'Git Starter',                       // page title, heading and artifact name: two to four words
  lang: 'bash',                               // main snippet language: its chip is hidden, other languages show one
  lede: 'A small sample sheet that uses every part of the template. Copy the folder, keep the shape, replace the content. The Git in it is real: **everyday commands** and the fixes people look up most.',
  // optional: up to three status tiles under the lede. tone: g (green), a (violet), b (rose)
  now: { label: 'What this sheet covers', items: [
    { tone: 'g', t: 'Git 2.23 and later', d: 'Uses `git switch` and `git restore`, which split the old `checkout`.' },
    { tone: 'a', t: 'Any host', d: 'Nothing here is specific to GitHub, GitLab or Azure Repos.' }
  ] },
  map: 'Two groups: what you do every day, then how to get out of trouble.',
  // optional: version badges. Entries with "match" colour a card's v: badge; entries with "eg" appear in the legend.
  badges: [
    { match: 'Git 2\\.2[3-9]|Git 2\\.[3-9]', tone: 'new', eg: 'Git 2.23', d: 'needs a reasonably recent Git' },
    { eg: 'Git 1.x', d: 'works everywhere' }
  ],
  search: {
    placeholder: 'Search commands and situations: “rebase”, “undo”, “detached”',
    hint: 'a command or a situation: “stash”, “force”, “undo”.',
    empty: 'Try a command (“rebase”) or a situation (“undo”).'
  },
  // footer paragraphs. {count} becomes "12 cards across 3 sections"; [label](https://…) makes a link.
  foot: ['Git Starter: {count}. A sample for the cheatsheet template; facts checked against the Git documentation.']
};

/* Groups in reading order. Each answers one question; every section belongs to exactly one group. */
window.NCS_GROUPS = [
  { id: 'daily', name: 'Everyday work', q: 'How do I save and share my changes?', secs: ['save', 'branch'] },
  { id: 'fix', name: 'Fixing mistakes', q: 'How do I get out of trouble?', secs: ['undo'] }
];

/* "I want to…" rows on the map: [task, hint, [card ids]]. The first card decides the group; every group needs one. */
window.NCS_TASKS = [
  ['Commit only part of a file', 'git add -p', ['save-stage']],
  ['Update my branch with main', 'rebase or merge', ['branch-update', 'branch-shape']],
  ['Push after a rebase', '--force-with-lease', ['branch-force']],
  ['Undo my last commit', 'reset or revert', ['undo-pick', 'undo-reset']],
  ['Get back a commit I lost', 'git reflog', ['undo-reflog']]
];
