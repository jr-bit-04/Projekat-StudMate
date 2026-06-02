import { useEffect, useState } from "react";

import {
  getStoredUser,
  subscribeToStoredUser,
} from "../utils/authStorage";

function useStoredUser() {
  const [user, setUser] = useState(() => getStoredUser());

  useEffect(() => {
    return subscribeToStoredUser(setUser);
  }, []);

  return user;
}

export default useStoredUser;
