/**
 * Format storage values for display in both GB and MB.
 * All inputs in GB unless noted.
 */

const GB_TO_MB = 1024;

/**
 * Format a single storage value (in GB) as "X.XX GB (Y MB)" or "X MB (Y.YY GB)" for small values.
 * @param {number} gb - value in GB
 * @param {object} opts - { decimalsGB: 2, decimalsMB: 0, forceBoth: true }
 */
export function formatStorageGB(gb, opts = {}) {
  const { decimalsGB = 2, decimalsMB = 0, forceBoth = true } = opts;
  const num = Number(gb) || 0;
  const mb = num * GB_TO_MB;
  if (num >= 1 || !forceBoth) {
    const gbStr = num.toFixed(decimalsGB);
    const mbStr = Math.round(mb).toFixed(decimalsMB);
    return `${gbStr} GB (${mbStr} MB)`;
  }
  const mbStr = mb.toFixed(decimalsMB);
  const gbStr = num.toFixed(decimalsGB);
  return `${mbStr} MB (${gbStr} GB)`;
}

/**
 * Format storage with overage support. Used/available can be negative (over limit).
 * @param {number} totalGB - plan total in GB
 * @param {number} usedGB - used in GB (or usedBytes if usedIsBytes)
 * @param {{ usedIsBytes?: boolean }} opts - if usedIsBytes, usedGB is in bytes
 */
export function formatStorageWithUnits(totalGB, usedGB, opts = {}) {
  const { usedIsBytes = false } = opts;
  const used = usedIsBytes ? (Number(usedGB) || 0) / (1024 * 1024 * 1024) : (Number(usedGB) || 0);
  const total = Number(totalGB) || 0;
  const available = total - used;

  return {
    totalGB: total,
    usedGB: used,
    availableGB: available,
    totalFormatted: formatStorageGB(total),
    usedFormatted: formatStorageGB(used),
    availableFormatted: available >= 0
      ? formatStorageGB(available)
      : `Over by ${formatStorageGB(-available)}`,
    availableMB: Math.round(available * GB_TO_MB),
    isOverage: available < 0,
  };
}

/**
 * Short label for available: "X.XX GB (Y MB)" or "Over by X.XX GB (Y MB)".
 */
export function formatAvailableLabel(totalGB, usedGB, opts = {}) {
  const { availableFormatted } = formatStorageWithUnits(totalGB, usedGB, opts);
  return availableFormatted;
}
