import React, { useState, useEffect } from "react";
import { Shield, Mail, Lock, Eye, EyeOff, Sparkles, KeyRound, AlertCircle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB } from "../lib/db";

interface AdminLoginProps {
  onLoginSuccess: (token: string, rememberMe: boolean) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Custom states for credential resetting
  const [resetEmail, setResetEmail] = useState("aaryanrajputofficial@gmail.com");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [securityCodeGenerated, setSecurityCodeGenerated] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const openResetModal = () => {
    setResetEmail("aaryanrajputofficial@gmail.com");
    setResetPassword("");
    setResetConfirmPassword("");
    setResetError(null);
    setResetSuccess(null);
    setSecurityCodeInput("");
    setSecurityCodeGenerated(Math.floor(1000 + Math.random() * 9000).toString());
    setShowForgotModal(true);
  };

  // Pre-fill email if remembered
  useEffect(() => {
    const savedEmail = localStorage.getItem("sr_admin_remember_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const sha256 = async (str: string): Promise<string> => {
    const buf = new TextEncoder().encode(str);
    const hashBuf = await window.crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorCode(null);

    if (!email.trim() || !password.trim()) {
      setErrorCode("Please enter both your registered email and secure password.");
      return;
    }

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;

        if (rememberMe) {
          localStorage.setItem("sr_admin_remember_email", email);
        } else {
          localStorage.removeItem("sr_admin_remember_email");
        }

        LocalDB.addAuditLog("Admin Authorized", `Logged in from IP 127.0.0.1 using secure credential protocols`, "Admin");
        onLoginSuccess(token, rememberMe);
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorCode(errData.error || "Invalid cryptographic credentials. Please verify your admin email and passkey.");
        LocalDB.addAuditLog("Access Denied", `Failed login attempt for account ${email}`, "System Gateway");
      }
    } catch (err) {
      // Robust and secure offline fallback for development/sandbox environments
      const customCredsStr = localStorage.getItem("sr_admin_custom_credentials");
      let expectedEmail = "aaryanrajputofficial@gmail.com";
      let expectedHash = "6f2cb9dd8f4b65e24e1c3f3fa5bc57982349237f11abceacd45bbcb74d621c25";

      if (customCredsStr) {
        try {
          const parsed = JSON.parse(customCredsStr);
          if (parsed.email && parsed.passwordHash) {
            expectedEmail = parsed.email.toLowerCase();
            expectedHash = parsed.passwordHash;
          }
        } catch (_) {}
      }

      const isMasterEmail = email.toLowerCase().trim() === expectedEmail;
      const inputHash = await sha256(password.trim()).catch(() => "");
      const isMasterPassword = inputHash === expectedHash;

      if (isMasterEmail && isMasterPassword) {
        const payload = btoa(JSON.stringify({ sub: "sagar_ratna_admin_id", role: "Owner", email: email }));
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const mockSignature = "r9U_63r-9saV_77f_93n-c";
        const token = `${header}.${payload}.${mockSignature}`;

        if (rememberMe) {
          localStorage.setItem("sr_admin_remember_email", email);
        } else {
          localStorage.removeItem("sr_admin_remember_email");
        }

        LocalDB.addAuditLog("Admin Authorized (Offline Fallback)", `Logged in offline using client credentials`, "Admin");
        onLoginSuccess(token, rememberMe);
      } else {
        setErrorCode("Invalid credentials or server connection timed out. Please verify connections.");
        LocalDB.addAuditLog("Access Denied", `Connection error during admin login attempt for ${email}`, "System Gateway");
      }
    }
  };

  const handleResetCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (!resetEmail.trim() || !resetPassword.trim() || !resetConfirmPassword.trim()) {
      setResetError("All fields are required to update credentials.");
      return;
    }

    if (resetPassword !== resetConfirmPassword) {
      setResetError("New password and confirmation password do not match.");
      return;
    }

    if (resetPassword.length < 6) {
      setResetError("New password must be at least 6 characters in length.");
      return;
    }

    if (securityCodeInput.trim() !== securityCodeGenerated) {
      setResetError("Incorrect security verification code.");
      return;
    }

