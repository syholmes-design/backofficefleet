import Link from "next/link";
import type { BofData } from "@/lib/load-bof-data";
import { DriverCell } from "@/components/DriverCell";

function loadStatusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "EN ROUTE") return "bof-status-pill bof-status-pill-info";
  if (s === "PENDING") return "bof-status-pill bof-status-pill-warn";
  if (s === "DELIVERED" || s === "CLOSED") return "bof-status-pill bof-status-pill-ok";
  return "bof-status-pill bof-status-pill-muted";
}

function loadSignal(load: BofData["loads"][number]): "Blocking action" | "At risk" | "Resolved / clean" {
  const pod = load.podStatus.toUpperCase();
  const seal = load.sealStatus.toUpperCase();
  if (pod.includes("MISSING") || seal.includes("MISSING") || pod.includes("BLOCK")) return "Blocking action";
  if (pod.includes("PENDING") || seal.includes("PENDING")) return "At risk";
  return "Resolved / clean";
}

export function LoadsDispatchTable({ data }: { data: BofData }) {
  return (
    <div className="bof-table-wrap">
      <table className="bof-table">
        <thead>
          <tr>
            <th scope="col">Load</th>
            <th scope="col">Driver</th>
            <th scope="col">Asset</th>
            <th scope="col">Route</th>
            <th scope="col">POD / seals</th>
            <th scope="col">Signal</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.loads.map((load) => {
            const driver = data.drivers.find((d) => d.id === load.driverId);
            const signal = loadSignal(load);
            return (
              <tr key={load.id} className="bof-load-row">
                <td>
                  <Link href={`/loads/${load.id}`} className="bof-driver-link">
                    <code className="bof-code">{load.id}</code> · {load.number}
                  </Link>
                </td>
                <td>
                  {driver ? (
                    <DriverCell driverId={load.driverId} name={driver.name} />
                  ) : (
                    <code className="bof-code">{load.driverId}</code>
                  )}
                </td>
                <td>
                  <code className="bof-code">{load.assetId}</code>
                </td>
                <td>
                  {load.origin} → {load.destination}
                </td>
                <td className="bof-small">
                  POD {load.podStatus} · Seals {load.sealStatus}
                </td>
                <td>
                  <span
                    className={
                      signal === "Blocking action"
                        ? "bof-status-pill bof-status-pill-danger"
                        : signal === "Resolved / clean"
                          ? "bof-status-pill bof-status-pill-ok"
                          : "bof-status-pill bof-status-pill-info"
                    }
                  >
                    {signal}
                  </span>
                </td>
                <td>
                  <span className={loadStatusClass(load.status)}>{load.status}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
