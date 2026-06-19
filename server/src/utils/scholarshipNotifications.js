const pool = require("../config/db");
const { broadcastPushToStudents } = require("./pushNotifications");

function isOpportunityStillRelevant(konkurs) {
  if (!konkurs || konkurs.push_notified_at || konkurs.aktivan !== true) {
    return false;
  }

  if (!konkurs.rok) {
    return true;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(konkurs.rok);
  deadline.setHours(0, 0, 0, 0);

  return deadline.getTime() >= today.getTime();
}

function getOpportunityNotificationContent(konkurs) {
  const isCredit = String(konkurs?.tip || "").toLowerCase() === "kredit";

  if (isCredit) {
    return {
      title: "Novi studentski kredit",
      body: `${konkurs.naslov} je upravo objavljen u StudMate aplikaciji.`,
      dataType: "credit_published",
    };
  }

  return {
    title: "Nova stipendija je dostupna",
    body: `${konkurs.naslov} je upravo objavljena u StudMate aplikaciji.`,
    dataType: "scholarship_published",
  };
}

async function notifyStudentsAboutOpportunity(konkurs) {
  if (!isOpportunityStillRelevant(konkurs)) {
    return false;
  }

  const content = getOpportunityNotificationContent(konkurs);

  await broadcastPushToStudents({
    title: content.title,
    body: content.body,
    data: {
      type: content.dataType,
      scholarshipId: konkurs.id,
      institution: konkurs.institucija || null,
      opportunityType: konkurs.tip || null,
    },
  });

  const result = await pool.query(
    `
    UPDATE stipendija
    SET push_notified_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
      AND push_notified_at IS NULL
    RETURNING id
    `,
    [konkurs.id]
  );

  return Boolean(result.rows[0]);
}

module.exports = {
  notifyStudentsAboutOpportunity,
};
