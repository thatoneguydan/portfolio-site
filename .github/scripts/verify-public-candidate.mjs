import { createHash } from 'node:crypto';
import { lstat, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function normalizeRelativePath(value) {
  const raw = String(value || '');
  if (!raw || raw.includes('\0') || raw.includes('\\') || raw.startsWith('/') || /^[A-Za-z]:/.test(raw)) {
    throw new Error(`Unsafe manifest path: ${JSON.stringify(raw)}`);
  }
  const normalized = path.posix.normalize(raw);
  const segments = normalized.split('/');
  if (normalized === '.' || normalized === '..' || normalized.startsWith('../') || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw new Error(`Unsafe manifest path: ${JSON.stringify(raw)}`);
  }
  return normalized;
}

async function enumerateFiles(root) {
  const files = [];
  async function walk(relativeDir = '') {
    const absolute = relativeDir ? path.join(root, ...relativeDir.split('/')) : root;
    for (const entry of await readdir(absolute, { withFileTypes: true })) {
      const relative = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink()) throw new Error(`Symbolic link is forbidden in public candidate: ${relative}`);
      if (entry.isDirectory()) await walk(relative);
      else if (entry.isFile()) files.push(relative.split(path.sep).join('/'));
      else throw new Error(`Unsupported filesystem entry in public candidate: ${relative}`);
    }
  }
  await walk();
  return files.sort();
}

function treeDigest(records) {
  const material = records.map((record) => `${record.path}\0${record.sha256}\0${record.bytes}\n`).join('');
  return sha256(Buffer.from(material, 'utf8'));
}

export async function verifyCandidate({ siteRoot, manifestPath, handoffPath, releasePath, candidateZipPath, receiptPath }) {
  for (const [label, file] of Object.entries({ manifestPath, handoffPath, releasePath, candidateZipPath })) {
    const info = await lstat(file);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} is not a regular non-symlink file: ${file}`);
  }
  const rootInfo = await lstat(siteRoot);
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) throw new Error(`siteRoot is not a regular directory: ${siteRoot}`);

  const manifestBytes = await readFile(manifestPath);
  const releaseBytes = await readFile(releasePath);
  const handoff = JSON.parse(await readFile(handoffPath, 'utf8'));
  const manifest = JSON.parse(manifestBytes.toString('utf8'));
  const release = JSON.parse(releaseBytes.toString('utf8'));

  if (handoff.schemaVersion !== 1) throw new Error('Unsupported handoff schemaVersion.');
  if (manifest.schemaVersion !== 1 || manifest.result !== 'PASS') throw new Error('Publish manifest is not an accepted PASS manifest.');
  if (release.schemaVersion !== 1 || release.storage !== 'private-github-release') throw new Error('Candidate release record is not canonical.');
  if (release.assetName !== 'portfolio-public-candidate.zip') throw new Error('Candidate asset name is not canonical.');

  const candidateBytes = await readFile(candidateZipPath);
  const candidateSha = sha256(candidateBytes);
  if (candidateSha !== String(handoff.candidateSha256)) throw new Error('Candidate ZIP hash differs from handoff marker.');
  if (candidateSha !== String(release.sha256)) throw new Error('Candidate ZIP hash differs from candidate release record.');
  if (sha256(manifestBytes) !== String(handoff.manifestSha256)) throw new Error('Publish manifest hash differs from handoff marker.');
  if (sha256(releaseBytes) !== String(handoff.releaseRecordSha256)) throw new Error('Candidate release-record hash differs from handoff marker.');
  if (String(manifest.publicTreeSha256) !== String(handoff.publicTreeSha256) || String(release.publicTreeSha256) !== String(handoff.publicTreeSha256)) {
    throw new Error('Public-tree SHA-256 identity differs across handoff/manifest/release evidence.');
  }

  const expectedRecords = Array.isArray(manifest.files) ? manifest.files : [];
  const expected = new Map();
  for (const record of expectedRecords) {
    const relative = normalizeRelativePath(record.path);
    if (expected.has(relative)) throw new Error(`Duplicate manifest path: ${relative}`);
    const hash = String(record.sha256 || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(hash)) throw new Error(`Invalid file SHA-256 in manifest: ${relative}`);
    expected.set(relative, { path: relative, sha256: hash, bytes: Number(record.bytes) });
  }
  if (expected.size !== Number(handoff.publicFiles) || expected.size !== Number(release.publicFiles) || expected.size !== Number(manifest.counts?.publicFiles)) {
    throw new Error('Public file count differs across handoff/manifest/release evidence.');
  }

  const actualPaths = await enumerateFiles(siteRoot);
  if (actualPaths.length !== expected.size) throw new Error(`Expanded candidate file count mismatch: expected ${expected.size}; got ${actualPaths.length}.`);
  const unexpected = actualPaths.filter((relative) => !expected.has(relative));
  const missing = [...expected.keys()].filter((relative) => !actualPaths.includes(relative));
  if (unexpected.length || missing.length) throw new Error(`Expanded candidate inventory mismatch. Unexpected: ${unexpected.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}.`);

  const records = [];
  for (const relative of [...expected.keys()].sort()) {
    const absolute = path.join(siteRoot, ...relative.split('/'));
    const info = await lstat(absolute);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Candidate path is not a regular file: ${relative}`);
    const bytes = await readFile(absolute);
    const actualHash = sha256(bytes);
    const definition = expected.get(relative);
    if (actualHash !== definition.sha256) throw new Error(`Candidate file hash mismatch: ${relative}`);
    if (info.size !== definition.bytes) throw new Error(`Candidate file byte-count mismatch: ${relative}`);
    records.push({ path: relative, sha256: actualHash, bytes: info.size });
  }

  const publicTreeSha256 = treeDigest(records);
  if (publicTreeSha256 !== String(handoff.publicTreeSha256)) throw new Error(`Expanded public-tree SHA-256 mismatch: ${publicTreeSha256}`);
  const publicBytes = records.reduce((sum, record) => sum + record.bytes, 0);
  if (publicBytes !== Number(release.publicBytes) || publicBytes !== Number(manifest.counts?.publicBytes)) throw new Error('Expanded candidate byte count differs from durable evidence.');

  const receipt = {
    schemaVersion: 1,
    result: 'PASS',
    requestId: String(handoff.requestId),
    candidateSha256: candidateSha,
    publicTreeSha256,
    publicFiles: records.length,
    publicBytes,
    sourceRescueSha256: String(handoff.sourceRescueSha256),
    verifiedAt: new Date().toISOString(),
  };
  if (receiptPath) await writeFile(receiptPath, `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return receipt;
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  const [siteRoot, manifestPath, handoffPath, releasePath, candidateZipPath, receiptPath] = process.argv.slice(2);
  if (!siteRoot || !manifestPath || !handoffPath || !releasePath || !candidateZipPath) {
    throw new Error('Usage: node verify-public-candidate.mjs <siteRoot> <manifestPath> <handoffPath> <releasePath> <candidateZipPath> [receiptPath]');
  }
  const receipt = await verifyCandidate({ siteRoot, manifestPath, handoffPath, releasePath, candidateZipPath, receiptPath });
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
}
