const https = require("https");
const pool = require("../config/db");

const EXPO_PUSH_API_URL =
  process.env.EXPO_PUSH_API_URL || "https://exp.host/--/api/v2/push/send";
const EXPO_PUSH_NOTIFICATIONS_ENABLED =
  String(process.env.EXPO_PUSH_NOTIFICATIONS_ENABLED || "true").toLowerCase() !==
  "false";
const EXPO_PUSH_BATCH_SIZE = 100;
const EXPO_PUSH_MAX_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function normalizeExpoPushToken(value = "") {
  return String(value).trim();
}

function isExpoPushToken(value = "") {
  return /^(ExponentPushToken|ExpoPushToken)\[[^\]]+\]$/.test(
    normalizeExpoPushToken(value)
  );
}

async function ensurePushNotificationSupport() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_push_tokens (
      id BIGSERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expo_push_token TEXT NOT NULL UNIQUE,
      device_platform TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    ALTER TABLE user_push_tokens
    ADD COLUMN IF NOT EXISTS device_platform TEXT
  `);

  await pool.query(`
    ALTER TABLE user_push_tokens
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
  `);

  await pool.query(`
    ALTER TABLE user_push_tokens
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE user_push_tokens
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    ALTER TABLE user_push_tokens
    ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS user_push_tokens_user_status_idx
    ON user_push_tokens (user_id, status)
  `);

  await pool.query(`
    ALTER TABLE popust
    ADD COLUMN IF NOT EXISTS push_notified_at TIMESTAMPTZ
  `);

  await pool.query(`
    ALTER TABLE stipendija
    ADD COLUMN IF NOT EXISTS push_notified_at TIMESTAMPTZ
  `);
}

async function saveUserPushToken({
  userId,
  expoPushToken,
  devicePlatform = null,
  enabled = true,
}) {
  const normalizedToken = normalizeExpoPushToken(expoPushToken);

  if (!enabled) {
    if (normalizedToken) {
      await pool.query(
        `
        UPDATE user_push_tokens
        SET status = 'disabled',
            updated_at = NOW()
        WHERE user_id = $1
          AND expo_push_token = $2
        `,
        [userId, normalizedToken]
      );
    } else {
      await pool.query(
        `
        UPDATE user_push_tokens
        SET status = 'disabled',
            updated_at = NOW()
        WHERE user_id = $1
        `,
        [userId]
      );
    }

    return null;
  }

  if (!isExpoPushToken(normalizedToken)) {
    throw new Error("Expo push token nije validan.");
  }

  const result = await pool.query(
    `
    INSERT INTO user_push_tokens (
      user_id,
      expo_push_token,
      device_platform,
      status,
      updated_at,
      last_seen_at
    )
    VALUES ($1, $2, $3, 'active', NOW(), NOW())
    ON CONFLICT (expo_push_token)
    DO UPDATE SET
      user_id = EXCLUDED.user_id,
      device_platform = EXCLUDED.device_platform,
      status = 'active',
      updated_at = NOW(),
      last_seen_at = NOW()
    RETURNING id, user_id, expo_push_token, device_platform, status, updated_at, last_seen_at
    `,
    [userId, normalizedToken, devicePlatform || null]
  );

  return result.rows[0] || null;
}

async function deactivatePushTokens(tokens, status = "invalid") {
  const normalizedTokens = [...new Set(tokens.map(normalizeExpoPushToken).filter(Boolean))];

  if (normalizedTokens.length === 0) {
    return;
  }

  await pool.query(
    `
    UPDATE user_push_tokens
    SET status = $2,
        updated_at = NOW()
    WHERE expo_push_token = ANY($1::text[])
    `,
    [normalizedTokens, status]
  );
}

async function getActivePushTokensForUsers(userIds = []) {
  const normalizedIds = [...new Set(userIds.map(Number).filter(Number.isInteger))];

  if (normalizedIds.length === 0) {
    return [];
  }

  const result = await pool.query(
    `
    SELECT expo_push_token
    FROM user_push_tokens
    WHERE status = 'active'
      AND user_id = ANY($1::int[])
    ORDER BY id ASC
    `,
    [normalizedIds]
  );

  return result.rows.map((row) => row.expo_push_token).filter(Boolean);
}

async function getActiveStudentPushTokens() {
  const result = await pool.query(
    `
    SELECT upt.expo_push_token
    FROM user_push_tokens upt
    JOIN users u ON u.id = upt.user_id
    WHERE upt.status = 'active'
      AND u.role = 'student'
    ORDER BY upt.id ASC
    `
  );

  return result.rows.map((row) => row.expo_push_token).filter(Boolean);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function chunkArray(items, chunkSize) {
  const chunks = [];

  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }

  return chunks;
}

function postJson(urlString, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const body = JSON.stringify(payload);

    const request = https.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || 443,
        path: `${url.pathname}${url.search}`,
        method: "POST",
        headers: {
          accept: "application/json",
          "accept-encoding": "gzip, deflate",
          "content-type": "application/json",
          "content-length": Buffer.byteLength(body),
        },
      },
      (response) => {
        let rawBody = "";

        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          rawBody += chunk;
        });
        response.on("end", () => {
          try {
            const parsedBody = rawBody ? JSON.parse(rawBody) : {};

            resolve({
              statusCode: response.statusCode || 0,
              body: parsedBody,
            });
          } catch (error) {
            reject(
              new Error(
                `Expo push odgovor nije validan JSON: ${error.message}`
              )
            );
          }
        });
      }
    );

    request.on("error", reject);
    request.write(body);
    request.end();
  });
}

async function postExpoBatch(messages, attempt = 1) {
  try {
    const response = await postJson(EXPO_PUSH_API_URL, messages);

    if (
      RETRYABLE_STATUS_CODES.has(response.statusCode) &&
      attempt < EXPO_PUSH_MAX_ATTEMPTS
    ) {
      await sleep(500 * Math.pow(2, attempt - 1));
      return postExpoBatch(messages, attempt + 1);
    }

    return response;
  } catch (error) {
    if (attempt < EXPO_PUSH_MAX_ATTEMPTS) {
      await sleep(500 * Math.pow(2, attempt - 1));
      return postExpoBatch(messages, attempt + 1);
    }

    throw error;
  }
}

function createExpoMessage(token, notification) {
  return {
    to: token,
    sound: "default",
    priority: "high",
    title: notification.title,
    body: notification.body,
    data: notification.data || {},
  };
}

async function sendPushNotifications(messages = []) {
  if (!EXPO_PUSH_NOTIFICATIONS_ENABLED) {
    return { sent: 0, invalidated: 0, skipped: messages.length };
  }

  const preparedMessages = messages
    .map((message) => ({
      ...message,
      to: normalizeExpoPushToken(message.to),
    }))
    .filter((message) => isExpoPushToken(message.to));

  if (preparedMessages.length === 0) {
    return { sent: 0, invalidated: 0, skipped: messages.length };
  }

  const invalidTokens = new Set();

  for (const batch of chunkArray(preparedMessages, EXPO_PUSH_BATCH_SIZE)) {
    const response = await postExpoBatch(batch);

    if (response.statusCode >= 400) {
      throw new Error(
        `Expo push servis je vratio status ${response.statusCode}.`
      );
    }

    const tickets = Array.isArray(response.body?.data)
      ? response.body.data
      : response.body?.data
      ? [response.body.data]
      : [];

    tickets.forEach((ticket, index) => {
      if (ticket?.status === "error") {
        const detailsError = ticket?.details?.error;

        if (detailsError === "DeviceNotRegistered") {
          invalidTokens.add(batch[index]?.to);
        }

        console.error("Greška pri slanju Expo push notifikacije:", {
          token: batch[index]?.to,
          message: ticket?.message,
          details: ticket?.details,
        });
      }
    });
  }

  if (invalidTokens.size > 0) {
    await deactivatePushTokens([...invalidTokens], "invalid");
  }

  return {
    sent: preparedMessages.length,
    invalidated: invalidTokens.size,
    skipped: Math.max(0, messages.length - preparedMessages.length),
  };
}

async function sendPushToUsers(userIds, notification) {
  const tokens = await getActivePushTokensForUsers(userIds);

  return sendPushNotifications(
    tokens.map((token) => createExpoMessage(token, notification))
  );
}

async function broadcastPushToStudents(notification) {
  const tokens = await getActiveStudentPushTokens();

  return sendPushNotifications(
    tokens.map((token) => createExpoMessage(token, notification))
  );
}

module.exports = {
  ensurePushNotificationSupport,
  saveUserPushToken,
  sendPushToUsers,
  broadcastPushToStudents,
  isExpoPushToken,
};
