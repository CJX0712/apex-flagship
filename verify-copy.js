/*
 * verify-copy.js · 发布前自检：给文案上尺子
 * ------------------------------------------------------------------
 * 传播文案的信用全靠"说的和真的对得上"。这篇文案的每个数字、每条链接，
 * 都要能被独立复现地核对——否则"AI 验伪"这块招牌会自己塌。
 *
 * 三道核对：
 *   ① 链接核对：文案里每个 github.com/CJX0712/<repo> 必须真实存在
 *   ② 数字溯源：文案里的关键数字必须能在对应源仓库 README 中找到（防漂移）
 *   ③ 自检数核对：实际跑各仓库自检，得到的总数必须 == 文案里写的徽章数
 *
 * 用法:
 *   node verify-copy.js            全量（含跑自检，数分钟）
 *   node verify-copy.js --fast     只跑 ①②（秒级）
 *   node verify-copy.js --only=links,numbers
 *
 * 作者：晨星 (GitHub: CJX0712) · 许可：MIT
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const NODE = process.execPath;
// 受验文件：前端大门两篇文案 + 门户 README + **门户首页 index.html** + **个人主页 README**（品牌落点，数字同样会漂移）
const DOCS = ['发布文案.md', 'AI验伪方法论.md', 'README.md', 'index.html', '../CJX0712/README.md'];

// ① 链接核对：文案里出现的 GitHub 仓库链接 → 必须真实存在
// ② 数字溯源：[关键数字, 必须出现在该源仓库 README 中的字符串]
const SOURCES = [
  ['62/62', 'flagship-ai-engine'],
  ['15/15', 'flagship-llm-chat'],
  ['9/9', 'flagship-transformer'],
  ['9/9', 'flagship-rag-engine'],
  ['8/8', 'flagship-algo-forge'],
];
const PROVENANCE = [
  ['0.75', 'flagship-transformer', '原生外推 L=40 达 0.75'],
  ['0.32', 'flagship-transformer', '裸放大前 d48 原生 0.32'],
  ['0.19', 'flagship-transformer', '原生 RoPE 外推崩塌 0.19'],
  ['0.52', 'flagship-transformer', 'YaRN 救回 0.52'],
  ['1.00', 'flagship-transformer', '注意力 1.00'],
  ['0.20', 'flagship-transformer', '无注意力基线 0.20'],
  ['4.19', 'flagship-rag-engine', 'KV-Cache 早期偏差 4.19'],
  ['0.00', 'flagship-rag-engine', 'KV-Cache 逐位等价 0.00'],
  ['76%', 'flagship-llm-chat', 'BPE 命中率 76%'],
  ['100%', 'flagship-llm-chat', 'BPE 命中率 100%'],
  ['41%', 'flagship-llm-chat', 'BPE token 省 41%'],
];

// ③ 自检数核对：实际跑自检 → 解析总数
const TESTS = [
  { name: 'flagship-ai-engine', dir: 'flagship-ai-engine', file: 'test/run.mjs' },
  { name: 'flagship-algo-forge', dir: 'flagship-algo-forge', file: 'apex-forge.js' },
  { name: 'flagship-transformer', dir: 'flagship-transformer', file: 'apex-transformer.js' },
  { name: 'flagship-rag-engine', dir: 'flagship-rag-engine', file: 'apex-engine.js' },
  { name: 'flagship-llm-chat', dir: 'flagship-llm-chat', file: 'verify.js' },
  { name: 'flagship-monorepo', dir: 'flagship-ai', file: 'verify.js', aggregate: true },
];

const args = process.argv.slice(2);
const FAST = args.includes('--fast');
const onlyArg = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1];
const only = onlyArg ? onlyArg.split(',') : null;
// --fast 跳过最慢的「自检数」实跑（只核对链接 + 数字溯源，秒级）
const want = (k) => (FAST && k === 'tests') ? false : (!only || only.includes(k));

const readDoc = (f) => {
  const p = path.join(__dirname, f);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
};
const docs = DOCS.map((f) => ({ f, t: readDoc(f) })).filter((d) => d.t);
const allText = docs.map((d) => d.t).join('\n');

const results = [];
const add = (cat, name, pass, detail) => results.push({ cat, name, pass: !!pass, detail });

// ---------- ① 链接核对 ----------
if (want('links')) {
  const repos = Array.from(new Set(
    (allText.match(/https:\/\/github\.com\/CJX0712\/[A-Za-z0-9._-]+/g) || [])
      .map((u) => u.split('github.com/CJX0712/')[1])
  ));
  for (const r of repos) {
    let ok = false, detail = '';
    // GitHub API 偶发网络抖动（schannel）→ 重试 3 次，避免把网络故障误判为"仓库不存在"
    for (let attempt = 1; attempt <= 3 && !ok; attempt++) {
      try {
        execFileSync('gh', ['api', `repos/CJX0712/${r}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        ok = true; detail = '仓库存在';
      } catch (e) {
        detail = attempt < 3 ? '网络抖动，重试中…' : '仓库不存在或无权访问';
      }
    }
    add('链接', r, ok, detail);
  }
}

// ---------- ② 数字溯源 ----------
if (want('numbers')) {
  for (const [num, repo, desc] of PROVENANCE) {
    const p = path.join(ROOT, repo, 'README.md');
    let ok = false, detail = '';
    if (!fs.existsSync(p)) { detail = '源仓库 README 不存在'; }
    else {
      const t = fs.readFileSync(p, 'utf8');
      ok = t.indexOf(num) >= 0;
      detail = ok ? `源仓库 ${repo}/README.md 命中` : `源仓库 ${repo}/README.md 未找到「${num}」`;
    }
    // 数字还必须出现在文案里
    const inCopy = allText.indexOf(num) >= 0;
    add('数字溯源', `${num} · ${desc}`, ok && inCopy,
      ok ? (inCopy ? detail : '数字在源仓库有，但文案中未出现') : detail);
  }
}

// ---------- ③ 自检数核对 ----------
function parseTotal(name, out) {
  if (name === 'flagship-monorepo') {
    // 汇总表： [PASS] name  label  n/m
    const lines = out.split('\n').filter((l) => /^\[PASS\]|^\[FAIL\]/.test(l) && /\d+\/\d+/.test(l) && !/旗舰闭环总战绩/.test(l));
    let a = 0, b = 0;
    lines.forEach((l) => { const m = l.match(/(\d+)\/(\d+)\s*$/); if (m) { a += +m[1]; b += +m[2]; } });
    return b ? `${a}/${b}` : null;
  }
  // ① "PASS 62/62 — 全部不变量自检通过"（flagship-ai-engine 格式）
  let m = out.match(/PASS\s+(\d+)\/(\d+)/);
  if (m) return `${m[1]}/${m[2]}`;
  // ② "结果：9/9 全绿"（其余仓库格式）
  m = out.match(/(\d+)\/(\d+)\s*全绿/);
  return m ? `${m[1]}/${m[2]}` : null;
}
if (want('tests')) {
  for (const t of TESTS) {
    const abs = path.join(ROOT, t.dir, t.file);
    let out = '', code = 0;
    try {
      out = execFileSync(NODE, [abs], { encoding: 'utf8', timeout: 600000, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      code = e.status || 1;
      out = (e.stdout || '') + (e.stderr || '');
    }
    const total = parseTotal(t.name, out);
    // 文案里为该仓库宣称的徽章数（monorepo 在文档中可能写作 flagship-monorepo 或 flagship-ai）
    const esc = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    let claimStr = null;
    for (const alias of (t.name === 'flagship-monorepo' ? ['flagship-monorepo', 'flagship-ai'] : [t.name])) {
      const m = allText.match(new RegExp(esc(alias) + '[^\\n]{0,140}?(\\d+/\\d+)'));
      if (m) { claimStr = m[1]; break; }
    }
    add('自检数', t.name, total && claimStr && total === claimStr,
      `实测=${total || '解析失败'} · 文案声称=${claimStr || '文案中未找到'}${code ? ' · (退出码 ' + code + ')' : ''}`);
  }
}

// ---------- ④ 门面徽章一致性（跨所有文档，含 index.html 门户首页）----------
// 直接抓"门户/README/个人主页某处徽章和别处不一致"的漂移（例：门户还写 12/12，仓库已 15/15）。
// 已验证自检总数（由 ③ 实跑核对 / 最近一次全量核对固化）。改这里前先跑一次 node verify-copy.js 全量。
if (want('badges') || want('tests') || !only) {
  const VERIFIED = {
    'flagship-ai-engine': '62/62',
    'flagship-algo-forge': '8/8',
    'flagship-transformer': '9/9',
    'flagship-rag-engine': '9/9',
    'flagship-llm-chat': '15/15',
    'flagship-monorepo': '32/32',
  };
  const esc = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  // 归一化：门户首页 pill 用带空格格式「8 / 8」，统一成「8/8」再匹配
  const norm = allText.replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2');
  // 词边界别名，防 flagship-ai 撞上 flagship-ai-engine 前缀
  const aliasRe = Object.fromEntries(Object.keys(VERIFIED).map((r) => [r,
    new RegExp('(?<![-\\w])' + esc(r) + '(?![-\\w])')]));
  const WIN = 80; // 徽章前后窗口：README 徽章在仓库名后，门户 pill 在仓库名前一行
  const perRepo = {};
  for (const r of Object.keys(VERIFIED)) perRepo[r] = new Set();
  for (const bm of norm.matchAll(/(\d+)\/(\d+)/g)) {
    const lo = Math.max(0, bm.index - WIN), hi = Math.min(norm.length, bm.index + bm[0].length + WIN);
    const win = norm.slice(lo, hi);
    const hits = Object.keys(VERIFIED).filter((r) => aliasRe[r].test(win));
    if (hits.length === 1) perRepo[hits[0]].add(`${bm[1]}/${bm[2]}`); // 恰好归属一个仓库才采信，避免串行
  }
  for (const [repo, verified] of Object.entries(VERIFIED)) {
    const uniq = [...perRepo[repo]];
    const ok = uniq.length > 0 && uniq.every((x) => x === verified);
    add('门面徽章', repo, ok, `出现 ${uniq.join(' , ') || '无（未在门面采信到）'} · 应全为 ${verified}`);
  }
}

// ---------- ⑤ 演示台 vendor 资产防漂移 ----------
// 验伪演示台原样加载 flagship-algo-forge/apex-forge.js；门户内的副本必须与源仓库逐字节一致，
// 否则演示台跑出的数字会和仓库徽章脱节——"尺子"先塌在自己门口的演示上。
if (want('vendor') || want('badges') || want('tests') || !only) {
  const src = path.join(ROOT, 'flagship-algo-forge', 'apex-forge.js');
  const vend = path.join(__dirname, 'assets', 'apex-forge.js');
  let ok = false, detail = '';
  if (!fs.existsSync(src)) detail = '源 flagship-algo-forge/apex-forge.js 不存在';
  else if (!fs.existsSync(vend)) detail = '门户 assets/apex-forge.js 缺失（演示台无法加载）';
  else {
    const a = fs.readFileSync(src), b = fs.readFileSync(vend);
    ok = a.equals(b);
    detail = ok ? '与源仓库逐字节一致' : '与源仓库不一致 → 重新 cp，否则演示数字会脱节';
  }
  add('vendor 资产', 'assets/apex-forge.js', ok, detail);
}

// ---------- 输出 ----------
console.log('\n=== 发布前自检（给文案上尺子）===');
let pass = 0, fail = 0;
let lastCat = '';
results.forEach((r) => {
  if (r.cat !== lastCat) { console.log(`\n[${r.cat}]`); lastCat = r.cat; }
  console.log(`${r.pass ? '✅' : '❌'} ${r.name.padEnd(40)} | ${r.detail}`);
  r.pass ? pass++ : fail++;
});
console.log(`\n------------------------------------------`);
console.log(`${pass}/${results.length} 通过${fail ? ` · ❌ ${fail} 项不符，文案需修正或源数据需更新` : ' · ✅ 文案与仓库完全一致'}`);
process.exit(fail ? 1 : 0);
