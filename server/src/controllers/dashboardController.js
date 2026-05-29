const pool = require("../config/db");

function getMealTitle(type) {
  if (type === "dorucak") return "Dorucak";
  if (type === "rucak") return "Rucak";
  if (type === "vecera") return "Vecera";

  return type || "Obrok";
}

function parseJsonArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatMenuItem(item) {
  const breakfastItems = parseJsonArray(item.dorucak_stavke).map((meal) =>
    typeof meal === "string" ? meal : meal?.naziv
  );

  const lunchDinnerItems = [
    ...parseJsonArray(item.glavna_jela),
    ...parseJsonArray(item.prilozi),
    ...parseJsonArray(item.salate),
    ...parseJsonArray(item.dodatno),
  ];

  const items = (item.tip_obroka === "dorucak" ? breakfastItems : lunchDinnerItems)
    .filter(Boolean)
    .slice(0, 4);

  return {
    id: item.id,
    datum: item.datum,
    tip_obroka: item.tip_obroka,
    naslov: getMealTitle(item.tip_obroka),
    opis: items.length ? items.join(", ") : "Nema unesenih stavki.",
    aktivan: item.aktivan,
  };
}

const getDashboardData = async (req, res) => {
  try {
    const announcements = await pool.query(`
    SELECT id, modul, naslov, opis, kategorija, priority, pinned, datum_vrijeme
    FROM obavjestenje
    ORDER BY pinned DESC, priority DESC, datum_vrijeme DESC
    LIMIT 5
  `);

    const discounts = await pool.query(`
      SELECT p.id, p.naslov, p.opis, p.kategorija, p.vrijednost, p.valid_until, p.aktivan,
             partner.naziv AS partner_naziv, partner.logo_url
      FROM popust p
      LEFT JOIN partner ON partner.id = p.partner_id
      WHERE p.aktivan = true
      ORDER BY p.valid_until ASC
      LIMIT 4
    `);

    const scholarships = await pool.query(`
      SELECT id, naslov, tip, opis, iznos, rok, link, aktivan
      FROM stipendija
      WHERE aktivan = true
      ORDER BY rok ASC
      LIMIT 4
    `);

    const menu = await pool.query(`
      SELECT id, datum, tip_obroka, aktivan,
             dorucak_stavke, glavna_jela, prilozi, salate, dodatno
      FROM meni
      WHERE aktivan = true
      AND datum = CURRENT_DATE
      ORDER BY
      CASE tip_obroka
        WHEN 'dorucak' THEN 1
        WHEN 'rucak' THEN 2
        WHEN 'vecera' THEN 3
        ELSE 4
      END
    `);

    res.json({
      announcements: announcements.rows,
      discounts: discounts.rows,
      scholarships: scholarships.rows,
      menu: menu.rows.map(formatMenuItem),
    });
  } catch (error) {
    res.status(500).json({
      message: "Greška pri učitavanju dashboard podataka.",
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardData,
};
