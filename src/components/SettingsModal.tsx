import { useCallback, useEffect, useState } from "react";
import { Database01, Settings01 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Form } from "@/components/base/form/form";
import { Input } from "@/components/base/input/input";
import { getScriptUrl, setScriptUrl } from "../lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
};

export default function SettingsModal({ open, onClose, onSaved }: Props) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (open) setUrl(getScriptUrl());
  }, [open]);

  const handleSave = useCallback(() => {
    setScriptUrl(url);
    onSaved();
  }, [url, onSaved]);

  const handleDisconnect = useCallback(() => {
    setScriptUrl("");
    setUrl("");
    onSaved();
  }, [onSaved]);

  if (!open) return null;

  return (
    <ModalOverlay isOpen={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <Modal>
        <Dialog className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-utility-brand-50 ring-8 ring-utility-brand-50/50">
                <Settings01 className="size-5 text-utility-brand-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-primary">Settings</h3>
                <p className="text-sm text-tertiary mt-0.5">
                  Data source configuration
                </p>
              </div>
            </div>
            <CloseButton onPress={onClose} />
          </div>

          <div className="mt-6 space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-secondary p-3 ring-1 ring-secondary">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-utility-green-50 text-utility-green-600">
                <Database01 className="size-4" />
              </div>
              <div>
                <div className="text-sm font-medium text-primary">Supabase</div>
                <div className="text-xs text-tertiary">Primary database &mdash; leads are stored and served from here.</div>
              </div>
            </div>

            <div className="border-t border-secondary pt-4">
              <div className="text-sm font-medium text-primary mb-2">Google Sheets Sync (optional)</div>
              <p className="text-xs text-tertiary mb-3">If you want leads from your Google Sheet imported into Supabase, paste the Apps Script URL below.</p>
              <Form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="flex flex-col gap-3">
                  <Input
                    label="Apps Script Web App URL"
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    type="url"
                    value={url}
                    onChange={(value) => setUrl(value)}
                  />
                  <div className="rounded-lg bg-secondary ring-1 ring-secondary p-3 text-xs text-tertiary space-y-1">
                    <div className="font-medium text-secondary">Quick setup</div>
                    <ol className="list-decimal pl-4 space-y-0.5">
                      <li>Open your Google Sheet &rarr; <b>Extensions &rarr; Apps Script</b>.</li>
                      <li>Paste the script from <code className="rounded bg-primary px-1 py-0.5 ring-1 ring-secondary">apps-script/Code.gs</code>.</li>
                      <li><b>Deploy &rarr; New Deployment &rarr; Web App</b>, set access to &quot;Anyone&quot;.</li>
                      <li>Copy the deployment URL and paste it above.</li>
                    </ol>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-6">
                  <Button size="sm" color="link-gray" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                  <div className="flex items-center gap-2">
                    <Button size="sm" color="secondary" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button size="sm" color="primary" type="submit">
                      Save
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  );
}
