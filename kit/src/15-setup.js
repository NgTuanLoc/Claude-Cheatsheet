/* ===== Kit setup: the section list and the language table for the syntax highlighter =====
   A sheet adds or changes a language with window.NCS_LANGS = { id: { n: 'Name', ... } } (merged field by field).
   n     name shown on the language chip
   kw    keywords, space separated      ci    true = keywords match in any case
   com   comments: c (// and block) | block | sql (--) | hash (#) | xml | none
   str   strings: c ("…" with @ and $ prefixes, '…') | sh ("…") | q ("…", '…') | all ("…", '…', backticks)
   num   numbers: c | sh                attr  cs ([Attribute]) | at (@decorator) | none
   fn    call (name before "(") | key (name before ":") | cmd (first word of a line; cmd: 'a b' limits it to a list)
   types true = Capitalised names get the type colour      tag   true = names after "<" get the type colour */
window.NCS = window.NCS || [];
window.NCS_LANGDEFS = {
  cs: { n: 'C#', com: 'c', str: 'c', num: 'c', attr: 'cs', fn: 'call', types: true,
    kw: 'abstract as async await base bool break byte case catch char checked class const continue decimal default delegate do double else enum event explicit extern false finally fixed float for foreach goto if implicit in init int interface internal is lock long namespace new null object operator out override params private protected public readonly record ref required return sbyte sealed short sizeof stackalloc static string struct switch this throw true try typeof uint ulong unchecked unsafe ushort using var virtual void volatile when where while with yield get set value nameof extension field union closed global partial and or not file scoped dynamic' },
  js: { n: 'JavaScript', com: 'c', str: 'all', num: 'c', fn: 'call', types: true,
    kw: 'import export from const let var function return if else for of in new await async default true false null undefined typeof class extends super this throw try catch finally switch case break continue while do yield instanceof delete static get set void' },
  ts: { n: 'TypeScript', com: 'c', str: 'all', num: 'c', attr: 'at', fn: 'call', types: true,
    kw: 'import export from const let var function return if else for of in new await async default true false null undefined typeof class extends super this throw try catch finally switch case break continue while do yield instanceof delete static get set void interface type enum implements abstract readonly private protected public declare namespace keyof infer is as satisfies unknown never any string number boolean object symbol bigint override' },
  py: { n: 'Python', com: 'hash', str: 'q', num: 'c', attr: 'at', fn: 'call', types: true,
    kw: 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield match case self' },
  go: { n: 'Go', com: 'c', str: 'all', num: 'c', fn: 'call', types: true,
    kw: 'break case chan const continue default defer else fallthrough for func go goto if import interface map package range return select struct switch type var nil true false iota string int int32 int64 uint float64 error bool byte rune any' },
  java: { n: 'Java', com: 'c', str: 'q', num: 'c', attr: 'at', fn: 'call', types: true,
    kw: 'abstract assert boolean break byte case catch char class const continue default do double else enum extends final finally float for if implements import instanceof int interface long native new null package private protected public record return sealed short static super switch synchronized this throw throws transient try var void volatile while yield true false permits' },
  sql: { n: 'SQL', com: 'sql', str: 'c', num: 'c', attr: 'cs', ci: true,
    kw: 'select from where and or not insert into values update set delete merge join inner left right full outer cross apply on group by order having as with begin commit rollback transaction create table index primary key foreign references unique alter add drop column exec declare top offset fetch next rows only is null in exists case when then else end output inserted deleted type bigint int decimal varchar nvarchar count sum avg min max distinct union all except intersect limit returning like ilike between asc desc default constraint view function procedure trigger if using over partition window coalesce cast text boolean timestamp timestamptz date uuid jsonb serial explain analyze grant revoke truncate' },
  bash: { n: 'Shell', com: 'hash', str: 'q', num: 'sh', fn: 'cmd', kw: 'if then else elif fi for while do done in case esac function export' },
  json: { n: 'JSON', com: 'none', str: 'c', num: 'c', attr: 'cs', kw: 'true false null' },
  yaml: { n: 'YAML', com: 'hash', str: 'sh', num: 'sh', fn: 'key', kw: 'true false null' },
  xml: { n: 'XML', com: 'xml', str: 'sh', num: 'sh', types: true, kw: '' },
  html: { n: 'HTML', com: 'xml', str: 'q', num: 'sh', tag: true, kw: '' },
  css: { n: 'CSS', com: 'block', str: 'q', num: 'sh', fn: 'key', kw: '' },
  docker: { n: 'Dockerfile', com: 'hash', str: 'sh', num: 'sh', kw: 'FROM AS WORKDIR COPY ADD RUN USER EXPOSE ENTRYPOINT ARG ENV CMD LABEL VOLUME HEALTHCHECK' },
  proto: { n: 'Protobuf', com: 'c', str: 'c', num: 'c', attr: 'cs',
    kw: 'syntax option service rpc returns stream message string int32 int64 uint32 uint64 bool bytes double float repeated map oneof enum import package reserved' },
  text: { n: 'Text' }
};
