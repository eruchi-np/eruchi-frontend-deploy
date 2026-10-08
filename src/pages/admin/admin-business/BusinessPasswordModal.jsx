// Set a new password for a merchant account.

import { Eye, EyeOff, RefreshCw, ShieldAlert } from 'lucide-react';
import { NAVY, generatePassword } from './businessShared.js';

export default function BusinessPasswordModal({
  handleChangePassword,
  inputCls,
  newPassword,
  passwordModalError,
  passwordSubmitLoading,
  selectedBusinessForPassword,
  setNewPassword,
  setSelectedBusinessForPassword,
  setShowNewPassword,
  showNewPassword,
}) {
  return (
    <>
      {selectedBusinessForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Change Password</h3>
                <p className="text-xs text-gray-500 mt-0.5">for {selectedBusinessForPassword.name}</p>
              </div>
              <button
                onClick={() => setSelectedBusinessForPassword(null)}
                className="text-gray-400 hover:text-gray-700 font-medium text-lg leading-none"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">New Password *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      required
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`${inputCls} pr-9 font-mono`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(s => !s)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setNewPassword(generatePassword()); setShowNewPassword(true); }}
                    className="flex items-center gap-1 px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Generate
                  </button>
                </div>
                {newPassword && (
                  <p className="text-[10px] text-gray-400 mt-1">
                    {newPassword.length} characters
                    {newPassword.length < 8 && <span className="text-red-500 ml-1">— too short</span>}
                  </p>
                )}
              </div>
              {passwordModalError && (
                <div className="p-2.5 bg-red-50 rounded-xl flex items-start gap-1.5 border border-red-100">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-600 font-medium leading-normal">{passwordModalError}</p>
                </div>
              )}
              <button
                type="submit"
                disabled={passwordSubmitLoading}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                style={{ backgroundColor: NAVY }}
              >
                {passwordSubmitLoading ? 'Updating…' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
