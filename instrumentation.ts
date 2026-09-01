export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { validateBattleStoreConfiguration } = await import("@/lib/battle-security/store-factory");
  validateBattleStoreConfiguration({ warnMemoryMode: true });
}
