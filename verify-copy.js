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
const DOCS = ['发布文案.md', 'AI验伪方法论.md', 'README.md'];

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
const want = (k) => !only || only.includes(k);

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
    try {
      execFileSync('gh', ['api', `repos/CJX0712/${r}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      ok = true; detail = '仓库存在';
    } catch (e) {
      detail = '仓库不存在或无权访问';
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
  const m = out.match(/(\d+)\/(\d+)\s*全绿/);
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
