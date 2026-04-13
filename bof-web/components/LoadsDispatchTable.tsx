import Link from "next/link";
import type { BofData } from "@/lib/load-bof-data";
import { DriverCell } from "@/components/DriverCell";

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
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.loads.map((load) => {
            const driver = data.drivers.find((d) => d.id === load.driverId);
            return (
              <tr key={load.id}>
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
                <td>{load.status}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
