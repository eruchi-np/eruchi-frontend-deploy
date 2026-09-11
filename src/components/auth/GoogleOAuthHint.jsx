import React from "react";
import { GOOGLE_OAUTH_BLOCKER_HINT } from "../../utils/googleOAuth";

const GoogleOAuthHint = () => (
  <p
    role="status"
    className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 leading-relaxed"
  >
    {GOOGLE_OAUTH_BLOCKER_HINT}
  </p>
);

export default GoogleOAuthHint;
