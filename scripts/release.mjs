import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'inherit'],
    ...options,
  }).trim();
}

function git(args, options = {}) {
  return run('git', args, options);
}

function rollbackVersionFiles() {
  try {
    git(['checkout', '--', 'package.json', 'package-lock.json']);
  } catch {
    // Keep the original release behavior if a checkout is not possible.
  }
}

const rl = readline.createInterface({ input, output });

try {
  const currentVersion = JSON.parse(
    fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'),
  ).version;

  console.log('=========================================');
  console.log('  MatrixFlow 发布工具');
  console.log(`  当前版本: ${currentVersion}`);
  console.log('=========================================\n');

  const status = git(['status', '--porcelain']);
  if (status) {
    console.error('存在未提交的更改，请先提交或暂存。');
    console.error(status);
    process.exit(1);
  }

  console.log('选择发布类型:');
  console.log('  1) patch (0.0.x) - 修复 bug');
  console.log('  2) minor (0.x.0) - 新功能（向后兼容）');
  console.log('  3) major (x.0.0) - 重大更新（可能不兼容）');
  console.log('  4) 自定义版本号\n');

  const choice = (await rl.question('输入选择 [1-4]: ')).trim();
  let newVersion;

  if (choice === '1' || choice === '2' || choice === '3') {
    const releaseType = { 1: 'patch', 2: 'minor', 3: 'major' }[choice];
    newVersion = run(npmCommand, ['version', releaseType, '--no-git-tag-version']);
  } else if (choice === '4') {
    const customVersion = (await rl.question('输入新版本号 (如 1.2.3): ')).trim();
    if (!/^\d+\.\d+\.\d+$/.test(customVersion)) {
      console.error('版本号格式无效');
      process.exit(1);
    }
    run(npmCommand, ['version', customVersion, '--no-git-tag-version']);
    newVersion = `v${customVersion}`;
  } else {
    console.error('无效选择');
    process.exit(1);
  }

  const version = newVersion.replace(/^v/, '');
  console.log(`\n新版本: ${version}\n`);

  const generateChangelog = (await rl.question('是否生成 changelog? [y/N]: ')).trim();
  if (/^y$/i.test(generateChangelog)) {
    let previousTag = '';
    try {
      previousTag = git(['describe', '--tags', '--abbrev=0', 'HEAD']);
    } catch {
      // The repository may not have a previous tag.
    }

    const logArgs = previousTag
      ? ['log', `${previousTag}..HEAD`, '--pretty=format:- %s (%h)', '--no-merges']
      : ['log', '--pretty=format:- %s (%h)', '--no-merges', '-30'];
    const commits = git(logArgs);
    const changelogPath = path.join(projectRoot, 'CHANGELOG.md');
    const existing = fs.existsSync(changelogPath)
      ? fs.readFileSync(changelogPath, 'utf8').split(/\r?\n/).slice(1).join('\n')
      : '';
    const content = `# Changelog\n## ${version} (${new Date().toISOString().slice(0, 10)})\n\n${commits}\n\n${existing}`;
    const tempPath = path.join(os.tmpdir(), `matrixflow-changelog-${process.pid}.tmp`);
    fs.writeFileSync(tempPath, content, 'utf8');
    fs.copyFileSync(tempPath, changelogPath);
    fs.rmSync(tempPath, { force: true });
    console.log('CHANGELOG.md 已更新');
  }

  console.log('\n即将执行以下操作:');
  console.log('  1. 提交版本更新');
  console.log(`  2. 创建 git tag v${version}`);
  console.log('  3. 推送到远程仓库');
  console.log('  4. 触发 CI/CD 构建并发布\n');

  const confirm = (await rl.question('确认发布? [y/N]: ')).trim();
  if (!/^y$/i.test(confirm)) {
    rollbackVersionFiles();
    console.log('已取消');
    process.exit(0);
  }

  const filesToAdd = ['package.json', 'package-lock.json'];
  if (fs.existsSync(path.join(projectRoot, 'CHANGELOG.md'))) {
    filesToAdd.push('CHANGELOG.md');
  }
  git(['add', ...filesToAdd]);
  git(['commit', '-m', `chore: release v${version}`]);
  git(['tag', `v${version}`]);
  git(['push', 'origin', 'main', '--tags']);

  console.log(`\n发布已触发！\n  Tag: v${version}`);
  console.log('  查看: https://github.com/matrixflow/matrixflow/actions');
} finally {
  rl.close();
}
