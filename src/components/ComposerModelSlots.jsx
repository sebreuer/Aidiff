import { useCallback, useState } from "react";
import { PROVIDERS } from "../constants/appConfig.js";
import { SearchableSlotPicker } from "./SearchableSlotPicker.jsx";

const THIRD_PLACEHOLDER = "Drittes Modell wählen…";
const THIRD_LIST_HINT = "Wähle ein Modell für die dritte Spalte — oder schließe ohne Auswahl (Esc / Klick außerhalb).";

/** Zwei oder drei Modellspalten; „+“ öffnet Auswahl, ohne Wahl zurück zum Plus. */
export function ComposerModelSlots({ compareSlots, setCompareSlots, modelOptions, listsLoading }) {
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
    setThirdDraft({ providerKey: PROVIDERS[0].key, modelValue: "" });
  }

  return (
    <div className="composer-model-row">
      {compareSlots.map((slot, i) => {
        const pos = i === 0 ? "first" : i === n - 1 && n === 3 ? "last" : "middle";
        return (
          <div
            key={i}
            className="composer-model-col"
            style={i === n - 1 && n === 3 ? { borderRight: "none" } : undefined}
          >
            {n > 2 && (
              <button
                type="button"
                className="composer-model-remove"
                aria-label="Spalte entfernen"
                title="Spalte entfernen"
                onClick={(e) => {
                  e.stopPropagation();
                  removeSlot(i);
                }}
              >
                ×
              </button>
            )}
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
              position={pos}
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
              position="last"
              emptyPlaceholder={THIRD_PLACEHOLDER}
              listHint={THIRD_LIST_HINT}
              defaultOpen
              onOpenChange={handleThirdOpenChange}
            />
          ) : (
            <button
              type="button"
              aria-label="Drittes Modell hinzufügen"
              title="Drittes Modell"
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