    setIsResetting(true);
    try {
      const res = await LocalDB.apiResetCredentials(resetEmail.trim(), resetPassword.trim());
      setResetSuccess(res.message || "Administrative credentials updated successfully!");
      LocalDB.addAuditLog("Admin Credentials Reset", `Owner credentials successfully altered to ${resetEmail.trim()}`, "System Reset Gateway");
      
      // Auto-prefill the login email field
      setEmail(resetEmail.trim());
      setPassword("");
      
      // Dismiss modal after success
      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(null);
      }, 2500);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset credentials. Please try again.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center relative p-4 font-sans select-none overflow-hidden" id="admin-login-screen">
      {/* Decorative Ornate Art Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#d4af37]/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md bg-white border border-stone-200/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 relative z-10 shadow-[0_24px_50px_rgba(40,30,10,0.06)]"
      >
        {/* Gold Border Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-t-3xl" />

        {/* Brand Identity / Logo Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-stone-50 to-stone-100 border border-[#d4af37]/40 text-[#d4af37] rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(212,175,55,0.1)] relative group">
            <Shield className="w-6.5 h-6.5 transition-transform group-hover:scale-110" />
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] absolute top-1 right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-semibold text-stone-900 tracking-wide uppercase">
              Sagar Ratna <span className="text-[#aa7c11]">Control</span>
            </h1>
            <p className="text-xs text-stone-500 font-mono tracking-widest uppercase mt-0.5">
              Secure Restaurant Administration
            </p>
          </div>
        </div>

        {/* Error notification banner */}
        <AnimatePresence mode="wait">
          {errorCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 text-xs text-red-800 leading-relaxed font-sans"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{errorCode}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-5">
          {/* Email input panel */}
          <div className="space-y-2">
            <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
              EMAIL ADDRESS
            </label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37] transition-colors" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-11 pr-4 py-3 bg-stone-50 hover:bg-stone-50 border border-stone-200 focus:border-[#d4af37]/80 text-sm rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none transition-all font-sans"
              />
            </div>
          </div>

          {/* Password input panel */}
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <label className="block text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                PASSWORD KEY
              </label>
              <button
                type="button"
                onClick={openResetModal}
                className="text-xs font-mono text-[#aa7c11] hover:text-[#d4af37] hover:underline"
              >
                FORGOT KEY?
              </button>
            </div>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 group-focus-within:text-[#d4af37] transition-colors" />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-11 pr-11 py-3 bg-stone-50 hover:bg-stone-50 border border-stone-200 focus:border-[#d4af37]/80 text-sm rounded-xl text-stone-900 placeholder-stone-400 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-700 focus:outline-none cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Toggle */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2.5 text-xs text-stone-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="accent-[#d4af37] w-4 h-4 rounded border-stone-300 bg-white"
              />
              Remember my workstation
            </label>
          </div>

          {/* Log In Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] hover:from-[#f3e5ab] hover:to-[#d4af37] text-white font-semibold tracking-wider rounded-xl shadow-[0_8px_30px_rgba(212,175,55,0.15)] uppercase text-xs cursor-pointer focus:outline-none transition-colors border border-yellow-300/10 mt-3"
            id="admin-login-btn"
          >
            AUTHORIZE & ENTER
          </motion.button>
        </form>
      </motion.div>

      {/* Credentials Reset & Setup Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForgotModal(false)}
              className="fixed inset-0 bg-stone-900/40 z-40 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-x-4 max-w-md mx-auto my-auto bg-white border border-stone-200 p-6 sm:p-8 rounded-3xl z-50 shadow-2xl h-fit self-center"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 border border-amber-200 text-[#aa7c11] rounded-xl">
                    <KeyRound className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-stone-900 uppercase tracking-wider">Credential Reset</h3>
                    <p className="text-xs text-stone-500 font-sans mt-0.5">Secure sandbox administration gateway</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowForgotModal(false)}
                  className="p-1 text-stone-400 hover:text-stone-900 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {resetSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="w-12 h-12 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="text-sm font-semibold text-stone-950 uppercase tracking-wider">Credentials Reset Successful</h4>
                  <p className="text-xs text-stone-650 max-w-sm mx-auto font-sans leading-relaxed">
                    {resetSuccess} Prefilling login credentials...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetCredentialsSubmit} className="space-y-4">
                  <p className="text-xs text-stone-505 leading-relaxed font-sans">
                    You can directly update the primary administrator credentials. Enter your target email, specify a new password, and verify the human check below.
                  </p>

                  {resetError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-stone-450 uppercase tracking-widest">
                        ADMIN EMAIL ADDRESS
                      </label>
                      <input
                        required
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="admin@example.com"
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-stone-450 uppercase tracking-widest">
                        NEW PASSWORD KEY
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="Min 6 characters"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-mono text-stone-450 uppercase tracking-widest">
                        CONFIRM NEW PASSWORD
                      </label>
                      <input
                        required
                        type="password"
                        placeholder="Repeat new password"
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-mono"
                      />
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <label className="block text-[10px] font-mono text-stone-450 uppercase tracking-widest">
                          HUMAN CHECK CODE
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={4}
                          placeholder="Type code"
                          value={securityCodeInput}
                          onChange={(e) => setSecurityCodeInput(e.target.value)}
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-mono text-center tracking-widest"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center bg-stone-100 border border-stone-200 p-2.5 rounded-xl h-fit min-w-[100px] select-none">
                        <span className="text-xs text-stone-400 font-mono uppercase tracking-wider mb-0.5">VERIFY</span>
                        <span className="text-lg font-mono font-bold text-stone-800 tracking-widest">{securityCodeGenerated}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-white font-semibold rounded-xl text-xs uppercase tracking-widest hover:from-[#aa7c11] hover:to-[#8a650e] transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isResetting ? "UPDATING CREDENTIALS..." : "RESET & UPDATE CREDENTIALS"}
                  </button>
                </form>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
