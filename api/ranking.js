const { randomUUID } = require('crypto');

const PREFIX = 'ogaucho:v63';
const RANK_KEY = `${PREFIX}:ranking`;
const DISPLAY_KEY = `${PREFIX}:display`;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ''), token };
}

async function command(args) {
  const cfg = redisConfig();
  if (!cfg) throw new Error('REDIS_NOT_CONFIGURED');
  const response = await fetch(cfg.url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(args)
  });
  if (!response.ok) throw new Error(`REDIS_HTTP_${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(payload.error);
  return payload.result;
}

async function pipeline(commands) {
  const cfg = redisConfig();
  if (!cfg) throw new Error('REDIS_NOT_CONFIGURED');
  const response = await fetch(`${cfg.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!response.ok) throw new Error(`REDIS_HTTP_${response.status}`);
  return response.json();
}

function cleanName(value) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, 24);
}

function normalizeName(value) {
  return cleanName(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.end(JSON.stringify(body));
}

async function getRanking() {
  const raw = await command(['ZREVRANGE', RANK_KEY, '0', '9', 'WITHSCORES']);
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const members = [];
  for (let i = 0; i < raw.length; i += 2) {
    members.push({ key: String(raw[i]), score: Number(raw[i + 1]) || 0 });
  }
  const displayRows = await pipeline(members.map(x => ['HGET', DISPLAY_KEY, x.key]));
  return members.map((x, i) => ({
    name: (displayRows[i] && displayRows[i].result) || x.key,
    score: x.score,
    normalized: x.key
  }));
}

module.exports = async function handler(req, res) {
  try {
    if (!redisConfig()) {
      return json(res, 503, {
        ok: false,
        code: 'RANKING_NOT_CONFIGURED',
        message: 'Ranking online ainda não está conectado ao banco de dados.'
      });
    }

    if (req.method === 'GET') {
      const ranking = await getRanking();
      return json(res, 200, { ok: true, ranking });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return json(res, 405, { ok: false, message: 'Método não permitido.' });
    }

    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch (_) { body = {}; }
    }
    body = body || {};
    const action = String(body.action || '');

    if (action === 'start') {
      const name = cleanName(body.name);
      const normalized = normalizeName(name);
      if (normalized.length < 2) {
        return json(res, 400, { ok: false, code: 'INVALID_NAME', message: 'Nome inválido.' });
      }

      const sessionToken = randomUUID();
      const nameKey = `${PREFIX}:name:${normalized}`;
      const reserved = await command(['SET', nameKey, sessionToken, 'NX']);
      if (reserved !== 'OK') {
        return json(res, 409, {
          ok: false,
          code: 'NAME_ALREADY_USED',
          message: 'Este nome já foi utilizado. Digite um nome diferente.'
        });
      }

      await command(['HSET', DISPLAY_KEY, normalized, name]);
      return json(res, 201, { ok: true, name, token: sessionToken });
    }

    if (action === 'score') {
      const name = cleanName(body.name);
      const normalized = normalizeName(name);
      const token = String(body.token || '');
      const score = Math.max(-99999, Math.min(999999, Math.trunc(Number(body.score) || 0)));

      if (!normalized || !token) {
        return json(res, 400, { ok: false, code: 'INVALID_SESSION', message: 'Sessão inválida.' });
      }

      const nameKey = `${PREFIX}:name:${normalized}`;
      const storedToken = await command(['GET', nameKey]);
      if (!storedToken || String(storedToken) !== token) {
        return json(res, 403, {
          ok: false,
          code: 'SESSION_EXPIRED',
          message: 'Esta sessão de jogador não é mais válida.'
        });
      }

      const previousRaw = await command(['ZSCORE', RANK_KEY, normalized]);
      const previous = previousRaw === null ? null : Number(previousRaw);
      await command(['ZADD', RANK_KEY, 'GT', String(score), normalized]);
      await command(['HSET', DISPLAY_KEY, normalized, name]);

      const bestRaw = await command(['ZSCORE', RANK_KEY, normalized]);
      const bestScore = bestRaw === null ? score : Number(bestRaw);
      const rankRaw = await command(['ZREVRANK', RANK_KEY, normalized]);
      const rankPosition = rankRaw === null ? null : Number(rankRaw) + 1;
      const updated = previous === null || score > previous;

      return json(res, 200, {
        ok: true,
        updated,
        bestScore,
        rankPosition
      });
    }

    return json(res, 400, { ok: false, code: 'INVALID_ACTION', message: 'Ação inválida.' });
  } catch (error) {
    console.error('ranking-api-error', error);
    return json(res, 500, {
      ok: false,
      code: 'RANKING_ERROR',
      message: 'Não foi possível acessar o ranking online agora.'
    });
  }
};
