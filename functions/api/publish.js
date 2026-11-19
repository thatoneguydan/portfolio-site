import {hostAllowed, json, verifyOwner} from '../_auth.js';
import {database, readSettings} from '../_settings.js';
import {stageCommit} from '../_publish-stage.js';
import {snapshotPublicKey} from '../_publish-public-key.js';

const repo = 'thatoneguydan/portfolio-site';
const workflow = 'publish-tune.yml';
const runsPath = `/actions/workflows/${workflow}/runs`;
const commitPattern = /^[a-f0-9]{40}$/;
const encoder = new TextEncoder();
const missingRunGrace = 5 * 60 * 1000;
const table = 'portfolio_tune_publish';
const createTable = `CREATE TABLE IF NOT EXISTS ${table} (
  id INTEGER PRIMARY KEY CHECK (id=1), request_id TEXT NOT NULL, stage TEXT NOT NULL,
  revision TEXT, started_at TEXT NOT NULL, finished_at TEXT, run_id INTEGER,
  status TEXT NOT NULL, conclusion TEXT, failed_step TEXT
)`;

function deployedStage(env) {
  if (commitPattern.test(stageCommit)) return stageCommit;
  if (env.CF_PAGES_BRANCH === 'redesign' && commitPattern.test(env.CF_PAGES_COMMIT_SHA)) {
    return env.CF_PAGES_COMMIT_SHA;
  }
  return '';
}

function snapshotKey(env) {
  try {
    const key = atob(env.PUBLISH_SNAPSHOT_PUBLIC_KEY || snapshotPublicKey);
    return key.length ? Uint8Array.from(key, char => char.charCodeAt(0)) : null;
  } catch {
    return null;
  }
}

