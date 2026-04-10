/**
 * Resolve catalog StoragePlan for renew. Never use user_storage_plans.id (drive row id) as catalog id.
 * Prefer catalogPlanId / planId; then match fixed plans by GB; then single (or best) per_gb plan.
 */
export function resolveCatalogPlanForRenew(drivePlan, catalogPlans) {
  if (!drivePlan || !Array.isArray(catalogPlans) || catalogPlans.length === 0) return null;
  const byId = (pid) => {
    if (pid == null || pid === '') return null;
    return catalogPlans.find((p) => String(p.id) === String(pid));
  };
  const catalogFk = drivePlan.catalogPlanId ?? drivePlan.planId;
  const hit = byId(catalogFk);
  if (hit) return hit;

  const totalGb = parseFloat(drivePlan.totalStorage);
  if (!Number.isFinite(totalGb) || totalGb <= 0) return null;

  const fixedHits = catalogPlans.filter(
    (p) => p.category === 'fixed' && Math.abs(parseFloat(p.storage) - totalGb) < 0.02,
  );
  if (fixedHits.length === 1) return fixedHits[0];
  if (fixedHits.length > 1) {
    return [...fixedHits].sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
  }

  const perGb = catalogPlans.filter((p) => p.category === 'per_gb');
  if (perGb.length === 1) return perGb[0];
  if (perGb.length > 1) {
    const month = perGb.find((p) => p.period === 'month');
    return month || perGb[0];
  }
  return null;
}
