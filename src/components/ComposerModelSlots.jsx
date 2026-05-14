import { useCallback, useState } from "react";
import { PROVIDERS } from "../constants/appConfig.js";
import { firstProviderWithApiKey } from "../lib/modelUtils.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { SearchableSlotPicker } from "./SearchableSlotPicker.jsx";

/** Two or three model columns; “+” opens picker, dismiss returns to plus. */
export function ComposerModelSlots({ compareSlots, setCompareSlots, modelOptions, listsLoading, apiKeysCommitted }) {
  const { t } = useI18n();
  const n = compareSlots.length;
  const [thirdDraft, setThirdDraft] = useState(null);

  const handleThirdOpenChange = useCallback((open) => {
    if (!open) {
      setThirdDraft((d) => (d && !d.modelValue ? null : d));
    }
  }, []);

  function removeSlot(index) {
    if (n <= 2) return;
    setCompareSlots((prev) => prev.filter((_, i) => i !== index));
  }

  function startAddThird() {
    if (n >= 3 || thirdDraft) return;
    const first = firstProviderWithApiKey(apiKeysCommitted ?? {});
    setThirdDraft({ providerKey: first?.key ?? PROVIDERS[0].key, modelValue: "" });
  }

  return (
    <div className="composer-model-row">
      {compareSlots.map((slot, i) => {
        const pos = i === 0 ? "first" : i === n - 1 && n === 3 ? "last" : "middle";
        return (
          <div key={i} className="composer-model-col" style={i === n - 1 && n === 3 ? { borderRight: "none" } : undefined}>
            <SearchableSlotPicker
              slotIndex={i}
              providerKey={slot.providerKey}
              modelValue={slot.modelValue}
              onSlotChange={(nextSlot) => {
                setCompareSlots((prev) => {
                  const next = [...prev];
                  next[i] = nextSlot;
                  return next;
                });
              }}
              modelOptions={modelOptions}
              listsLoading={listsLoading}
              apiKeysCommitted={apiKeysCommitted}
              position={pos}
              onRemoveColumn={n > 2 ? () => removeSlot(i) : undefined}
              removeColumnAriaLabel={t("composerModelSlots.removeColumn")}
              removeColumnTitle={t("composerModelSlots.removeColumnTitle")}
            />
          </div>
        );
      })}
      {n < 3 && (
        <div className={`composer-model-plusWrap${thirdDraft ? " composer-model-plusWrap--picking" : ""}`}>
          {thirdDraft ? (
            <SearchableSlotPicker
              key={`third-draft-${thirdDraft.providerKey}`}
              slotIndex={2}
              providerKey={thirdDraft.providerKey}
              modelValue={thirdDraft.modelValue}
              onSlotChange={(nextSlot) => {
                if (!nextSlot.modelValue) {
                  setThirdDraft(nextSlot);
                  return;
                }
                setCompareSlots((prev) => [...prev, nextSlot]);
                setThirdDraft(null);
              }}
              modelOptions={modelOptions}
              listsLoading={listsLoading}
              apiKeysCommitted={apiKeysCommitted}
              position="last"
              emptyPlaceholder={t("composerModelSlots.thirdPlaceholder")}
              defaultOpen
              onOpenChange={handleThirdOpenChange}
            />
          ) : (
            <button
              type="button"
              aria-label={t("composerModelSlots.addThirdAria")}
              title={t("composerModelSlots.addThirdTitle")}
              onClick={(e) => {
                e.stopPropagation();
                startAddThird();
              }}
              className="composer-model-plusBtn"
            >
              +
            </button>
          )}
        </div>
      )}
    </div>
  );
}