async function encryptSnapshot(settings, keyBytes, requestId, stage) {
  const publicKey = await crypto.subtle.importKey('spki', keyBytes,
    {name: 'RSA-OAEP', hash: 'SHA-256'}, false, ['encrypt']);
  if (publicKey.algorithm.modulusLength !== 2048) throw new Error('Invalid publish encryption key size.');
  const rawKey = crypto.getRandomValues(new Uint8Array(32));
  const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const additionalData = encoder.encode(JSON.stringify([requestId, stage]));
  const [wrappedKey, encrypted] = await Promise.all([
    crypto.subtle.encrypt({name: 'RSA-OAEP'}, publicKey, rawKey),
    crypto.subtle.encrypt({name: 'AES-GCM', iv, additionalData}, key, encoder.encode(JSON.stringify(settings))),
  ]);
  let binary = String.fromCharCode(...new Uint8Array(wrappedKey), ...iv);
  for (const byte of new Uint8Array(encrypted)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function github(env, path, options = {}) {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2026-03-10',
    'User-Agent': 'portfolio-staging-publish',
    ...options.headers,
  };
  if (env.PUBLISH_GITHUB_TOKEN) headers.Authorization = `Bearer ${env.PUBLISH_GITHUB_TOKEN}`;
  return fetch(`https://api.github.com/repos/${repo}${path}`, {
    ...options, headers, redirect: 'error', signal: AbortSignal.timeout(8000),
  });
}

async function githubJson(env, path) {
  const response = await github(env, path);
  if (!response.ok) throw new Error('GitHub status unavailable.');
  return response.json();
}

async function readPublish(db) {
  const read = () => db.prepare(`SELECT * FROM ${table} WHERE id=1`).first();
  try {
    return await read();
  } catch (error) {
    if (!/no such table: (?:main\.)?portfolio_tune_publish\b/i.test(String(error?.message) + ' ' + String(error?.cause?.message))) throw error;
    await db.prepare(createTable).run();
    return read();
  }
}

const active = record => record?.status === 'queued' || record?.status === 'in_progress';

function publicStatus(record, status = record?.status) {
  if (!record) return null;
  return {
    id: record.request_id,
    status,
    pending: active(record),
    stage: record.stage,
    revision: record.revision,
    startedAt: record.started_at,
    finishedAt: record.finished_at ?? null,
    runUrl: record.run_id ? `https://github.com/${repo}/actions/runs/${record.run_id}` : null,
    conclusion: record.conclusion ?? null,
    failedStep: record.failed_step ?? null,
  };
}

async function reservePublish(db, record) {
  const result = await db.prepare(`INSERT INTO ${table}
    (id, request_id, stage, revision, started_at, status) VALUES (1, ?, ?, ?, ?, 'queued')
    ON CONFLICT(id) DO UPDATE SET request_id=excluded.request_id, stage=excluded.stage,
      revision=excluded.revision, started_at=excluded.started_at, status='queued',
      run_id=NULL, finished_at=NULL, conclusion=NULL, failed_step=NULL
    WHERE ${table}.status IN ('success','failure','cancelled')`)
    .bind(record.request_id, record.stage, record.revision, record.started_at).run();
  return result.meta?.changes === 1;
}

async function updatePublish(db, record) {
  const result = await db.prepare(`UPDATE ${table} SET run_id=?, status=?, conclusion=?, finished_at=?, failed_step=?
    WHERE id=1 AND request_id=? AND status IN ('queued','in_progress')`)
    .bind(record.run_id ?? null, record.status, record.conclusion ?? null,
      record.finished_at ?? null, record.failed_step ?? null, record.request_id).run();
  return result.meta?.changes === 1 ? record : readPublish(db);
}

async function reconcileRun(db, env, record) {
  if (!active(record)) return publicStatus(record);
  try {
    const expectedTitle = `Tune publish ${record.request_id}`;
    const matches = run => run?.event === 'workflow_dispatch' && run.head_branch === 'main'
      && run.display_title === expectedTitle;
    const run = record.run_id
      ? await githubJson(env, `/actions/runs/${record.run_id}`)
      : (await githubJson(env, `${runsPath}?branch=main&event=workflow_dispatch&per_page=30`)).workflow_runs.find(matches);
    if (!run) {
      // A transport error during dispatch may occur after GitHub accepted it.
      // Recover accepted requests by their unique run title before unlocking.
      if (Date.now() - Date.parse(record.started_at) < missingRunGrace) return publicStatus(record);
      return publicStatus(await updatePublish(db, {...record, status: 'failure',
        conclusion: 'run_not_found', finished_at: new Date().toISOString()}));
    }
    if (!matches(run) || !Number.isSafeInteger(run.id)) throw new Error('Unexpected workflow run.');
    if (run.status !== 'completed') {
      const status = run.status === 'in_progress' ? 'in_progress' : 'queued';
      if (record.status === status && record.run_id === run.id) return publicStatus(record);
      return publicStatus(await updatePublish(db, {...record, run_id: run.id, status}));
    }
    const conclusion = run.conclusion;
    const status = conclusion === 'success' || conclusion === 'cancelled' ? conclusion : 'failure';
    let failedStep = null;
    if (status !== 'success') {
      const jobs = await githubJson(env, `/actions/runs/${run.id}/jobs`).catch(() => null);
      failedStep = jobs?.jobs?.flatMap(job => job.steps || [])
        .find(step => step.conclusion === 'failure' || step.conclusion === 'cancelled')?.name ?? null;
    }
    return publicStatus(await updatePublish(db, {...record, run_id: run.id, status, conclusion,
      finished_at: run.updated_at || new Date().toISOString(), failed_step: failedStep}));
  } catch {
    return publicStatus(record, 'unknown');
  }
}

async function previouslyVerifiedPublish() {
  // Preserve the verified manual result if the live marker cannot be read from this Worker.
  const record = publicStatus({
    request_id: '185ff173d2b69ef8e40134cf28889776755effe0',
    status: 'success', stage: 'dbd473291c38b71d93376960742103f91b164bd7',
    revision: '4539d1a0-9919-488a-8082-af8d61ff178f',
    started_at: null, finished_at: '2026-11-19T16:24:13Z', conclusion: 'success',
  });
  try {
    const response = await fetch('https://dantylersmith.com/', {
      headers: {'Cache-Control': 'no-cache'}, signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return {...record, liveConfirmed: false};
    const html = await response.text();
    return html.includes('/assets/site-effects.js?v=public-dbd473291c-6d6196dc"')
      ? {...record, liveConfirmed: true} : null;
  } catch {
    return {...record, liveConfirmed: false};
  }
}

const isOwner = (request, env) => hostAllowed(request, env) && verifyOwner(request, env);
const isConfigured = (env, stage, key) => Boolean(env.PORTFOLIO_CONFIG && env.PUBLISH_GITHUB_TOKEN && stage && key);

export async function onRequestGet({request, env}) {
  if (!await isOwner(request, env)) return json({error: 'Owner sign-in required.'}, 403);
  const configured = isConfigured(env, deployedStage(env), snapshotKey(env));
  try {
    if (!env.PORTFOLIO_CONFIG) return json({configured, publish: null});
    const db = await database(env);
    const record = await readPublish(db);
    const publish = record ? await reconcileRun(db, env, record) : await previouslyVerifiedPublish();
    return json({configured, publish});
  } catch {
    return json({configured, error: 'Publish status is temporarily unavailable.'}, 503);
  }
}

export async function onRequestPost({request, env}) {
  if (!await isOwner(request, env)) return json({error: 'Owner sign-in required.'}, 403);
  if (request.headers.get('Origin') !== new URL(request.url).origin) return json({error: 'Invalid request origin.'}, 403);
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') return json({error: 'JSON required.'}, 415);
  if (Number(request.headers.get('Content-Length')) > 1024) return json({error: 'Request too large.'}, 413);
  let revision;
  try {
    const body = await request.text();
    if (body.length > 1024) return json({error: 'Request too large.'}, 413);
    ({revision} = JSON.parse(body));
    if (revision !== null && typeof revision !== 'string') throw new Error('Invalid revision.');
  } catch {
    return json({error: 'A saved settings revision is required.'}, 400);
  }

  const stage = deployedStage(env);
  const key = snapshotKey(env);
  const configured = isConfigured(env, stage, key);
  if (!configured) return json({configured, error: 'Publishing is not configured on this staging deployment.'}, 503);

  try {
    const db = await database(env);
    const settings = await readSettings(db);
    if (settings.revision !== revision) return json({configured, error: 'Staging settings changed. Reload Tune before publishing.'}, 409);
    const existing = await reconcileRun(db, env, await readPublish(db));
    if (existing?.pending) return json({configured, publish: existing, error: 'A publish is already running.'}, 409);

    const record = {request_id: crypto.randomUUID(), stage, revision, status: 'queued', started_at: new Date().toISOString()};
    const snapshot = await encryptSnapshot(settings, key, record.request_id, stage);
    const inputs = {request_id: record.request_id, stage, snapshot};
    if (JSON.stringify(inputs).length > 65000) return json({configured, error: 'Saved settings exceed the publish limit.'}, 413);
    if (!await reservePublish(db, record)) {
      return json({configured, publish: publicStatus(await readPublish(db)), error: 'A publish is already running.'}, 409);
    }

    const response = await github(env, `/actions/workflows/${workflow}/dispatches`, {
      method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ref: 'main', inputs}),
    }).catch(() => null);
    if (response && !response.ok && response.status < 500) {
      const rejected = await updatePublish(db, {...record, status: 'failure',
        conclusion: 'dispatch_rejected', finished_at: new Date().toISOString()});
      return json({configured, publish: publicStatus(rejected), error: 'GitHub rejected the publish request.'}, 502);
    }
    if (response?.status === 200) {
      const runId = (await response.json().catch(() => null))?.workflow_run_id;
      if (Number.isSafeInteger(runId) && runId > 0) {
        const linked = await updatePublish(db, {...record, run_id: runId});
        return json({configured, publish: publicStatus(linked)}, 202);
      }
    }
    return json({configured, publish: publicStatus(record, response?.ok ? 'queued' : 'unknown')}, 202);
  } catch {
    return json({configured, error: 'Could not start publishing. Check the current publish status before retrying.'}, 503);
  }
}
