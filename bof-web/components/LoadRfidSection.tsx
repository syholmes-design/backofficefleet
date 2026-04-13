import type { BofData } from "@/lib/load-bof-data";
import { formatUsd } from "@/lib/format-money";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelRowForLoad,
} from "@/lib/rfid-intelligence";

export function LoadRfidSection({
  data,
  loadId,
}: {
  data: BofData;
  loadId: string;
}) {
  const fuel = buildRfidFuelRowForLoad(data, loadId);
  const dock = buildRfidDockRowForLoad(data, loadId);
  if (!fuel || !dock) return null;

  return (
    <section className="bof-rfid-section" aria-labelledby="rfid-heading">
      <h2 id="rfid-heading" className="bof-h2">
        RFID operations intelligence
      </h2>
      <p className="bof-doc-section-lead">
        RFID is used for <strong>verification</strong>,{" "}
        <strong>attribution</strong>, <strong>checkpointing</strong>, and{" "}
        <strong>workflow confirmation</strong> — not direct engine fuel burn
        measurement.
      </p>
      <div className="bof-rfid-grid">
        <article className="bof-rfid-card">
          <h3 className="bof-h3">Fuel validation</h3>
          <p className="bof-rfid-narrative bof-small">{fuel.verifiedFuelingNarrative}</p>
          <dl className="bof-rfid-dl">
            <dt>Driver / asset matched</dt>
            <dd>{fuel.driverAssetMatched ? "Yes" : "No"}</dd>
            <dt>Route checkpoint</dt>
            <dd>{fuel.routeCheckpointMatch ? "Aligned" : "Review"}</dd>
            <dt>Unauthorized fueling flag</dt>
            <dd>
              {fuel.unauthorizedFuelingFlag ? (
                <span className="bof-badge bof-badge-warn">Raised</span>
              ) : (
                <span className="bof-badge bof-badge-neutral">Clear</span>
              )}
            </dd>
            <dt>Anomaly opportunity (est.)</dt>
            <dd>{formatUsd(fuel.fuelAnomalyOpportunityUsd)}</dd>
            <dt>Next action</dt>
            <dd>{fuel.nextAction}</dd>
          </dl>
        </article>
        <article className="bof-rfid-card">
          <h3 className="bof-h3">Dock / lumper validation</h3>
          <p className="bof-rfid-narrative bof-small">
            {dock.unloadCheckpointNarrative}
          </p>
          <dl className="bof-rfid-dl">
            <dt>Trailer at dock (RFID proxy)</dt>
            <dd>{dock.trailerConfirmedAtDock ? "Confirmed" : "Pending"}</dd>
            <dt>Lumper workflow</dt>
            <dd className="bof-rfid-cap">{dock.lumperWorkflowStatus}</dd>
            <dt>Receipt still required</dt>
            <dd>{dock.receiptStillRequired ? "Yes" : "No"}</dd>
            <dt>BOF note</dt>
            <dd className="bof-muted bof-small">{dock.bofNote}</dd>
            <dt>Next action</dt>
            <dd>{dock.nextAction}</dd>
          </dl>
        </article>
        <article className="bof-rfid-card">
          <h3 className="bof-h3">Maintenance linkage</h3>
          <p className="bof-muted bof-small">
            Yard / service-bay RFID confirms the asset entered a maintenance
            zone when the lane is equipped. PM status is inferred from the money
            at risk register and load volume on this asset.
          </p>
          <dl className="bof-rfid-dl">
            <dt>Asset</dt>
            <dd>
              <code className="bof-code">{fuel.assetId}</code>
            </dd>
            <dt>Service zone verified (demo)</dt>
            <dd>
              {fuel.routeCheckpointMatch && !fuel.unauthorizedFuelingFlag
                ? "Likely on-network"
                : "Verify yard read"}
            </dd>
            <dt>Next action</dt>
            <dd>
              Cross-check MAR maintenance rows for this asset; log PM to RFID
              service lane when complete.
            </dd>
          </dl>
        </article>
      </div>
    </section>
  );
}
