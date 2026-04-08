import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const workerSource = fs.readFileSync(
	path.resolve('/Users/yuzhexu/Downloads/edgetunnel/_worker.js'),
	'utf8'
);

function extractFunction(source, functionName) {
	const signature = `function ${functionName}`;
	const start = source.indexOf(signature);
	if (start === -1) {
		throw new Error(`Function ${functionName} not found`);
	}

	const braceStart = source.indexOf('{', start);
	if (braceStart === -1) {
		throw new Error(`Function ${functionName} has no body`);
	}

	let depth = 0;
	let inSingle = false;
	let inDouble = false;
	let inTemplate = false;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let i = braceStart; i < source.length; i++) {
		const char = source[i];
		const next = source[i + 1];

		if (inLineComment) {
			if (char === '\n') inLineComment = false;
			continue;
		}

		if (inBlockComment) {
			if (char === '*' && next === '/') {
				inBlockComment = false;
				i++;
			}
			continue;
		}

		if (inSingle) {
			if (!escaped && char === '\\') {
				escaped = true;
				continue;
			}
			if (!escaped && char === '\'') inSingle = false;
			escaped = false;
			continue;
		}

		if (inDouble) {
			if (!escaped && char === '\\') {
				escaped = true;
				continue;
			}
			if (!escaped && char === '"') inDouble = false;
			escaped = false;
			continue;
		}

		if (inTemplate) {
			if (!escaped && char === '\\') {
				escaped = true;
				continue;
			}
			if (!escaped && char === '`') inTemplate = false;
			escaped = false;
			continue;
		}

		if (char === '/' && next === '/') {
			inLineComment = true;
			i++;
			continue;
		}

		if (char === '/' && next === '*') {
			inBlockComment = true;
			i++;
			continue;
		}

		if (char === '\'') {
			inSingle = true;
			continue;
		}

		if (char === '"') {
			inDouble = true;
			continue;
		}

		if (char === '`') {
			inTemplate = true;
			continue;
		}

		if (char === '{') depth++;
		if (char === '}') {
			depth--;
			if (depth === 0) {
				return source.slice(start, i + 1);
			}
		}
	}

	throw new Error(`Function ${functionName} body is not balanced`);
}

async function loadFunction(functionName) {
	const fnSource = extractFunction(workerSource, functionName);
	const moduleUrl = `data:text/javascript;charset=utf-8,${encodeURIComponent(`${fnSource}\nexport { ${functionName} };`)}`;
	return import(moduleUrl);
}

test('命中广告节点特征 会拦截已知 cmliussss 广告节点', async () => {
	const { 命中广告节点特征 } = await loadFunction('命中广告节点特征');

	assert.equal(
		命中广告节点特征('join.my.telegram.channel.cmliussss.to.unlock.more.premium.nodes.cf.090227.xyz'),
		true
	);
	assert.equal(
		命中广告节点特征('加入我的频道t.me/CMLiussss解锁更多优选节点'),
		true
	);
});

test('命中广告节点特征 不误伤正常节点地址和备注', async () => {
	const { 命中广告节点特征 } = await loadFunction('命中广告节点特征');

	assert.equal(命中广告节点特征('104.16.0.1:443#CF官方优选1'), false);
	assert.equal(命中广告节点特征('hk01.example.com:8443#Hong Kong'), false);
});
