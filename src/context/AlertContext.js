import { createContext, useCallback, useContext, useState } from "react";
import AlertModal from "../../components/ui/AlertModal";

const AlertContext = createContext({
  showAlert: () => {},
  hideAlert: () => {},
});

export function AlertProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const hideAlert = useCallback(() => {
    setDialog(null);
  }, []);

  const showAlert = useCallback((options) => {
    setDialog({
      confirmLabel: "Entendido",
      cancelLabel: null,
      confirmColor: options.confirmColor || options.primaryColor || undefined,
      cancelColor: options.cancelColor || options.secondaryColor || undefined,
      ...options,
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (dialog?.onConfirm) {
      dialog.onConfirm();
    }
    if (dialog?.closeOnConfirm !== false) {
      hideAlert();
    }
  }, [dialog, hideAlert]);

  const handleCancel = useCallback(() => {
    if (dialog?.onCancel) {
      dialog.onCancel();
    }
    hideAlert();
  }, [dialog, hideAlert]);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <AlertModal
        visible={!!dialog}
        title={dialog?.title || "Aviso"}
        message={dialog?.message || ""}
        details={dialog?.details}
        confirmLabel={dialog?.confirmLabel || "Entendido"}
        cancelLabel={dialog?.cancelLabel}
        confirmColor={dialog?.confirmColor}
        cancelColor={dialog?.cancelColor}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </AlertContext.Provider>
  );
}

export const useAlert = () => useContext(AlertContext);
