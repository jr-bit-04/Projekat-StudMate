const PUBLIC_USER_COLUMNS = `
  id,
  name,
  email,
  role,
  faculty,
  dorm,
  index_number,
  admin_module,
  profile_image_path AS profile_image_url,
  location_tracking_consent
`;

const PROFILE_USER_COLUMNS = `
  ${PUBLIC_USER_COLUMNS},
  created_at,
  updated_at,
  last_login_at
`;

module.exports = {
  PUBLIC_USER_COLUMNS,
  PROFILE_USER_COLUMNS,
};
