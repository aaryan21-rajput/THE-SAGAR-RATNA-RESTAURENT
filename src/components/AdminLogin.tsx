import React, { useState, useEffect } from "react";
import { Shield, Lock, Sparkles, KeyRound, AlertCircle, RefreshCw, Delete } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LocalDB } from "../lib/db";

interface AdminLoginProps {
  onLoginSuccess: (token: string, rememberMe: boolean) => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  
  // Custom states for PIN resetting
  const [resetPin, setResetPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [securityCodeInput, setSecurityCodeInput] = useState("");
  const [securityCodeGenerated, setSecurityCodeGenerated] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  const openResetModal = () => {
    setResetPin("");
    setResetConfirmPin("");
    setResetError(null);
    setResetSuccess(null);
    setSecurityCodeInput("");
    setSecurityCodeGenerated(Math.floor(1000 + Math.random() * 9000).toString());
    setShowForgotModal(true);
  };

  const submitPin = async (inputPin: string) => {
    setErrorCode(null);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: inputPin.trim() })
      });

      if (response.ok) {
        const data = await response.json();
        onLoginSuccess(data.token, true);
        LocalDB.addAuditLog("Admin Authorized", `Logged in from IP 127.0.0.1 using secure PIN`, "Admin");
      } else {
        const errData = await response.json().catch(() => ({}));
        setErrorCode(errData.error || "Invalid administrative PIN. Access denied.");
        LocalDB.addAuditLog("Access Denied", `Failed PIN entry attempt`, "System Gateway");
        setPin("");
      }
    } catch (err) {
      // Fallback for offline/development sandbox
      const expectedPin = "1234";
      if (inputPin === expectedPin) {
        const payload = btoa(JSON.stringify({ sub: "sagar_ratna_admin_id", role: "Owner", email: "admin@sagarratna.com" }));
        const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
        const mockSignature = "r9U_63r-9saV_77f_93n-c";
        const token = `${header}.${payload}.${mockSignature}`;
        
        onLoginSuccess(token, true);
        LocalDB.addAuditLog("Admin Authorized (Offline Fallback)", `Logged in offline using fallback PIN`, "Admin");
      } else {
        setErrorCode("Invalid PIN or server connection timed out.");
        setPin("");
      }
    }
  };

  const handleKeypadPress = (val: string) => {
    setErrorCode(null);
    if (val === "Clear") {
      setPin("");
    } else if (val === "Backspace") {
      setPin(prev => prev.slice(0, -1));
    } else {
      if (pin.length < 4) {
        const newPin = pin + val;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => {
            submitPin(newPin);
          }, 150);
        }
      }
    }
  };

  // Numpad Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;

      if (e.key >= "0" && e.key <= "9") {
        if (pin.length < 4) {
          const newPin = pin + e.key;
          setPin(newPin);
          if (newPin.length === 4) {
            setTimeout(() => {
              submitPin(newPin);
            }, 150);
          }
        }
      } else if (e.key === "Backspace") {
        setPin(prev => prev.slice(0, -1));
      } else if (e.key === "Escape") {
        setPin("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pin, showForgotModal]);

  const handleResetPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    setResetSuccess(null);

    if (resetPin.length < 4) {
      setResetError("PIN code must be exactly 4 digits.");
      return;
    }

    if (resetPin !== resetConfirmPin) {
      setResetError("PIN codes do not match.");
      return;
    }

    if (securityCodeInput.trim() !== securityCodeGenerated) {
      setResetError("Incorrect security verification code.");
      return;
    }

    setIsResetting(true);
    try {
      const response = await fetch("/api/admin/reset-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: resetPin,
          securityToken: "SAGAR_SANDBOX_RESET"
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update administrative PIN.");
      }

      setResetSuccess("Administrative PIN code successfully updated!");
      LocalDB.addAuditLog("Admin PIN Altered", `Owner PIN altered successfully`, "System Gateway");

      setTimeout(() => {
        setShowForgotModal(false);
        setResetSuccess(null);
        setPin("");
      }, 2000);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset administrative PIN.");
    } finally {
      setIsResetting(false);
    }
  };

  const padNumbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "Clear", "0", "Backspace"];

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-800 flex items-center justify-center relative p-4 font-sans select-none overflow-hidden" id="admin-login-screen">
      {/* Decorative Ornate Art Background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#d4af37]/8 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-amber-100/40 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(212,175,55,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(212,175,55,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Main PIN Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-sm bg-white border border-stone-200/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 relative z-10 shadow-[0_24px_50px_rgba(40,30,10,0.06)]"
      >
        {/* Gold Border Top Accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent rounded-t-3xl" />

        {/* Brand Identity / Logo Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-stone-50 to-stone-100 border border-[#d4af37]/40 text-[#d4af37] rounded-2xl flex items-center justify-center mx-auto shadow-[0_8px_30px_rgba(212,175,55,0.1)] relative group">
            <Shield className="w-6.5 h-6.5 transition-transform group-hover:scale-110" />
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37] absolute top-1 right-1 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-semibold text-stone-900 tracking-wide uppercase">
              Sagar Ratna <span className="text-[#aa7c11]">Terminal</span>
            </h1>
            <p className="text-[10px] text-stone-500 font-mono tracking-widest uppercase mt-0.5">
              Enter Admin Access PIN
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
              className="mb-4 bg-red-50 border border-red-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-800 leading-relaxed font-sans"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
              <span>{errorCode}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center text-2xl font-bold font-mono transition-all duration-200 ${
                pin.length > index
                  ? "border-[#d4af37] bg-amber-50/50 text-[#aa7c11] shadow-[0_4px_12px_rgba(212,175,55,0.15)] scale-105"
                  : "border-stone-200 bg-stone-50 text-stone-400"
              }`}
            >
              {pin.length > index ? "•" : ""}
            </div>
          ))}
        </div>

        {/* Numeric PIN Pad Grid */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {padNumbers.map((num) => {
            const isSpecial = num === "Clear" || num === "Backspace";
            return (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(num)}
                className={`py-4 rounded-xl text-base font-medium transition-all duration-150 active:scale-95 focus:outline-none cursor-pointer flex items-center justify-center ${
                  isSpecial
                    ? "bg-stone-50 hover:bg-stone-100 text-stone-500 text-xs uppercase tracking-wider font-mono"
                    : "bg-stone-50/60 hover:bg-stone-50 border border-stone-100 hover:border-stone-200 text-stone-800 font-sans font-bold text-lg"
                }`}
              >
                {num === "Backspace" ? <Delete className="w-4 h-4 text-stone-500" /> : num}
              </button>
            );
          })}
        </div>

        {/* Action Link Row */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={openResetModal}
            className="text-xs font-mono text-[#aa7c11] hover:text-[#d4af37] hover:underline"
          >
            FORGOT PIN KEY?
          </button>
        </div>
      </motion.div>

      {/* Credentials Reset Modal */}
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
              className="fixed inset-x-4 max-w-sm mx-auto my-auto bg-white border border-stone-200 p-6 sm:p-8 rounded-3xl z-50 shadow-2xl h-fit self-center"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 border border-amber-200 text-[#aa7c11] rounded-xl">
                    <KeyRound className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-serif font-bold text-stone-900 uppercase tracking-wider">PIN Code Reset</h3>
                    <p className="text-[10px] text-stone-500 font-sans mt-0.5">Secure sandbox recovery bypass</p>
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
                  <h4 className="text-sm font-semibold text-stone-950 uppercase tracking-wider">PIN Reset Successful</h4>
                  <p className="text-xs text-stone-500 max-w-xs mx-auto font-sans leading-relaxed">
                    {resetSuccess} Returning to login...
                  </p>
                </div>
              ) : (
                <form onSubmit={handleResetPinSubmit} className="space-y-4">
                  <p className="text-xs text-stone-500 leading-relaxed font-sans">
                    Define a new 4-digit master PIN. Verify using the security verification code generated below.
                  </p>

                  {resetError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-3 font-sans">
                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                        NEW 4-DIGIT PIN
                      </label>
                      <input
                        required
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        placeholder="••••"
                        value={resetPin}
                        onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-mono text-center tracking-widest"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                        CONFIRM NEW PIN
                      </label>
                      <input
                        required
                        type="password"
                        maxLength={4}
                        pattern="\d{4}"
                        placeholder="••••"
                        value={resetConfirmPin}
                        onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-sm text-stone-900 font-mono text-center tracking-widest"
                      />
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <label className="block text-[9px] font-mono text-stone-400 uppercase tracking-widest">
                          HUMAN CHECK CODE
                        </label>
                        <input
                          required
                          type="text"
                          maxLength={4}
                          placeholder="Code"
                          value={securityCodeInput}
                          onChange={(e) => setSecurityCodeInput(e.target.value)}
                          className="w-full px-4 py-2 bg-stone-50 border border-stone-200 focus:border-[#d4af37] focus:outline-none rounded-xl text-xs text-stone-900 font-mono text-center tracking-widest"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center bg-stone-100 border border-stone-200 p-2 rounded-xl h-fit min-w-[80px] select-none">
                        <span className="text-[9px] text-stone-400 font-mono uppercase tracking-wider mb-0.5">VERIFY</span>
                        <span className="text-sm font-mono font-bold text-stone-800 tracking-widest">{securityCodeGenerated}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isResetting}
                    className="w-full py-3 bg-gradient-to-r from-[#d4af37] to-[#aa7c11] text-white font-semibold rounded-xl text-xs uppercase tracking-widest hover:from-[#aa7c11] hover:to-[#8a650e] transition-all focus:outline-none cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isResetting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "RESET PIN CODE"}
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
