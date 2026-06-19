const pool = require("../config/db");
const { broadcastPushToStudents } = require("./pushNotifications");

async function notifyStudentsAboutDiscount(popust) {
  if (
    !popust ||
    popust.push_notified_at ||
    popust.aktivan !== true ||
    (popust.status && popust.status !== "approved")
  ) {
    return false;
  }

  await broadcastPushToStudents({
    title: "Novi studentski popust",
    body: `${popust.naslov} je sada dostupan u aplikaciji StudMate.`,
    data: {
      type: "discount_approved",
      discountId: popust.id,
      category: popust.kategorija || null,
    },
  });

  const result = await pool.query(
    `
    UPDATE popust
    SET push_notified_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
      AND push_notified_at IS NULL
    RETURNING id
    `,
    [popust.id]
  );

  return Boolean(result.rows[0]);
}

module.exports = {
  notifyStudentsAboutDiscount,
};
