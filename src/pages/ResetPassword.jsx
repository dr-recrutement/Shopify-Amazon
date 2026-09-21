import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

// Supabase's "reset password" e-mail links back to /reset-password with the
// recovery session encoded in the URL hash. The client (see
// supabaseClient.js, detectSessionInUrl: true) picks that up automatically on
// load and fires a PASSWORD_RECOVERY auth event - there's no separate manual
// token to read from a query param.
export default function ResetPassword() {
  const [checking, setChecking] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let settled = false;
    const finish = (ok) => {
      if (settled) return;
      settled = true;
      setHasRecoverySession(ok);
      setChecking(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") finish(true);
      else if (event === "SIGNED_IN" && session) finish(true);
    });

    // If the recovery link was already processed before this listener
    // attached, fall back to checking for an existing session.
    supabase.auth.getSession().then(({ data: { session } }) => finish(!!session));

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "Échec de la réinitialisation du mot de passe");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <AuthLayout icon={Lock} title="Nouveau mot de passe">
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
          Vérification du lien…
        </div>
      </AuthLayout>
    );
  }

  if (!hasRecoverySession) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est manquant, expiré ou déjà utilisé"
        footer={
          <Link to="/forgot-password" className="text-primary font-medium hover:underline">
            Demander un nouveau lien
          </Link>
        }
      >
        <p className="text-sm text-foreground text-center">
          Le lien utilisé semble incomplet ou n'est plus valide. Merci de demander un nouvel e-mail de réinitialisation.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="Nouveau mot de passe"
      subtitle="Entrez votre nouveau mot de passe ci-dessous"
    >
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirmer le mot de passe</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-12 font-medium rounded-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Réinitialisation…
            </>
          ) : (
            "Réinitialiser le mot de passe"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
