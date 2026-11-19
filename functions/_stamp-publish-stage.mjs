import {writeFileSync} from 'node:fs';

const {CF_PAGES_BRANCH, CF_PAGES_COMMIT_SHA} = process.env;
const stageCommit = CF_PAGES_BRANCH === 'redesign' && /^[a-f0-9]{40}$/.test(CF_PAGES_COMMIT_SHA)
  ? CF_PAGES_COMMIT_SHA
  : '';

writeFileSync(new URL('_publish-stage.js', import.meta.url), `export const stageCommit = ${JSON.stringify(stageCommit)};\n`);
